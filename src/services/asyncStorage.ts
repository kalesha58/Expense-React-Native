import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExpenseHeader {
  title: string;
  department: string;
}

export interface LineItem {
  id: string;
  receipt?: string;
  amount: number;
  currency: string;
  expenseType: string;
  date: string;
  location?: string;
  supplier?: string;
  comment?: string;
  itemized?: ItemizedEntry[];
}

export interface ItemizedEntry {
  id: string;
  description: string;
  amount: number;
}

export interface FullExpenseDraft {
  header: ExpenseHeader;
  lineItems: LineItem[];
}

const EXPENSE_DRAFT_KEY = 'expense_draft';

export const AsyncStorageService = {
  // Save the entire expense draft
  saveExpenseDraft: async (draft: FullExpenseDraft): Promise<void> => {
    try {
      await AsyncStorage.setItem(EXPENSE_DRAFT_KEY, JSON.stringify(draft));
      console.log('Expense draft saved successfully');
    } catch (error) {
      console.error('Error saving expense draft:', error);
      throw error;
    }
  },

  // Load the expense draft
  loadExpenseDraft: async (): Promise<FullExpenseDraft | null> => {
    try {
      const data = await AsyncStorage.getItem(EXPENSE_DRAFT_KEY);
      if (data) {
        const draft = JSON.parse(data) as FullExpenseDraft;
        console.log('Expense draft loaded successfully');
        return draft;
      }
      return null;
    } catch (error) {
      console.error('Error loading expense draft:', error);
      return null;
    }
  },

  // Update header only
  updateHeader: async (header: ExpenseHeader): Promise<void> => {
    try {
      const existingDraft = await AsyncStorageService.loadExpenseDraft();
      const updatedDraft: FullExpenseDraft = {
        header,
        lineItems: existingDraft?.lineItems || [],
      };
      await AsyncStorageService.saveExpenseDraft(updatedDraft);
    } catch (error) {
      console.error('Error updating header:', error);
      throw error;
    }
  },

  // Add a new line item
  addLineItem: async (lineItem: LineItem): Promise<void> => {
    try {
      const existingDraft = await AsyncStorageService.loadExpenseDraft();
      const updatedDraft: FullExpenseDraft = {
        header: existingDraft?.header || { title: '', department: '' },
        lineItems: [...(existingDraft?.lineItems || []), lineItem],
      };
      await AsyncStorageService.saveExpenseDraft(updatedDraft);
    } catch (error) {
      console.error('Error adding line item:', error);
      throw error;
    }
  },

  // Update an existing line item
  updateLineItem: async (updatedLineItem: LineItem): Promise<void> => {
    try {
      const existingDraft = await AsyncStorageService.loadExpenseDraft();
      if (!existingDraft) return;

      const updatedLineItems = existingDraft.lineItems.map(item =>
        item.id === updatedLineItem.id ? updatedLineItem : item
      );

      const updatedDraft: FullExpenseDraft = {
        ...existingDraft,
        lineItems: updatedLineItems,
      };
      await AsyncStorageService.saveExpenseDraft(updatedDraft);
    } catch (error) {
      console.error('Error updating line item:', error);
      throw error;
    }
  },

  // Delete a line item
  deleteLineItem: async (lineItemId: string): Promise<void> => {
    try {
      const existingDraft = await AsyncStorageService.loadExpenseDraft();
      if (!existingDraft) return;

      const updatedLineItems = existingDraft.lineItems.filter(
        item => item.id !== lineItemId
      );

      const updatedDraft: FullExpenseDraft = {
        ...existingDraft,
        lineItems: updatedLineItems,
      };
      await AsyncStorageService.saveExpenseDraft(updatedDraft);
    } catch (error) {
      console.error('Error deleting line item:', error);
      throw error;
    }
  },

  // Clear the entire draft
  clearExpenseDraft: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(EXPENSE_DRAFT_KEY);
      console.log('Expense draft cleared successfully');
    } catch (error) {
      console.error('Error clearing expense draft:', error);
      throw error;
    }
  },

  // Get all line items
  getLineItems: async (): Promise<LineItem[]> => {
    try {
      const draft = await AsyncStorageService.loadExpenseDraft();
      return draft?.lineItems || [];
    } catch (error) {
      console.error('Error getting line items:', error);
      return [];
    }
  },

  // Get header only
  getHeader: async (): Promise<ExpenseHeader | null> => {
    try {
      const draft = await AsyncStorageService.loadExpenseDraft();
      return draft?.header || null;
    } catch (error) {
      console.error('Error getting header:', error);
      return null;
    }
  },
}; 