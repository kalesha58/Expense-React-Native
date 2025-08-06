import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { SIZES, FONTS } from '../../constants/theme';

interface NoAttachmentsModalProps {
  visible: boolean;
  expenseItemName?: string;
  onClose: () => void;
}

export const NoAttachmentsModal: React.FC<NoAttachmentsModalProps> = ({
  visible,
  expenseItemName,
  onClose,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {expenseItemName} - Attachments
            </Text>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.noAttachmentsContainer}>
              <Feather name="image" size={48} color={colors.placeholder} />
              <Text style={[styles.noAttachmentsText, { color: colors.placeholder }]}>
                No attachments available for this expense item
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    borderRadius: SIZES.radius,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
  modalContent: {
    padding: 16,
  },
  noAttachmentsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noAttachmentsText: {
    marginTop: 10,
    fontSize: SIZES.medium,
    textAlign: 'center',
    fontFamily: FONTS.medium,
  },
}); 