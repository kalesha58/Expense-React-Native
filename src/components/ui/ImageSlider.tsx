import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Modal,
  Text,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { SIZES, FONTS } from '../../constants/theme';

interface ImageItem {
  uri: string;
  name?: string;
  type?: string;
}

interface ImageSliderProps {
  images: ImageItem[];
  height?: number;
  showIndicators?: boolean;
  showImageCount?: boolean;
  onImagePress?: (image: ImageItem, index: number) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const ImageSlider: React.FC<ImageSliderProps> = ({
  images,
  height = 200,
  showIndicators = true,
  showImageCount = true,
  onImagePress,
}) => {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleImagePress = (image: ImageItem, index: number) => {
    setSelectedImageIndex(index);
    setModalVisible(true);
    onImagePress?.(image, index);
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / screenWidth);
    setActiveIndex(index);
  };

  const scrollToIndex = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * screenWidth,
      animated: true,
    });
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const nextImage = () => {
    const nextIndex = (selectedImageIndex + 1) % images.length;
    setSelectedImageIndex(nextIndex);
  };

  const previousImage = () => {
    const prevIndex = selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1;
    setSelectedImageIndex(prevIndex);
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      <View style={[styles.container, { height }]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          {images.map((image, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.imageContainer, { width: screenWidth }]}
              onPress={() => handleImagePress(image, index)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: image.uri }}
                style={[styles.image, { height }]}
                resizeMode="cover"
              />
              {showImageCount && images.length > 1 && (
                <View style={[styles.imageCount, { backgroundColor: colors.primary + 'CC' }]}>
                  <Text style={[styles.imageCountText, { color: colors.background }]}>
                    {index + 1} / {images.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Indicators */}
        {showIndicators && images.length > 1 && (
          <View style={styles.indicatorsContainer}>
            {images.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor: index === activeIndex ? colors.primary : colors.placeholder + '40',
                  },
                ]}
                onPress={() => scrollToIndex(index)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Full Screen Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <StatusBar hidden />
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            {images.length > 1 && (
              <Text style={styles.modalImageCount}>
                {selectedImageIndex + 1} / {images.length}
              </Text>
            )}
          </View>

          <View style={styles.modalImageContainer}>
            <Image
              source={{ uri: images[selectedImageIndex].uri }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </View>

          {images.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={previousImage}
              >
                <Feather name="chevron-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={nextImage}
              >
                <Feather name="chevron-right" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}

          {/* Image Info */}
          {images[selectedImageIndex].name && (
            <View style={styles.imageInfo}>
              <Text style={styles.imageName}>{images[selectedImageIndex].name}</Text>
              {images[selectedImageIndex].type && (
                <Text style={styles.imageType}>{images[selectedImageIndex].type}</Text>
              )}
            </View>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
  },
  imageCount: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    fontSize: SIZES.small,
    fontFamily: FONTS.medium,
  },
  indicatorsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageCount: {
    color: '#FFFFFF',
    fontSize: SIZES.font,
    fontFamily: FONTS.medium,
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: screenWidth,
    height: '100%',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25,
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  imageInfo: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 8,
  },
  imageName: {
    color: '#FFFFFF',
    fontSize: SIZES.medium,
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  imageType: {
    color: '#FFFFFF',
    fontSize: SIZES.small,
    fontFamily: FONTS.regular,
    opacity: 0.8,
  },
}); 