// Design System Constants for AdStudio

export const COLORS = {
  // Brand colors
  brand: {
    primary: "#6366f1", // Indigo
    secondary: "#8b5cf6", // Purple
    accent: "#06b6d4", // Cyan
    success: "#099969", // Emerald
    warning: "#f59e0b", // Amber
    error: "#ef4444", // Red
  },

  // Gradients
  gradients: {
    primary: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    accent: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
    warm: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
    cool: "linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)",
  },

  // Neutral colors
  neutral: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },

  // Background colors
  background: {
    primary: "#ffffff",
    secondary: "#f8fafc",
    muted: "#f1f5f9",
    dark: "#0f172a",
  },

  // Text colors
  text: {
    primary: "#0f172a",
    secondary: "#475569",
    muted: "#64748b",
    inverse: "#ffffff",
  },

  // Border colors
  border: {
    default: "#e2e8f0",
    muted: "#f1f5f9",
    strong: "#cbd5e1",
  },
};

export const SPACING = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
  "3xl": "4rem", // 64px
};

export const SHADOWS = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  card: "0 4px 24px rgba(0, 0, 0, 0.08)",
  cardHover: "0 8px 32px rgba(0, 0, 0, 0.12)",
};

export const BORDER_RADIUS = {
  sm: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  "3xl": "1.5rem", // 24px
  full: "9999px",
};

export const TRANSITIONS = {
  fast: "0.15s ease-in-out",
  default: "0.2s ease-in-out",
  slow: "0.3s ease-in-out",
  bounce: "0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
};

export const TYPOGRAPHY = {
  fontSizes: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
  },
  fontWeights: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
  lineHeights: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.75",
  },
};

export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  toast: 1070,
};

// Component-specific styles
export const CARD_STYLES = {
  base: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.xl,
    boxShadow: SHADOWS.card,
    border: `1px solid ${COLORS.border.default}`,
    transition: TRANSITIONS.default,
  },
  hover: {
    boxShadow: SHADOWS.cardHover,
    transform: "translateY(-2px)",
  },
};

export const BUTTON_STYLES = {
  primary: {
    background: COLORS.gradients.primary,
    color: COLORS.text.inverse,
    borderRadius: BORDER_RADIUS.lg,
    transition: TRANSITIONS.default,
  },
  secondary: {
    backgroundColor: COLORS.neutral[100],
    color: COLORS.text.primary,
    borderRadius: BORDER_RADIUS.lg,
    border: `1px solid ${COLORS.border.default}`,
    transition: TRANSITIONS.default,
  },
};
