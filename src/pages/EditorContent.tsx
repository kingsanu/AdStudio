import { DesignFrame } from '@canva/components/editor';
// import { data } from '../origin-data';
import { data } from '../data';

const EditorContent = () => {
    return <DesignFrame data={data} />;
};

export default EditorContent;
