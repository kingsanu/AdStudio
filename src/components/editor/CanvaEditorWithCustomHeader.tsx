import { FC, useRef, useEffect } from "react";
import { CanvaEditor } from "canva-editor/components/editor";
import CustomHeader from "./CustomHeader";

// Define the props type
interface CanvaEditorWithCustomHeaderProps {
  data?: {
    name: string;
    editorConfig: unknown;
  };
  saving?: boolean;
  config: any;
  onChanges: (changes: unknown) => void;
  onDesignNameChanges?: (name: string) => void;
  isTextTemplate?: boolean;
  isAdmin?: boolean;
  isKiosk?: boolean;
  onShare?: () => void;
  onSaveAsTemplate?: () => void;
  [key: string]: any;
}

const CanvaEditorWithCustomHeader: FC<CanvaEditorWithCustomHeaderProps> = ({
  data,
  config,
  onChanges,
  onDesignNameChanges,
  isTextTemplate = false,
  isAdmin = false,
  isKiosk = false,
  onShare,
  onSaveAsTemplate,
  ...rest
}) => {
  // Create a ref to the editor container
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // After the component mounts, inject our custom header
  useEffect(() => {
    if (editorContainerRef.current) {
      // Find the original header
      const originalHeader =
        editorContainerRef.current.querySelector(".editor-header");

      // If found, replace it with our custom header
      if (originalHeader && originalHeader instanceof HTMLElement) {
        originalHeader.style.display = "none";
      }
    }
  }, []);

  return (
    <div className="h-screen overflow-hidden" ref={editorContainerRef}>
      {/* The CanvaEditor component */}
      {/* Render the custom header separately */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <CustomHeader isAdmin={isAdmin} isKiosk={isKiosk} onShare={onShare} />
      </div>

      {/* The CanvaEditor component */}
      <CanvaEditor
        data={data}
        config={config}
        onChanges={onChanges}
        onDesignNameChanges={onDesignNameChanges}
        isTextTemplate={isTextTemplate}
        {...rest}
      />

      {/* CSS to hide horizontal scrollbars */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* Hide horizontal scrollbars */
          .horizontal-scroll::-webkit-scrollbar {
            height: 0;
            display: none;
          }
          .horizontal-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
        `,
        }}
      />
    </div>
  );
};

export default CanvaEditorWithCustomHeader;
