import {
  EditorActions,
  EditorQuery,
  EditorState,
} from '@canva/types';
import { createContext } from 'react';

export type EditorConfig = {
  frame: {
    defaultImage: {
      url: string;
      width: number;
      height: number;
    };
  };

  //
  apis: {
    url: string;
    searchFonts: string;
    searchTemplates: string;
    searchTexts: string;
    searchImages: string;
    searchShapes: string;
    searchFrames: string;
    templateKeywordSuggestion: string;
    textKeywordSuggestion: string;
    imageKeywordSuggestion: string;
    shapeKeywordSuggestion: string;
    frameKeywordSuggestion: string;
  };
  editorAssetsUrl: string;
  imageKeywordSuggestions?: string;
  templateKeywordSuggestions?: string;
};
export type EditorContext = {
  getState: () => EditorState;
  query: EditorQuery;
  actions: EditorActions;
  config: EditorConfig;
};

export const EditorContext = createContext<EditorContext>({} as EditorContext);
