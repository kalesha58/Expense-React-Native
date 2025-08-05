import { TableSchema } from '../utils/database';

export interface ApiConfig {
  name: string;
  displayName: string;
  metadataEndpoint: string;
  dataEndpoint: string;
  tableName: string;
  description?: string;
  isRequired?: boolean;
  syncInterval?: number;
  maxRetries?: number;
  timeout?: number;
}

export interface SyncStatus {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  lastSync?: Date;
  error?: string;
  retryCount?: number;
  dataCount?: number;
}

export const API_SETTINGS: ApiConfig[] = [
  {
    name: 'departments',
    displayName: 'Departments',
    metadataEndpoint: '/23B/getAllDepartments/metadata',
    dataEndpoint: '/23B/getAllDepartments/%22%22',
    tableName: 'departments',
    description: 'Department information for expense categorization',
    isRequired: true,
    syncInterval: 60, // 1 hour
    maxRetries: 3,
    timeout: 30,
  },
  {
    name: 'currencies',
    displayName: 'Currencies',
    metadataEndpoint: '/23B/getCurrencies/metadata',
    dataEndpoint: '/23B/getCurrencies/%22%22',
    tableName: 'currencies',
    description: 'Available currencies for expense reporting',
    isRequired: true,
    syncInterval: 1440, // 24 hours
    maxRetries: 2,
    timeout: 20,
  },
  {
    name: 'expense_notifications',
    displayName: 'Expense Notifications',
    metadataEndpoint: '/23B/getExpenseNotificationDetails/metadata',
    dataEndpoint: '/23B/getExpenseNotificationDetails/1015084/%22%22',
    tableName: 'expense_notifications',
    description: 'Expense notification details',
    isRequired: false,
    syncInterval: 30, // 30 minutes
    maxRetries: 3,
    timeout: 25,
  },
  {
    name: 'expense_items',
    displayName: 'Expense Items',
    metadataEndpoint: '/23B/getExpenseItem/7923/metadata',
    dataEndpoint: '/23B/getExpenseItem/7923/%22%22',
    tableName: 'expense_items',
    description: 'Individual expense item details',
    isRequired: false,
    syncInterval: 60, // 1 hour
    maxRetries: 3,
    timeout: 30,
  },
  {
    name: 'expense_details',
    displayName: 'Expense Details',
    metadataEndpoint: '/23B/getExpenseDetails/metadata',
    dataEndpoint: '/23B/getExpenseDetails/32849/7923/%22%22',
    tableName: 'expense_details',
    description: 'Detailed expense information with line items',
    isRequired: false,
    syncInterval: 60, // 1 hour
    maxRetries: 3,
    timeout: 30,
  },
];

// Sync configuration
export const SYNC_CONFIG = {
  maxConcurrentSyncs: 3,
  defaultTimeout: 30, // seconds
  defaultRetries: 3,
  retryDelay: 5000, // milliseconds
  batchSize: 100, // records per batch
  enableBackgroundSync: true,
  enableDeltaSync: false, // for future implementation
  enableChunkedSync: true,
};

// Network configuration
export const NETWORK_CONFIG = {
  baseUrl: 'https://testnode.propelapps.com/EBS',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 2000, // 2 seconds
  enableOfflineMode: true,
  cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

 