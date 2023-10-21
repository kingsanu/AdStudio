import { isEditorID } from './identityGenerator';

const dataMapping: any = {
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

function getAlphabetCharByOrder(order: number) {
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

const pack = (obj: any, charCode = 1, mapping: any = {}): any => {
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

  const packedObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (!mapping[key]) {
        console.log(key, isEditorID(key));
        if (!isEditorID(key)) {
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
};

const unpack = (packed: any): any => {
  if (!packed) return packed;
  if (Array.isArray(packed)) {
    const unpackedArray = [];
    for (let i = 0; i < packed.length; i++) {
      unpackedArray.push(unpack(packed[i]));
    }
    return unpackedArray;
  }

  if (typeof packed === 'object') {
    const unpackedObj: any = {};
    for (const key in packed) {
      if (packed.hasOwnProperty(key)) {
        const originalKey =
          Object.keys(dataMapping).find((k) => dataMapping[k] === key) || key;
        unpackedObj[originalKey] = unpack(packed[key]);
      }
    }
    return unpackedObj;
  }

  return packed;
};

export { pack, unpack };
