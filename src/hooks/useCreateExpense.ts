import { useState, useCallback } from 'react';
import { createExpenseTransaction, validateExpenseData, type CreateExpenseResponse } from '../services/expenseTransactionService';
import { AsyncStorageService } from '../services/asyncStorage';
import { navigate } from '../utils/NavigationUtils';

// Banner state interface
interface BannerState {
  visible: boolean;
  type: 'success' | 'error' | 'info' | 'loading';
  title: string;
  message?: string;
  onAction?: () => void;
  actionText?: string;
}

interface UseCreateExpenseReturn {
  isCreating: boolean;
  banner: BannerState;
  createExpense: () => Promise<void>;
  resetState: () => void;
}

export const useCreateExpense = (): UseCreateExpenseReturn => {
  const [isCreating, setIsCreating] = useState(false);
  const [banner, setBanner] = useState<BannerState>({
    visible: false,
    type: 'info',
    title: '',
  });

  const resetState = useCallback(() => {
    setIsCreating(false);
    setBanner({ visible: false, type: 'info', title: '' });
  }, []);

  const createExpense = useCallback(async () => {
    try {
      setIsCreating(true);

      // Show loading banner
      setBanner({
        visible: true,
        type: 'loading',
        title: 'Creating Expense',
        message: 'Please wait while we submit your expense...',
      });

      // First validate the data
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
            // Error clearing expense draft
          }
          setBanner({ visible: false, type: 'info', title: '' });
          navigate('Dashboard');
        }, 3000);

        return;
      }

      // Call the API
      const response: CreateExpenseResponse = await createExpenseTransaction();
      
      // API Response
      
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
          // Error clearing expense draft
        }
        setBanner({ visible: false, type: 'info', title: '' });
        navigate('Dashboard');
      }, 1000);

    } catch (error) {
      // Error creating expense
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
          // Error clearing expense draft
        }
        setBanner({ visible: false, type: 'info', title: '' });
        navigate('Dashboard');
      }, 3000);
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    isCreating,
    banner,
    createExpense,
    resetState,
  };
}; 