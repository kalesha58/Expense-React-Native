import { useState, useCallback } from 'react';

export interface LineItem {
  id: string;
  date: Date;
  expenseType: string;
  supplier: string;
  amount: number;
  currency: string;
  location: string;
  comments?: string;
  itemize?: boolean;
  receipts?: Array<{ uri: string; name?: string; mimeType?: string }>;
}

export interface ExpenseHeader {
  title: string;
  purpose: string;
  expenseType: string;
  businessUnit: string;
  date?: Date;
}

export interface UseExpenseReturn {
  header: ExpenseHeader;
  lineItems: LineItem[];
  isLoading: boolean;
  addLineItem: (lineItem: Omit<LineItem, 'id'>) => void;
  updateHeader: (header: Partial<ExpenseHeader>) => void;
  submitReport: () => Promise<void>;
}

export const useExpense = (): UseExpenseReturn => {
  const [header, setHeader] = useState<ExpenseHeader>({
    title: '',
    purpose: '',
    expenseType: '',
    businessUnit: '',
    date: new Date(),
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLineItem = useCallback((lineItem: Omit<LineItem, 'id'>) => {
    const newLineItem: LineItem = {
      ...lineItem,
      id: Date.now().toString(),
    };
    setLineItems(prev => [...prev, newLineItem]);
  }, []);

  const updateHeader = useCallback((newHeader: Partial<ExpenseHeader>) => {
    setHeader(prev => ({ ...prev, ...newHeader }));
  }, []);

  const submitReport = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to submit expense report
      console.log('Submitting expense report:', { header, lineItems });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    } catch (error) {
      console.error('Failed to submit expense report:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [header, lineItems]);

  return {
    header,
    lineItems,
    isLoading,
    addLineItem,
    updateHeader,
    submitReport,
  };
}; 