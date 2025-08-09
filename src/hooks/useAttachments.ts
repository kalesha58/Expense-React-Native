import { useState, useCallback } from 'react';
import { attachmentAPI } from '../service/api';
import { getActualFileType, shouldDisplayAsImage } from '../utils/fileTypeDetector';
import { ExpenseDetail } from './useExpenseDetails';

interface UseAttachmentsReturn {
  selectedItemAttachments: any[];
  modalVisible: boolean;
  loadingAttachments: boolean;
  loadAttachmentsForItem: (item: ExpenseDetail) => Promise<void>;
  closeModal: () => void;
}

export const useAttachments = (): UseAttachmentsReturn => {
  const [selectedItemAttachments, setSelectedItemAttachments] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const loadAttachmentsForItem = useCallback(async (item: ExpenseDetail) => {
    try {
      setLoadingAttachments(true);
      const result = await attachmentAPI.getAttachments(item.LineId);

      if (result && result.AttachmentList && Array.isArray(result.AttachmentList)) {
        // Transform attachments to match the expected interface
        const transformedAttachments = result.AttachmentList.map((attachment: any) => {
          const actualFileType = getActualFileType(attachment.BASE64_DATA || '', attachment.content_type || '');
          const isImage = shouldDisplayAsImage(attachment.BASE64_DATA || '', attachment.content_type || '');

          return {
            ...attachment,
            // Transform to match Attachment interface
            P_PK1_VALUE: attachment.P_PK1_VALUE || item.LineId,
            P_PK2_VALUE: attachment.P_PK2_VALUE || null,
            P_PK3_VALUE: attachment.P_PK3_VALUE || null,
            P_PK4_VALUE: attachment.P_PK4_VALUE || null,
            P_PK5_VALUE: attachment.P_PK5_VALUE || null,
            ENTITY_TYPE: attachment.ENTITY_TYPE || 'EXPENSE',
            ENTITY_NAME: attachment.ENTITY_NAME || item.ExpenseItem,
            ENTITY_DESC: attachment.ENTITY_DESC || null,
            ATTACHEMNT_TITLE: attachment.ATTACHEMNT_TITLE || attachment.FileName,
            ATTACHMENT_TYPE: attachment.ATTACHMENT_TYPE || 'RECEIPT',
            ATTACHMENT_DESC: attachment.ATTACHMENT_DESC || attachment.FileName,
            ATTACHMENT_CATEGORY: attachment.ATTACHMENT_CATEGORY || 'RECEIPT',
            SHORT_TEXT: attachment.SHORT_TEXT || null,
            WEB_PAGE_URL: attachment.WEB_PAGE_URL || attachment.FileUrl,
            file_name: attachment.FileName || attachment.file_name || `Attachment_${item.LineId}`,
            file_length: attachment.file_length || null,
            content_type: actualFileType,
            blob_data: attachment.blob_data || null,
            BASE64_DATA: attachment.BASE64_DATA || attachment.FileUrl || '',
          };
        });

        setSelectedItemAttachments(transformedAttachments);
      } else {
        setSelectedItemAttachments([]);
      }
    } catch (error) {
      // Failed to load attachments for LineId
      setSelectedItemAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  }, []);

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItemAttachments([]);
  };

  return {
    selectedItemAttachments,
    modalVisible,
    loadingAttachments,
    loadAttachmentsForItem,
    closeModal,
  };
}; 