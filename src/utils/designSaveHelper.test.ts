/**
 * Test file to verify design saving functionality
 * This file can be used to test the design saving helper functions
 */

import { saveDesignBeforeAction, ensureDesignSaved, getCurrentDesignData } from '../utils/designSaveHelper';

// Mock data for testing
const mockDesignData = {
  pages: [
    {
      id: 'page1',
      layers: [
        {
          id: 'layer1',
          type: 'text',
          content: 'Hello World'
        }
      ]
    }
  ]
};

const mockQuery = {
  serialize: () => mockDesignData
};

// Test functions
export const testDesignSaving = async () => {
  console.log('Testing design saving functionality...');
  
  try {
    // Test 1: getCurrentDesignData
    console.log('Test 1: getCurrentDesignData');
    const designData = getCurrentDesignData(mockQuery);
    console.log('Design data:', designData);
    
    // Test 2: saveDesignBeforeAction
    console.log('Test 2: saveDesignBeforeAction');
    const saveResult = await saveDesignBeforeAction(
      designData,
      'Test Design',
      { force: true, showNotification: false, waitForCompletion: true }
    );
    console.log('Save result:', saveResult);
    
    // Test 3: ensureDesignSaved
    console.log('Test 3: ensureDesignSaved');
    const ensureResult = await ensureDesignSaved(
      mockQuery,
      'Test Design',
      'test action'
    );
    console.log('Ensure result:', ensureResult);
    
    console.log('All tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
};

// Export for use in other components if needed
export { mockDesignData, mockQuery };
