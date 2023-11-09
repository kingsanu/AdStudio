import { EditorActions, EditorQuery, EditorState, FontDataApi, GetFontQuery } from '@canva/types';
import { createContext } from 'react';

export type EditorConfig = {
    assetPath: string;
    frame: {
        defaultImage: {
            url: string;
            width: number;
            height: number;
        }
    }
};
export type EditorContext = {
    getState: () => EditorState;
    query: EditorQuery;
    actions: EditorActions;
    getFonts: (query: GetFontQuery) => Promise<FontDataApi[]>;
    config: EditorConfig;
};

export const EditorContext = createContext<EditorContext>({} as EditorContext);
