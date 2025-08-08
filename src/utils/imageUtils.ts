import { Platform } from 'react-native';
// @ts-ignore
import RNFS from 'react-native-fs';

export interface ImageProcessingResult {
  base64: string;
  mimeType: string;
  fileName: string;
}

/**
 * Convert an image file to base64 format
 * @param fileUri - The URI of the image file
 * @returns Promise<ImageProcessingResult> - Object containing base64 string, mime type, and filename
 */
export const convertImageToBase64 = async (fileUri: string): Promise<ImageProcessingResult> => {
  try {
    // Read the file as base64
    const base64Data = await RNFS.readFile(fileUri, 'base64');
    
    // Determine mime type based on file extension
    const fileExtension = fileUri.split('.').pop()?.toLowerCase();
    let mimeType = 'image/jpeg'; // default
    
    switch (fileExtension) {
      case 'png':
        mimeType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'gif':
        mimeType = 'image/gif';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      default:
        mimeType = 'image/jpeg';
    }
    
    // Create the data URL format
    const base64String = `data:${mimeType};base64,${base64Data}`;
    
    // Extract filename from URI
    const fileName = fileUri.split('/').pop() || `image_${Date.now()}.${fileExtension || 'jpg'}`;
    
    return {
      base64: base64String,
      mimeType,
      fileName
    };
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to convert image to base64 format');
  }
};

/**
 * Validate if the image file is supported
 * @param fileUri - The URI of the image file
 * @returns boolean - True if the image format is supported
 */
export const isSupportedImageFormat = (fileUri: string): boolean => {
  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExtension = fileUri.toLowerCase().split('.').pop();
  return supportedExtensions.some(ext => ext.includes(fileExtension || ''));
};

/**
 * Get file size in MB
 * @param fileUri - The URI of the image file
 * @returns Promise<number> - File size in MB
 */
export const getFileSize = async (fileUri: string): Promise<number> => {
  try {
    const stats = await RNFS.stat(fileUri);
    return stats.size / (1024 * 1024); // Convert to MB
  } catch (error) {
    console.error('Error getting file size:', error);
    return 0;
  }
};

/**
 * Check if file size is within acceptable limits (max 10MB)
 * @param fileUri - The URI of the image file
 * @returns Promise<boolean> - True if file size is acceptable
 */
export const isFileSizeAcceptable = async (fileUri: string): Promise<boolean> => {
  const maxSizeMB = 10;
  const fileSizeMB = await getFileSize(fileUri);
  return fileSizeMB <= maxSizeMB;
};
