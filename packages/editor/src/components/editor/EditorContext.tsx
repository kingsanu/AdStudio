import { EditorActions, EditorQuery, EditorState } from "canva-editor/types";
import { createContext } from "react";

export type EditorConfig = {
  logoUrl?: string;
  isAdmin?: boolean; // Add admin flag to config
  type?: "coupon" | "template" | "design"; // Add type field for editor mode
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
    getUserImages: string;
    uploadImage: string;
  };
  placeholders?: {
    searchTemplate?: string;
    searchText?: string;
    searchImage?: string;
    searchShape?: string;
    searchFrame?: string;
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
