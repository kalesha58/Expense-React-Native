import { AsyncStorageService, type LineItem, type ExpenseHeader as AsyncStorageHeader } from './asyncStorage';

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
  return getExpenseReportId(expenseType);
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
  DailyRates: null;
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

// Get ExpenseReportID based on expense type
const getExpenseReportId = (expenseType: string): string => {
  const expenseTypeMap: { [key: string]: string } = {
    'TRAVEL': '1001',
    'MEALS': '1002',
    'ACCOMMODATION': '1003',
    'TRANSPORTATION': '1004',
    'OFFICE_SUPPLIES': '1005',
    'CLIENT_ENTERTAINMENT': '1006',
    'TRAINING': '1007',
    'MISCELLANEOUS': '1008',
  };

  const expenseReportId = expenseTypeMap[expenseType];
  if (!expenseReportId) {
    // No ExpenseReportID found for expense type, using default
  }
  return expenseReportId || '1008'; // Default to MISCELLANEOUS
};

// Get the most appropriate ExpenseReportID for multiple line items
const getBestExpenseReportId = (lineItems: LineItem[]): string => {
  if (!lineItems || lineItems.length === 0) {
    return EXPENSE_TYPE_MAPPING['default'];
  }

  // If single item, use its expense type
  if (lineItems.length === 1) {
    return getExpenseReportId(lineItems[0].expenseType || 'default');
  }

  // For multiple items, prioritize based on expense type hierarchy
  const priorityOrder = ['Accommodations', 'Airfare', 'Car Rental', 'Meals', 'Miscellaneous'];
  
  for (const priority of priorityOrder) {
    for (const item of lineItems) {
      if (item.expenseType && getExpenseReportId(item.expenseType) === EXPENSE_TYPE_MAPPING[priority]) {
        return EXPENSE_TYPE_MAPPING[priority];
      }
    }
  }

  // Fallback to first item's expense type
  return getExpenseReportId(lineItems[0].expenseType || 'default');
};

// Convert AsyncStorage LineItem to API ExpenseLineItem
const convertLineItemToExpenseLineItem = (
  lineItem: LineItem, 
  lineNum: string
): ExpenseLineItem => {
  return {
    LineNum: lineNum,
    ItemDescription: lineItem.expenseType || 'Expense Item',
    StartDate: lineItem.date,
    NumberOfDays: '1', // Default to 1 day
    Justification: lineItem.comment || '',
    Amount: lineItem.amount.toString(),
    Location: lineItem.location || '',
    ToLocation: lineItem.location || '', // Same as location for now
    MerchantName: lineItem.supplier || '',
    DailyRates: null,
    Itemized: [], // Empty array for now, can be extended later
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

    // Convert line items to API format with sequential line numbers
    const expenses: ExpenseLineItem[] = lineItems.map((lineItem, index) => 
      convertLineItemToExpenseLineItem(lineItem, (index + 1).toString())
    );

    // Get the most appropriate ExpenseReportID based on all line items
    // All line items in a single expense report should use the same ExpenseReportID
    const expenseReportId = getBestExpenseReportId(lineItems);

    // Build the expense header
    const expenseHeader: ExpenseHeader = {
      MobileTransactionId: generateMobileTransactionId(),
      employeeId: "32849", // Hardcoded as per requirements
      OrgId: 7923, // Hardcoded as per requirements
      DepartmentCode: "400", // Hardcoded as per requirements
      Currency: "PRUSD", // Hardcoded as per requirements
      ApproverId: "", // Empty for now
      Purpose: header.title,
      ExpenseReportId: expenseReportId, // Set based on expense type
      ReportHeaderID: expenseReportId, // Set to same value as ExpenseReportId
      UserId: "1014803", // Hardcoded as per requirements
      RespID: "20419", // Hardcoded as per requirements
      Expenses: expenses,
    };

    // Build the complete payload
    const payload: CreateExpensePayload = {
      Input: {
        parts: [
          {
            id: "expense_report",
            path: "/expense/report",
            Operation: "Save",
            ExpenseHeader: [expenseHeader],
          },
        ],
      },
    };

    return payload;
  } catch (error) {
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
    
  

         // Note: AsyncStorage clearing is now handled in the hooks after banner display

    return apiResponse;
  } catch (error) {
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