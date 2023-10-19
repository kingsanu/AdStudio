// @ts-nocheck
import { data } from './data';
import Test from './Test';

function isGUID(key) {
  return key.match(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
  );
}

function getAlphabetCharByOrder(order) {
  const alphabetLength = 26;

  if (order <= alphabetLength) {
    return String.fromCharCode(96 + order); // 'a' là 97
  } else {
    const firstCharOrder = Math.floor((order - 1) / alphabetLength);
    const secondCharOrder = ((order - 1) % alphabetLength) + 1;

    const firstChar = String.fromCharCode(96 + firstCharOrder);
    const secondChar = String.fromCharCode(96 + secondCharOrder);

    return firstChar + secondChar;
  }
}
function pack(obj, charCode = 1, mapping = {}) {
  if (typeof obj !== 'object' || obj === null) {
    return [obj, mapping];
  }

  if (Array.isArray(obj)) {
    const packedArray = [];
    for (let i = 0; i < obj.length; i++) {
      const [packedItem, updatedMapping] = pack(obj[i], charCode, mapping);
      packedArray.push(packedItem);
      mapping = updatedMapping;
    }
    return [packedArray, mapping];
  }

  const packedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (!mapping[key]) {
        if (!isGUID(key)) {
          mapping[key] = getAlphabetCharByOrder(charCode);
          charCode++;
        }
      } else {
      }
      const [packedValue, updatedMapping] = pack(obj[key], charCode, mapping);
      packedObj[mapping[key] || key] = packedValue;
      charCode = Math.max(charCode, Object.keys(updatedMapping).length + 1);

      mapping = { ...mapping, ...updatedMapping };
    }
  }

  return [packedObj, mapping];
}

function unpack(packed, mapping) {
  if (Array.isArray(packed)) {
    const unpackedArray = [];
    for (let i = 0; i < packed.length; i++) {
      unpackedArray.push(unpack(packed[i], mapping));
    }
    return unpackedArray;
  }

  if (typeof packed === 'object') {
    const unpackedObj = {};
    for (const key in packed) {
      if (packed.hasOwnProperty(key)) {
        const originalKey =
          Object.keys(mapping).find((k) => mapping[k] === key) || key;
        unpackedObj[originalKey] = unpack(packed[key], mapping);
      }
    }
    return unpackedObj;
  }

  return packed;
}

function App() {
  const mapping = {
    locked: 'a',
    layers: 'b',
    ROOT: 'c',
    type: 'd',
    resolvedName: 'e',
    props: 'f',
    boxSize: 'g',
    width: 'h',
    height: 'i',
    position: 'j',
    x: 'k',
    y: 'l',
    rotate: 'm',
    color: 'n',
    image: 'o',
    child: 'p',
    parent: 'q',
    shape: 'r',
    text: 's',
    scale: 't',
    fonts: 'u',
    name: 'v',
    urls: 'w',
    colors: 'x',
    fontSizes: 'y',
    style: 'z',
    effect: 'aa',
  };

  const [packedObject] = pack(data);
  console.log('Mapping:', JSON.stringify(mapping));
  console.log('Packed Object:', packedObject);

  const unpackedObject = unpack(packedObject, mapping);
  console.log('Original Object:', data);
  console.log('Unpacked Object:', unpackedObject);
  // console.log('Original Object:', JSON.stringify(data));
  // console.log('Unpacked Object:', JSON.stringify(unpackedObject));
  return <Test />;
}

export default App;
