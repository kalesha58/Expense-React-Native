/**
 * Detects if a base64 string contains image data by checking common image headers
 * @param base64Data - The base64 encoded data
 * @returns true if the data appears to be an image, false otherwise
 */
export const isImageFromBase64 = (base64Data: string): boolean => {
  if (!base64Data) return false;
  
  // Common image file signatures in base64
  const imageSignatures = [
    '/9j/', // JPEG
    'iVBORw0KGgo', // PNG
    'R0lGODlh', // GIF
    'UklGR', // WebP
    'AAABAA', // ICO
    'Qk0', // BMP
  ];
  
  return imageSignatures.some(signature => 
    base64Data.startsWith(signature)
  );
};

/**
 * Detects the actual file type from base64 data
 * @param base64Data - The base64 encoded data
 * @returns The detected MIME type or null if unknown
 */
export const detectFileTypeFromBase64 = (base64Data: string): string | null => {
  if (!base64Data) return null;
  
  if (base64Data.startsWith('/9j/')) {
    return 'image/jpeg';
  }
  
  if (base64Data.startsWith('iVBORw0KGgo')) {
    return 'image/png';
  }
  
  if (base64Data.startsWith('R0lGODlh')) {
    return 'image/gif';
  }
  
  if (base64Data.startsWith('UklGR')) {
    return 'image/webp';
  }
  
  if (base64Data.startsWith('AAABAA')) {
    return 'image/x-icon';
  }
  
  if (base64Data.startsWith('Qk0')) {
    return 'image/bmp';
  }
  
  // Check for PDF signature
  if (base64Data.startsWith('JVBERi0')) {
    return 'application/pdf';
  }
  
  return null;
};

/**
 * Gets the appropriate file type for display, prioritizing detected type over content_type
 * @param base64Data - The base64 encoded data
 * @param contentType - The content type from the API
 * @returns The best guess for the actual file type
 */
export const getActualFileType = (base64Data: string, contentType: string): string => {
  const detectedType = detectFileTypeFromBase64(base64Data);
  
  // If we can detect the type from base64, use it
  if (detectedType) {
    return detectedType;
  }
  
  // Otherwise fall back to the content_type from API
  return contentType;
};

/**
 * Checks if the file should be displayed as an image
 * @param base64Data - The base64 encoded data
 * @param contentType - The content type from the API
 * @returns true if the file should be displayed as an image
 */
export const shouldDisplayAsImage = (base64Data: string, contentType: string): boolean => {
  // First check if the base64 data is actually an image
  if (isImageFromBase64(base64Data)) {
    return true;
  }
  
  // Fall back to content type check
  return contentType.startsWith('image/');
}; 