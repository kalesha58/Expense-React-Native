import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { AttachmentCarousel } from '../ui/AttachmentCarousel';
import { SIZES, FONTS } from '../../constants/theme';

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

interface AttachmentViewerProps {
  attachments: Attachment[];
  onDownload?: (attachment: Attachment) => void;
  onRetry?: () => void;
  loading?: boolean;
  error?: string | null;
}

export const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  attachments,
  onDownload,
  onRetry,
  loading = false,
  error = null,
}) => {
  const { colors } = useTheme();

  const handleDownload = (attachment: Attachment) => {
    if (onDownload) {
      onDownload(attachment);
    } else {
      Alert.alert(
        'Download Attachment',
        `Download functionality for ${attachment.file_name} will be implemented here.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Feather name="loader" size={48} color={colors.placeholder} />
        <Text style={[styles.loadingText, { color: colors.placeholder }]}>
          Loading attachments...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>
          Failed to load attachments
        </Text>
        <Text style={[styles.errorSubtext, { color: colors.placeholder }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={handleRetry}
        >
          <Feather name="refresh-cw" size={16} color="#FFFFFF" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (attachments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="image" size={48} color={colors.placeholder} />
        <Text style={[styles.emptyText, { color: colors.placeholder }]}>
          No attachments available
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Attachment Carousel */}
      <View style={styles.carouselSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Attachments ({attachments.length})
          </Text>
        </View>
        <AttachmentCarousel
          attachments={attachments}
          onDownload={handleDownload}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: SIZES.font,
    fontFamily: FONTS.medium,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  errorText: {
    fontSize: SIZES.font,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: SIZES.small,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
    gap: 6,
    marginTop: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: SIZES.small,
    fontFamily: FONTS.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: SIZES.font,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  carouselSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: SIZES.medium,
    fontFamily: FONTS.medium,
    fontWeight: '600',
  },
}); 