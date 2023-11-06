const express = require('express');
const app = express();
const fs = require('fs');

app.listen(4000, () => {
  console.log('Server has started! Open http://localhost:4000');
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
    res.send(JSON.parse(jsonString).data);
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
  