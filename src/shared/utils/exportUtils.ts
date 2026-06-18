/**
 * Core utility for downloading generated content as files.
 * Handles the lifecycle of Blob and Object URL creation/revocation
 * to avoid memory leaks or download failures.
 * 
 * @param content The string or Blob content to download
 * @param filename The name of the downloaded file
 * @param mimeType The MIME type of the file
 */
export const downloadFile = (content: string | Blob, filename: string, mimeType: string) => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Use a slight delay to ensure the download starts before revoking the URL
  setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Helper to export Markdown files
 */
export const exportAsMarkdown = (content: string, filename: string) => {
  const finalFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
  downloadFile(content, finalFilename, 'text/markdown;charset=utf-8;');
};

/**
 * Helper to export JSON files
 */
export const exportAsJSON = (data: any, filename: string) => {
  const finalFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
  downloadFile(JSON.stringify(data, null, 2), finalFilename, 'application/json;charset=utf-8;');
};

/**
 * Helper to export CSV files
 * Automatically adds the UTF-8 BOM to prevent Excel encoding issues
 */
export const exportAsCSV = (content: string, filename: string) => {
  const BOM = '\uFEFF'; // To ensure Excel reads it as UTF-8
  const csvWithBom = BOM + content;
  const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  downloadFile(csvWithBom, finalFilename, 'text/csv;charset=utf-8;');
};
