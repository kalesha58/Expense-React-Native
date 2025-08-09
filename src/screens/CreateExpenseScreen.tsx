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

type CreateExpenseScreenRouteProp = RouteProp<RootStackParamList, 'CreateExpense'>;

export const CreateExpenseScreen: React.FC = () => {
  const { colors } = useTheme();
  const { departments } = useDepartments();
  const route = useRoute<CreateExpenseScreenRouteProp>();
  
  // Get parameters passed from camera/navigation
  const { receiptImage, extractedData } = route.params || {};
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);

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

  // Handle receipt processing state
  useEffect(() => {
    if (receiptImage && !extractedData && !hasAutoFilled) {
      // We have an image but no extracted data yet, show processing state
      console.log('🔄 Showing processing state - waiting for extraction');
      setIsProcessingReceipt(true);
    } else {
      // We have extracted data, no receipt image, or already auto-filled
      console.log('✅ Hiding processing state');
      setIsProcessingReceipt(false);
    }
  }, [receiptImage, extractedData, hasAutoFilled]);

  // Auto-fill form with extracted receipt data
  useEffect(() => {
    const autoFillFromExtraction = async () => {
      if (extractedData && receiptImage && !hasAutoFilled) {
        try {
          setIsProcessingReceipt(false);
          console.log('Auto-filling form with extracted data:', extractedData);
          setHasAutoFilled(true);
          
          // Generate a unique ID for the line item
          const lineItemId = `receipt_${Date.now()}`;
          
          // Calculate total amount
          const totalAmount = extractedData.total_amount || 
                            extractedData.items.reduce((sum, item) => sum + item.price, 0);
          
          // Create line item with extracted data
          const lineItemData = {
            id: lineItemId,
            receiptFiles: [{ uri: receiptImage, name: 'receipt.jpg', mimeType: 'image/jpeg' }],
            amount: totalAmount.toString(),
            currency: 'USD',
            expenseType: extractedData.expense_type || 'Business Meal',
            date: new Date(),
            location: '',
            supplier: extractedData.business_name || '',
            comment: `Extracted: ${extractedData.items.length} items`,
            itemize: extractedData.items.length > 1,
          };

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
            itemized: lineItemData.itemize ? extractedData.items.map((item, index) => ({
              id: `item_${Date.now()}_${index}`,
              description: item.description,
              amount: item.price,
            })) : undefined,
          };

          await AsyncStorageService.addLineItem(asyncStorageLineItem);
          
          // Update expense title with business name
          if (extractedData.business_name) {
            await updateFormData('title', `${extractedData.business_name} Receipt`);
          }
          
          console.log('Auto-fill completed successfully');
          
        } catch (error) {
          console.error('Error auto-filling form with extracted data:', error);
        }
      }
    };

    if (extractedData && receiptImage && !hasAutoFilled) {
      autoFillFromExtraction();
    }
  }, [extractedData, receiptImage, hasAutoFilled, updateFormData]);



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