// Import the EffectSettings type from the correct path
import { EffectSettings } from "../../packages/editor/src/types";

/**
 * Gets the CSS style for a text effect
 * @param effect The text effect settings
 * @returns CSS style string
 */
export function getTextEffectStyle(
  effect: string | undefined,
  settings: EffectSettings | undefined,
  _textColor: string | undefined, // Prefix with underscore to indicate it's not used
  _fontSize: number | undefined // Prefix with underscore to indicate it's not used
): Record<string, any> {
  // Use 'any' to allow nested objects
  // If no effect is provided, return an empty object
  if (!effect || effect === "none" || !settings) {
    console.warn("Text effect, settings, or effect name is undefined or null");
    return {};
  }

  // Handle splice effect
  if (effect === "splice") {
    // Check if color exists
    if (!settings.color) {
      console.warn("Text effect color is undefined or null");
      return {};
    }

    return {
      position: "relative",
      zIndex: 1,
      "&::after": {
        content: "''",
        position: "absolute",
        bottom: `${settings.position || 0}%`,
        left: 0,
        height: `${settings.thickness || 10}px`,
        width: "100%",
        backgroundColor: settings.color,
        zIndex: -1,
        opacity:
          settings.transparency !== undefined
            ? 1 - settings.transparency / 100
            : 1,
      },
    };
  }

  // Handle shadow effect
  if (effect === "shadow") {
    // Check if color exists
    if (!settings.color) {
      console.warn("Text effect color is undefined or null");
      return {};
    }

    const offsetX = settings.offset
      ? settings.offset * Math.cos(settings.direction || 0)
      : 0;
    const offsetY = settings.offset
      ? settings.offset * Math.sin(settings.direction || 0)
      : 0;

    return {
      textShadow: `${offsetX}px ${offsetY}px ${settings.blur || 0}px ${
        settings.color
      }`,
    };
  }

  // Handle border effect
  if (effect === "border") {
    // Check if color exists
    if (!settings.color) {
      console.warn("Text effect color is undefined or null");
      return {};
    }

    // Use thickness property instead of weight (which doesn't exist in EffectSettings)
    return {
      WebkitTextStroke: `${settings.thickness || 1}px ${settings.color}`,
    };
  }

  // Default case
  return {};
}
