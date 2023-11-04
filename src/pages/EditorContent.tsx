import { DesignFrame } from '@canva/components/editor';
import { data } from '../origin-data';
// import { data } from '../data';

const EditorContent = () => {
    return <DesignFrame data={data} onChanges={(changes) => {
        console.log(changes)
    }} />;
};

export default EditorContent;
