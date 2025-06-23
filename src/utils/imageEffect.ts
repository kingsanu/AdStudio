import { ImageEffectSettings } from "../../packages/editor/src/types";

/**
 * Gets the CSS style for image effects
 * @param imageEffects The image effect settings
 * @returns CSS style object
 */
export function getImageEffectStyle(
  imageEffects: ImageEffectSettings | undefined
): Record<string, string | number> {
  if (!imageEffects) {
    return {};
  }

  const styles: Record<string, string | number> = {};

  // Build CSS filter string
  const filters: string[] = [];
  
  if (imageEffects.brightness && imageEffects.brightness !== 100) {
    filters.push(`brightness(${imageEffects.brightness}%)`);
  }
  if (imageEffects.contrast && imageEffects.contrast !== 100) {
    filters.push(`contrast(${imageEffects.contrast}%)`);
  }
  if (imageEffects.saturation && imageEffects.saturation !== 100) {
    filters.push(`saturate(${imageEffects.saturation}%)`);
  }
  if (imageEffects.hue && imageEffects.hue !== 0) {
    filters.push(`hue-rotate(${imageEffects.hue}deg)`);
  }
  if (imageEffects.sepia && imageEffects.sepia > 0) {
    filters.push(`sepia(${imageEffects.sepia}%)`);
  }
  if (imageEffects.grayscale && imageEffects.grayscale > 0) {
    filters.push(`grayscale(${imageEffects.grayscale}%)`);
  }
  if (imageEffects.invert && imageEffects.invert > 0) {
    filters.push(`invert(${imageEffects.invert}%)`);
  }
  
  if (filters.length > 0) {
    styles.filter = filters.join(' ');
  }

  // Border radius (limited to 50%)
  if (imageEffects.borderRadius && imageEffects.borderRadius > 0) {
    const radius = Math.min(imageEffects.borderRadius, 50);
    styles.borderRadius = `${radius}%`;
    styles.overflow = 'hidden';
  }

  // Border styling
  if (imageEffects.borderWidth && imageEffects.borderWidth > 0) {
    const borderWidth = Math.min(imageEffects.borderWidth, 20);
    const borderColor = imageEffects.borderColor || '#000000';
    const borderStyle = imageEffects.borderStyle || 'solid';
    
    if (borderStyle === 'curved') {
      // Create a curved border effect using box-shadow
      styles.boxShadow = `inset 0 0 0 ${borderWidth}px ${borderColor}`;
      styles.borderRadius = styles.borderRadius || '20px';
    } else {
      styles.border = `${borderWidth}px ${borderStyle} ${borderColor}`;
    }
  }

  return styles;
}
