import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Banner } from '../components/ui/Banner';
import { SIZES } from '../constants/theme';
import useDepartments from '../hooks/useDepartments';
import { 
  BasicDetailsCard, 
  LineItemsSection, 
  CreateExpenseFAB 
} from '../components/expenses';
import { useExpenseForm } from '../hooks/useExpenseForm';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AsyncStorageService } from '../services/asyncStorage';
import { extractReceiptDataSilent, ReceiptExtractionResult } from '../utils/receiptUtils';

type CreateExpenseScreenRouteProp = RouteProp<RootStackParamList, 'CreateExpense'>;

export const CreateExpenseScreen: React.FC = () => {
  const { colors } = useTheme();
  const { departments } = useDepartments();
  const route = useRoute<CreateExpenseScreenRouteProp>();
  
  // Get parameters passed from camera/navigation
  const { receiptImage, extractedData, startExtractionInBackground } = route.params || {};
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const [extractionData, setExtractionData] = useState<ReceiptExtractionResult | null>(extractedData || null);

  // Debug logging for navigation parameters
  console.log('📄 CreateExpenseScreen mounted with params:', {
    hasReceiptImage: !!receiptImage,
    hasExtractedData: !!extractedData,
    receiptImageUri: receiptImage ? receiptImage.substring(0, 50) + '...' : null
  });
  
  const {
    formData,
    isLoading,
    isSubmitting,
    banner,
    updateFormData,
    handleAddLineItem,
    handleEditLineItem,
    handleDeleteLineItem,
    handleSubmit,
  } = useExpenseForm();

  // Handle background extraction when startExtractionInBackground is true
  useEffect(() => {
    const startBackgroundExtraction = async () => {
      if (receiptImage && startExtractionInBackground && !extractionData && !hasAutoFilled) {
        console.log('🔄 Starting background receipt extraction...');
        setIsProcessingReceipt(true);
        
        try {
          const result = await extractReceiptDataSilent(receiptImage);
          
          if (result) {
            console.log('✅ Background extraction successful:', result);
            setExtractionData(result);
          } else {
            console.log('❌ Background extraction failed or returned null');
          }
        } catch (error) {
          console.error('Background extraction error:', error);
        } finally {
          setIsProcessingReceipt(false);
        }
      }
    };

    startBackgroundExtraction();
  }, [receiptImage, startExtractionInBackground, extractionData, hasAutoFilled]);

  // Handle receipt processing state
  useEffect(() => {
    if (receiptImage && !extractionData && !hasAutoFilled && !startExtractionInBackground) {
      // We have an image but no extracted data yet, show processing state
      console.log('🔄 Showing processing state - waiting for extraction');
      setIsProcessingReceipt(true);
    } else {
      // We have extracted data, no receipt image, or already auto-filled
      console.log('✅ Hiding processing state');
      // Don't hide processing if we're doing background extraction
      if (!startExtractionInBackground || extractionData) {
        setIsProcessingReceipt(false);
      }
    }
  }, [receiptImage, extractionData, hasAutoFilled, startExtractionInBackground]);

  // Auto-fill form with extracted receipt data
  useEffect(() => {
    const autoFillFromExtraction = async () => {
      if (extractionData && receiptImage && !hasAutoFilled) {
        try {
          setIsProcessingReceipt(false);
          console.log('Auto-filling form with extracted data:', extractionData);
          setHasAutoFilled(true);
          
          // Get expense type from either field name
          const expenseType = extractionData.Expense_Type || extractionData.expense_type || 'Business Meal';
          
          // Use check_in_date if available, otherwise current date
          const expenseDate = extractionData.check_in_date ? new Date(extractionData.check_in_date) : new Date();
          
          // Calculate total amount and validate
          const calculatedTotal = extractionData.items.reduce((sum, item) => sum + item.price, 0);
          const finalTotal = extractionData.total_amount || calculatedTotal;
          
          // Validate total matches (allow small rounding differences)
          const totalMismatch = Math.abs(finalTotal - calculatedTotal) > 0.01;
          if (totalMismatch && extractionData.total_amount) {
            console.warn(`Total mismatch: extracted=${extractionData.total_amount}, calculated=${calculatedTotal}`);
          }
          
          // Generate a unique ID for the line item
          const lineItemId = `receipt_${Date.now()}`;
          
          // Handle multiple items as itemized entries
          const isItemized = extractionData.items.length > 1;
          
          // Create line item with extracted data
          const lineItemData = {
            id: lineItemId,
            receiptFiles: [{ uri: receiptImage, name: 'receipt.jpg', mimeType: 'image/jpeg' }],
            amount: finalTotal.toString(),
            currency: 'USD',
            expenseType: expenseType,
            date: expenseDate,
            location: extractionData.to_location || '',
            supplier: extractionData.business_name || '',
            comment: isItemized ? 
              `${extractionData.business_name} - ${extractionData.items.length} items` : 
              `${extractionData.business_name}`,
            itemize: isItemized,
          };

          // Prepare itemized entries if multiple items
          const itemizedEntries = isItemized ? extractionData.items.map((item, index) => ({
            id: `item_${Date.now()}_${index}`,
            description: item.description, // description → supplier field mapping
            amount: item.price, // price → amount field mapping
            expenseType: expenseType, // Apply expense type to all itemizations
            supplier: item.description, // Use description as supplier for itemized entries
            merchant: extractionData.business_name, // Set business_name as merchant
            date: expenseDate.toISOString(), // Use check_in_date for itemizations
            editable: true, // Ensure editability
          })) : undefined;

          // Save line item to AsyncStorage
          const asyncStorageLineItem = {
            id: lineItemData.id,
            receipt: lineItemData.receiptFiles[0].uri,
            amount: parseFloat(lineItemData.amount),
            currency: lineItemData.currency,
            expenseType: lineItemData.expenseType,
            date: lineItemData.date.toISOString(),
            location: lineItemData.location,
            supplier: lineItemData.supplier,
            comment: lineItemData.comment,
            itemized: itemizedEntries, // Store itemizations under parent's Itemized array
          };

          await AsyncStorageService.addLineItem(asyncStorageLineItem);
          
          // Update expense title with business name
          if (extractionData.business_name) {
            await updateFormData('title', `${extractionData.business_name} Receipt`);
          }
          
          console.log('Auto-fill completed successfully with itemized entries:', itemizedEntries?.length || 0);
          
        } catch (error) {
          console.error('Error auto-filling form with extracted data:', error);
        }
      }
    };

    if (extractionData && receiptImage && !hasAutoFilled) {
      autoFillFromExtraction();
    }
  }, [extractionData, receiptImage, hasAutoFilled, updateFormData]);



  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Create Expense" showThemeToggle={true} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show processing banner if we're extracting receipt data
  const shouldShowProcessingBanner = isProcessingReceipt && receiptImage && !extractedData;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Create Expense"
        showThemeToggle={true}
      />
      
      {/* Fixed Basic Details Section */}
      <View style={[styles.fixedSection, { backgroundColor: colors.background }]}>
        <BasicDetailsCard
          title={formData.title}
          department={formData.department}
          departments={departments}
          onTitleChange={(title) => updateFormData('title', title)}
          onDepartmentChange={(department) => updateFormData('department', department)}
        />
      </View>

      {/* Scrollable Line Items Section */}
      <KeyboardAvoidingView
        style={styles.scrollableSection}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LineItemsSection
            lineItems={formData.lineItems}
            onEditLineItem={handleEditLineItem}
            onDeleteLineItem={handleDeleteLineItem}
            onAddLineItem={handleAddLineItem}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button */}
      <View style={[styles.submitContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title={isSubmitting ? "Creating..." : "Create Expense"}
          onPress={handleSubmit}
          disabled={isSubmitting || formData.lineItems.length === 0}
          loading={isSubmitting}
          style={styles.submitButton}
        />
      </View>

      {/* Floating Action Button */}
      <CreateExpenseFAB
          onPress={handleAddLineItem}
        visible={formData.lineItems.length > 0}
      />

      {/* Receipt Processing Banner */}
      {shouldShowProcessingBanner && (
        <Banner
          visible={true}
          type="loading"
          title="Extracting Receipt Data"
          message="Please wait while we extract information from your receipt. This may take up to 60 seconds."
        />
      )}

      {/* Status Banner */}
      <Banner
        visible={banner.visible}
        type={banner.type}
        title={banner.title}
        message={banner.message}
        onClose={() => {
          // The banner will be hidden by the onAction callback in the hook
        }}
        onAction={banner.onAction}
        actionText={banner.actionText}
        autoHide={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: SIZES.medium,
    fontWeight: '600',
  },
  fixedSection: {
    padding: 16,
    paddingBottom: 8,
  },
  scrollableSection: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  submitContainer: {
    padding: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
  },
  submitButton: {
    borderRadius: 12,
  },
}); 