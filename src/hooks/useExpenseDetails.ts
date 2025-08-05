import { useState, useEffect } from 'react';
import { expenseDetailsAPI } from '../service/api';
import { logger } from '../utils/logger';

export interface ExpenseDetail {
  LineId: string;
  ReportHeaderId: string;
  ReportName: string;
  ExpenseReportId: string;
  BusinessPurpose: string;
  DepartmentCode: string;
  AmountDueEmployee: string;
  TotalPaidByCompany: string;
  ReportDate: string;
  ExpenseItem: string;
  Amount: string;
  Currency: string;
  NumberOfDays: string;
  Location: string;
  Supplier: string;
  Comments: string;
  ExpenseStatus: string;
  Approver: string;
  TransactionDate: string;
  SyncStatus: string;
  ItemizationParentId: string;
  ToLocation: string;
  ItemizationFlag: string;
}

export interface UseExpenseDetailsReturn {
  expenseDetails: ExpenseDetail[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useExpenseDetails = (): UseExpenseDetailsReturn => {
  const [expenseDetails, setExpenseDetails] = useState<ExpenseDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      logger.info('Fetching expense details...');
      const response = await expenseDetailsAPI.getExpenseDetails();
      
      logger.info('Expense details API response', { response });
      
      // Handle the actual API response structure
      if (response && response.Response && Array.isArray(response.Response)) {
        setExpenseDetails(response.Response as ExpenseDetail[]);
        logger.info('Expense details fetched successfully', { count: response.Response.length });
      } else if (response && response.data && Array.isArray(response.data)) {
        setExpenseDetails(response.data as ExpenseDetail[]);
        logger.info('Expense details fetched successfully', { count: response.data.length });
      } else if (response && Array.isArray(response)) {
        // Handle direct array response
        setExpenseDetails(response as ExpenseDetail[]);
        logger.info('Expense details fetched successfully', { count: response.length });
      } else {
        logger.warn('No expense details data found', { response });
        setExpenseDetails([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      logger.error('Failed to fetch expense details', { error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchExpenseDetails();
  };

  useEffect(() => {
    fetchExpenseDetails();
  }, []);

  return {
    expenseDetails,
    loading,
    error,
    refetch,
  };
};

export default useExpenseDetails; 