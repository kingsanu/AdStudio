import { FC, PropsWithChildren } from 'react';
import { EditorConfig, EditorContext } from './EditorContext';
import { FontData, GetFontQuery } from '@canva/types';
import { useEditorStore } from '../../hooks/useEditorStore';

export type EditorProps = {
    config: EditorConfig;
    getFonts: (query: GetFontQuery) => Promise<FontData[]>;
};

const Editor: FC<PropsWithChildren<EditorProps>> = ({ getFonts, config, children }) => {
    const { getState, actions, query } = useEditorStore();
    return (
        <EditorContext.Provider value={{ config, getState, actions, query, getFonts }}>
            {children}
        </EditorContext.Provider>
    );
};

export default Editor;
