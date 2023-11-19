import { CanvaEditor } from '@canva/components/editor';
import { data } from './sampleData';
// import { useEditorStore } from '@canva/hooks/useEditorStore';
const editorConfig = {
  frame: {
    defaultImage: {
      url: './assets/images/frame-placeholder.png',
      width: 1200,
      height: 800,
    },
  },
  apis: {
    url: 'http://localhost:4000/api',
    searchFonts: '/fonts',
    searchTemplates: '/templates',
    searchTexts: '/texts',
    searchImages: '/images',
    searchShapes: '/shapes',
    searchFrames: '/frames',
    templateKeywordSuggestion: '/template-suggestion',
    textKeywordSuggestion: '/text-suggestion',
    imageKeywordSuggestion: '/image-suggestion',
    shapeKeywordSuggestion: '/shape-suggestion',
    frameKeywordSuggestion: '/frame-suggestion',
  },
  editorAssetsUrl: 'http://localhost:4000/editor',
  imageKeywordSuggestions: 'animal,sport,love,scene,dog,cat,whale',
  templateKeywordSuggestions:
    'mother,sale,discount,fashion,model,deal,motivation,quote',
};

const Test = () => {
  // const { actions } = useEditorStore();
  const name = '';
  const handleOnChanges = (changes: any) => {
    console.log('On changes');
    console.log(changes);
    
    // actions.setSaveStatus(true);
    // setTimeout(() => {
    //   actions.setSaveStatus(false);
    // }, 3e3);
  };

  const handleOnDesignNameChanges = (newName: string) => {
    console.log('On name changes');
    console.log(newName);
    
    // actions.setSaveStatus(true);
    // setTimeout(() => {
    //   actions.setSaveStatus(false);
    // }, 3e3);
  };
  return (
    <CanvaEditor
      data={{
        name,
        editorConfig: data,
      }}
      config={editorConfig}
      onChanges={handleOnChanges}
      onDesignNameChanges={handleOnDesignNameChanges}
    />
  );
};

export default Test;
