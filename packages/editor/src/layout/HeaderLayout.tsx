import { forwardRef, ForwardRefRenderFunction, useState } from 'react';
import { useEditor } from '@canva/hooks';
import CanvaIcon from '@canva/icons/CanvaIcon';
import EditInlineInput from '@canva/components/EditInlineInput';
import SettingDivider from '@canva/utils/settings/components/SettingDivider';
import EditorButton from '@canva/components/EditorButton';
import NextIcon from '@canva/icons/NextIcon';
import BackIcon from '@canva/icons/BackIcon';
import SyncedIcon from '@canva/icons/SyncedIcon';
import HeaderFileMenu from './sidebar/components/HeaderFileMenu';
import SyncingIcon from '@canva/icons/SyncingIcon';

interface HeaderLayoutProps {
  designName: string;
  onChanges: (str: string) => void;
}
const HeaderLayout: ForwardRefRenderFunction<
  HTMLDivElement,
  HeaderLayoutProps
> = ({ designName, onChanges }, ref) => {
  const [name, setName] = useState(designName);
  const { actions, query, saving } = useEditor((state) => {
    return {
      saving: state.saving
    };
  });
  return (
    <div
      ref={ref}
      css={{
        background: 'linear-gradient(90deg,#00c4cc,#7d2ae8)',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 9999,
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
      <div css={{ marginRight: 'auto' }}>
        <div css={{ margin: '0 16px' }}>
          <HeaderFileMenu designName={name} />
        </div>
      </div>
      <div
        css={{ display: 'flex', alignItems: 'center', verticalAlign: 'middle' }}
      >
        <div css={{ display: 'flex', alignItems: 'center', columnGap: 15 }}>
          <EditInlineInput
            text={name}
            placeholder='Untitled design'
            autoRow={false}
            styles={{
              placeholderColor: 'hsla(0,0%,100%,.5)',
            }}
            onSetText={(newText) => {
              setName(newText);
              onChanges(newText);
            }}
            handleStyle={(isFocus) => {
              return {
                color: '#fff',
                borderRadius: 6,
                padding: 8,
                minHeight: 18,
                minWidth: 18,
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
            {saving ? '...' : 'sss'}
            {saving ? <SyncingIcon /> : <SyncedIcon />}
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
              color: '#fff',
            }}
            tooltip='Undo'
          >
            <BackIcon />
          </EditorButton>
          <EditorButton
            onClick={actions.history.redo}
            disabled={!query.history.canRedo()}
            styles={{
              disabledColor: 'hsla(0,0%,100%,.4)',
              color: '#fff',
            }}
            tooltip='Redo'
          >
            <NextIcon />
          </EditorButton>
        </div>
      </div>
    </div>
  );
};

export default forwardRef(HeaderLayout);
