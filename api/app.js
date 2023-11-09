const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

const fs = require('fs');

app.listen(4000, () => {
  console.log('Server has started! Open http://localhost:4000');
});
app.use(express.static(__dirname + '/public')); //Serves resources from public folder

function paginateArrayWithFilter(array, size = 30, index = 0, keyword = '') {
  const startIndex = index * size;
  const endIndex = startIndex + size;
  let filteredArray = array;

  if (keyword && keyword !== '') {
    const lowerCaseKeyword = keyword.toLowerCase();
    filteredArray = array.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(lowerCaseKeyword)
    );
  }

  return filteredArray.slice(startIndex, endIndex);
}

function handleFontStyleName(fontName, style) {
  if (style === 'regular') return fontName + ' Regular';

  const fontStrong = parseInt(style);
  if (style.includes('italic')) {
    return fontName + (fontStrong ? ` Italic Bold ${fontStrong}` : ' Italic');
  }

  if (!fontStrong) return fontName + ' Regular';
  return fontName + ` Bold ${fontStrong}`;
}

/**
 * Get draft fonts
 */
app.get('/api/draft-fonts', async (req, res) => {
  console.log(req.query);
  fs.readFile('./json/draft-fonts.json', 'utf8', (err, jsonString) => {
    if (err) {
      console.error(err);
      res.send(null);
      return;
    }
    const filtered = JSON.parse(jsonString).items.map((font) => {
      return {
        family: font.family,
        styles: Object.keys(font.files).map((style) => {
          return {
            name: handleFontStyleName(font.family, style),
            style,
            url: font.files[style],
          };
        }),
      };
    });
    res.send({data: filtered});
  });
});

/**
 * Get fonts
 */
app.get('/api/fonts', async (req, res) => {
  fs.readFile('./json/fonts.json', 'utf8', (err, jsonString) => {
    if (err) {
      console.error(err);
      res.send(null);
      return;
    }
    const { ps, pi, kw } = req.query;
    res.send(
      paginateArrayWithFilter(JSON.parse(jsonString).data, +ps, +pi, kw)
    );
  });
});

/**
 * Get templates
 */
app.get('/api/templates', async (req, res) => {
  fs.readFile('./json/templates.json', 'utf8', (err, jsonString) => {
    if (err) {
      console.error(err);
      res.send(null);
      return;
    }
    res.send(JSON.parse(jsonString).data);
  });
});

/**
 * Get text templates
 */
app.get('/api/texts', async (req, res) => {
  fs.readFile('./json/texts.json', 'utf8', (err, jsonString) => {
    if (err) {
      console.error(err);
      res.send(null);
      return;
    }
    res.send(JSON.parse(jsonString).data);
  });
});

/**
 * Get frames
 */
app.get('/api/frames', async (req, res) => {
  fs.readFile('./json/frames.json', 'utf8', (err, jsonString) => {
    if (err) {
      console.error(err);
      res.send(null);
      return;
    }
    res.send(JSON.parse(jsonString).data);
  });
});

/**
 * Get images
 */
app.get('/api/images', async (req, res) => {
  fs.readFile('./json/images.json', 'utf8', (err, jsonString) => {
    if (err) {
      console.error(err);
      res.send(null);
      return;
    }
    res.send(JSON.parse(jsonString).data);
  });
});
