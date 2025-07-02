import { toast } from "sonner";
import { syncChangesToServer } from "canva-editor/services/syncService";
import Cookies from "js-cookie";

export interface DesignSaveOptions {
  force?: boolean;
  showNotification?: boolean;
  waitForCompletion?: boolean;
  templateId?: string | null;
}

/**
 * Saves the current design to the server
 * @param designData - The serialized design data
 * @param designName - The name of the design
 * @param editorContext - The editor context containing designId
 * @param user - The user object from auth context (optional)
 * @param options - Save options
 * @returns Promise<{success: boolean, templateId?: string}> - result with new template ID if created
 */
export const saveDesignBeforeAction = async (
  designData: unknown,
  designName: string,
  editorContext: any, // Editor context with designId
  user?: any, // User object from auth context
  options: Omit<DesignSaveOptions, 'templateId'> = {}
): Promise<{success: boolean, templateId?: string}> => {
  const { force = true, showNotification = false, waitForCompletion = true } = options;

  console.log("💾 saveDesignBeforeAction called");
  console.log("📊 Design data:", !!designData);
  console.log("📝 Design name:", designName);
  console.log("🆔 Editor designId:", editorContext?.designId);
  console.log("👤 User object:", user);
  console.log("👤 User ID:", user?.userId);

  try {
    // Show loading notification if requested
    if (showNotification) {
      toast.loading("Saving design...", { id: "design-save" });
    }

    // Use designId from editor context - do NOT fall back to localStorage
    const templateId = editorContext?.designId || null;
    
    // Get the correct user ID: first from user object, then from outlet ID cookie, then anonymous
    const userId = user?.userId || Cookies.get("auth_token") || "anonymous";
    console.log("👤 Using user ID for save:", userId);
    
    // If designId is null or undefined, this should create a completely new template
    // Clear any localStorage template ID to prevent using old IDs
    if (!templateId) {
      localStorage.removeItem("canva_editor_template_id");
      console.log("🆕 Creating NEW template (designId is null)");
    } else {
      console.log("🔄 Updating EXISTING template:", templateId);
    }

    // CRITICAL: Store design data in IndexedDB first using the sync service
    // Import the saveChangesLocally function
    const { saveChangesLocally } = await import("canva-editor/services/syncService");
    
    console.log("💾 Storing design data to IndexedDB before sync...");
    
    // Try to get the page content element for preview image generation
    const pageContentElement = document.querySelector('.page-content') as HTMLElement;
    console.log("🖼️ Page content element found:", !!pageContentElement);
    
    await saveChangesLocally(
      designData as any, 
      designName, 
      pageContentElement // Pass the page content element for preview image generation
    );
    console.log("✅ Design data stored to IndexedDB successfully");

    // Store the design data temporarily for sync service (legacy support)
    localStorage.setItem("canva_editor_template_data", JSON.stringify(designData));
    localStorage.setItem("canva_editor_template_name", designName);
    localStorage.setItem("canva_editor_last_saved", new Date().toISOString());

    // Set a flag to indicate manual save is in progress (to prevent auto-save conflicts)
    localStorage.setItem("manual_save_in_progress", "true");
    localStorage.setItem("manual_save_user_id", userId);

    // Trigger sync to server with template ID and user ID
    const result = await syncChangesToServer({
      force: true, // Force manual saves to bypass any pending saves
      showNotification: false, // We handle notifications here
      templateId, // Pass template ID to sync service
      userId, // Pass correct user ID to sync service
    });

    // Clear the manual save flag
    localStorage.removeItem("manual_save_in_progress");
    localStorage.removeItem("manual_save_user_id");

    console.log("💾 Sync result:", result);
    console.log("💾 Sync completed, checking for new template ID...");

    if (result) {
      if (showNotification) {
        toast.success("Design saved successfully", { id: "design-save" });
      }
      console.log("✅ Design saved successfully");
      
      // If this was a new design (no designId), get the new ID from localStorage
      // The sync service stores it there after creating a new template
      let newTemplateId = templateId;
      if (!templateId) {
        const storedTemplateId = localStorage.getItem("canva_editor_template_id");
        console.log("🆔 New template ID from sync service:", storedTemplateId);
        console.log("🔍 All localStorage keys:", Object.keys(localStorage));
        console.log("🔍 localStorage template keys:");
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('template')) {
            console.log(`  ${key}: ${localStorage.getItem(key)}`);
          }
        }
        
        // Update the editor context with the new design ID
        if (storedTemplateId && editorContext?.setDesignId) {
          editorContext.setDesignId(storedTemplateId);
          console.log("🆔 Updated editor context with new design ID:", storedTemplateId);
          newTemplateId = storedTemplateId;
        } else if (!storedTemplateId) {
          console.warn("⚠️ No template ID found in localStorage after sync");
        } else if (!editorContext?.setDesignId) {
          console.warn("⚠️ Editor context missing setDesignId function");
        }
      }
      
      return { success: true, templateId: newTemplateId || undefined };
    } else {
      throw new Error("Failed to sync design to server");
    }
  } catch (error) {
    console.error("❌ Error saving design:", error);
    
    if (showNotification) {
      toast.error("Failed to save design", { id: "design-save" });
    }
    
    return { success: false };
  } finally {
    // Always clear the manual save flag in case of error
    localStorage.removeItem("manual_save_in_progress");
    localStorage.removeItem("manual_save_user_id");
  }
};

/**
 * Gets the current design data from the editor context
 * @param query - The editor query object
 * @returns The serialized design data
 */
export const getCurrentDesignData = (query: any) => {
  console.log("🔍 getCurrentDesignData called");
  console.log("📋 Query object:", query);
  console.log("📋 Query.serialize exists:", !!query?.serialize);
  
  try {
    if (query?.serialize) {
      const serialized = query.serialize();
      console.log("✅ Design serialized successfully");
      console.log("📊 Serialized data keys:", Object.keys(serialized || {}));
      return serialized;
    } else {
      console.warn("⚠️ No serialize method found on query object");
      return {};
    }
  } catch (error) {
    console.error("❌ Error serializing design data:", error);
    return {};
  }
};

/**
 * Ensures the design is saved before performing an action
 * @param query - The editor query object
 * @param designName - The name of the design
 * @param editorContext - The editor context containing designId
 * @param user - The user object from auth context (optional)
 * @param actionName - The name of the action being performed (for notifications)
 * @returns Promise<boolean> - true if design was saved successfully
 */
export const ensureDesignSaved = async (
  query: any,
  designName: string,
  editorContext: any,
  user?: any, // User object from auth context
  actionName: string = "action"
): Promise<boolean> => {
  console.log(`🔄 ensureDesignSaved called for action: ${actionName}`);
  console.log("📋 Query object:", !!query);
  console.log("📝 Design name:", designName);
  console.log("🆔 Editor designId:", editorContext?.designId);
  console.log("👤 User object:", user);
  console.log("👤 User ID:", user?.userId);

  const designData = getCurrentDesignData(query);
  
  console.log("📊 Design data keys:", Object.keys(designData || {}));
  console.log("📊 Design data size:", designData ? Object.keys(designData).length : 0);
  
  if (!designData || Object.keys(designData).length === 0) {
    console.error(`❌ No design data found for ${actionName}`);
    toast.error(`Cannot perform ${actionName} - no design data found`);
    return false;
  }

  console.log(`💾 Attempting to save design for ${actionName}...`);

  const result = await saveDesignBeforeAction(designData, designName, editorContext, user, {
    force: true,
    showNotification: true,
    waitForCompletion: true,
  });

  console.log(`💾 Save result for ${actionName}:`, result);

  if (!result.success) {
    console.error(`❌ Failed to save design for ${actionName}`);
    toast.error(`Cannot perform ${actionName} - failed to save design`);
    return false;
  }

  console.log(`✅ Design saved successfully for ${actionName}`);
  return true;
};

/**
 * Updates the design's download statistics on the server
 * @param templateId - The ID of the design that was downloaded
 * @returns Promise<boolean> - true if update was successful
 */
export const updateDownloadStats = async (templateId?: string | null): Promise<boolean> => {
  console.log("📊 updateDownloadStats called");
  
  try {
    if (!templateId) {
      console.log("⚠️ No template ID provided, skipping download stats update");
      return true; // Don't fail the download process for missing ID
    }

    console.log("📊 Updating download stats for template:", templateId);

    // Update download count and timestamp on server
    const response = await fetch(`https://adstudioserver.foodyqueen.com/api/templates/${templateId}/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        downloadedAt: new Date().toISOString(),
        downloadType: 'PNG',
      }),
    });

    if (response.ok) {
      console.log("✅ Download stats updated successfully");
      return true;
    } else {
      console.warn("⚠️ Failed to update download stats:", response.status);
      return true; // Don't fail the download process for stats update failure
    }
  } catch (error) {
    console.error("❌ Error updating download stats:", error);
    return true; // Don't fail the download process for stats update failure
  }
};
