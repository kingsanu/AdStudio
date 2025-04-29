/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEditorID } from "./identityGenerator";

export const dataMapping: any = {
  // Original mappings
  name: "a",
  notes: "b",
  layers: "c",
  ROOT: "d",
  type: "e",
  resolvedName: "f",
  props: "g",
  boxSize: "h",
  width: "i",
  height: "j",
  position: "k",
  x: "l",
  y: "m",
  rotate: "n",
  color: "o",
  image: "p",
  gradientBackground: "q",
  locked: "r",
  child: "s",
  parent: "t",
  scale: "u",
  text: "v",
  fonts: "w",
  family: "x",
  url: "y",
  style: "z",
  styles: "aa",
  colors: "ab",
  fontSizes: "ac",
  effect: "ad",
  settings: "ae",
  thickness: "af",
  transparency: "ag",
  clipPath: "ah",
  shapeSize: "ai",
  thumb: "aj",
  offset: "ak",
  direction: "al",
  blur: "am",
  border: "an",
  weight: "ao",

  // New mappings for text templates
  // These are the reverse mappings for the new format
  // Original property name: minified name
  // aq: "name",
  // as: "layers",
  // ar: "locked",
  // au: "type",
  // av: "resolvedName",
  // aw: "props",
  // ax: "boxSize",
  // ay: "width",
  // az: "height",
  // ba: "position",
  // bg: "x",
  // bh: "y",
  // bb: "rotate",
  // bc: "color",
  // bd: "image",
  // be: "child",
  // bf: "parent",
  // bi: "scale",
  // bj: "text",
  // bk: "fonts",
  // bn: "colors",
  // bo: "fontSizes",
  // bp: "effect",
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

const pack = (obj: any, mapping: any = {}, charCode = 1): any => {
  if (typeof obj !== "object" || obj === null) {
    return [obj, mapping];
  }

  if (Array.isArray(obj)) {
    const packedArray: any = [];

    for (let i = 0; i < obj.length; i++) {
      const [packedItem, updatedMapping] = pack(obj[i], mapping, charCode);
      packedArray.push(packedItem);
      mapping = updatedMapping;
    }
    return [packedArray, mapping];
  }

  const packedObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (!mapping[key]) {
        console.log(key);
        if (!isEditorID(key)) {
          mapping[key] = getAlphabetCharByOrder(charCode);
          charCode++;
        }
      } else {
        //ll
      }
      const [packedValue, updatedMapping] = pack(obj[key], mapping, charCode);
      packedObj[mapping[key] || key] = packedValue;
      charCode = Math.max(charCode, Object.keys(updatedMapping).length + 1);

      mapping = { ...mapping, ...updatedMapping };
    }
  }

  return [packedObj, mapping];
};

const unpack = (packed: any, depth = 0, path = "root"): any => {
  const indent = "  ".repeat(depth);
  console.log(
    `${indent}[UNPACK] Processing at ${path}, type: ${typeof packed}, value:`,
    packed
  );

  // Handle null or undefined
  if (packed === null || packed === undefined) {
    console.log(`${indent}[UNPACK] Returning null/undefined value at ${path}`);
    return packed;
  }

  // Handle arrays
  if (Array.isArray(packed)) {
    console.log(
      `${indent}[UNPACK] Processing array at ${path} with ${packed.length} items`
    );
    const unpackedArray: any = [];
    for (let i = 0; i < packed.length; i++) {
      console.log(`${indent}[UNPACK] Processing array item ${i} at ${path}`);
      unpackedArray.push(unpack(packed[i], depth + 1, `${path}[${i}]`));
    }
    console.log(
      `${indent}[UNPACK] Finished array at ${path}, result:`,
      unpackedArray
    );
    return unpackedArray;
  }

  // Handle objects
  if (typeof packed === "object") {
    console.log(
      `${indent}[UNPACK] Processing object at ${path} with ${
        Object.keys(packed).length
      } keys`
    );
    const unpackedObj: any = {};
    for (const key in packed) {
      if (packed.hasOwnProperty(key)) {
        // Find the original key from the mapping
        let originalKey = key;

        // First check if this is a key from the original mapping (a -> name)
        const originalMappingKey = Object.keys(dataMapping).find(
          (k) => dataMapping[k] === key
        );
        if (originalMappingKey) {
          originalKey = originalMappingKey;
          console.log(
            `${indent}[UNPACK] Found key in original mapping: '${key}' -> '${originalKey}'`
          );
        }
        // Then check if this is a key from the new format (aq -> name)
        else if (dataMapping[key]) {
          originalKey = dataMapping[key];
          console.log(
            `${indent}[UNPACK] Found key in new format mapping: '${key}' -> '${originalKey}'`
          );
        }
        console.log(
          `${indent}[UNPACK] Key mapping: '${key}' -> '${originalKey}' at ${path}`
        );

        // Recursively unpack the value
        const value = packed[key];
        console.log(
          `${indent}[UNPACK] Processing value for key '${originalKey}' at ${path}.${originalKey}`
        );
        unpackedObj[originalKey] = unpack(
          value,
          depth + 1,
          `${path}.${originalKey}`
        );
      }
    }
    console.log(
      `${indent}[UNPACK] Finished object at ${path}, result:`,
      unpackedObj
    );
    return unpackedObj;
  }

  // Handle primitive values (string, number, boolean)
  console.log(
    `${indent}[UNPACK] Returning primitive value at ${path}: ${packed}`
  );
  return packed;
};

export { pack, unpack };
