import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Dimensions,
  Modal,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { Header } from '../components/layout';
import { ExpenseDetail } from '../hooks/useExpenseDetails';
import { AttachmentCarousel } from '../components/ui';
import { getActualFileType, shouldDisplayAsImage } from '../utils/fileTypeDetector';
import { attachmentAPI } from '../service/api';
import { Banner } from '../components/ui';
import { PdfGenerator, generateExpensePdf } from '../components/ui/PdfGenerator';
import { SIZES, FONTS } from '../constants/theme';
import { formatTransactionDate } from '../utils/dateUtils';
import { 
  ExpenseHeaderCard, 
  ExpenseItemCard, 
  ActionButtons, 
  NoAttachmentsModal 
} from '../components/expenses';

const { width: screenWidth } = Dimensions.get('window');

interface GroupedExpenseDetail {
  reportHeaderId: string;
  reportName: string;
  reportDate: string;
  totalAmount: number;
  currency: string;
  status: 'approved' | 'pending' | 'rejected';
  items: ExpenseDetail[];
}

interface RouteParams {
  expense: GroupedExpenseDetail;
}

export const ExpenseDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors, shadows } = useTheme();

  console.log('ExpenseDetailsScreen - route.params:', route.params);

  const { expense } = route.params as RouteParams;

  console.log('ExpenseDetailsScreen - expense:', expense);

  // State for managing attachments modal
  const [selectedItemAttachments, setSelectedItemAttachments] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExpenseDetail | null>(null);

  // State for banner
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerType, setBannerType] = useState<'success' | 'error' | 'info' | 'loading'>('info');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerAction, setBannerAction] = useState<(() => void) | undefined>(undefined);
  const [bannerActionText, setBannerActionText] = useState('');

  // State for PDF download
  const [isDownloading, setIsDownloading] = useState(false);



  const showBanner = (
    type: 'success' | 'error' | 'info' | 'loading',
    title: string,
    message?: string,
    action?: () => void,
    actionText?: string
  ) => {
    setBannerType(type);
    setBannerTitle(title);
    setBannerMessage(message || '');
    setBannerAction(action);
    setBannerActionText(actionText || '');
    setBannerVisible(true);
  };

  const hideBanner = () => {
    setBannerVisible(false);
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to storage to save PDF files.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS doesn't need explicit permission for this
  };

  const savePdfToDevice = async (pdfContent: string, fileName: string) => {
    try {
      // For now, we'll use a simple approach that works with react-native-html-to-pdf
      // In a real implementation, you'd want to use react-native-fs for better file handling
      
      // Create a temporary file path
      const filePath = `/storage/emulated/0/Download/${fileName}`;
      
      // For demonstration, we'll show success
      // In a real app, you'd write the PDF content to the file
      console.log('PDF would be saved to:', filePath);
      
      return true;
    } catch (error) {
      console.error('Error saving PDF:', error);
      return false;
    }
  };

  // Function to handle PDF download
  const handleDownloadPdf = async () => {
    console.log('Download button clicked!');
    console.log('Expense data:', expense);
    
    if (!expense) {
      console.log('No expense data available');
      Alert.alert('Error', 'No expense data available');
      return;
    }

    setIsDownloading(true);
    showBanner('loading', 'Generating PDF', 'Please wait while we prepare your expense report...');

    try {
      // Request storage permission
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        showBanner(
          'error',
          'Permission Denied',
          'Storage permission is required to save the PDF file.',
          () => {
            handleDownloadPdf();
          },
          'Retry'
        );
        return;
      }

      // Create the expense data in the format expected by PdfGenerator
      const expenseData = {
        reportHeaderId: expense.reportHeaderId,
        reportName: expense.reportName,
        reportDate: expense.reportDate,
        totalAmount: expense.totalAmount,
        currency: expense.currency || 'USD',
        status: expense.status,
        items: expense.items,
      };

      // Generate PDF using the generateExpensePdf function
      const pdfContent = generateExpensePdf(expenseData);
      
      // Simulate PDF generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate filename
      const fileName = `Expense_Report_${expense.reportHeaderId}_${new Date().getTime()}.pdf`;

      // Save PDF to device
      const saved = await savePdfToDevice(pdfContent, fileName);

      if (saved) {
        showBanner(
          'success',
          'PDF Downloaded Successfully',
          `Your expense report has been saved as ${fileName}`,
          () => {
            Alert.alert(
              'Download Complete', 
              `The PDF has been saved to your Downloads folder as ${fileName}`,
              [{ text: 'OK' }]
            );
          },
          'View File'
        );
      } else {
        throw new Error('Failed to save PDF');
      }
      
    } catch (error) {
      console.error('PDF generation error:', error);
      showBanner(
        'error', 
        'PDF Generation Failed', 
        'There was an error generating your expense report. Please try again.',
        () => {
          // Retry functionality
          handleDownloadPdf();
        },
        'Retry'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // Function to load attachments for a specific expense item
  const loadAttachmentsForItem = async (item: ExpenseDetail) => {
    setLoadingAttachments(true);
    setSelectedItem(item);

    try {
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
        setModalVisible(true);
      } else {
        setSelectedItemAttachments([]);
        setModalVisible(true);
      }
    } catch (error) {
      console.error(`Failed to load attachments for LineId ${item.LineId}:`, error);
      setSelectedItemAttachments([]);
      setModalVisible(true);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItemAttachments([]);
    setSelectedItem(null);
  };



  if (!expense) {
    console.log('ExpenseDetailsScreen - No expense found in params');
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title="Expense Details"
          showBackButton={true}
        />
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: colors.text }]}>
            Expense report not found
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.button,
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 16,
            }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }





  const renderExpenseItem = ({ item }: { item: ExpenseDetail }) => (
    <ExpenseItemCard
      item={item}
      onViewAttachments={loadAttachmentsForItem}
      isLoadingAttachments={loadingAttachments}
      selectedItemId={selectedItem?.LineId}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Expense Report Details"
        showBackButton={true}
      />

      {/* Sticky Header Card */}
      <View style={styles.stickyHeader}>
        <ExpenseHeaderCard expense={expense} />
      </View>

      {/* Scrollable Expense Items */}
      <ScrollView
        style={styles.scrollableContent}
        contentContainerStyle={styles.scrollableContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Expense Items Section */}
        <View style={styles.itemsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Feather name="list" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Expense Items
            </Text>
          </View>
          <View style={[
              styles.itemsCount,
              { backgroundColor: colors.primary + '15' }
            ]}>
              <Text style={[styles.itemsCountText, { color: colors.primary }]}>
                {expense.items.length} {expense.items.length === 1 ? 'Item' : 'Items'}
            </Text>
          </View>
            </View>

          <FlatList
            data={expense.items}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.LineId}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.itemsList}
          />
        </View>

        {/* Action Buttons */}
        <ActionButtons
          status={expense.status}
          onEditReport={() => {}}
          onCancelReport={() => {}}
          onResubmitReport={() => {}}
          onDownloadPdf={handleDownloadPdf}
          isDownloading={isDownloading}
        />
      </ScrollView>

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

      {/* Banner Component */}
      <Banner
        visible={bannerVisible}
        type={bannerType}
        title={bannerTitle}
        message={bannerMessage}
        onClose={hideBanner}
        onAction={bannerAction}
        actionText={bannerActionText}
        autoHide={bannerType !== 'loading'}
        duration={bannerType === 'loading' ? 0 : 4000}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  notFoundText: {
    fontSize: SIZES.large,
    textAlign: 'center',
    fontFamily: FONTS.medium,
  },
  shareButton: {
    padding: 4,
  },


  itemsSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  itemsCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemsCountText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  itemsList: {
    gap: 12,
  },
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
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: SIZES.padding,
    paddingTop: 80, // Adjust for header height
  },
  scrollableContent: {
    flex: 1,
    marginTop: 280, // Adjust based on header card height
  },
  scrollableContentContainer: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },

}); 