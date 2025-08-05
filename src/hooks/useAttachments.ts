import { useState, useEffect, useCallback } from 'react';
import { attachmentAPI } from '../service/api';
import { logger } from '../utils/logger';

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

interface AttachmentsResponse {
  AttachmentList: Attachment[];
}

export const useAttachments = (lineId?: string) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchAttachments = useCallback(async () => {
    if (!lineId) {
      setAttachments([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.info('Starting attachment fetch for lineId:', lineId);
      const response = await attachmentAPI.getAttachments(lineId);
      
      logger.info('Raw attachment API response:', response);
      
      // Handle different response formats
      let attachmentData: Attachment[] = [];
      
      if (response && typeof response === 'object') {
        if ('AttachmentList' in response) {
          attachmentData = (response as AttachmentsResponse).AttachmentList || [];
          logger.info('Found AttachmentList in response:', attachmentData.length);
        } else if (Array.isArray(response)) {
          attachmentData = response as Attachment[];
          logger.info('Response is direct array:', attachmentData.length);
        } else if ('data' in response && Array.isArray((response as any).data)) {
          attachmentData = (response as any).data as Attachment[];
          logger.info('Found data array in response:', attachmentData.length);
        } else {
          logger.warn('Unexpected response format:', response);
          // If response is empty or unexpected, treat as no attachments
          attachmentData = [];
        }
      } else {
        logger.warn('Response is not an object:', typeof response, response);
        attachmentData = [];
      }

      // Filter attachments that match the lineId
      const filteredAttachments = attachmentData.filter(
        attachment => attachment.P_PK1_VALUE === lineId
      );

      logger.info('Filtered attachments for lineId:', {
        lineId,
        totalAttachments: attachmentData.length,
        filteredAttachments: filteredAttachments.length,
        allP_PK1_VALUES: attachmentData.map(a => a.P_PK1_VALUE)
      });

      setAttachments(filteredAttachments);
      setHasLoaded(true);
      logger.info('Attachments fetched successfully', { 
        total: attachmentData.length, 
        filtered: filteredAttachments.length,
        lineId 
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch attachments';
      setError(errorMessage);
      logger.error('Error fetching attachments:', { 
        error: err, 
        lineId,
        errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      });
      
      // Set empty attachments on error to show "no attachments" state
      setAttachments([]);
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [lineId]);

  // Manual trigger function - will be called when user clicks on expense
  const loadAttachments = useCallback(() => {
    if (lineId && !hasLoaded && !loading) {
      fetchAttachments();
    }
  }, [lineId, hasLoaded, loading, fetchAttachments]);

  return {
    attachments,
    loading,
    error,
    hasLoaded,
    loadAttachments,
    refetch: fetchAttachments,
  };
}; 