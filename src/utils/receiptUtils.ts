import { Alert } from 'react-native';
import { receiptExtractionAPI } from '../service/api';
import { convertImageToBase64, isSupportedImageFormat, isFileSizeAcceptable } from './imageUtils';
import { logger } from './logger';

export interface ReceiptExtractionResult {
  business_name: string;
  items: Array<{
    description: string;
    price: number;
  }>;
  total_amount?: number;
  expense_type?: string;
}

export const extractReceiptData = async (imageUri: string): Promise<ReceiptExtractionResult | null> => {
  try {
    console.log('🔍 Starting receipt extraction for image:', imageUri);
    logger.info('Starting receipt extraction for image:', imageUri);

    // Validate file format
    if (!isSupportedImageFormat(imageUri)) {
      Alert.alert('Unsupported Format', 'Please select a supported image format (JPG, PNG, GIF, WebP)');
      return null;
    }
    
    // Check file size
    const isAcceptableSize = await isFileSizeAcceptable(imageUri);
    if (!isAcceptableSize) {
      Alert.alert('File Too Large', 'Please select an image smaller than 10MB');
      return null;
    }
    
    // Show processing alert
    Alert.alert(
      'Processing Receipt',
      'Extracting data from receipt. This may take up to 60 seconds.',
      [{ text: 'OK' }]
    );
    
    // Convert image to base64
    console.log('📝 Converting image to base64...');
    logger.info('Converting image to base64...');
    const base64Result = await convertImageToBase64(imageUri);
    
    // Call receipt extraction API
    console.log('🌐 Calling receipt extraction API...');
    logger.info('Calling receipt extraction API...');
    const extractionResult = await receiptExtractionAPI.extractReceiptDetails(base64Result.base64);
    
    console.log('✅ Receipt extraction completed successfully:', extractionResult);
    logger.info('Receipt extraction completed successfully:', extractionResult);
    
    return extractionResult;
    
  } catch (error) {
    logger.error('Receipt extraction failed:', error);
    
    // Show error alert
    Alert.alert(
      'Extraction Failed', 
      error instanceof Error ? error.message : 'Failed to extract receipt details. Please try again.',
      [
        { text: 'Continue Without Extraction', style: 'default' },
        { text: 'Try Again', style: 'cancel' }
      ]
    );
    
    return null;
  }
};

export const showExtractionSuccess = (extractionResult: ReceiptExtractionResult) => {
  Alert.alert(
    'Receipt Extracted!', 
    `Successfully extracted data from receipt:\n\nBusiness: ${extractionResult.business_name}\nItems: ${extractionResult.items.length} found\nTotal: $${extractionResult.total_amount || extractionResult.items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}`,
    [{ text: 'Continue to Create Expense' }]
  );
};
