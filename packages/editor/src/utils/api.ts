/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Utility functions for API interactions
 */

/**
 * Uploads a template to the specified endpoint
 * @param templateData The template data to upload
 * @param thumbnailImage The thumbnail image data (base64 string)
 * @param templateName Template name
 * @param templateDesc Template description
 * @returns Promise with the response
 */
export const uploadTemplate = async (...args: any[]): Promise<Response> => {
  console.log("uploadTemplate called with args:", args);
  const [templateData, thumbnailImage, templateName, templateDesc] = args;
  // Convert the template data to a JSON string
  const jsonString = JSON.stringify(templateData);

  // Generate a timestamp for unique filenames
  const timestamp = new Date().getTime();
  const templateFilename = `custom_${timestamp}.json`;
  const thumbnailFilename = `custom_${timestamp}.png`;

  // Extract the base64 data from the thumbnail image string
  // The thumbnailImage is expected to be a data URL like: data:image/png;base64,ABC123...
  const thumbnailBase64 = thumbnailImage.split(",")[1] || thumbnailImage;

  // Send the data to the local backend endpoint
  return fetch("http://localhost:4000/api/upload-template", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "document",
      filename: templateFilename,
      templateName,
      templateDesc,
      // Send the template JSON as base64
      base64: btoa(jsonString),
      // Include the thumbnail image
      thumbnailImage: thumbnailBase64,
      thumbnailFilename,
    }),
  });
};

/**
 * Generates a GUID (Globally Unique Identifier)
 * @returns A GUID string
 */
export const generateGuid = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
