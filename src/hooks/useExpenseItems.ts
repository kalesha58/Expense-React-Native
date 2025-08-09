import { useState, useEffect } from 'react';
import { databaseManager } from '../utils/database';
import { logger } from '../utils/logger';

export interface ExpenseItem {
  id: string;
  expenseType: string;
  expenseItem: string;
  expenseReportId?: string;
  flag?: string;
  syncStatus?: string;
}

export interface UseExpenseItemsReturn {
  expenseItems: ExpenseItem[];
  expenseTypes: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useExpenseItems = (): UseExpenseItemsReturn => {
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenseItems();
  }, []);

  const fetchExpenseItems = async () => {
    try {
      setLoading(true);
      console.log('useExpenseItems - Starting to fetch expense items...');
      
      const items = await databaseManager.getExpenseItems();
      
      console.log('useExpenseItems - Raw database items:', { 
        itemsLength: items.length,
        firstItem: items[0],
        allItems: items
      });
      
      logger.info('Raw database items:', { items });
      
      // Transform the data to match our interface
      const transformedItems = items.map(item => {
        const transformed = {
          id: item.id,
          expenseItem: item.ExpenseItem,
          expenseType: item.ExpenseItem,
          amount: parseFloat(item.Amount || '0'),
          currency: item.Currency || 'USD',
          location: item.Location || '',
          supplier: item.Supplier || '',
          comment: item.Comments || '',
          date: new Date(item.TransactionDate || Date.now()),
          syncStatus: item.syncStatus || item.SyncStatus || item.sync_status,
        };
        return transformed;
      });
      
      setExpenseItems(transformedItems);
      
      // Extract unique expense types
      const uniqueTypes = [...new Set(transformedItems.map(item => item.expenseItem))];
      setExpenseTypes(uniqueTypes);
      
      logger.info('Expense items loaded successfully', { 
        count: transformedItems.length, 
        types: uniqueTypes 
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      logger.error('Failed to load expense items', { error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchExpenseItems();
  };

  return {
    expenseItems,
    expenseTypes,
    loading,
    error,
    refetch,
  };
};

export default useExpenseItems; 