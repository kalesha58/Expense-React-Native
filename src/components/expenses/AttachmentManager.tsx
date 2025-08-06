import React from 'react';
import { View } from 'react-native';
import { AttachmentCarousel } from '../ui';
import { NoAttachmentsModal } from './NoAttachmentsModal';
import { useAttachments } from '../../hooks/useAttachments';
import { ExpenseDetail } from '../../hooks/useExpenseDetails';

interface AttachmentManagerProps {
  children: (props: {
    loadAttachmentsForItem: (item: ExpenseDetail) => Promise<void>;
    loadingAttachments: boolean;
    selectedItemId?: string;
  }) => React.ReactNode;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({ children }) => {
  const {
    selectedItemAttachments,
    modalVisible,
    loadingAttachments,
    selectedItem,
    loadAttachmentsForItem,
    closeModal,
  } = useAttachments();

  return (
    <View style={{ flex: 1 }}>
      {children({
        loadAttachmentsForItem,
        loadingAttachments,
        selectedItemId: selectedItem?.LineId,
      })}

      {/* Attachments Modal */}
      {modalVisible && selectedItemAttachments.length > 0 && (
        <AttachmentCarousel
          attachments={selectedItemAttachments}
        />
      )}

      {/* No Attachments Modal */}
      <NoAttachmentsModal
        visible={modalVisible && selectedItemAttachments.length === 0}
        expenseItemName={selectedItem?.ExpenseItem}
        onClose={closeModal}
      />
    </View>
  );
}; 