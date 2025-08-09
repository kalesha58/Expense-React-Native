import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  PermissionsAndroid,
  Image,
} from 'react-native';
import { launchCamera, ImagePickerResponse, MediaType, CameraOptions } from 'react-native-image-picker';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../hooks/useTheme';
import { SIZES } from '../constants/theme';
import { navigate } from '../utils/NavigationUtils';
import { extractReceiptData, showExtractionSuccess } from '../utils/receiptUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ICameraScreenProps {
  onImageCaptured?: (imageUri: string) => void;
}

export const CameraScreen: React.FC<ICameraScreenProps> = ({ onImageCaptured }) => {
  const { colors } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCameraInterface, setShowCameraInterface] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to camera to capture receipts.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasPermission(hasPermission);
        return hasPermission;
      } else {
        // iOS permissions are handled by react-native-image-picker
        setHasPermission(true);
        return true;
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
      return false;
    }
  };

  const launchCameraCapture = () => {
    const options: CameraOptions = {
      mediaType: 'photo' as MediaType,
      quality: 1.0,
      includeBase64: false,
      maxWidth: 2000,
      maxHeight: 2000,
      saveToPhotos: false,
      cameraType: 'back',
      includeExtra: false,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
        handleClose();
        return;
      }

      if (response.errorMessage) {
        console.error('Camera Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to capture image. Please try again.');
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        if (imageUri) {
          setCapturedImage(imageUri);
          setShowCameraInterface(false);
          
          if (onImageCaptured) {
            onImageCaptured(imageUri);
          }
        }
      }
    });
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setShowCameraInterface(true);
    launchCameraCapture();
  };

  const handleUseImage = async () => {
    if (!capturedImage) return;
    
    try {
      console.log('🎯 User clicked "Use Image" - starting extraction process...');
      setIsExtracting(true);
      
      // Extract receipt data from the captured image
      console.log('🔍 Calling extractReceiptData with image:', capturedImage);
      const extractedData = await extractReceiptData(capturedImage);
      
      if (extractedData) {
        console.log('✅ Extraction successful! Data:', extractedData);
        // Show success message
        showExtractionSuccess(extractedData);
        
        // Navigate to expense creation with both image and extracted data
        console.log('🧭 Navigating to CreateExpense with extracted data');
        navigate('CreateExpense', { 
          receiptImage: capturedImage,
          extractedData: extractedData
        });
      } else {
        console.log('❌ Extraction failed or returned null');
        // Navigate with just the image if extraction failed
        console.log('🧭 Navigating to CreateExpense with image only');
        navigate('CreateExpense', { 
          receiptImage: capturedImage 
        });
      }
    } catch (error) {
      console.error('Error during receipt extraction:', error);
      // Navigate with just the image if extraction failed
      navigate('CreateExpense', { 
        receiptImage: capturedImage 
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleClose = () => {
    navigate('Dashboard');
  };

  // Launch camera immediately when component mounts
  useEffect(() => {
    const initializeCamera = async () => {
      const permission = await requestCameraPermission();
      if (permission) {
        // Small delay to ensure UI is ready
        setTimeout(() => {
          launchCameraCapture();
        }, 100);
      }
    };

    initializeCamera();
  }, []);

  // Permission request screen
  if (!hasPermission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.permissionContainer}>
          <Feather name="camera-off" size={64} color={colors.placeholder} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>
            Camera Permission Required
          </Text>
          <Text style={[styles.permissionSubtitle, { color: colors.placeholder }]}>
            Please grant camera permission to capture receipts and documents.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
            onPress={requestCameraPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backButton, { borderColor: colors.border }]}
            onPress={handleClose}
          >
            <Text style={[styles.backButtonText, { color: colors.text }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }



  // Image preview screen
  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        {/* Image Preview */}
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.topButton} onPress={handleClose}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <View style={styles.previewBottomControls}>
              <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                <Feather name="camera" size={24} color="#FFFFFF" />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.useImageButton, isExtracting && styles.useImageButtonDisabled]} 
                onPress={handleUseImage}
                disabled={isExtracting}
              >
                {isExtracting ? (
                  <>
                    <Feather name="loader" size={24} color="#FFFFFF" />
                    <Text style={styles.useImageButtonText}>Extracting...</Text>
                  </>
                ) : (
                  <>
                    <Feather name="check" size={24} color="#FFFFFF" />
                    <Text style={styles.useImageButtonText}>Use Image</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Camera interface screen (like your reference image)
  if (showCameraInterface && !capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        {/* Camera Interface Background */}
        <View style={styles.cameraContainer}>
          {/* Dark camera background */}
          <View style={styles.cameraBackground}>
            {/* Top Controls */}
            <View style={styles.topControls}>
              <TouchableOpacity style={styles.topButton} onPress={handleClose}>
                <Feather name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <Text style={styles.headerTitle}>Capture Receipt</Text>
              
              <TouchableOpacity style={styles.topButton}>
                <Feather name="zap-off" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Document Frame Overlay */}
            <View style={styles.documentFrame}>
              <View style={styles.frameCorner} />
              <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
              <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
              <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
            </View>

            {/* Instruction Text */}
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>
                Position the document within the frame
              </Text>
              <Text style={styles.instructionSubtext}>
                Camera will open automatically
              </Text>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              <View style={styles.bottomControlsInner}>
                {/* Gallery Button */}
                <TouchableOpacity style={styles.galleryButton}>
                  <Feather name="image" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                {/* Capture Button */}
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={launchCameraCapture}
                >
                  <View style={styles.captureButtonInner}>
                    <Feather name="camera" size={32} color="#000000" />
                  </View>
                </TouchableOpacity>
                
                {/* Empty space for symmetry */}
                <View style={styles.flashIndicator} />
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Loading screen when waiting for camera or permissions
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Loading Interface */}
      <View style={styles.cameraContainer}>
        <View style={styles.cameraBackground}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.topButton} onPress={handleClose}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Opening Camera...</Text>
            
            <View style={styles.topButton} />
          </View>

          {/* Center loading indicator */}
          <View style={styles.loadingContainer}>
            <Feather name="camera" size={80} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.loadingText}>Initializing Camera</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding * 2,
  },
  permissionTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    marginTop: SIZES.padding,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: SIZES.font,
    marginTop: SIZES.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
    marginTop: SIZES.padding * 2,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.font,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginTop: SIZES.base,
  },
  backButtonText: {
    fontSize: SIZES.font,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  cameraBackground: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: SIZES.font,
    marginTop: SIZES.padding,
    opacity: 0.7,
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    zIndex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: SIZES.large,
    fontWeight: '600',
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentFrame: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    bottom: '35%',
    zIndex: 1,
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFFFFF',
    top: 0,
    left: 0,
  },
  frameCornerTopRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  frameCornerBottomLeft: {
    bottom: 0,
    top: 'auto',
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  frameCornerBottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: SIZES.font,
    fontWeight: '500',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
    textAlign: 'center',
    marginBottom: SIZES.base,
  },
  instructionSubtext: {
    color: '#FFFFFF',
    fontSize: SIZES.small,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base / 2,
    borderRadius: SIZES.radius,
    textAlign: 'center',
    opacity: 0.8,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1,
  },
  bottomControlsInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding * 2,
  },
  galleryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturingText: {
    color: '#000000',
    fontSize: SIZES.font,
    fontWeight: 'bold',
  },
  flashIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  flashText: {
    color: '#FFFFFF',
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  
  // Preview Screen Styles
  previewBottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
    gap: SIZES.base,
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.font,
    fontWeight: '600',
  },
  useImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: SIZES.padding * 1.5,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
    gap: SIZES.base,
  },
  useImageButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.font,
    fontWeight: '600',
  },
  useImageButtonDisabled: {
    opacity: 0.6,
  },
});
