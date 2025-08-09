import { ExpenseHeader, LineItem, ItemizedEntry } from './asyncStorage';

export interface PayloadExpenseItemized {
  ItemDescription: string;
  StartDate: string;
  NumberOfDays: string;
  Justification: string;
  Amount: string;
  Location: string;
  MerchantName: string;
}

export interface PayloadExpenseLineItem {
  LineNum: string;
  ItemDescription: string;
  StartDate: string;
  NumberOfDays: string;
  Justification: string;
  Amount: string;
  Location: string;
  ToLocation: string;
  MerchantName: string;
  DailyRates: number | null;
  Itemized: PayloadExpenseItemized[];
}

export interface PayloadExpenseHeader {
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
  Expenses: PayloadExpenseLineItem[];
}

export interface CreateExpensePayload {
  Input: {
    parts: [
      {
        id: string;
        path: string;
        Operation: string;
        ExpenseHeader: PayloadExpenseHeader[];
      }
    ];
  };
}

export class PayloadBuilder {
  /**
   * Generate a unique mobile transaction ID
   */
  static generateMobileTransactionId(): string {
    return Date.now().toString() + Math.floor(Math.random() * 1000);
  }

  /**
   * Format date to the required format (dd-MMM-yyyy)
   */
  static formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    
    return `${day}-${month}-${year}`;
  }

  /**
   * Convert ItemizedEntry to PayloadExpenseItemized
   */
  static convertItemizedEntry(entry: ItemizedEntry): PayloadExpenseItemized {
    return {
      ItemDescription: entry.itemDescription || entry.description || '',
      StartDate: entry.startDate || (entry.date ? this.formatDate(entry.date) : ''),
      NumberOfDays: entry.numberOfDays || '1',
      Justification: entry.justification || entry.comment || '',
      Amount: entry.amount.toString(),
      Location: entry.location || '',
      MerchantName: entry.merchantName || entry.supplier || '',
    };
  }

  /**
   * Convert LineItem to PayloadExpenseLineItem
   */
  static convertLineItem(lineItem: LineItem, index: number): PayloadExpenseLineItem {
    const itemizedEntries = lineItem.itemized || [];
    
    return {
      LineNum: lineItem.lineNum || (index + 1).toString(),
      ItemDescription: lineItem.itemDescription || lineItem.expenseType || '',
      StartDate: lineItem.startDate || this.formatDate(lineItem.date),
      NumberOfDays: lineItem.numberOfDays || '1',
      Justification: lineItem.justification || lineItem.comment || '',
      Amount: lineItem.amount.toString(),
      Location: lineItem.location || '',
      ToLocation: lineItem.toLocation || '',
      MerchantName: lineItem.merchantName || lineItem.supplier || '',
      DailyRates: lineItem.dailyRates ?? null,
      Itemized: itemizedEntries.map(entry => this.convertItemizedEntry(entry)),
    };
  }

  /**
   * Build the complete payload for Create Expense API
   */
  static buildCreateExpensePayload(
    header: ExpenseHeader,
    lineItems: LineItem[],
    additionalData?: {
      employeeId?: string;
      orgId?: number;
      userId?: string;
      respId?: string;
    }
  ): CreateExpensePayload {
    const mobileTransactionId = header.mobileTransactionId || this.generateMobileTransactionId();
    
    const payloadHeader: PayloadExpenseHeader = {
      MobileTransactionId: mobileTransactionId,
      employeeId: additionalData?.employeeId || header.employeeId || '',
      OrgId: additionalData?.orgId || header.orgId || 0,
      DepartmentCode: header.departmentCode || header.department || '',
      Currency: header.currency || 'USD',
      ApproverId: header.approverId || '',
      Purpose: header.purpose || header.title || '',
      ExpenseReportId: header.expenseReportId || '',
      ReportHeaderID: header.reportHeaderId || '',
      UserId: additionalData?.userId || header.userId || '',
      RespID: additionalData?.respId || header.respId || '',
      Expenses: lineItems.map((lineItem, index) => this.convertLineItem(lineItem, index)),
    };

    return {
      Input: {
        parts: [
          {
            id: 'part1',
            path: '/Expense',
            Operation: 'save',
            ExpenseHeader: [payloadHeader],
          },
        ],
      },
    };
  }

  /**
   * Validate that all required fields are present
   */
  static validatePayload(header: ExpenseHeader, lineItems: LineItem[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate header
    if (!header.title && !header.purpose) {
      errors.push('Purpose/Title is required');
    }
    if (!header.department && !header.departmentCode) {
      errors.push('Department is required');
    }

    // Validate line items
    if (lineItems.length === 0) {
      errors.push('At least one line item is required');
    }

    lineItems.forEach((item, index) => {
      if (!item.amount || item.amount <= 0) {
        errors.push(`Line item ${index + 1}: Amount is required and must be positive`);
      }
      if (!item.expenseType && !item.itemDescription) {
        errors.push(`Line item ${index + 1}: Expense type/description is required`);
      }
      if (!item.date) {
        errors.push(`Line item ${index + 1}: Date is required`);
      }

      // Validate itemized entries if present
      if (item.itemized && item.itemized.length > 0) {
        item.itemized.forEach((itemizedEntry, itemizedIndex) => {
          if (!itemizedEntry.amount || itemizedEntry.amount <= 0) {
            errors.push(`Line item ${index + 1}, Itemized ${itemizedIndex + 1}: Amount is required`);
          }
          if (!itemizedEntry.description && !itemizedEntry.itemDescription) {
            errors.push(`Line item ${index + 1}, Itemized ${itemizedIndex + 1}: Description is required`);
          }
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
