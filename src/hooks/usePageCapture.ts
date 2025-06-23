import { useCallback } from 'react';
import html2canvas from 'html2canvas';

export const usePageCapture = () => {
  const captureAllPages = useCallback(async (pageRef: React.RefObject<HTMLDivElement[]>) => {
    console.log('🎯 Starting captureAllPages...');
    
    if (!pageRef.current) {
      console.error('❌ pageRef.current is null');
      return [];
    }

    const pages = pageRef.current;
    console.log(`📄 Found ${pages.length} pages to capture`);
    
    const capturedImages: string[] = [];

    for (let i = 0; i < pages.length; i++) {
      const pageElement = pages[i];
      
      if (!pageElement) {
        console.warn(`⚠️ Page ${i} element is null, skipping`);
        continue;
      }

      console.log(`🖼️ Capturing page ${i + 1}/${pages.length}...`);
      
      try {
        // Small delay to ensure the page is fully rendered
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(pageElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          height: pageElement.scrollHeight,
          width: pageElement.scrollWidth,
        });

        const imageDataUrl = canvas.toDataURL('image/png', 0.9);
        
        // Log capture details
        console.log(`✅ Page ${i + 1} captured:`, {
          size: `${canvas.width}x${canvas.height}`,
          dataUrlLength: imageDataUrl.length,
          mimeType: 'image/png',
          preview: imageDataUrl.substring(0, 50) + '...'
        });
        
        capturedImages.push(imageDataUrl);
      } catch (error) {
        console.error(`❌ Error capturing page ${i + 1}:`, error);
      }
    }

    console.log(`🎉 Capture complete! Total images: ${capturedImages.length}`);
    return capturedImages;
  }, []);

  const capturePages = useCallback(async (
    pageRef: React.RefObject<HTMLDivElement[]>, 
    pageIndices: number[]
  ) => {
    console.log('🎯 Starting capturePages for indices:', pageIndices);
    
    if (!pageRef.current) {
      console.error('❌ pageRef.current is null');
      return [];
    }

    const pages = pageRef.current;
    const capturedImages: string[] = [];

    for (const index of pageIndices) {
      if (index < 0 || index >= pages.length) {
        console.warn(`⚠️ Page index ${index} out of bounds, skipping`);
        continue;
      }

      const pageElement = pages[index];
      
      if (!pageElement) {
        console.warn(`⚠️ Page ${index} element is null, skipping`);
        continue;
      }

      console.log(`🖼️ Capturing page ${index + 1}...`);
      
      try {
        // Small delay to ensure the page is fully rendered
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(pageElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          height: pageElement.scrollHeight,
          width: pageElement.scrollWidth,
        });

        const imageDataUrl = canvas.toDataURL('image/png', 0.9);
        
        // Log capture details
        console.log(`✅ Page ${index + 1} captured:`, {
          size: `${canvas.width}x${canvas.height}`,
          dataUrlLength: imageDataUrl.length,
          mimeType: 'image/png',
          preview: imageDataUrl.substring(0, 50) + '...'
        });
        
        capturedImages.push(imageDataUrl);
      } catch (error) {
        console.error(`❌ Error capturing page ${index + 1}:`, error);
      }
    }

    console.log(`🎉 Capture complete! Total images: ${capturedImages.length}`);
    return capturedImages;
  }, []);

  return { captureAllPages, capturePages };
};
