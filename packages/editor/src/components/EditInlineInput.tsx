import { Interpolation, Theme } from '@emotion/react';
import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';

type InlineEditProps = {
  text: string;
  onSetText: (text: string) => void;
  placeholder?: string;
  styles?: { placeholderColor: string };
  handleStyle?: (isFocus: boolean) => Interpolation<Theme>;
  inputCss?: Interpolation<Theme>;
};

const EditInlineInput: React.FC<InlineEditProps> = ({
  text,
  onSetText,
  placeholder = 'Add new text',
  handleStyle,
  styles = { placeholderColor: '#73757b' },
  inputCss = null,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [textDraft, setTextDraft] = useState('');
  const handleDoubleClick = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setTextDraft(text);
    setIsEditing(true);
  };
  const handleBlur = () => {
    setIsFocused(false);
    handleSubmit();
  };
  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    setTextDraft(inputRef.current?.value || '');
    if (event.key === 'Enter') {
      handleSubmit();
    } else if (event.key === 'Escape') {
      setIsEditing(false);
      setTextDraft('');
    }
  };

  const handleSubmit = () => {
    setIsEditing(false);
    setTextDraft('');
    onSetText(inputRef.current?.value || '');
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div css={handleStyle && handleStyle(isFocused)}>
      <div css={{ minHeight: 18, minWidth: 18 }}>
        {isEditing ? (
          <div
            css={{
              position: 'relative',
            }}
          >
            <input
              ref={inputRef}
              defaultValue={text}
              onFocus={() => setIsFocused(true)}
              onBlur={handleBlur}
              onKeyDown={handleKeyPress}
              css={{
                position: 'absolute',
                border: 'none',
                borderBottom: '1px dashed #000',
                backgroundColor: 'transparent',
                width: 'calc(100% + 10px)',
                fontWeight: 'bold',
                color: 'inherit',
                font: 'inherit',
                zIndex: 1,
                ...(inputCss ? (inputCss as Record<string, Theme>) : {}),
              }}
            />
            <span css={{ opacity: 0 }}>{textDraft}</span>
          </div>
        ) : (
          <span
            onClick={handleDoubleClick}
            css={{
              color: text ? 'inherit' : styles.placeholderColor,
              fontWeight: 'bold',
              font: 'inherit',
              cursor: 'text',
            }}
          >
            {text || placeholder}
          </span>
        )}
      </div>
    </div>
  );
};

export default EditInlineInput;
