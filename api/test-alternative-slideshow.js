/**
 * Test the alternative FFmpeg-based slideshow endpoint
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

async function testAlternativeEndpoint() {
  try {
    // Use existing test images from the API directory
    const testImage1 = path.join(__dirname, 'test.jpg');
    const testImage2 = path.join(__dirname, 'test2.jpg');
    
    // Check if test images exist
    if (!fs.existsSync(testImage1) || !fs.existsSync(testImage2)) {
      console.log('❌ Test images not found in api directory');
      return;
    }
    
    console.log('✅ Found test images, creating slideshow with Alternative FFmpeg method...');
    
    // Prepare form data
    const formData = new FormData();
    
    // Add images to form data
    formData.append('images', fs.createReadStream(testImage1));
    formData.append('images', fs.createReadStream(testImage2));
    
    // Add configuration
    formData.append('duration', '3'); // 3 seconds per image
    formData.append('outputName', 'alternative-test-slideshow');
    
    console.log('📤 Sending request to alternative FFmpeg endpoint...');
    
    // Make request to the alternative endpoint
    const response = await axios.post(
      'http://localhost:4000/api/video-processing/create-alternative-slideshow',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 180000, // 3 minute timeout for FFmpeg processing
      }
    );
    
    console.log('🎉 SUCCESS! Alternative slideshow created:');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ ERROR testing alternative endpoint:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server not running. Please start the server first with: npm run dev');
    } else {
      console.error('Message:', error.message);
    }
  }
}

console.log('🧪 Testing Alternative FFmpeg Slideshow Endpoint');
console.log('===============================================');
testAlternativeEndpoint();
