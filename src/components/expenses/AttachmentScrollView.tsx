import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
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

interface AttachmentScrollViewProps {
  attachments: Attachment[];
  onAttachmentPress?: (attachment: Attachment) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.85;
const CARD_HEIGHT = 120;

export const AttachmentScrollView: React.FC<AttachmentScrollViewProps> = ({
  attachments,
  onAttachmentPress,
}) => {
  const { colors } = useTheme();

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleAttachmentPress = (attachment: Attachment) => {
    if (onAttachmentPress) {
      onAttachmentPress(attachment);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Attachments
        </Text>
        <Text style={[styles.headerCount, { color: colors.placeholder }]}>
          {attachments.length} {attachments.length === 1 ? 'file' : 'files'}
        </Text>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
      >
        {attachments.map((attachment, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.attachmentCard, { width: CARD_WIDTH }]}
            onPress={() => handleAttachmentPress(attachment)}
            activeOpacity={0.9}
          >
            {/* Background Image or Placeholder */}
            <View style={styles.cardBackground}>
              {attachment.BASE64_DATA && shouldDisplayAsImage(attachment.BASE64_DATA, attachment.content_type) ? (
                <Image
                  source={{ 
                    uri: `data:${getActualFileType(attachment.BASE64_DATA, attachment.content_type)};base64,${attachment.BASE64_DATA}` 
                  }}
                  style={styles.backgroundImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.placeholderBackground, { backgroundColor: colors.primary + '20' }]}>
                  <Feather 
                    name={getActualFileType(attachment.BASE64_DATA, attachment.content_type).includes('pdf') ? 'file-text' : 'file'} 
                    size={48} 
                    color={colors.primary} 
                  />
                </View>
              )}
              
              {/* Gradient Overlay for better text readability */}
              <View style={styles.gradientOverlay} />
            </View>
            
            {/* Text Overlay */}
            <View style={styles.textOverlay}>
              <Text style={styles.attachmentTitle} numberOfLines={1}>
                {attachment.file_name || `Attachment ${index + 1}`}
              </Text>
              <Text style={styles.attachmentSubtitle} numberOfLines={1}>
                {getActualFileType(attachment.BASE64_DATA, attachment.content_type)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8, // Reduced bottom margin for tighter spacing
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: SIZES.padding,
  },
  headerTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  headerCount: {
    fontSize: SIZES.small,
    fontFamily: FONTS.regular,
  },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    gap: 16,
  },
  attachmentCard: {
    height: CARD_HEIGHT,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardBackground: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBackground: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  attachmentTitle: {
    color: '#FFFFFF',
    fontSize: SIZES.large,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  attachmentSubtitle: {
    color: '#FFFFFF',
    fontSize: SIZES.font,
    fontFamily: FONTS.medium,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
