import React, {
  ChangeEvent,
  forwardRef,
  ForwardRefRenderFunction,
  useRef,
  useState,
} from 'react';
import { downloadObjectAsJson } from '../utils/download';
import { useEditor } from '@canva/hooks';
import PlayArrowIcon from '@canva/icons/PlayArrowIcon';
import CanvaIcon from '@canva/icons/CanvaIcon';
import EditInlineInput from '@canva/components/EditInlineInput';
import SettingDivider from '@canva/utils/settings/components/SettingDivider';
import EditorButton from '@canva/components/EditorButton';
import NextIcon from '@canva/icons/NextIcon';
import BackIcon from '@canva/icons/BackIcon';
import SyncedIcon from '@canva/icons/SyncedIcon';

interface HeaderLayoutProps {
  openPreview: () => void;
}
const HeaderLayout: ForwardRefRenderFunction<
  HTMLDivElement,
  HeaderLayoutProps
> = ({ openPreview }, ref) => {
  const [name, setName] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);
  const { actions, query } = useEditor();
  const handleExport = () => {
    downloadObjectAsJson('file', query.serialize());
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function () {
        const fileContent = JSON.parse(reader.result as string);
        actions.setData(fileContent);
      };
      reader.readAsText(file);
      e.target.value = '';
    }
  };
  return (
    <div
      ref={ref}
      css={{
        background: 'linear-gradient(90deg,#00c4cc,#7d2ae8)',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        '@media (max-width: 900px)': {
          padding: 12,
        },
      }}
    >
      <div
        css={{
          color: '#3d8eff',
          fontSize: 36,
        }}
      >
        <div css={{ color: 'white' }}>
          <CanvaIcon fill='currentColor' />
        </div>
      </div>
      <div
        css={{ display: 'flex', alignItems: 'center', verticalAlign: 'middle' }}
      >
        <div css={{ display: 'flex', alignItems: 'center', columnGap: 15 }}>
          <EditInlineInput
            text={name}
            placeholder='Untitled design'
            styles={{
              placeholderColor: 'hsla(0,0%,100%,.5)',
            }}
            onSetText={(newText) => {
              console.log('on change');
              setName(newText);
            }}
            handleStyle={(isFocus) => {
              return {
                color: '#fff',
                borderRadius: 6,
                padding: 8,
                border: `1px solid ${
                  isFocus ? 'hsla(0,0%,100%,.8)' : 'transparent'
                }`,
                ':hover': {
                  border: '1px solid hsla(0,0%,100%,.8)',
                },
              };
            }}
            inputCss={{
              borderBottomColor: 'transparent',
              backgroundColor: 'transparent',
            }}
          />
          <div css={{ color: 'hsla(0,0%,100%,.7)' }}>
            <SyncedIcon />
          </div>
        </div>
        <div
          css={{
            margin: '0 16px',
          }}
        >
          <SettingDivider background='hsla(0,0%,100%,.15)' />
        </div>
        <div css={{ display: 'flex', columnGap: 15 }}>
          <EditorButton
            onClick={actions.history.undo}
            disabled={!query.history.canUndo()}
            styles={{
                disabledColor: 'hsla(0,0%,100%,.4)',
                color: '#fff'
            }}
          >
            <BackIcon />
          </EditorButton>
          <EditorButton
            onClick={actions.history.redo}
            disabled={!query.history.canRedo()}
            styles={{
                disabledColor: 'hsla(0,0%,100%,.4)',
                color: '#fff'
            }}
          >
            <NextIcon />
          </EditorButton>
        </div>
        {/* <div
                    css={{
                        margin: '0 16px',
                        cursor: 'pointer',
                        color: '#fff',
                        fontWeight: 700,
                        ':hover': {
                            textDecoration: 'underline',
                        },
                    }}
                    onClick={() => uploadRef.current?.click()}
                >
                    <input
                        ref={uploadRef}
                        type="file"
                        accept="application/json"
                        onChange={handleImport}
                        css={{ display: 'none' }}
                    />
                    Import
                </div>
                <div
                    css={{
                        margin: '0 16px',
                        cursor: 'pointer',
                        color: '#fff',
                        fontWeight: 700,
                        ':hover': {
                            textDecoration: 'underline',
                        },
                    }}
                    onClick={() => handleExport()}
                >
                    Export
                </div>
                <div
                    css={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#fff',
                        lineHeight: 1,
                        background: '#3a3a4c',
                        padding: '8px 14px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        ':hover': {
                            background: 'rgba(58,58,76,0.5)',
                        },
                    }}
                    onClick={openPreview}
                >
                    <div css={{ marginRight: 4, fontSize: 20 }}>
                        <PlayArrowIcon />
                    </div>{' '}
                    Preview
                </div> */}
      </div>
    </div>
  );
};

export default forwardRef(HeaderLayout);
