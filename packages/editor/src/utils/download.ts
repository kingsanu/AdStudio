export const createJsonBlob = (data: unknown) => {
  const jsonString = JSON.stringify(data);
  return new Blob([jsonString], { type: "application/json" });
};

export const downloadObjectAsJson = (exportName: string, data: unknown) => {
  const blob = createJsonBlob(data);
  const url = URL.createObjectURL(blob);
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", url);
  downloadAnchorNode.setAttribute("download", exportName + ".json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  URL.revokeObjectURL(url); // Clean up the URL object
};
