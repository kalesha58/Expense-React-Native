import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExpenseHeader {
  title: string;
  department: string;
  // New required fields for payload
  mobileTransactionId?: string;
  employeeId?: string;
  orgId?: number;
  departmentCode?: string;
  currency?: string;
  approverId?: string;
  purpose?: string;
  expenseReportId?: string;
  reportHeaderId?: string;
  userId?: string;
  respId?: string;
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
  // New required fields for payload
  lineNum?: string;
  itemDescription?: string;
  startDate?: string;
  numberOfDays?: string;
  justification?: string;
  toLocation?: string;
  merchantName?: string;
  dailyRates?: number;
}

export interface ItemizedEntry {
  id: string;
  lineItemId: string; // Foreign key to parent line item
  description: string;
  amount: number;
  // New required fields for payload
  currency?: string;
  expenseType?: string;
  date?: string;
  location?: string;
  supplier?: string;
  comment?: string;
  itemDescription?: string;
  startDate?: string;
  numberOfDays?: string;
  justification?: string;
  merchantName?: string;
}

export interface FullExpenseDraft {
  header: ExpenseHeader;
  lineItems: LineItem[];
}

const EXPENSE_DRAFT_KEY = 'expense_draft';

export const AsyncStorageService = {
  async saveExpenseDraft(header: ExpenseHeader, lineItems: LineItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem('expenseHeader', JSON.stringify(header));
      await AsyncStorage.setItem('expenseLineItems', JSON.stringify(lineItems));
      // Expense draft saved successfully
    } catch (error) {
      // Error saving expense draft
      throw error;
    }
  },

  async loadExpenseDraft(): Promise<{ header: ExpenseHeader | null; lineItems: LineItem[] }> {
    try {
      const headerData = await AsyncStorage.getItem('expenseHeader');
      const lineItemsData = await AsyncStorage.getItem('expenseLineItems');
      
      const header = headerData ? JSON.parse(headerData) : null;
      const lineItems = lineItemsData ? JSON.parse(lineItemsData) : [];
      
      // Expense draft loaded successfully
      return { header, lineItems };
    } catch (error) {
      // Error loading expense draft
      throw error;
    }
  },

  async updateHeader(header: ExpenseHeader): Promise<void> {
    try {
      await AsyncStorage.setItem('expenseHeader', JSON.stringify(header));
    } catch (error) {
      // Error updating header
      throw error;
    }
  },

  async addLineItem(lineItem: LineItem): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem('expenseLineItems');
      const lineItems = existingData ? JSON.parse(existingData) : [];
      lineItems.push(lineItem);
      await AsyncStorage.setItem('expenseLineItems', JSON.stringify(lineItems));
    } catch (error) {
      // Error adding line item
      throw error;
    }
  },

  async updateLineItem(updatedLineItem: LineItem): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem('expenseLineItems');
      const lineItems = existingData ? JSON.parse(existingData) : [];
      
      const updatedLineItems = lineItems.map((item: LineItem) =>
        item.id === updatedLineItem.id ? updatedLineItem : item
      );
      
      await AsyncStorage.setItem('expenseLineItems', JSON.stringify(updatedLineItems));
    } catch (error) {
      // Error updating line item
      throw error;
    }
  },

  async deleteLineItem(lineItemId: string): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem('expenseLineItems');
      const lineItems = existingData ? JSON.parse(existingData) : [];
      
      const updatedLineItems = lineItems.filter((item: LineItem) => item.id !== lineItemId);
      
      await AsyncStorage.setItem('expenseLineItems', JSON.stringify(updatedLineItems));
    } catch (error) {
      // Error deleting line item
      throw error;
    }
  },

  async clearExpenseDraft(): Promise<void> {
    try {
      await AsyncStorage.removeItem('expenseHeader');
      await AsyncStorage.removeItem('expenseLineItems');
      // Expense draft cleared successfully
    } catch (error) {
      // Error clearing expense draft
      throw error;
    }
  },

  async getLineItems(): Promise<LineItem[]> {
    try {
      const data = await AsyncStorage.getItem('expenseLineItems');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      // Error getting line items
      return [];
    }
  },

  async getHeader(): Promise<ExpenseHeader | null> {
    try {
      const data = await AsyncStorage.getItem('expenseHeader');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      // Error getting header
      return null;
    }
  },

  /**
   * Store itemized expenses for a specific line item
   */
  async setItemizedExpenses(lineItemId: string, itemizedExpenses: ItemizedEntry[]): Promise<void> {
    try {
      const key = `itemizedExpenses_${lineItemId}`;
      await AsyncStorage.setItem(key, JSON.stringify(itemizedExpenses));
    } catch (error) {
      console.error('Error storing itemized expenses:', error);
      throw error;
    }
  },

  /**
   * Get itemized expenses for a specific line item
   */
  async getItemizedExpenses(lineItemId: string): Promise<ItemizedEntry[]> {
    try {
      const key = `itemizedExpenses_${lineItemId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error retrieving itemized expenses:', error);
      return [];
    }
  },

  /**
   * Get itemized count for a specific line item
   */
  async getItemizedCount(lineItemId: string): Promise<number> {
    try {
      const itemizedExpenses = await this.getItemizedExpenses(lineItemId);
      return itemizedExpenses.length;
    } catch (error) {
      console.error('Error getting itemized count:', error);
      return 0;
    }
  },

  /**
   * Delete itemized expenses for a specific line item
   */
  async deleteItemizedExpenses(lineItemId: string): Promise<void> {
    try {
      const key = `itemizedExpenses_${lineItemId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error deleting itemized expenses:', error);
      throw error;
    }
  }
}; 