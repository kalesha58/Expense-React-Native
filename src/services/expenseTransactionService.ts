import { AsyncStorageService, type LineItem, type ExpenseHeader as AsyncStorageHeader } from './asyncStorage';
import { expenseItemAPI } from '../service/api';

// Expense type reference mapping
export interface ExpenseTypeReference {
  ExpenseItemID: string;
  ExpenseReportID: string;
  ExpenseType: string;
  ExpenseItem: string;
  Flag: string;
  SyncStatus: string;
}

// Expense type mapping based on reference data
export const EXPENSE_TYPE_MAPPING: { [key: string]: string } = {
  'Accommodations': '10629',
  'Hotel': '10629',
  'Airfare': '10629',
  'Car Rental': '10629',
  'Meals': '10629',
  'Meal': '10629',
  'Dinner': '10629',
  'Breakfast': '10629',
  'Miscellaneous': '10629',
  'Telephone': '10629',
  'Entertainment': '10629',
  'Cab': '10629',
  // Add default fallback
  'default': '10629'
};

// Export helper function for external use
export const getExpenseReportIdForType = (expenseType: string): string => {
  return getExpenseReportIdFallback(expenseType);
};

// Export function to clear expense reference cache (useful for testing or data refresh)
export const clearExpenseReferenceCache = (): void => {
  expenseReferenceCache = null;
  console.log('Expense reference cache cleared');
};

// TypeScript interfaces for the API payload
export interface ExpenseItemized {
  ItemDescription: string;
  StartDate: string;
  NumberOfDays: string;
  Justification: string;
  Amount: string;
  Location: string;
  MerchantName: string;
}

export interface ExpenseLineItem {
  LineNum: string; // "1", "2", "3", etc.
  ItemDescription: string;
  StartDate: string;
  NumberOfDays: string;
  Justification: string;
  Amount: string;
  Location: string;
  ToLocation: string;
  MerchantName: string;
  DailyRates: number | null;
  Itemized: ExpenseItemized[];
}

export interface ExpenseHeader {
  MobileTransactionId: string;
  employeeId: string;
  OrgId: number;
  DepartmentCode: string;
  Currency: string;
  ApproverId: string;
  Purpose: string;
  ExpenseReportId: string;
  ReportHeaderID: string;
  UserId: string;
  RespID: string;
  Expenses: ExpenseLineItem[];
}

export interface CreateExpensePayload {
  Input: {
    parts: [
      {
        id: string;
        path: string;
        Operation: string;
        ExpenseHeader: ExpenseHeader[];
      }
    ];
  };
}

// API configuration
const API_BASE_URL = 'https://testnode.propelapps.com/EBS/23B';
const CREATE_EXPENSE_ENDPOINT = `${API_BASE_URL}/createExpenseReport`;

// Headers configuration
const getHeaders = () => ({
  'Accept': 'application/json, text/plain, */*',
  'Referer': '',
  'User-Agent': 'ReactNativeDebugger/0.14.0 Chrome/114.0.5735.199',
  'Content-Type': 'application/json',
});

// Generate MobileTransactionId
const generateMobileTransactionId = (): string => {
  return `${Date.now()}`;
};

// Cache for expense reference data
let expenseReferenceCache: ExpenseTypeReference[] | null = null;

// Fetch expense reference data from API
const fetchExpenseReferenceData = async (): Promise<ExpenseTypeReference[]> => {
  try {
    // Return cached data if available
    if (expenseReferenceCache) {
      return expenseReferenceCache;
    }

    console.log('Fetching expense reference data from API...');
    const response = await expenseItemAPI.getExpenseItem();
    
    if (response && response.data && Array.isArray(response.data)) {
      // Transform API response to our interface
      const referenceData: ExpenseTypeReference[] = response.data.map((item: any) => ({
        ExpenseItemID: item.ExpenseItemID || item.expenseItemId || '',
        ExpenseReportID: item.ExpenseReportID || item.expenseReportId || '',
        ExpenseType: item.ExpenseType || item.expenseType || '',
        ExpenseItem: item.ExpenseItem || item.expenseItem || '',
        Flag: item.Flag || item.flag || '',
        SyncStatus: item.SyncStatus || item.syncStatus || ''
      }));

      // Cache the data
      expenseReferenceCache = referenceData;
      console.log('Expense reference data cached:', referenceData.length, 'items');
      return referenceData;
    }

    console.warn('No expense reference data received from API');
    return [];
  } catch (error) {
    console.error('Error fetching expense reference data:', error);
    return [];
  }
};

// Get both ExpenseReportId and ReportHeaderID based on expense type
const getExpenseReportMapping = async (expenseType: string): Promise<{ expenseReportId: string; reportHeaderID: string }> => {
  try {
    const referenceData = await fetchExpenseReferenceData();
    
    // Find matching expense type in reference data
    const matchingItem = referenceData.find(item => 
      item.ExpenseType === expenseType || 
      item.ExpenseItem === expenseType ||
      item.ExpenseType.toLowerCase() === expenseType.toLowerCase() ||
      item.ExpenseItem.toLowerCase() === expenseType.toLowerCase()
    );

    if (matchingItem) {
      // Use fallback mapping for ExpenseReportId
      const expenseReportId = getExpenseReportIdFallback(expenseType);
      // Use API ExpenseReportID for ReportHeaderID
      const reportHeaderID = matchingItem.ExpenseReportID || expenseReportId;
      
      console.log(`Found mapping for ${expenseType}:`);
      console.log(`- ExpenseReportId will use: ${reportHeaderID} (from API: ${matchingItem.ExpenseReportID})`);
      console.log(`- ReportHeaderID will be: empty`);
      return { expenseReportId, reportHeaderID };
    }

    // Fallback to static mapping if no API data found
    console.warn(`No ExpenseReportID found in API data for expense type: ${expenseType}, using fallback`);
    const fallbackId = getExpenseReportIdFallback(expenseType);
    return { expenseReportId: fallbackId, reportHeaderID: fallbackId };
  } catch (error) {
    console.error('Error getting ExpenseReportID from API:', error);
    const fallbackId = getExpenseReportIdFallback(expenseType);
    return { expenseReportId: fallbackId, reportHeaderID: fallbackId };
  }
};

// Fallback ExpenseReportID mapping (for when API is unavailable)
const getExpenseReportIdFallback = (expenseType: string): string => {
  const expenseTypeMap: { [key: string]: string } = {
    'TRAVEL': '1001',
    'MEALS': '1002',
    'ACCOMMODATION': '1003',
    'TRANSPORTATION': '1004',
    'OFFICE_SUPPLIES': '1005',
    'CLIENT_ENTERTAINMENT': '1006',
    'TRAINING': '1007',
    'MISCELLANEOUS': '1008',
    // Add common expense types
    'Hotel': '1003',
    'Airfare': '1001',
    'Car Rental': '1004',
    'Business Meal': '1002',
    'Breakfast': '1002',
    'Dinner': '1002',
    'Cab': '1004',
    'Taxi': '1004',
  };

  const expenseReportId = expenseTypeMap[expenseType] || expenseTypeMap[expenseType.toUpperCase()];
  return expenseReportId || '1008'; // Default to MISCELLANEOUS
};

// Get the most appropriate ExpenseReportID mapping for multiple line items
const getBestExpenseReportMapping = async (lineItems: LineItem[]): Promise<{ expenseReportId: string; reportHeaderID: string }> => {
  if (!lineItems || lineItems.length === 0) {
    const fallbackId = getExpenseReportIdFallback('MISCELLANEOUS');
    return { expenseReportId: fallbackId, reportHeaderID: fallbackId };
  }

  // If single item, use its expense type
  if (lineItems.length === 1) {
    return await getExpenseReportMapping(lineItems[0].expenseType || 'MISCELLANEOUS');
  }

  // For multiple items, prioritize based on expense type hierarchy
  const priorityOrder = ['Airfare', 'Hotel', 'Car Rental', 'Business Meal', 'Meals', 'MISCELLANEOUS'];
  
  for (const priority of priorityOrder) {
    for (const item of lineItems) {
      if (item.expenseType && (
        item.expenseType === priority || 
        item.expenseType.toLowerCase() === priority.toLowerCase()
      )) {
        return await getExpenseReportMapping(item.expenseType);
      }
    }
  }

  // Fallback to first item's expense type
  return await getExpenseReportMapping(lineItems[0].expenseType || 'MISCELLANEOUS');
};

// Convert AsyncStorage LineItem to API ExpenseLineItem
const convertLineItemToExpenseLineItem = (
  lineItem: LineItem, 
  lineNum: string
): ExpenseLineItem => {
  // Convert itemized entries to the required format
  const itemizedItems = lineItem.itemized ? lineItem.itemized.map(item => ({
    ItemDescription: item.itemDescription || item.description || '',
    StartDate: item.startDate || item.date || lineItem.date,
    NumberOfDays: item.numberOfDays || '1',
    Justification: item.justification || item.comment || '',
    Amount: item.amount.toString(),
    Location: item.location || lineItem.location || '',
    MerchantName: item.merchantName || item.supplier || lineItem.supplier || '',
  })) : [];

  return {
    LineNum: lineNum,
    ItemDescription: lineItem.expenseType || 'Expense Item',
    StartDate: lineItem.startDate || lineItem.date,
    NumberOfDays: lineItem.numberOfDays || '1',
    Justification: lineItem.justification || lineItem.comment || '',
    Amount: lineItem.amount.toString(),
    Location: lineItem.location || '',
    ToLocation: lineItem.toLocation || '',
    MerchantName: lineItem.merchantName || lineItem.supplier || '',
    DailyRates: lineItem.dailyRates || null,
    Itemized: itemizedItems,
  };
};

// Build the complete payload
const buildCreateExpensePayload = async (): Promise<CreateExpensePayload> => {
  try {
    // Get data from AsyncStorage
    const header = await AsyncStorageService.getHeader();
    const lineItems = await AsyncStorageService.getLineItems();

    if (!header || !header.title) {
      throw new Error('Expense title is required');
    }

    if (!lineItems || lineItems.length === 0) {
      throw new Error('At least one line item is required');
    }

    // Load itemized data for each line item
    const lineItemsWithItemized = await Promise.all(lineItems.map(async (lineItem) => {
      // If line item has itemized field but it's empty/undefined, try to load from AsyncStorage
      if (lineItem.itemized === undefined || (Array.isArray(lineItem.itemized) && lineItem.itemized.length === 0)) {
        try {
          const itemizedData = await AsyncStorageService.getItemizedExpenses(lineItem.id);
          return {
            ...lineItem,
            itemized: itemizedData.length > 0 ? itemizedData : undefined
          };
        } catch (error) {
          console.error(`Error loading itemized data for line item ${lineItem.id}:`, error);
          return lineItem;
        }
      }
      
      return lineItem;
    }));

    // Convert line items to API format with sequential line numbers
    const expenses: ExpenseLineItem[] = lineItemsWithItemized.map((lineItem, index) => 
      convertLineItemToExpenseLineItem(lineItem, (index + 1).toString())
    );

    // Get the most appropriate ExpenseReportID mapping based on all line items
    // ExpenseReportId uses API ExpenseReportID, ReportHeaderID will be empty
    const { expenseReportId, reportHeaderID } = await getBestExpenseReportMapping(lineItems);
    
    console.log(`Using ExpenseReportId: ${reportHeaderID} (from API), ReportHeaderID: '' (empty)`);

    // Build the expense header
    const expenseHeader: ExpenseHeader = {
      MobileTransactionId: generateMobileTransactionId(),
      employeeId: "32849", // Hardcoded as per requirements
      OrgId: 7923, // Hardcoded as per requirements
      DepartmentCode: "400", // Hardcoded as per requirements
      Currency: "PRUSD", // Hardcoded as per requirements
      ApproverId: "", // Empty for now
      Purpose: header.title,
        ExpenseReportId: expenseReportId, // Set based on API ExpenseReportID from expense items table
        ReportHeaderID: '', // Empty as per requirement
      UserId: "1014803", // Hardcoded as per requirements
      RespID: "20419", // Hardcoded as per requirements
      Expenses: expenses,
    };

    // Build the complete payload
    const payload: CreateExpensePayload = {
      Input: {
        parts: [
          {
            id: "part1",
            path: "/expense/report",
            Operation: "Save",
            ExpenseHeader: [expenseHeader],
          },
        ],
      },
    };

    console.log('📦 Payload Built:', JSON.stringify(payload, null, 2));
    return payload;
  } catch (error) {
    console.error('❌ Error building payload:', error);
    throw error;
  }
};

// API Response interfaces
export interface CreateExpenseResponse {
  EmployeeID: string;
  InvoiceNumber: string;
  MobileTransactionId: string;
  ReportNumber: string;
  ReturnMessage: string;
  ReturnStatus: 'S' | 'E' | 'D';
}

export interface WrappedApiResponse {
  Response: CreateExpenseResponse[];
  Success: boolean;
}

// Main service function to create expense
export const createExpenseTransaction = async (): Promise<CreateExpenseResponse> => {
  try {
    // Build the payload
    const payload = await buildCreateExpensePayload();

    // Make the API call
    const response = await fetch(CREATE_EXPENSE_ENDPOINT, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData: WrappedApiResponse | CreateExpenseResponse[] | CreateExpenseResponse = await response.json();

    // Handle the wrapped response structure
    let apiResponse: CreateExpenseResponse;
    if ('Response' in responseData && Array.isArray(responseData.Response)) {
      // Response is wrapped in {Response: [...], Success: true}
      apiResponse = responseData.Response[0];
    } else if (Array.isArray(responseData)) {
      // Direct array response
      apiResponse = responseData[0];
    } else {
      // Direct object response
      apiResponse = responseData as CreateExpenseResponse;
    }
    
    console.log('📡 API Response:', apiResponse);

    return apiResponse;
  } catch (error) {
    console.error('❌ Error in createExpenseTransaction:', error);
    throw error;
  }
};

// Helper function to validate data before submission
export const validateExpenseData = async (): Promise<{ isValid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  try {
    const header = await AsyncStorageService.getHeader();
    const lineItems = await AsyncStorageService.getLineItems();

    if (!header) {
      errors.push('Expense header is missing');
    } else {
      if (!header.title || header.title.trim() === '') {
        errors.push('Expense title is required');
      }
      if (!header.department || header.department.trim() === '') {
        errors.push('Department is required');
      }
    }

    if (!lineItems || lineItems.length === 0) {
      errors.push('At least one line item is required');
    } else {
      // Validate each line item
      lineItems.forEach((item, index) => {
        if (!item.amount || item.amount <= 0) {
          errors.push(`Line item ${index + 1}: Amount must be greater than 0`);
        }
        if (!item.expenseType || item.expenseType.trim() === '') {
          errors.push(`Line item ${index + 1}: Expense type is required`);
        }
        if (!item.date) {
          errors.push(`Line item ${index + 1}: Date is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    errors.push('Failed to validate expense data');
    return {
      isValid: false,
      errors,
    };
  }
}; 