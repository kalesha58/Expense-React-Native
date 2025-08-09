import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';
import { convertImageToBase64, isSupportedImageFormat, isFileSizeAcceptable } from '../../utils/imageUtils';
import { receiptExtractionAPI } from '../../service/api';

interface ReceiptFile {
  uri: string;
  name?: string;
  mimeType?: string;
}

interface ReceiptUploadFallbackProps {
  value: ReceiptFile[];
  onChange: (files: ReceiptFile[]) => void;
  label?: string;
  onExtractionComplete?: (extractionResult: {
    business_name: string;
    items: Array<{
      description: string;
      price: number;
    }>;
  }) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const ReceiptUploadFallback: React.FC<ReceiptUploadFallbackProps> = ({ 
  value = [], 
  onChange, 
  label = 'Receipts',
  onExtractionComplete
}) => {
  const { colors } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Debug isExtracting state changes
  React.useEffect(() => {
    // isExtracting state changed to (fallback):
  }, [isExtracting]);

  // Image picker configuration
  const imagePickerOptions = {
    mediaType: 'photo' as MediaType,
    includeBase64: false,
    maxHeight: 2000,
    maxWidth: 2000,
    quality: 0.8,
  };

  // Handle image picker response
  const handleImagePickerResponse = useCallback((response: ImagePickerResponse) => {
    // Image picker response (fallback):
    
    if (response.didCancel || response.errorMessage) {
      if (response.errorMessage) {
        Alert.alert('Error', response.errorMessage);
      }
      return;
    }

    if (response.assets && response.assets.length > 0) {
      const newFiles: ReceiptFile[] = response.assets.map(asset => ({
        uri: asset.uri || '',
        name: asset.fileName || `image_${Date.now()}.jpg`,
        mimeType: asset.type || 'image/jpeg',
      })).filter(file => file.uri !== '');

      // New files to add (fallback):

      if (newFiles.length > 0) {
        onChange([...value, ...newFiles]);
        
        // Automatically extract from the first image if extraction callback is provided
        if (onExtractionComplete && newFiles.length > 0) {
          // Starting receipt extraction for (fallback):
          extractReceiptDetails(newFiles[0].uri);
        } else {
          // No extraction callback provided or no files to extract (fallback)
        }
      }
    }
  }, [value, onChange, onExtractionComplete, extractReceiptDetails]);

  // Camera functionality
  const handleTakePhoto = useCallback(() => {
    setIsModalVisible(false);
    
    launchCamera(imagePickerOptions, handleImagePickerResponse);
  }, [handleImagePickerResponse]);

  // Gallery functionality
  const handlePickImage = useCallback(() => {
    setIsModalVisible(false);
    
    launchImageLibrary({
      ...imagePickerOptions,
      selectionLimit: 5, // Allow multiple selection
    }, handleImagePickerResponse);
  }, [handleImagePickerResponse]);

  // Extract receipt details from image
  const extractReceiptDetails = useCallback(async (fileUri: string) => {
    try {
      setIsExtracting(true);
      // Starting extraction process for (fallback):
      
      // Show initial alert to user
      Alert.alert(
        'Processing Receipt',
        'Starting receipt extraction. This may take up to 60 seconds.',
        [{ text: 'OK' }]
      );
      
      // Validate file format
      if (!isSupportedImageFormat(fileUri)) {
        // Unsupported file format (fallback):
        Alert.alert('Unsupported Format', 'Please select a supported image format (JPG, PNG, GIF, WebP)');
        return;
      }
      
      // File format validation passed (fallback)
      
      // Check file size
      const isAcceptableSize = await isFileSizeAcceptable(fileUri);
      if (!isAcceptableSize) {
        // File size too large (fallback)
        Alert.alert('File Too Large', 'Please select an image smaller than 10MB');
        return;
      }
      
      // File size validation passed (fallback)
      
      // Convert to base64
      // Converting image to base64 (fallback)...
      const base64Result = await convertImageToBase64(fileUri);
      // Base64 conversion completed (fallback), length:
      
      // Call extraction API
      // Calling receipt extraction API (fallback)...
      const extractionResult = await receiptExtractionAPI.extractReceiptDetails(base64Result.base64);
      // Extraction API response (fallback):
      
      // Call the callback with extraction results
      if (onExtractionComplete) {
        // Calling onExtractionComplete callback (fallback)
        onExtractionComplete(extractionResult);
      }
      
      Alert.alert(
        'Receipt Extracted!', 
        `Successfully extracted data from receipt:\n\nBusiness: ${extractionResult.business_name}\nItems: ${extractionResult.items.length} found`
      );
      
    } catch (error) {
      // Receipt extraction error (fallback):
      Alert.alert(
        'Extraction Failed', 
        error instanceof Error ? error.message : 'Failed to extract receipt details. Please try again.'
      );
    } finally {
      // Setting isExtracting to false (fallback)
      setIsExtracting(false);
    }
  }, [onExtractionComplete]);

  // Document picker - keeping as placeholder for now
  const handlePickPdf = () => {
    setIsModalVisible(false);
    Alert.alert('Info', 'Document picker functionality will be implemented later');
  };

  // Remove file
  const handleRemove = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  function isPdf(file: ReceiptFile): boolean {
    if (!file) return false;
    if (file.mimeType && file.mimeType === 'application/pdf') return true;
    if (file.name && file.name.toLowerCase().endsWith('.pdf')) return true;
    if (file.uri && file.uri.toLowerCase().includes('.pdf')) return true;
    return false;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      
      {/* Upload Area - matches reference image design */}
      <TouchableOpacity 
        style={[styles.uploadArea, { borderColor: colors.border }]} 
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.7}
        disabled={isExtracting}
      >
        <View style={styles.uploadContent}>
          {isExtracting ? (
            <>
              <View style={[styles.loaderContainer, { backgroundColor: colors.primary + '10' }]}>
                <ActivityIndicator size="large" color={colors.primary} style={styles.extractionLoader} />
                <Text style={[styles.uploadTitle, { color: colors.text }]}>
                  Extracting receipt details...
                </Text>
                <Text style={[styles.uploadSubtitle, { color: colors.placeholder }]}>
                  Please wait while we process your receipt
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* Icon similar to reference image */}
              <View style={[styles.uploadIcon, { backgroundColor: colors.primary + '15' }]}>
                <Feather name="image" size={32} color={colors.primary} />
              </View>
              
              {/* Text content */}
              <Text style={[styles.uploadTitle, { color: colors.text }]}>
                Drop your image here, or <Text style={[styles.browseText, { color: colors.primary }]}>browse</Text>
              </Text>
              <Text style={[styles.uploadSubtitle, { color: colors.placeholder }]}>
                Supports: JPG, JPEG2000, PNG
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Display uploaded files */}
      {value.length > 0 && (
        <View style={styles.filesContainer}>
          {value.map((file, idx) => (
            isPdf(file) ? (
              <View style={[styles.pdfContainer, { backgroundColor: colors.card, borderColor: colors.border }]} key={file.uri + idx}>
                <Feather name="file-text" size={40} color={colors.primary} />
                <Text style={[styles.pdfFilename, { color: colors.text }]} numberOfLines={1}>
                  {file.name || file.uri.split('/').pop()}
                </Text>
                <TouchableOpacity style={styles.removeButton} onPress={() => handleRemove(idx)}>
                  <Feather name="x" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.imageContainer, { borderColor: colors.border }]} key={file.uri + idx}>
                <Image source={{ uri: file.uri }} style={styles.image} resizeMode="cover" />
                <TouchableOpacity style={styles.removeButton} onPress={() => handleRemove(idx)}>
                  <Feather name="x" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )
          ))}
        </View>
      )}

      {/* Fallback Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Upload Receipt
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Feather name="x" size={24} color={colors.placeholder} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalOptions}>
              {/* Camera Option */}
              <TouchableOpacity 
                style={[styles.modalOption, { backgroundColor: colors.card, borderColor: colors.border }]} 
                onPress={handleTakePhoto}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Feather name="camera" size={24} color={colors.primary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>Take Photo</Text>
                  <Text style={[styles.optionSubtitle, { color: colors.placeholder }]}>
                    Use camera to capture receipt
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.placeholder} />
              </TouchableOpacity>

              {/* Gallery Option */}
              <TouchableOpacity 
                style={[styles.modalOption, { backgroundColor: colors.card, borderColor: colors.border }]} 
                onPress={handlePickImage}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Feather name="image" size={24} color={colors.primary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>Choose from Gallery</Text>
                  <Text style={[styles.optionSubtitle, { color: colors.placeholder }]}>
                    Select image from your device
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.placeholder} />
              </TouchableOpacity>

              {/* Document Option */}
              <TouchableOpacity 
                style={[styles.modalOption, { backgroundColor: colors.card, borderColor: colors.border }]} 
                onPress={handlePickPdf}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Feather name="file-text" size={24} color={colors.primary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>Upload Document</Text>
                  <Text style={[styles.optionSubtitle, { color: colors.placeholder }]}>
                    Select PDF or document file
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.placeholder} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    marginBottom: 12,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: SIZES.radius * 2,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.02)',
    minHeight: 120,
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  browseText: {
    fontWeight: '700',
  },
  uploadSubtitle: {
    fontSize: SIZES.small,
    textAlign: 'center',
  },
  extractionLoader: {
    marginBottom: 16,
  },
  loaderContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  filesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pdfContainer: {
    width: 110,
    height: 110,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pdfFilename: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 100,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5222D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: SIZES.large,
    fontWeight: '700',
  },
  modalOptions: {
    gap: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: SIZES.small,
  },
}); 