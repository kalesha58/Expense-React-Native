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
import { shouldDisplayAsImage, getActualFileType } from '../../utils/fileTypeDetector';

interface Attachment {
  P_PK1_VALUE: string;
  P_PK2_VALUE: string | null;
  P_PK3_VALUE: string | null;
  P_PK4_VALUE: string | null;
  P_PK5_VALUE: string | null;
  ENTITY_TYPE: string;
  ENTITY_NAME: string | null;
  ENTITY_DESC: string | null;
  ATTACHEMNT_TITLE: string | null;
  ATTACHMENT_TYPE: string;
  ATTACHMENT_DESC: string;
  ATTACHMENT_CATEGORY: string;
  SHORT_TEXT: string | null;
  WEB_PAGE_URL: string | null;
  file_name: string;
  file_length: string | null;
  content_type: string;
  blob_data: string | null;
  BASE64_DATA: string;
}

interface AttachmentCarouselProps {
  attachments: Attachment[];
  onDownload?: (attachment: Attachment) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.85;
const CARD_SPACING = 16;

export const AttachmentCarousel: React.FC<AttachmentCarouselProps> = ({
  attachments,
  onDownload,
}) => {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleAttachmentPress = (attachment: Attachment) => {
    console.log('Attachment pressed:', {
      fileName: attachment.file_name,
      contentType: attachment.content_type,
      base64Start: attachment.BASE64_DATA?.substring(0, 20),
      isImage: shouldDisplayAsImage(attachment.BASE64_DATA, attachment.content_type),
      actualType: getActualFileType(attachment.BASE64_DATA, attachment.content_type)
    });
    setSelectedAttachment(attachment);
    setModalVisible(true);
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (CARD_WIDTH + CARD_SPACING));
    setActiveIndex(index);
  };

  const scrollToIndex = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * (CARD_WIDTH + CARD_SPACING),
      animated: true,
    });
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedAttachment(null);
  };

  const handleDownload = (attachment: Attachment) => {
    if (onDownload) {
      onDownload(attachment);
    }
  };

  if (!attachments || attachments.length === 0) {
    return null;
  }

  // Debug log to see all attachments and their types
  console.log('AttachmentCarousel - All attachments:', attachments.map(att => ({
    fileName: att.file_name,
    contentType: att.content_type,
    base64Start: att.BASE64_DATA?.substring(0, 20),
    actualType: getActualFileType(att.BASE64_DATA, att.content_type),
    isImage: shouldDisplayAsImage(att.BASE64_DATA, att.content_type)
  })));

  return (
    <>
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          decelerationRate="fast"
        >
          {attachments.map((attachment, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.card, { width: CARD_WIDTH }]}
              onPress={() => handleAttachmentPress(attachment)}
              activeOpacity={0.9}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <Text style={[styles.fileName, { color: colors.text }]}>
                  {attachment.file_name || `Attachment ${index + 1}`}
                </Text>
                <Text style={[styles.fileType, { color: colors.placeholder }]}>
                  {getActualFileType(attachment.BASE64_DATA, attachment.content_type)}
                </Text>
              </View>

              {/* Preview Area */}
              <View style={[styles.previewArea, { backgroundColor: colors.background }]}>
                {attachment.BASE64_DATA && shouldDisplayAsImage(attachment.BASE64_DATA, attachment.content_type) ? (
                  <Image
                    source={{ uri: `data:${getActualFileType(attachment.BASE64_DATA, attachment.content_type)};base64,${attachment.BASE64_DATA}` }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.filePreview}>
                    <Feather 
                      name={getActualFileType(attachment.BASE64_DATA, attachment.content_type).includes('pdf') ? 'file-text' : 'file'} 
                      size={48} 
                      color={colors.primary} 
                    />
                    <Text style={[styles.filePreviewText, { color: colors.placeholder }]}>
                      {getActualFileType(attachment.BASE64_DATA, attachment.content_type).includes('pdf') ? 'PDF Document' : 'File Preview'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Download Button */}
              <TouchableOpacity
                style={[styles.downloadButton, { backgroundColor: colors.primary }]}
                onPress={() => handleDownload(attachment)}
              >
                <Feather name="download" size={16} color="#FFFFFF" />
                <Text style={styles.downloadText}>Download</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Indicators */}
        {attachments.length > 1 && (
          <View style={styles.indicatorsContainer}>
            {attachments.map((_, index) => (
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
            {selectedAttachment && (
              <Text style={styles.modalFileName}>
                {selectedAttachment.file_name} ({getActualFileType(selectedAttachment.BASE64_DATA, selectedAttachment.content_type)})
              </Text>
            )}
          </View>

          <View style={styles.modalContent}>
            {selectedAttachment?.BASE64_DATA && shouldDisplayAsImage(selectedAttachment.BASE64_DATA, selectedAttachment.content_type) ? (
              <Image
                source={{ uri: `data:${getActualFileType(selectedAttachment.BASE64_DATA, selectedAttachment.content_type)};base64,${selectedAttachment.BASE64_DATA}` }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.modalFilePreview}>
                <Feather 
                  name={getActualFileType(selectedAttachment?.BASE64_DATA || '', selectedAttachment?.content_type || '').includes('pdf') ? 'file-text' : 'file'} 
                  size={64} 
                  color="#FFFFFF" 
                />
                <Text style={styles.modalFileText}>
                  {selectedAttachment?.file_name || 'File Preview'}
                </Text>
                <Text style={styles.modalFileType}>
                  {getActualFileType(selectedAttachment?.BASE64_DATA || '', selectedAttachment?.content_type || '')}
                </Text>
              </View>
            )}
          </View>

          {/* Modal Actions */}
          {selectedAttachment && (
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionButton, { backgroundColor: colors.primary }]}
                onPress={() => handleDownload(selectedAttachment)}
              >
                <Feather name="download" size={20} color="#FFFFFF" />
                <Text style={styles.modalActionText}>Download</Text>
              </TouchableOpacity>
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
    paddingHorizontal: SIZES.padding,
  },
  card: {
    marginRight: CARD_SPACING,
    borderRadius: SIZES.radius,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  fileName: {
    fontSize: SIZES.font,
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  fileType: {
    fontSize: SIZES.small,
    fontFamily: FONTS.regular,
  },
  previewArea: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  filePreview: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  filePreviewText: {
    fontSize: SIZES.font,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  downloadText: {
    color: '#FFFFFF',
    fontSize: SIZES.font,
    fontFamily: FONTS.medium,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
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
  modalFileName: {
    color: '#FFFFFF',
    fontSize: SIZES.font,
    fontFamily: FONTS.medium,
    flex: 1,
    marginLeft: 16,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalImage: {
    width: screenWidth,
    height: '100%',
  },
  modalFilePreview: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  modalFileText: {
    color: '#FFFFFF',
    fontSize: SIZES.large,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  modalFileType: {
    color: '#FFFFFF',
    fontSize: SIZES.font,
    fontFamily: FONTS.regular,
    opacity: 0.8,
  },
  modalActions: {
    padding: 20,
    alignItems: 'center',
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: SIZES.radius,
    gap: 8,
  },
  modalActionText: {
    color: '#FFFFFF',
    fontSize: SIZES.font,
    fontFamily: FONTS.medium,
  },
}); 