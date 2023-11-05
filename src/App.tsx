import { pack, unpack } from '@canva/utils/minifier';
import { data } from './origin-data';
// import { data } from './data';
import Test from './Test';
import {
  JSXElementConstructor,
  ReactElement,
  ReactNode,
  ReactPortal,
  useState,
} from 'react';
// import { GridView } from './dev/GridView';
// import { generateRandomID, isEditorID } from '@canva/utils/identityGenerator';
// function App() {
//   // const id = generateRandomID(10);
//   // console.log(id)
//   // console.log(isEditorID(id))
//   const [packedObject,mapping] = pack(data);
//   console.log('Packed Object:', packedObject);
//   console.log('Packed Object:', mapping);

//   // const unpackedObject = unpack(packedObject);
//   // console.log('Original Object:', data);
//   // console.log('Unpacked Object:', unpackedObject);
//   // console.log('Original Object:', JSON.stringify(data));
//   // console.log('Unpacked Object:', JSON.stringify(unpackedObject));
//   // return <>test</>;
// }

// const formatResult = (item: { id: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; name: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; }) => {
//   return (
//     <>
//       <span style={{ display: 'block', textAlign: 'left' }}>id: {item.id}</span>
//       <span style={{ display: 'block', textAlign: 'left' }}>name: {item.name}</span>
//     </>
//   )
// }
function App() {
  return <Test />;
}

export default App;
