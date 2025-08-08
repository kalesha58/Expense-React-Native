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

  const fetchExpenseItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      logger.info('Fetching expense items from database...');
      
      // Check if database is initialized
      try {
        await databaseManager.getDatabase();
      } catch (dbError) {
        logger.error('Database not initialized, trying to initialize...', { dbError });
        await databaseManager.initialize();
      }
      
      // Query expense_items table
      const items = await databaseManager.queryData('expense_items');
      
      logger.info('Raw database items:', { items });
      console.log('Raw expense_items from database:', items);
      
      // Transform the data to match our interface
      const transformedItems: ExpenseItem[] = items.map((item: any) => {
        const transformed = {
          id: item.id || item.ExpenseItemID || item.expense_item_id,
          expenseType: item.expenseType || item.ExpenseType || item.expense_type,
          expenseItem: item.expenseItem || item.ExpenseItem || item.expense_item,
          expenseReportId: item.expenseReportId || item.ExpenseReportID || item.expense_report_id,
          flag: item.flag || item.Flag,
          syncStatus: item.syncStatus || item.SyncStatus || item.sync_status,
        };
        console.log('Transforming item:', item, 'to:', transformed);
        return transformed;
      });
      
      // Extract unique expense types
      const uniqueTypes = [...new Set(transformedItems.map(item => item.expenseType))].filter(Boolean);
      
      setExpenseItems(transformedItems);
      setExpenseTypes(uniqueTypes);
      logger.info('Expense items fetched successfully', { 
        count: transformedItems.length,
        types: uniqueTypes 
      });
      console.log('Transformed expense items:', transformedItems);
      console.log('Available expense types:', uniqueTypes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      logger.error('Failed to fetch expense items', { error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchExpenseItems();
  };

  useEffect(() => {
    fetchExpenseItems();
  }, []);

  return {
    expenseItems,
    expenseTypes,
    loading,
    error,
    refetch,
  };
};

export default useExpenseItems; 