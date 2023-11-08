import { css, Global } from '@emotion/react';
import React, { FC, useMemo } from 'react';
import { FontData } from '../../types';

export interface FontStyleProps {
    font: FontData;
}
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
const FontStyle: FC<FontStyleProps> = ({ font }) => {
    const fontFaceString = useMemo(() => {
        const fontFaceCss: string[] = [];
        fontFaceCss.push(`
            @font-face {
                font-family: '${font.name}';
                ${handleFontStyleName(font.style)}
                src: url(${font.url}) format('woff2');
                font-display: block;
            }
        `);
        return fontFaceCss.join('\n');
    }, [font]);

    return (
        <Global
            styles={css`
                ${fontFaceString}
            `}
        />
    );
};

export default React.memo(FontStyle);
