import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AsyncStorageService, type LineItem, type ExpenseHeader } from '../services/asyncStorage';
import { push, navigate } from '../utils/NavigationUtils';
import { createExpenseTransaction, validateExpenseData, type CreateExpenseResponse } from '../services/expenseTransactionService';

// Banner state interface
interface BannerState {
  visible: boolean;
  type: 'success' | 'error' | 'info' | 'loading';
  title: string;
  message?: string;
  onAction?: () => void;
  actionText?: string;
}

interface LineItemData {
  id: string;
  receiptFiles: Array<{ uri: string; name?: string; mimeType?: string }>;
  amount: string;
  currency: string;
  expenseType: string;
  date: Date;
  location: string;
  supplier: string;
  comment: string;
  itemize?: boolean;
}

interface ExpenseFormData {
  title: string;
  department: string;
  lineItems: LineItemData[];
}

export const useExpenseForm = () => {
  const navigation = useNavigation();
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    title: '',
    department: '',
    lineItems: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [banner, setBanner] = useState<BannerState>({
    visible: false,
    type: 'info',
    title: '',
  });

  // Load existing data from AsyncStorage on mount
  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      setIsLoading(true);
      const savedHeader = await AsyncStorageService.getHeader();
      const savedLineItems = await AsyncStorageService.getLineItems();
      
      if (savedHeader) {
        setFormData(prev => ({
          ...prev,
          title: savedHeader.title,
          department: savedHeader.department,
        }));
      }
      
      // Convert LineItem to LineItemData format for display
      const convertedLineItems: LineItemData[] = savedLineItems.map(item => ({
        id: item.id,
        receiptFiles: item.receipt ? [{ uri: item.receipt, name: 'receipt.jpg', mimeType: 'image/jpeg' }] : [],
        amount: item.amount.toString(),
        currency: item.currency,
        expenseType: item.expenseType,
        date: new Date(item.date),
        location: item.location || '',
        supplier: item.supplier || '',
        comment: item.comment || '',
        itemize: item.itemized ? item.itemized.length > 0 : false,
      }));
      
      setFormData(prev => ({
        ...prev,
        lineItems: convertedLineItems,
      }));
    } catch (error) {
      console.error('Error loading existing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a focus listener to reload data when returning from LineItemEntryScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadExistingData();
    });

    return unsubscribe;
  }, [navigation]);

  // Handle screen leave with draft data
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Only show alert if there's draft data
      const hasDraftData = formData.title || formData.department || formData.lineItems.length > 0;
      
      if (hasDraftData) {
        // Prevent default navigation
        e.preventDefault();
        
        Alert.alert(
          'Unsaved Changes',
          'You have unsaved expense data. What would you like to do?',
          [
                         {
               text: 'Clear Data',
               style: 'destructive',
               onPress: async () => {
                 try {
                   await AsyncStorageService.clearExpenseDraft();
                   // Navigate to dashboard after clearing data
                   navigate('Dashboard');
                 } catch (error) {
                   console.error('Error clearing draft:', error);
                   // Still navigate to dashboard even if clearing fails
                   navigate('Dashboard');
                 }
               },
             },
            {
              text: 'Create Expense',
              onPress: async () => {
                if (validateForm()) {
                  await handleSubmit();
                } else {
                  Alert.alert('Validation Error', 'Please fill in all required fields before submitting.');
                }
              },
            },
            {
              text: 'Stay Here',
              style: 'cancel',
            },
          ]
        );
      }
    });

    return unsubscribe;
  }, [navigation, formData]);

  const updateFormData = useCallback(async (field: keyof ExpenseFormData, value: any) => {
    const updatedData = {
      ...formData,
      [field]: value,
    };
    setFormData(updatedData);
    
    // Save header changes to AsyncStorage
    if (field === 'title' || field === 'department') {
      try {
        await AsyncStorageService.updateHeader({
          title: field === 'title' ? value : formData.title,
          department: field === 'department' ? value : formData.department,
        });
      } catch (error) {
        console.error('Error saving header:', error);
      }
    }
  }, [formData]);

  const handleAddLineItem = useCallback(() => {
    push('LineItemEntry', {
      onSave: async (lineItem: LineItemData) => {
        // Convert LineItemData to LineItem format for AsyncStorage
        const asyncStorageLineItem: LineItem = {
          id: lineItem.id,
          receipt: lineItem.receiptFiles.length > 0 ? lineItem.receiptFiles[0].uri : undefined,
          amount: parseFloat(lineItem.amount),
          currency: lineItem.currency,
          expenseType: lineItem.expenseType,
          date: lineItem.date.toISOString(),
          location: lineItem.location,
          supplier: lineItem.supplier,
          comment: lineItem.comment,
          itemized: lineItem.itemize ? [] : undefined,
        };
        
        try {
          await AsyncStorageService.addLineItem(asyncStorageLineItem);
          // Reload data to show the new line item
          await loadExistingData();
        } catch (error) {
          console.error('Error saving line item:', error);
          Alert.alert('Error', 'Failed to save line item');
        }
      },
    });
  }, []);

  const handleEditLineItem = useCallback((lineItem: LineItemData) => {
    push('LineItemEntry', {
      onSave: async (updatedLineItem: LineItemData) => {
        // Convert LineItemData to LineItem format for AsyncStorage
        const asyncStorageLineItem: LineItem = {
          id: updatedLineItem.id,
          receipt: updatedLineItem.receiptFiles.length > 0 ? updatedLineItem.receiptFiles[0].uri : undefined,
          amount: parseFloat(updatedLineItem.amount),
          currency: updatedLineItem.currency,
          expenseType: updatedLineItem.expenseType,
          date: updatedLineItem.date.toISOString(),
          location: updatedLineItem.location,
          supplier: updatedLineItem.supplier,
          comment: updatedLineItem.comment,
          itemized: updatedLineItem.itemize ? [] : undefined,
        };
        
        try {
          await AsyncStorageService.updateLineItem(asyncStorageLineItem);
          // Reload data to show the updated line item
          await loadExistingData();
        } catch (error) {
          console.error('Error updating line item:', error);
          Alert.alert('Error', 'Failed to update line item');
        }
      },
      editMode: true,
      lineItem: lineItem,
    });
  }, []);

  const handleDeleteLineItem = useCallback(async (lineItemId: string) => {
    console.log('Attempting to delete line item:', lineItemId);
    
    try {
      // Delete the line item from AsyncStorage
      await AsyncStorageService.deleteLineItem(lineItemId);
      console.log('Successfully deleted line item from AsyncStorage');
      
      // Reload data to reflect the deletion
      await loadExistingData();
      console.log('Successfully reloaded data after deletion');
    } catch (error) {
      console.error('Error deleting line item:', error);
      Alert.alert('Error', 'Failed to delete line item. Please try again.');
    }
  }, [loadExistingData]);

  const validateForm = useCallback((): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter an expense title');
      return false;
    }
    
    if (!formData.department) {
      Alert.alert('Error', 'Please select a department');
      return false;
    }
    
    if (formData.lineItems.length === 0) {
      Alert.alert('Error', 'Please add at least one line item');
      return false;
    }
    
    return true;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    // Show loading banner
    setBanner({
      visible: true,
      type: 'loading',
      title: 'Creating Expense',
      message: 'Please wait while we submit your expense...',
    });
    
    try {
      // Validate data before submission
      const validation = await validateExpenseData();
      
      if (!validation.isValid) {
        setBanner({
          visible: true,
          type: 'error',
          title: 'Validation Error',
          message: `Please fix the following issues:\n\n${validation.errors.join('\n')}`,
          // No action buttons - auto navigate after 3 seconds
        });
        
               // Clear AsyncStorage and navigate to dashboard after 3 seconds
       setTimeout(async () => {
         try {
           await AsyncStorageService.clearExpenseDraft();
         } catch (error) {
           console.error('Error clearing expense draft:', error);
         }
         setBanner({ visible: false, type: 'info', title: '' });
         navigate('Dashboard');
       }, 3000);
       
       return;
      }

      // Call the API to create expense
      const response: CreateExpenseResponse = await createExpenseTransaction();
      
      console.log('API Response:', response);
      
      // Show banner with API response for 3 seconds
      const bannerMessage = response.ReturnStatus === 'S' 
        ? (response.ReportNumber 
            ? `Expense created successfully!\nReport Number: ${response.ReportNumber}`
            : 'Expense created successfully!')
        : response.ReturnMessage || 'API response received';
      
             setBanner({
         visible: true,
         type: response.ReturnStatus === 'S' ? 'success' : 'error',
         title: response.ReturnStatus === 'S' ? 'Success!' : 'API Response',
         message: bannerMessage,
         // No action buttons - auto navigate after 3 seconds
       });
       
       // Clear AsyncStorage and navigate to dashboard after 3 seconds
       setTimeout(async () => {
         try {
           await AsyncStorageService.clearExpenseDraft();
         } catch (error) {
           console.error('Error clearing expense draft:', error);
         }
         setBanner({ visible: false, type: 'info', title: '' });
         navigate('Dashboard');
       }, 3000);
    } catch (error) {
      console.error('Failed to create expense:', error);
      
      // Handle different types of errors
      let errorMessage = 'Failed to create expense. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('API request failed')) {
          errorMessage = 'Server error. Please check your connection and try again.';
        } else if (error.message.includes('required')) {
          errorMessage = error.message;
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }

             setBanner({
         visible: true,
         type: 'error',
         title: 'Error',
         message: errorMessage,
         // No action buttons - auto navigate after 3 seconds
       });
       
       // Clear AsyncStorage and navigate to dashboard after 3 seconds
       setTimeout(async () => {
         try {
           await AsyncStorageService.clearExpenseDraft();
         } catch (error) {
           console.error('Error clearing expense draft:', error);
         }
         setBanner({ visible: false, type: 'info', title: '' });
         navigate('Dashboard');
       }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm]);

  return {
    formData,
    isLoading,
    isSubmitting,
    banner,
    updateFormData,
    handleAddLineItem,
    handleEditLineItem,
    handleDeleteLineItem,
    handleSubmit,
    validateForm,
  };
}; 