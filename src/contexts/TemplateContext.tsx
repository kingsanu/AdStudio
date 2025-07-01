import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface TemplateContextType {
  // Template state
  templateId: string | null;
  lastSavedTitle: string | null;
  isNewDesign: boolean;
  
  // Actions
  setTemplateId: (id: string | null) => void;
  setLastSavedTitle: (title: string | null) => void;
  startNewDesign: () => void;
  createFromTemplate: (sourceTemplateTitle?: string) => void;
  
  // Getters
  shouldCreateNewTemplate: (currentTitle: string) => boolean;
  getTemplateInfo: () => {
    templateId: string | null;
    lastSavedTitle: string | null;
    isNewDesign: boolean;
  };
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

interface TemplateProviderProps {
  children: ReactNode;
}

export const TemplateProvider: React.FC<TemplateProviderProps> = ({ children }) => {
  const [templateId, setTemplateIdState] = useState<string | null>(null);
  const [lastSavedTitle, setLastSavedTitleState] = useState<string | null>(null);
  const [isNewDesign, setIsNewDesign] = useState<boolean>(true);

  const setTemplateId = useCallback((id: string | null) => {
    console.log("📋 TemplateContext: Setting template ID:", id);
    setTemplateIdState(id);
    setIsNewDesign(!id); // If no ID, it's a new design
  }, []);

  const setLastSavedTitle = useCallback((title: string | null) => {
    console.log("📝 TemplateContext: Setting last saved title:", title);
    setLastSavedTitleState(title);
  }, []);

  const startNewDesign = useCallback(() => {
    console.log("🆕 TemplateContext: Starting new design");
    setTemplateIdState(null);
    setLastSavedTitleState(null);
    setIsNewDesign(true);
  }, []);

  const createFromTemplate = useCallback((sourceTemplateTitle?: string) => {
    console.log("📋 TemplateContext: Creating from template:", sourceTemplateTitle);
    setTemplateIdState(null); // Clear any existing template ID
    setLastSavedTitleState(null); // Clear last saved title
    setIsNewDesign(true); // This is a new design based on template
  }, []);

  const shouldCreateNewTemplate = useCallback((currentTitle: string): boolean => {
    // Create new template if:
    // 1. No existing template ID (first save)
    // 2. Title has changed from what was last saved
    const noExistingId = !templateId;
    const titleChanged = currentTitle !== (lastSavedTitle || "") && lastSavedTitle !== null;
    
    const result = noExistingId || titleChanged;
    
    console.log("🤔 TemplateContext: Should create new template?", {
      result,
      noExistingId,
      titleChanged,
      currentTitle,
      lastSavedTitle,
      templateId
    });
    
    return result;
  }, [templateId, lastSavedTitle]);

  const getTemplateInfo = useCallback(() => {
    return {
      templateId,
      lastSavedTitle,
      isNewDesign
    };
  }, [templateId, lastSavedTitle, isNewDesign]);

  const value: TemplateContextType = {
    templateId,
    lastSavedTitle,
    isNewDesign,
    setTemplateId,
    setLastSavedTitle,
    startNewDesign,
    createFromTemplate,
    shouldCreateNewTemplate,
    getTemplateInfo
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplate = (): TemplateContextType => {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplate must be used within a TemplateProvider');
  }
  return context;
};

export default TemplateContext;
