import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
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

interface ReceiptUploadProps {
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

export const ReceiptUpload: React.FC<ReceiptUploadProps> = ({ 
  value = [], 
  onChange, 
  label = 'Receipts',
  onExtractionComplete
}) => {
  const { colors } = useTheme();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [isExtracting, setIsExtracting] = useState(false);


  // Variables for bottom sheet
  const snapPoints = useMemo(() => ['25%', '50%'], []);

  // Callbacks for bottom sheet
  const handlePresentModalPress = useCallback(() => {
    try {
      bottomSheetModalRef.current?.present();
    } catch (error) {
      // Error presenting bottom sheet
    }
  }, []);

  const handleDismiss = useCallback(() => {
    try {
      bottomSheetModalRef.current?.dismiss();
    } catch (error) {
      // Error dismissing bottom sheet
    }
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    // handleSheetChanges
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  // Image picker configuration
  const imagePickerOptions = {
    mediaType: 'photo' as MediaType,
    includeBase64: false,
    maxHeight: 2000,
    maxWidth: 2000,
    quality: 0.8,
  };

  // Extract receipt details from image
  const extractReceiptDetails = useCallback(async (fileUri: string) => {
    try {
      setIsExtracting(true);

      
      // Show initial alert to user
      Alert.alert(
        'Processing Receipt',
        'Starting receipt extraction. This may take up to 60 seconds.',
        [{ text: 'OK' }]
      );
      
      // Validate file format
      if (!isSupportedImageFormat(fileUri)) {
        Alert.alert('Unsupported Format', 'Please select a supported image format (JPG, PNG, GIF, WebP)');
        return;
      }
      
      
      // Check file size
      const isAcceptableSize = await isFileSizeAcceptable(fileUri);
      if (!isAcceptableSize) {
        Alert.alert('File Too Large', 'Please select an image smaller than 10MB');
        return;
      }
      
      // Converting image to base64...
      const base64Result = await convertImageToBase64(fileUri);
      
      // Calling receipt extraction API...
      const extractionResult = await receiptExtractionAPI.extractReceiptDetails(base64Result.base64);
      
      // Show different popup based on item count and handle auto-save
      if (extractionResult.items.length > 1) {
        Alert.alert(
          'Itemized Items Found!', 
          `Found ${extractionResult.items.length} items in your receipt:\n\nBusiness: ${extractionResult.business_name}\n\nItemization will be enabled automatically. Click OK to save the itemized data.`,
          [{ 
            text: 'OK',
            onPress: () => {
              console.log('🔥 User acknowledged itemized extraction - triggering auto-save...');
              // Call onExtractionComplete with user acknowledgment after user clicks OK
              if (onExtractionComplete) {
                // Add a flag to indicate user acknowledged the itemized data
                const extractionWithAcknowledgment = {
                  ...extractionResult,
                  userAcknowledgedItemization: true
                };
                onExtractionComplete(extractionWithAcknowledgment);
              }
            }
          }]
        );
      } else {
        Alert.alert(
          'Receipt Extracted!', 
          `Successfully extracted data from receipt:\n\nBusiness: ${extractionResult.business_name}\nItems: ${extractionResult.items.length} found`,
          [{ 
            text: 'OK',
            onPress: () => {
              // Call onExtractionComplete for single item (no auto-save needed)
              if (onExtractionComplete) {
                onExtractionComplete(extractionResult);
              }
            }
          }]
        );
      }
      
    } catch (error) {
      // Receipt extraction error
      Alert.alert(
        'Extraction Failed', 
        error instanceof Error ? error.message : 'Failed to extract receipt details. Please try again.'
      );
    } finally {
      // Setting isExtracting to false
      setIsExtracting(false);
    }
  }, [onExtractionComplete]);

  // Handle image picker response
  const handleImagePickerResponse = useCallback((response: ImagePickerResponse) => {
    // Image picker response
    
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

      // New files to add
      if (newFiles.length > 0) {
        onChange([...value, ...newFiles]);
        
        // Automatically extract from the first image if extraction callback is provided
        if (onExtractionComplete && newFiles.length > 0) {
          extractReceiptDetails(newFiles[0].uri);
        }
      }
    }
  }, [value, onChange, onExtractionComplete, extractReceiptDetails]);

  // Camera functionality
  const handleTakePhoto = useCallback(() => {
    handleDismiss();

    launchCamera(
      {
        ...imagePickerOptions,
        quality: 0.8, // Fix: quality should be a number between 0 and 1
      },
      handleImagePickerResponse
    );
  }, [handleImagePickerResponse, handleDismiss]);

  // Gallery functionality
  const handlePickImage = useCallback(() => {
    handleDismiss();

    launchImageLibrary(
      {
        ...imagePickerOptions,
        selectionLimit: 5, // Allow multiple selection
        quality: 0.8, // Fix: quality should be a number between 0 and 1
      },
      handleImagePickerResponse
    );
  }, [handleImagePickerResponse, handleDismiss]);

  // Document picker - keeping as placeholder for now
  const handlePickPdf = () => {
    handleDismiss();
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
        onPress={handlePresentModalPress}
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
                Supports: JPG, JPEG2000, PNG, PDF
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

      {/* Bottom Sheet Modal with error boundary */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.card }}
        handleIndicatorStyle={{ backgroundColor: colors.placeholder }}
        android_keyboardInputMode="adjustResize"
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <BottomSheetView style={styles.modalContent}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Upload Receipt
          </Text>
          
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
        </BottomSheetView>
      </BottomSheetModal>
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: SIZES.large,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
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