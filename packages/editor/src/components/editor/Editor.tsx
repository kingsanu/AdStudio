import { FC, PropsWithChildren, useEffect, useRef, useState } from 'react';
import { EditorConfig, EditorContext } from './EditorContext';
import { useEditorStore } from '../../hooks/useEditorStore';
import HeaderLayout from '@canva/layout/HeaderLayout';
import Sidebar from '@canva/layout/Sidebar';
import EditorContent from '@canva/layout/pages/EditorContent';
import AppLayerSettings from '@canva/layout/AppLayerSettings';
import { PageControl } from '@canva/utils/settings';

export type EditorProps = {
  data?: {
    name: string;
    editorConfig: any;
  };
  saving?: boolean;
  config: EditorConfig;
  onChanges: (changes: any) => void;
  onDesignNameChanges: (name: any) => void;
};

const CanvaEditor: FC<PropsWithChildren<EditorProps>> = ({
  data,
  config,
  saving,
  onChanges,
  onDesignNameChanges
}) => {
  const { getState, actions, query } = useEditorStore();
  const leftSidebarRef = useRef<HTMLDivElement>(null);
  const [viewPortHeight, setViewPortHeight] = useState<number>();

  useEffect(() => {
    const windowHeight = () => {
      setViewPortHeight(window.innerHeight);
    };
    window.addEventListener('resize', windowHeight);
    windowHeight();
    return () => {
      window.removeEventListener('resize', windowHeight);
    };
  }, []);

  return (
    <EditorContext.Provider value={{ config, getState, actions, query }}>
      <div
        css={{
          display: 'flex',
          flexDirection: 'column',
          width: '100vw',
          height: '100vh',
          maxHeight: viewPortHeight ? `${viewPortHeight}px` : 'auto',
        }}
      >
        <HeaderLayout designName={data?.name || ''} saving={saving || false} onChanges={onDesignNameChanges} />
        <div
          css={{
            display: 'flex',
            flexDirection: 'row',
            flex: 'auto',
            overflow: 'auto',
            background: '#EBECF0',
            '@media (max-width: 900px)': {
              flexDirection: 'column-reverse',
            },
          }}
        >
          <div
            ref={leftSidebarRef}
            css={{
              display: 'flex',
              background: 'white',
            }}
          >
            <Sidebar />
          </div>
          <div
            css={{
              flexGrow: 1,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
            }}
          >
            <AppLayerSettings />
            <div
              css={{
                flexGrow: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <EditorContent data={data?.editorConfig} onChanges={onChanges} />
            </div>
            <div
              css={{
                height: 40,
                background: '#fff',
                borderTop: '1px solid rgba(57,76,96,.15)',
                display: 'grid',
                alignItems: 'center',
                flexShrink: 0,
                '@media (max-width: 900px)': {
                  display: 'none',
                },
              }}
            >
              <PageControl />
            </div>
          </div>
        </div>
      </div>
    </EditorContext.Provider>
  );
};

export default CanvaEditor;
