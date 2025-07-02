/**
 * Debug script to test video with very distinct images
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Create distinct test images with clear visual differences
function createDistinctTestImages() {
  try {
    const { createCanvas } = require('canvas');
    
    const images = [
      { color: '#FF0000', text: 'RED IMAGE #1' },
      { color: '#00FF00', text: 'GREEN IMAGE #2' },
      { color: '#0000FF', text: 'BLUE IMAGE #3' },
      { color: '#FFFF00', text: 'YELLOW IMAGE #4' }
    ];
    
    const imagePaths = [];
    
    for (let i = 0; i < images.length; i++) {
      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext('2d');
      
      // Fill with solid color
      ctx.fillStyle = images[i].color;
      ctx.fillRect(0, 0, 800, 600);
      
      // Add large text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      
      // Draw text with stroke for better visibility
      ctx.strokeText(images[i].text, 400, 300);
      ctx.fillText(images[i].text, 400, 300);
      
      // Add timestamp
      ctx.font = '30px Arial';
      ctx.fillText(`Created: ${new Date().toLocaleTimeString()}`, 400, 400);
      
      // Save as PNG
      const buffer = canvas.toBuffer('image/png');
      const filepath = path.join(__dirname, 'temp', `distinct-image-${i + 1}.png`);
      
      // Ensure temp directory exists
      if (!fs.existsSync(path.dirname(filepath))) {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
      }
      
      fs.writeFileSync(filepath, buffer);
      imagePaths.push(filepath);
      console.log(`✅ Created distinct image ${i + 1}: ${images[i].color} - ${filepath}`);
    }
    
    return imagePaths;
  } catch (error) {
    console.error('❌ Canvas not available, using fallback approach');
    return null;
  }
}

async function testWithDistinctImages() {
  try {
    console.log('🎨 Creating distinct test images...');
    
    const imagePaths = createDistinctTestImages();
    
    if (!imagePaths) {
      console.log('⚠️  Skipping distinct image test (canvas not available)');
      return;
    }
    
    console.log('📤 Testing with distinct images...');
    
    // Prepare form data
    const formData = new FormData();
    
    // Add images to form data
    imagePaths.forEach((imagePath, index) => {
      formData.append('images', fs.createReadStream(imagePath));
    });
    
    // Add configuration
    formData.append('duration', '4'); // 4 seconds per image for clear visibility
    formData.append('transition', 'fade');
    formData.append('outputName', 'distinct-images-test');
    
    console.log('📤 Sending request to videoshow endpoint...');
    
    // Make request to the endpoint
    const response = await axios.post(
      'https://adstudioserver.foodyqueen.com/api/video-processing/create-videoshow-slideshow',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 180000, // 3 minute timeout
      }
    );
    
    console.log('🎉 SUCCESS! Distinct images slideshow created:');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('🎬 Video URL:', response.data.videoUrl);
    console.log('⏱️  Expected duration:', response.data.duration, 'seconds');
    console.log('🖼️  Images processed:', response.data.imagesProcessed);
    
    // Clean up test images
    imagePaths.forEach(imagePath => {
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`🧹 Cleaned up: ${path.basename(imagePath)}`);
        }
      } catch (e) {
        console.warn(`Could not clean up ${imagePath}`);
      }
    });
    
  } catch (error) {
    console.error('❌ ERROR testing with distinct images:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

console.log('🧪 Testing Video Slideshow with Distinct Images');
console.log('==============================================');
testWithDistinctImages();
