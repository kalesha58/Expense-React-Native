import { ExpenseDetail } from '../../hooks/useExpenseDetails';
import { ExpenseType } from '../../types/ExpenseTypes';
import { processItemization, ProcessedExpenseItem } from '../../utils/itemizationUtils';

interface GroupedExpenseDetail {
  reportHeaderId: string;
  reportName: string;
  reportDate: string;
  totalAmount: number;
  currency: string;
  status: 'approved' | 'pending' | 'rejected';
  items: ExpenseDetail[];
}

// Helper function to categorize expenses dynamically
const categorizeExpense = (expenseType: string): string => {
  const type = expenseType.toLowerCase();
  
  // Travel & Transportation
  if (type.includes('airfare') || type.includes('flight') || type.includes('air')) {
    return 'travel';
  }
  if (type.includes('car rental') || type.includes('cab') || type.includes('transportation')) {
    return 'travel';
  }
  
  // Lodging & Accommodation  
  if (type.includes('hotel') || type.includes('accommodation') || type.includes('lodging')) {
    return 'lodging';
  }
  
  // Fuel & Gas
  if (type.includes('fuel') || type.includes('gas') || type.includes('petrol')) {
    return 'fuel';
  }
  
  // Meals & Food
  if (type.includes('meal') || type.includes('food') || type.includes('dining') || 
      type.includes('breakfast') || type.includes('lunch') || type.includes('dinner')) {
    return 'meals';
  }
  
  // Default to other
  return 'other';
};

// Helper function to get category display name
const getCategoryDisplayName = (category: string): string => {
  switch (category) {
    case 'travel': return 'TRAVEL';
    case 'lodging': return 'LODGING';
    case 'fuel': return 'FUEL';
    case 'meals': return 'MEALS';
    default: return 'OTHER*';
  }
};

// Helper function to get category icon
const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'travel': return '✈️';
    case 'lodging': return '🏨';
    case 'fuel': return '⛽';
    case 'meals': return '🍽️';
    default: return '📋';
  }
};

// Helper function to get category color
const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'travel': return '#3498db';
    case 'lodging': return '#9b59b6';
    case 'fuel': return '#e74c3c';
    case 'meals': return '#f39c12';
    default: return '#95a5a6';
  }
};

// Export the enhanced function for direct use
export const generateEnhancedExpensePdf = (expense: GroupedExpenseDetail): string => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  // Calculate totals for different categories using dynamic categorization
  const categoryTotals = {
    travel: 0,
    lodging: 0,
    fuel: 0,
    meals: 0,
    other: 0,
    total: 0
  };
  
  // Group items by category
  const categorizedItems: { [key: string]: ExpenseDetail[] } = {
    travel: [],
    lodging: [],
    fuel: [],
    meals: [],
    other: []
  };
  
  // Categorize expenses using dynamic logic
  expense.items.forEach(item => {
    const amount = parseFloat(item.Amount);
    const category = categorizeExpense(item.ExpenseItem);
    
    categoryTotals[category as keyof typeof categoryTotals] += amount;
    categoryTotals.total += amount;
    
    categorizedItems[category].push(item);
  });

  // Calculate advances (mock data for now)
  const advances = 0;

  // Process itemization to understand hierarchy
  const { parentItems, childItems } = processItemization(expense.items);
  
  // Generate hierarchical table rows showing parent -> children structure
  const generateHierarchicalRows = () => {
    let rows = '';
    
    parentItems.forEach((parentItem, parentIndex) => {
      const parentDate = new Date(parentItem.TransactionDate).toLocaleDateString('en-GB');
      const parentAmount = parseFloat(parentItem.Amount);
      const parentCategory = categorizeExpense(parentItem.ExpenseItem);
      
      // Create empty cells for all categories, then fill the appropriate one
      const getAmountForCategory = (category: string, itemCategory: string, amount: number) => {
        return category === itemCategory ? `$${amount.toFixed(2)}` : '';
      };
      
      // Add parent row with header styling
      rows += `
        <tr class="expense-row ${parentItem.hasItemized ? 'parent-row' : 'regular-row'}">
          <td class="date-cell">${parentDate}</td>
          <td class="description-cell parent-description">
            ${parentItem.hasItemized ? '📋 ' : ''}${parentItem.ExpenseItem}
            ${parentItem.hasItemized ? ` <span class="itemized-badge">(${parentItem.itemizedCount} items)</span>` : ''}
          </td>
          <td class="category-cell ${parentCategory}">${getAmountForCategory('travel', parentCategory, parentAmount)}</td>
          <td class="category-cell ${parentCategory}">${getAmountForCategory('lodging', parentCategory, parentAmount)}</td>
          <td class="category-cell ${parentCategory}">${getAmountForCategory('fuel', parentCategory, parentAmount)}</td>
          <td class="category-cell ${parentCategory}">${getAmountForCategory('meals', parentCategory, parentAmount)}</td>
          <td class="category-cell ${parentCategory}">${getAmountForCategory('other', parentCategory, parentAmount)}</td>
          <td class="amount-cell ${parentItem.hasItemized ? 'parent-amount' : ''}">${parentItem.hasItemized ? '' : '$' + parentAmount.toFixed(2)}</td>
        </tr>
      `;
      
      // Add children rows if this item has itemized content
      if (parentItem.hasItemized && parentItem.children && parentItem.children.length > 0) {
        parentItem.children.forEach((childItem, childIndex) => {
          const childDate = new Date(childItem.TransactionDate).toLocaleDateString('en-GB');
          const childAmount = parseFloat(childItem.Amount);
          const childCategory = categorizeExpense(childItem.ExpenseItem);
          
          rows += `
            <tr class="expense-row child-row">
              <td class="date-cell child-date">${childDate}</td>
              <td class="description-cell child-description">
                <span class="indent">└─ ${childItem.ExpenseItem}</span>
              </td>
              <td class="category-cell ${childCategory}">${getAmountForCategory('travel', childCategory, childAmount)}</td>
              <td class="category-cell ${childCategory}">${getAmountForCategory('lodging', childCategory, childAmount)}</td>
              <td class="category-cell ${childCategory}">${getAmountForCategory('fuel', childCategory, childAmount)}</td>
              <td class="category-cell ${childCategory}">${getAmountForCategory('meals', childCategory, childAmount)}</td>
              <td class="category-cell ${childCategory}">${getAmountForCategory('other', childCategory, childAmount)}</td>
              <td class="amount-cell child-amount">$${childAmount.toFixed(2)}</td>
            </tr>
          `;
        });
        
        // Add total row for itemized group
        rows += `
          <tr class="expense-row group-total-row">
            <td class="date-cell"></td>
            <td class="description-cell group-total-description">
              <strong>Subtotal for ${parentItem.ExpenseItem}</strong>
            </td>
            <td class="category-cell"></td>
            <td class="category-cell"></td>
            <td class="category-cell"></td>
            <td class="category-cell"></td>
            <td class="category-cell"></td>
            <td class="amount-cell group-total-amount">
              <strong>$${(parentAmount + parentItem.children.reduce((sum, child) => sum + parseFloat(child.Amount), 0)).toFixed(2)}</strong>
            </td>
          </tr>
        `;
      }
    });
    
    return rows;
  };

  // Generate hierarchical additional information section
  const generateHierarchicalAdditionalInfo = () => {
    let info = '';
    
    parentItems.forEach((parentItem, index) => {
      const parentDate = new Date(parentItem.TransactionDate).toLocaleDateString('en-GB');
      const parentAmount = parseFloat(parentItem.Amount);
      
      if (parentItem.hasItemized && parentItem.children && parentItem.children.length > 0) {
        // Add parent header
        info += `
          <div class="additional-info-header">
            <strong>${parentDate} - ${parentItem.ExpenseItem} (Itemized)</strong>
          </div>
        `;
        
        // Add children
        parentItem.children.forEach(childItem => {
          const childDate = new Date(childItem.TransactionDate).toLocaleDateString('en-GB');
          const childAmount = parseFloat(childItem.Amount);
          
          info += `
            <div class="additional-info-item child-info">
              └─ ${childDate} [$${childAmount.toFixed(2)}] : ${childItem.ExpenseItem} Business visit
            </div>
          `;
        });
        
        // Add total
        const totalAmount = parentAmount + parentItem.children.reduce((sum, child) => sum + parseFloat(child.Amount), 0);
        info += `
          <div class="additional-info-total">
            <strong>Total for ${parentItem.ExpenseItem}: $${totalAmount.toFixed(2)}</strong>
          </div>
        `;
      } else {
        // Regular item
        info += `
          <div class="additional-info-item">
            ${parentDate} [$${parentAmount.toFixed(2)}] : ${parentItem.ExpenseItem} Business visit
          </div>
        `;
      }
    });
    
    return info;
  };
  
  // Generate HTML content with modern, professional design
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Monthly Business Expense Report - ${expense.reportHeaderId}</title>
        <style>
          @page {
            margin: 0;
            size: A4;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            color: #333333;
            line-height: 1.4;
            font-size: 12px;
          }
          
          .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            position: relative;
          }
          
          /* Header Section */
          .header {
            background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);
            color: white;
            padding: 20px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .company-logo {
            display: flex;
            align-items: center;
            gap: 15px;
            flex: 1;
          }
          
          .logo-square {
            width: 50px;
            height: 50px;
            background: white;
            color: #1E3A8A;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .company-info h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 600;
            line-height: 1.2;
          }
          
          .header-instructions {
            font-size: 11px;
            text-align: right;
            max-width: 200px;
            line-height: 1.4;
            opacity: 0.95;
          }
          
          /* Employee Details Section */
          .employee-details {
            background: #F8FAFC;
            padding: 25px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #E2E8F0;
          }
          
          .employee-info {
            display: flex;
            gap: 40px;
            flex: 1;
          }
          
          .info-group {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          
          .info-label {
            font-size: 10px;
            color: #64748B;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .info-value {
            font-size: 14px;
            font-weight: 600;
            color: #1E293B;
          }
          
          .status-badges {
            display: flex;
            gap: 10px;
            align-items: center;
          }
          
          .status-badge {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .badge-approved { background: #10B981; color: white; }
          .badge-pending { background: #F59E0B; color: white; }
          .badge-rejected { background: #EF4444; color: white; }
          
          /* Main Content */
          .content {
            padding: 30px;
          }
          
          /* Expense Table */
          .expense-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          
          .table-header {
            background: linear-gradient(135deg, #374151 0%, #4B5563 100%);
            color: white;
          }
          
          .table-header th {
            padding: 15px 12px;
            text-align: center;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .table-header th:last-child {
            border-right: none;
          }
          
          .expense-row {
            border-bottom: 1px solid #F1F5F9;
            transition: background-color 0.2s;
          }
          
          .expense-row:hover {
            background-color: #F8FAFC;
          }
          
          .expense-row:last-child {
            border-bottom: none;
          }
          
          .expense-row td {
            padding: 12px;
            text-align: center;
            font-size: 11px;
          }
          
          .date-cell {
            font-weight: 500;
            color: #475569;
          }
          
          .description-cell {
            text-align: left !important;
            font-weight: 500;
            color: #1E293B;
          }
          
          .category-cell {
            font-weight: 600;
            color: #059669;
          }
          
          .amount-cell {
            font-weight: 700;
            color: #1E293B;
            background: #F0FDF4;
          }
          
          /* Summary Section */
          .summary-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          
          .summary-table {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            border: 2px solid #E2E8F0;
          }
          
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 20px;
            border-bottom: 1px solid #F1F5F9;
          }
          
          .summary-row:last-child {
            border-bottom: none;
            background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);
            color: white;
            font-weight: 700;
            font-size: 14px;
          }
          
          .summary-label {
            font-weight: 600;
            color: #475569;
          }
          
          .summary-value {
            font-weight: 700;
            color: #1E293B;
          }
          
          /* Additional Information */
          .additional-info {
            background: #F8FAFC;
            border-radius: 12px;
            padding: 25px;
            border: 2px solid #E2E8F0;
          }
          
          .additional-info h3 {
            color: #1E293B;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #E2E8F0;
          }
          
          .additional-info-header {
            background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);
            color: white;
            padding: 10px 15px;
            border-radius: 6px;
            margin: 10px 0 5px 0;
            font-size: 12px;
            font-weight: 600;
          }
          
          .additional-info-item {
            padding: 8px 0;
            color: #475569;
            font-size: 11px;
            line-height: 1.5;
            border-bottom: 1px solid #F1F5F9;
          }
          
          .child-info {
            padding-left: 20px;
            color: #64748B;
            background: #F8FAFC;
            margin: 2px 0;
            padding: 6px 0 6px 20px;
            border-left: 2px solid #94A3B8;
          }
          
          .additional-info-total {
            background: #F0FDF4;
            border: 1px solid #10B981;
            padding: 8px 15px;
            margin: 5px 0 15px 0;
            border-radius: 6px;
            color: #065F46;
            font-size: 12px;
          }
          
          .additional-info-item:last-child {
            border-bottom: none;
          }
          
          /* Generation Info */
          .generation-info {
            margin-top: 30px;
            text-align: center;
            color: #64748B;
            font-size: 10px;
            padding: 20px;
            background: #F1F5F9;
            border-radius: 8px;
          }
          
          /* Hierarchical Styling */
          .parent-row {
            background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%);
            border-left: 4px solid #3B82F6;
            font-weight: 600;
          }
          
          .parent-description {
            font-weight: 700 !important;
            color: #1E293B !important;
            font-size: 12px !important;
          }
          
          .itemized-badge {
            background: #3B82F6;
            color: white;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 9px;
            font-weight: 600;
            margin-left: 8px;
          }
          
          .parent-amount {
            background: #E2E8F0 !important;
            font-style: italic;
            color: #64748B !important;
          }
          
          .child-row {
            background: #FAFBFC;
            border-left: 2px solid #94A3B8;
          }
          
          .child-date {
            color: #64748B !important;
            font-size: 10px !important;
          }
          
          .child-description {
            color: #475569 !important;
            font-size: 11px !important;
          }
          
          .indent {
            padding-left: 20px;
            color: #64748B;
            font-weight: 500;
          }
          
          .child-amount {
            background: #F1F5F9 !important;
            font-weight: 600 !important;
            color: #059669 !important;
          }
          
          .group-total-row {
            background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);
            color: white !important;
            border-top: 2px solid #1E3A8A;
          }
          
          .group-total-description {
            color: white !important;
            font-weight: 700 !important;
            text-align: right !important;
            padding-right: 15px !important;
          }
          
          .group-total-amount {
            background: #1E3A8A !important;
            color: white !important;
            font-weight: 700 !important;
            font-size: 13px !important;
          }
          
          .regular-row {
            border-left: 2px solid #10B981;
          }
          
          /* Category Colors */
          .travel { color: #3498db !important; }
          .lodging { color: #9b59b6 !important; }
          .fuel { color: #e74c3c !important; }
          .meals { color: #f39c12 !important; }
          .other { color: #95a5a6 !important; }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Header Section -->
          <div class="header">
            <div class="company-logo">
              <div class="logo-square">PA</div>
              <div class="company-info">
                <h1>PROPEL APPS</h1>
                <div>Monthly Business Expense Report</div>
              </div>
            </div>
            <div class="header-instructions">
              Please attach all receipts of expenses and submit copy to Human Resources.
            </div>
          </div>
          
          <!-- Employee Details Section -->
          <div class="employee-details">
            <div class="employee-info">
              <div class="info-group">
                <div class="info-label">Employee Name:</div>
                <div class="info-value">EXP-${expense.reportHeaderId}</div>
              </div>
              <div class="info-group">
                <div class="info-label">Employee ID:</div>
                <div class="info-value">#${expense.reportHeaderId}</div>
              </div>
              <div class="info-group">
                <div class="info-label">Department:</div>
                <div class="info-value">400</div>
              </div>
              <div class="info-group">
                <div class="info-label">Manager:</div>
                <div class="info-value">Manager Name</div>
              </div>
            </div>
            <div class="status-badges">
              <div class="status-badge badge-${expense.status}">
                ${expense.status.charAt(0).toUpperCase()}
              </div>
              <div class="status-badge badge-${expense.status}">
                ${expense.status.charAt(1).toUpperCase()}
              </div>
              <div class="status-badge badge-${expense.status}">
                ${expense.status.charAt(2).toUpperCase()}
              </div>
              <div class="status-badge badge-${expense.status}">
                ${expense.status.charAt(3).toUpperCase()}
              </div>
            </div>
          </div>
          
          <!-- Main Content -->
          <div class="content">
            <!-- Expense Table -->
            <table class="expense-table">
              <thead class="table-header">
                <tr>
                  <th>DATE</th>
                  <th>EXPENSE DESCRIPTION</th>
                  <th>TRAVEL</th>
                  <th>LODGING</th>
                  <th>FUEL</th>
                  <th>MEALS</th>
                  <th>OTHER*</th>
                  <th>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                ${generateHierarchicalRows()}
              </tbody>
            </table>
            
            <!-- Summary Section -->
            <div class="summary-section">
              <div class="summary-table">
                <div class="summary-row">
                  <span class="summary-label">SUBTOTAL</span>
                  <span class="summary-value">$${categoryTotals.total.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">ADVANCES</span>
                  <span class="summary-value">$${advances.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                  <span>TOTAL</span>
                  <span>$${(categoryTotals.total - advances).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <!-- Additional Information -->
            <div class="additional-info">
              <h3>Detailed Expense Breakdown:</h3>
              ${generateHierarchicalAdditionalInfo()}
            </div>
            
            <!-- Generation Info -->
            <div class="generation-info">
              Generated on ${currentDate} at ${currentTime}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
  
  return htmlContent;
};
