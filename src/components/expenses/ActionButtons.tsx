import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { SIZES, FONTS } from '../../constants/theme';

interface ActionButtonsProps {
  status: 'approved' | 'pending' | 'rejected';
  onEditReport?: () => void;
  onCancelReport?: () => void;
  onResubmitReport?: () => void;
  onDownloadPdf?: () => void;
  isDownloading?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  status,
  onEditReport,
  onCancelReport,
  onResubmitReport,
  onDownloadPdf,
  isDownloading = false,
}) => {
  const { colors } = useTheme();





  // For approved status, show download button
  if (status === 'approved') {
    return (
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.button,
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            opacity: isDownloading ? 0.6 : 1,
          }}
          onPress={onDownloadPdf}
          disabled={isDownloading}
        >
          <Feather name="download" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // For pending status, show edit, cancel, and download buttons
  if (status === 'pending') {
    return (
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.button,
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginRight: 6,
          }}
          onPress={onEditReport}
        >
          <Text style={{ color: colors.button, fontWeight: '600' }}>Edit Report</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.error,
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginLeft: 6,
          }}
          onPress={onCancelReport}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Cancel Report</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.primary,
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 8,
            flexDirection: 'row',
            justifyContent: 'center',
            opacity: isDownloading ? 0.6 : 1,
          }}
          onPress={onDownloadPdf}
          disabled={isDownloading}
        >
          <Feather name="download" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // For rejected status, show resubmit and download buttons
  if (status === 'rejected') {
    return (
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.button,
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 8,
          }}
          onPress={onResubmitReport}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Resubmit with Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.primary,
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            opacity: isDownloading ? 0.6 : 1,
          }}
          onPress={onDownloadPdf}
          disabled={isDownloading}
        >
          <Feather name="download" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Default case - show download button for any other status
  return (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: colors.button,
          padding: 16,
          borderRadius: 8,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          opacity: isDownloading ? 0.6 : 1,
        }}
        onPress={onDownloadPdf}
        disabled={isDownloading}
      >
        <Feather name="download" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
          {isDownloading ? 'Generating...' : 'Download PDF'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
}); 