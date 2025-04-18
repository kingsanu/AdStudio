import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      expand
      richColors
      closeButton
      style={
        {
          "--success-bg": "#10b981",
          "--success-text": "white",
          "--success-border": "#059669",
          "--error-bg": "#ef4444",
          "--error-text": "white",
          "--error-border": "#dc2626",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
