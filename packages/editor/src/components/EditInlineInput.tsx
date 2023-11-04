import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';

type InlineEditProps = {
  text: string;
  onSetText: (text: string) => void;
  placeholder?: string;
};

const EditInlineInput: React.FC<InlineEditProps> = ({
  text,
  onSetText,
  placeholder = 'Add new text',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [textDraft, setTextDraft] = useState('');
  const handleDoubleClick = () => {
    setTextDraft(text);
    setIsEditing(true);
  };
  const handleBlur = () => {
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
    <div>
      {isEditing ? (
        <div
          css={{
            position: 'relative',
          }}
        >
          <input
            ref={inputRef}
            defaultValue={text}
            placeholder={placeholder}
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
            }}
          />
          <span css={{ opacity: 0 }}>{textDraft}</span>
        </div>
      ) : (
        <span
          onClick={handleDoubleClick}
          css={{
            color: text ? 'inherit' : '#73757b',
            fontWeight: 'bold',
            font: 'inherit',
          }}
        >
          {text || placeholder}
        </span>
      )}
    </div>
  );
};

export default EditInlineInput;
