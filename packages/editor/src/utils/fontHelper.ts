function handleFontStyleName(style: string) {
  if (style === 'regular') return '';

  const fontStrong = parseInt(style);
  if (style.includes('italic')) {
    // bold + italic
    const fontStyle = 'font-style: italic;\n';
    return fontStrong ? `font-weight: ${fontStrong};\n${fontStyle}` : fontStyle;
  }

  if (!fontStrong) return '';

  return `font-weight: ${fontStrong};\n`;
}

export { handleFontStyleName };
