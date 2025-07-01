/**
 * Test script for the new videoshow slideshow endpoint
 * This script creates sample images and tests the video slideshow generation
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Create some sample test images (colored rectangles)
function createTestImage(color, filename) {
  const { createCanvas } = require('canvas');
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');
  
  // Fill with solid color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 800, 600);
  
  // Add text
  ctx.fillStyle = 'white';
  ctx.font = '60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Image ${filename}`, 400, 300);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  const filepath = path.join(__dirname, 'temp', filename);
  
  // Ensure temp directory exists
  if (!fs.existsSync(path.dirname(filepath))) {
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
  }
  
  fs.writeFileSync(filepath, buffer);
  return filepath;
}

async function testVideoshowEndpoint() {
  try {
    console.log('Creating test images...');
    
    // Create test images
    const image1Path = createTestImage('#FF0000', 'test1.png');
    const image2Path = createTestImage('#00FF00', 'test2.png');
    const image3Path = createTestImage('#0000FF', 'test3.png');
    
    console.log('Test images created successfully');
    
    // Prepare form data
    const formData = new FormData();
    
    // Add images to form data
    formData.append('images', fs.createReadStream(image1Path));
    formData.append('images', fs.createReadStream(image2Path));
    formData.append('images', fs.createReadStream(image3Path));
    
    // Add configuration
    formData.append('duration', '2'); // 2 seconds per image
    formData.append('transition', 'fade');
    formData.append('outputName', 'test-slideshow');
    
    console.log('Sending request to videoshow endpoint...');
    
    // Make request to the endpoint
    const response = await axios.post(
      'http://localhost:4000/api/video-processing/create-videoshow-slideshow',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 60000, // 60 second timeout
      }
    );
    
    console.log('✅ SUCCESS! Video slideshow created:');
    console.log('Response:', response.data);
    
    // Cleanup test images
    fs.unlinkSync(image1Path);
    fs.unlinkSync(image2Path);
    fs.unlinkSync(image3Path);
    
  } catch (error) {
    console.error('❌ ERROR testing videoshow endpoint:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

// Only run if canvas is available
try {
  require('canvas');
  testVideoshowEndpoint();
} catch (err) {
  console.log('⚠️  Canvas not available, skipping image generation test');
  console.log('You can manually test the endpoint with your own images');
  console.log('Endpoint: POST http://localhost:4000/api/video-processing/create-videoshow-slideshow');
  console.log('Required fields: images (file uploads), duration (optional), transition (optional)');
}
