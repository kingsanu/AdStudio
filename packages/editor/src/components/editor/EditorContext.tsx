import { EditorActions, EditorQuery, EditorState, FontData, GetFontQuery } from '@canva/types';
import { createContext } from 'react';

export type EditorConfig = {
    assetPath: string;
};
export type EditorContext = {
    getState: () => EditorState;
    query: EditorQuery;
    actions: EditorActions;
    getFonts: (query: GetFontQuery) => Promise<FontData[]>;
    config: EditorConfig;
};

export const EditorContext = createContext<EditorContext>({} as EditorContext);
