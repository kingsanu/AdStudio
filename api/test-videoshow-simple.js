/**
 * Simple test for videoshow endpoint using existing test images
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

async function testWithExistingImages() {
  try {
    // Use existing test images from the API directory
    const testImage1 = path.join(__dirname, 'test.jpg');
    const testImage2 = path.join(__dirname, 'test2.jpg');
    
    // Check if test images exist
    if (!fs.existsSync(testImage1)) {
      console.log('❌ test.jpg not found in api directory');
      return;
    }
    
    if (!fs.existsSync(testImage2)) {
      console.log('❌ test2.jpg not found in api directory');
      return;
    }
    
    console.log('✅ Found test images, creating slideshow...');
    
    // Prepare form data
    const formData = new FormData();
    
    // Add images to form data
    formData.append('images', fs.createReadStream(testImage1));
    formData.append('images', fs.createReadStream(testImage2));
    
    // Add configuration
    formData.append('duration', '3'); // 3 seconds per image
    formData.append('transition', 'fade');
    formData.append('outputName', 'api-test-slideshow');
    
    console.log('📤 Sending request to videoshow endpoint...');
    
    // Make request to the endpoint
    const response = await axios.post(
      'https://adstudioserver.foodyqueen.com/api/video-processing/create-videoshow-slideshow',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 120000, // 2 minute timeout for video processing
      }
    );
    
    console.log('🎉 SUCCESS! Video slideshow created:');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ ERROR testing videoshow endpoint:');
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

console.log('🧪 Testing Videoshow Slideshow Endpoint');
console.log('=====================================');
testWithExistingImages();
