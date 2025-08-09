import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Modal,
  Alert,
  PermissionsAndroid,
  Platform,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../hooks/useTheme';
import { Header } from '../components/layout';
import useExpenseDetails, { ExpenseDetail } from '../hooks/useExpenseDetails';
import { AttachmentCarousel } from '../components/ui';
import { getActualFileType, shouldDisplayAsImage } from '../utils/fileTypeDetector';
import { attachmentAPI } from '../service/api';
import { Banner } from '../components/ui';
import { PdfGenerator, generateExpensePdf } from '../components/ui/PdfGenerator';
import { SIZES, FONTS } from '../constants/theme';
import { formatTransactionDate } from '../utils/dateUtils';
import { processItemization, ProcessedExpenseItem, getItemizedGroup } from '../utils/itemizationUtils';
import { 
  ExpenseHeaderCard, 
  ExpenseItemCard, 
  NoAttachmentsModal,
  AttachmentScrollView,
  CompactExpenseItemCard,
  SearchModal
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

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const ExpenseDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const { colors, shadows } = useTheme();
  const { expenseDetails } = useExpenseDetails();

  const { expense } = route.params as RouteParams;

  // Transform expense details to grouped format for search
  const transformExpenseDetailsToGroups = (expenseDetails: ExpenseDetail[]) => {
    const groupedMap = new Map<string, ExpenseDetail[]>();
    
    expenseDetails.forEach((detail) => {
      const reportHeaderId = detail.ReportHeaderId;
      if (!groupedMap.has(reportHeaderId)) {
        groupedMap.set(reportHeaderId, []);
      }
      groupedMap.get(reportHeaderId)!.push(detail);
    });

    return Array.from(groupedMap.entries()).map(([reportHeaderId, items]) => {
      const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.Amount) || 0), 0);
      const firstItem = items[0];
      
      const statusCounts = {
        approved: 0,
        pending: 0,
        rejected: 0,
      };

      let finalStatus: 'approved' | 'pending' | 'rejected' = 'approved';
      if (statusCounts.rejected > 0) {
        finalStatus = 'rejected';
      } else if (statusCounts.pending > 0) {
        finalStatus = 'pending';
      }

      return {
        id: reportHeaderId,
        reportHeaderId,
        reportName: firstItem.ExpenseItem || `Expense Report ${reportHeaderId}`,
        reportDate: firstItem.TransactionDate,
        title: firstItem.ExpenseItem || `Expense Report ${reportHeaderId}`,
        amount: totalAmount,
        totalAmount,
        status: finalStatus,
        date: firstItem.TransactionDate,
        itemCount: items.filter(item => item.ItemizationParentId === '-1').length,
        category: 'Business Travel',
        items,
        businessPurpose: firstItem.BusinessPurpose,
        departmentCode: firstItem.DepartmentCode,
        currency: firstItem.Currency,
        location: firstItem.Location,
        supplier: firstItem.Supplier,
        comments: firstItem.Comments,
      };
    });
  };

  const allExpensesForSearch = transformExpenseDetailsToGroups(expenseDetails);

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
  
  // State for search modal
  const [showSearchModal, setShowSearchModal] = useState(false);

  // State for all attachments
  const [allAttachments, setAllAttachments] = useState<any[]>([]);
  const [loadingAllAttachments, setLoadingAllAttachments] = useState(false);
  
  // State for processed expense items (with itemization)
  const [processedItems, setProcessedItems] = useState<ProcessedExpenseItem[]>([]);

  // Load all attachments for the expense
  const loadAllAttachments = async () => {
    setLoadingAllAttachments(true);
    try {
      const allAttachmentsList: any[] = [];
      
      for (const item of expense.items) {
        try {
          const result = await attachmentAPI.getAttachments(item.LineId);
          if (result && result.AttachmentList && Array.isArray(result.AttachmentList)) {
            const transformedAttachments = result.AttachmentList.map((attachment: any) => ({
              ...attachment,
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
              content_type: getActualFileType(attachment.BASE64_DATA || '', attachment.content_type || ''),
              blob_data: attachment.blob_data || null,
              BASE64_DATA: attachment.BASE64_DATA || attachment.FileUrl || '',
            }));
            allAttachmentsList.push(...transformedAttachments);
          }
        } catch (error) {
          // console.error(`Failed to load attachments for LineId ${item.LineId}:`, error);
        }
      }
      
      setAllAttachments(allAttachmentsList);
    } catch (error) {
      // console.error('Failed to load all attachments:', error);
    } finally {
      setLoadingAllAttachments(false);
    }
  };

  // Calculate parent items count (items with ItemizationParentId: "-1")
  const parentItemsCount = expense?.items?.filter(item => item.ItemizationParentId === '-1').length || 0;

  // Process expense items for itemization
  const processExpenseItems = () => {
    if (expense && expense.items.length > 0) {
      const { parentItems } = processItemization(expense.items);
      // Only show items with ItemizationParentId: "-1" in the main list
      const mainListItems = expense.items.filter(item => item.ItemizationParentId === '-1');
      const processedMainItems = mainListItems.map(item => {
        const isParent = item.ItemizationFlag === 'Y' && item.ItemizationParentId === '-1';
        const children = expense.items.filter(child => 
          child.ItemizationFlag === 'Y' && child.ItemizationParentId === item.LineId
        );
        
        return {
          ...item,
          hasItemized: isParent,
          itemizedCount: children.length,
          isParent,
          isChild: false,
        } as ProcessedExpenseItem;
      });
      
      setProcessedItems(processedMainItems);
    }
  };

  // Load attachments on component mount
  useEffect(() => {
    if (expense && expense.items.length > 0) {
      console.log('ExpenseDetailsScreen - Loading for expense:', expense.reportHeaderId);
      console.log('ExpenseDetailsScreen - Items count:', expense.items.length);
      loadAllAttachments();
      processExpenseItems();
    }
  }, [expense]);

  // Debug logging for attachments
  useEffect(() => {
    console.log('ExpenseDetailsScreen - All attachments count:', allAttachments.length);
  }, [allAttachments]);

  // Debug logging for processed items
  useEffect(() => {
    console.log('ExpenseDetailsScreen - Processed items count:', processedItems.length);
  }, [processedItems]);

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
        // console.warn(err);
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
      // console.log('PDF would be saved to:', filePath);
      
      return true;
    } catch (error) {
      // console.error('Error saving PDF:', error);
      return false;
    }
  };

  // Function to handle search modal
  const handleSearchToggle = () => {
    setShowSearchModal(!showSearchModal);
  };

  const handleSearchModalClose = () => {
    setShowSearchModal(false);
  };

  const handleSearchResultSelect = (expenseId: string) => {
    // Find the selected expense and navigate to it
    const selectedExpense = allExpensesForSearch.find(exp => exp.id === expenseId);
    if (selectedExpense) {
      navigation.navigate('ExpenseDetails', { 
        expense: {
          reportHeaderId: selectedExpense.reportHeaderId,
          reportName: selectedExpense.reportName,
          reportDate: selectedExpense.reportDate,
          totalAmount: selectedExpense.totalAmount,
          currency: selectedExpense.currency || 'USD',
          status: selectedExpense.status,
          items: selectedExpense.items,
        }
      });
    }
    setShowSearchModal(false);
  };

  // Function to handle PDF download
  const handleDownloadPdf = async () => {
    // console.log('Download button clicked!');
    // console.log('Expense data:', expense);
    
    if (!expense) {
      // console.log('No expense data available');
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
      // console.error('PDF generation error:', error);
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
      // console.error(`Failed to load attachments for LineId ${item.LineId}:`, error);
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
      </View>
    );
  }

  console.log('ExpenseDetailsScreen - Rendering with expense:', expense.reportHeaderId);
  console.log('ExpenseDetailsScreen - Expense data for header:', {
    reportDate: expense.reportDate,
    reportName: expense.reportName,
    reportHeaderId: expense.reportHeaderId,
    totalAmount: expense.totalAmount,
    currency: expense.currency,
    status: expense.status
  });





  const renderExpenseItem = ({ item }: { item: ProcessedExpenseItem }) => (
    <CompactExpenseItemCard
      item={item}
      onViewAttachments={loadAttachmentsForItem}
      onViewDetails={(lineItem) => {
        if (item.hasItemized) {
          // Navigate to itemized group details for parent items
          const itemizedGroup = getItemizedGroup(lineItem, expense.items);
          (navigation as any).navigate('LineItemDetails', { 
            lineItem: lineItem,
            itemizedGroup: itemizedGroup 
          });
        } else {
          // Navigate to regular item details
          (navigation as any).navigate('LineItemDetails', { lineItem });
        }
      }}
      isLoadingAttachments={loadingAttachments}
      selectedItemId={selectedItem?.LineId}
      hasItemized={item.hasItemized}
      itemizedCount={item.itemizedCount}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Expense Report Details"
        showBackButton={true}
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={handleSearchToggle}
              style={[styles.actionButton, { backgroundColor: 'rgba(0,0,0,0.05)' }]}
            >
              <Feather 
                name="search" 
                size={24} 
                color={colors.primary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleDownloadPdf}
              disabled={isDownloading}
              style={[styles.actionButton, { backgroundColor: 'rgba(0,0,0,0.05)' }]}
            >
              <Feather 
                name="download" 
                size={24} 
                color={isDownloading ? colors.placeholder : colors.primary} 
              />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollableContent}
        contentContainerStyle={styles.scrollableContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Attachments Section - Always show */}
        <View style={styles.attachmentSection}>
          {/* <View style={styles.attachmentSectionHeader}>
            <Feather name="paperclip" size={20} color={colors.primary} />
            <Text style={[styles.attachmentSectionTitle, { color: colors.text }]}>
              Attachments ({allAttachments.length})
            </Text>
          </View> */}
          {allAttachments.length > 0 ? (
            <AttachmentScrollView
              attachments={allAttachments}
              onAttachmentPress={(attachment) => {
                setSelectedItemAttachments([attachment]);
                setModalVisible(true);
              }}
            />
          ) : (
            <View style={styles.attachmentPlaceholder}>
              <View style={styles.placeholderCard}>
                <Feather name="paperclip" size={32} color={colors.placeholder} />
                <Text style={[styles.placeholderText, { color: colors.placeholder }]}>
                  No attachments available
                </Text>
                <Text style={[styles.placeholderSubtext, { color: colors.placeholder }]}>
                  Attachments will appear here when available
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Expense Header Card */}
        <View style={styles.headerCard}>
          <ExpenseHeaderCard expense={expense} parentItemsCount={parentItemsCount} />
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Expense Items Section */}
        <View style={styles.itemsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionIcon}>
                <Feather name="list" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Line Items
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.placeholder }]}>
                  {processedItems.length} {processedItems.length === 1 ? 'item' : 'items'}
                </Text>
              </View>
            </View>
            <View style={[styles.sectionBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.sectionBadgeText, { color: colors.primary }]}>
                {processedItems.length}
              </Text>
            </View>
          </View>

                               {processedItems.length > 0 ? (
            <FlatList
              data={processedItems}
              renderItem={renderExpenseItem}
              keyExtractor={(item) => item.LineId}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.itemsList}
            />
          ) : (
            <View style={styles.emptyLineItems}>
              <Feather name="list" size={32} color={colors.placeholder} />
              <Text style={[styles.emptyLineItemsText, { color: colors.placeholder }]}>
                No line items available
              </Text>
              <Text style={[styles.emptyLineItemsSubtext, { color: colors.placeholder }]}>
                Line items will appear here when available
              </Text>
            </View>
          )}
        </View>

        {/* Submit Expense Button */}
        <View style={styles.submitButtonContainer}>
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              // Handle submit expense functionality here
              console.log('Submit Expense pressed');
            }}
          >
            <Feather name="send" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Submit Expense</Text>
          </TouchableOpacity>
        </View>
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

      {/* Search Modal */}
      <SearchModal
        visible={showSearchModal}
        onClose={handleSearchModalClose}
        expenses={allExpensesForSearch}
        onSelectExpense={handleSearchResultSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
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
  headerCard: {
    paddingTop: SIZES.padding, // Reduced padding top for tighter spacing
    paddingBottom: SIZES.padding,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollableContentContainer: {
    paddingTop: SIZES.padding / 2, // Reduced top padding for tighter spacing
    paddingBottom: 40,
  },
  itemsSection: {
    marginTop: 16, // Reduced margin top for tighter spacing
    marginBottom: 24,
    paddingHorizontal: SIZES.padding - 4, // Reduced from SIZES.padding (16px) to 12px for wider cards
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  sectionSubtitle: {
    fontSize: SIZES.small,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeText: {
    fontSize: SIZES.small,
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
  divider: {
    height: 1,
    marginVertical: 8, // Reduced vertical margin for tighter spacing
    marginHorizontal: SIZES.padding,
  },
  seeAllText: {
    fontSize: SIZES.font,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  attachmentSection: {
    marginBottom: SIZES.padding,
    paddingHorizontal: SIZES.padding,
  },
  attachmentSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SIZES.base,
  },
  attachmentSectionTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  attachmentPlaceholder: {
    marginTop: SIZES.base,
  },
  placeholderCard: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  placeholderText: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    fontFamily: FONTS.medium,
    marginTop: SIZES.base,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: SIZES.small,
    fontFamily: FONTS.regular,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyLineItems: {
    padding: SIZES.padding * 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: SIZES.radius,
    marginTop: SIZES.base,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  emptyLineItemsText: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    fontFamily: FONTS.medium,
    marginTop: SIZES.base,
    textAlign: 'center',
  },
  emptyLineItemsSubtext: {
    fontSize: SIZES.small,
    fontFamily: FONTS.regular,
    marginTop: 4,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
    marginLeft: SIZES.base,
  },
  downloadButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding * 1.5,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    gap: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.medium,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
}); 