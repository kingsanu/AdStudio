import { FC, useEffect } from "react";
import { EffectSettings, FontData, LayerComponentProps } from "../../types";
import { getTextEffectStyle } from "../text/textEffect";
import { handleFontStyle } from "../../utils/fontHelper";

// Type definitions for the minified format
type ExtendedFontData = FontData & {
  x?: string; // family
  bl?: string; // style
  bm?: string[]; // styles
};

type ExtendedEffectSettings = Partial<EffectSettings> & {
  br?: number; // position
  bs?: number; // transparency
  bt?: number; // thickness
  bc?: string; // color
};

// ExtendedEffect type removed as it's not used

export interface TextContentProps extends LayerComponentProps {
  id: string;
  text: string;
  scale: number;
  fonts: FontData[];
  colors: string[];
  fontSizes: number[];
  effect: {
    bq: boolean;
    name: string;
    settings: EffectSettings;
  } | null;
}

export const TextContent: FC<TextContentProps> = ({
  id,
  text,
  colors,
  fontSizes,
  fonts,
  effect,
}) => {
  // Create a default empty style object
  let styles: Record<string, string | number> = {};

  // Only try to get text effect styles if we have a valid effect
  if (effect) {
    try {
      console.log("Effect object:", effect);

      // Handle both standard format and minified format
      const effectName = effect.name;
      const effectSettings: Partial<EffectSettings> = effect.settings || {};

      // Handle minified format where settings are in 'bq' property
      if (
        Object.keys(effectSettings).length === 0 &&
        "bq" in effect &&
        effect.bq
      ) {
        // Cast to unknown first to avoid TypeScript error
        const minifiedSettings = effect.bq as unknown as ExtendedEffectSettings;
        console.log(
          "Found minified effect settings in bq property:",
          minifiedSettings
        );

        // Map minified properties to standard properties
        if (minifiedSettings.br !== undefined)
          effectSettings.position = minifiedSettings.br;
        if (minifiedSettings.bs !== undefined)
          effectSettings.transparency = minifiedSettings.bs;
        if (minifiedSettings.bt !== undefined)
          effectSettings.thickness = minifiedSettings.bt;
        if (minifiedSettings.color !== undefined)
          effectSettings.color = minifiedSettings.color;
        if (minifiedSettings.bc !== undefined)
          effectSettings.color = minifiedSettings.bc;
      }

      if (
        effectName &&
        effectName !== "none" &&
        Object.keys(effectSettings).length > 0
      ) {
        console.log(
          "Applying effect:",
          effectName,
          "with settings:",
          effectSettings
        );
        const textColor = colors && colors.length > 0 ? colors[0] : undefined;
        const fontSize =
          fontSizes && fontSizes.length > 0 ? fontSizes[0] : undefined;

        const effectStyles = getTextEffectStyle(
          effectName,
          effectSettings as EffectSettings,
          textColor,
          fontSize
        );

        if (effectStyles && typeof effectStyles === "object") {
          styles = effectStyles as Record<string, string | number>;
        }
        console.log("Generated effect styles:", styles);
      } else {
        console.warn("Invalid effect configuration:", effect);
      }
    } catch (error) {
      console.error("Error applying text effect:", error);
      // Continue with empty styles if there's an error
    }
  }
  const textId = `text-${id}`;
  useEffect(() => {
    const testEl = document.getElementById(textId);
    if (testEl) {
      testEl.innerHTML = text;
    }
  }, [text, textId]);
  // Process font styles
  let fontStyles: Record<string, string> = {};
  if (fonts && fonts.length > 0) {
    try {
      console.log("Fonts available:", fonts);
      const font = fonts[0] as ExtendedFontData;
      console.log("Using font:", font);

      // Handle both standard format and minified format
      const fontFamily = font.family || font.name || font.x;
      const fontStyle = font.style || font.bl;

      if (fontFamily) {
        fontStyles = { fontFamily: `'${fontFamily}'` };
      }

      if (fontStyle) {
        console.log("Font style:", fontStyle);
        const fontStyleCSS = handleFontStyle(fontStyle);
        console.log("Generated font style CSS:", fontStyleCSS);
        if (fontStyleCSS && typeof fontStyleCSS === "string") {
          // Parse the CSS string into an object
          const cssProperties = fontStyleCSS
            .split(";\n")
            .filter((prop) => prop.trim() !== "")
            .reduce((acc, prop) => {
              const [key, value] = prop.split(": ");
              if (key && value) {
                acc[key.trim()] = value.trim();
              }
              return acc;
            }, {} as Record<string, string>);

          fontStyles = {
            ...fontStyles,
            ...cssProperties,
          };
          console.log("Applied font styles:", fontStyles);
        }
      } else {
        console.warn("Font object has no style property:", font);
      }
    } catch (error) {
      console.error("Error applying font styles:", error);
    }
  } else {
    console.warn("No fonts available for text content");
  }

  return (
    <div
      id={textId}
      className={`canva-editor-text`}
      css={{
        p: {
          "&:before": {
            ...styles,
          },
          ...fontStyles,
        },
        ...styles,
      }}
    />
  );
};
