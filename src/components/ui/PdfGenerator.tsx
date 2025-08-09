import React from 'react';
import { Alert } from 'react-native';
import { ExpenseDetail } from '../../hooks/useExpenseDetails';

interface GroupedExpenseDetail {
  reportHeaderId: string;
  reportName: string;
  reportDate: string;
  totalAmount: number;
  currency: string;
  status: 'approved' | 'pending' | 'rejected';
  items: ExpenseDetail[];
}

interface PdfGeneratorProps {
  expense: GroupedExpenseDetail;
  onDownload?: (pdfData: string) => void;
}

export const PdfGenerator: React.FC<PdfGeneratorProps> = ({ expense, onDownload }) => {
  
  const generatePdfContent = (): string => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    // Generate HTML content that can be converted to PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Expense Report - ${expense.reportHeaderId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background-color: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #007bff;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 28px;
              color: #007bff;
              margin: 0;
              font-weight: bold;
            }
            .subtitle {
              font-size: 16px;
              color: #666;
              margin: 10px 0;
            }
            .status {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 12px;
              letter-spacing: 1px;
            }
            .status.approved { background-color: #d4edda; color: #155724; }
            .status.pending { background-color: #fff3cd; color: #856404; }
            .status.rejected { background-color: #f8d7da; color: #721c24; }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .info-item {
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 6px;
              border-left: 4px solid #007bff;
            }
            .info-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 5px;
            }
            .info-value {
              font-size: 16px;
              font-weight: bold;
              color: #333;
            }
            .amount {
              font-size: 24px;
              color: #007bff;
              font-weight: bold;
            }
            .items-section {
              margin-top: 30px;
            }
            .section-title {
              font-size: 20px;
              color: #333;
              margin-bottom: 20px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 10px;
            }
            .item {
              border: 1px solid #ddd;
              border-radius: 6px;
              padding: 15px;
              margin-bottom: 15px;
              background-color: #fafafa;
            }
            .item-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
            }
            .item-title {
              font-size: 16px;
              font-weight: bold;
              color: #333;
            }
            .item-amount {
              font-size: 18px;
              font-weight: bold;
              color: #007bff;
            }
            .item-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              font-size: 14px;
              color: #666;
            }
            .detail-item {
              display: flex;
              align-items: center;
            }
            .detail-icon {
              margin-right: 8px;
              color: #007bff;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            .generated-info {
              margin-top: 10px;
              font-size: 10px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">Expense Report</h1>
              <p class="subtitle">Report #${expense.reportHeaderId}</p>
              <span class="status ${expense.status}">${expense.status}</span>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Report Name</div>
                <div class="info-value">${expense.reportName || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Report Date</div>
                <div class="info-value">${expense.reportDate}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Total Amount</div>
                <div class="amount">${expense.currency} ${expense.totalAmount.toFixed(2)}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Items Count</div>
                <div class="info-value">${expense.items.length} items</div>
              </div>
            </div>
            
            <div class="items-section">
              <h2 class="section-title">Expense Items</h2>
              ${expense.items.map((item, index) => `
                <div class="item">
                  <div class="item-header">
                    <div class="item-title">${item.ExpenseItem}</div>
                    <div class="item-amount">${item.Currency} ${parseFloat(item.Amount).toFixed(2)}</div>
                  </div>
                  <div class="item-details">
                    <div class="detail-item">
                      <span class="detail-icon">📅</span>
                      <span>${item.TransactionDate}</span>
                    </div>
                    ${item.Location ? `
                      <div class="detail-item">
                        <span class="detail-icon">📍</span>
                        <span>${item.Location}</span>
                      </div>
                    ` : ''}
                    ${item.Supplier ? `
                      <div class="detail-item">
                        <span class="detail-icon">👤</span>
                        <span>${item.Supplier}</span>
                      </div>
                    ` : ''}
                    ${item.BusinessPurpose ? `
                      <div class="detail-item">
                        <span class="detail-icon">💼</span>
                        <span>${item.BusinessPurpose}</span>
                      </div>
                    ` : ''}
                    <div class="detail-item">
                      <span class="detail-icon">🏷️</span>
                      <span>Status: ${item.ExpenseStatus}</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <div class="footer">
              <p>This expense report was generated on ${currentDate} at ${currentTime}</p>
              <p class="generated-info">Generated by Expense Management System</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    return htmlContent;
  };

  const handleGeneratePdf = async () => {
    try {
      const pdfContent = generatePdfContent();
      
      // For now, we'll show an alert with the content
      // In a real implementation, you would use a PDF library like react-native-html-to-pdf
      Alert.alert(
        'PDF Generation',
        'PDF generation functionality will be implemented here. The content has been prepared.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'View Content', 
            onPress: () => {
              if (onDownload) {
                onDownload(pdfContent);
              }
            }
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  return null; // This component doesn't render anything visible
};

// Export the function for direct use
export const generateExpensePdf = (expense: GroupedExpenseDetail): string => {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();
  
  // Calculate totals for different categories
  const categoryTotals = {
    travel: 0,
    lodging: 0,
    fuel: 0,
    meals: 0,
    other: 0,
    total: 0
  };
  
  // Categorize expenses based on item names or descriptions
  expense.items.forEach(item => {
    const amount = parseFloat(item.Amount);
    const itemName = item.ExpenseItem.toLowerCase();
    
    if (itemName.includes('travel') || itemName.includes('flight') || itemName.includes('airfare')) {
      categoryTotals.travel += amount;
    } else if (itemName.includes('lodging') || itemName.includes('hotel') || itemName.includes('accommodation')) {
      categoryTotals.lodging += amount;
    } else if (itemName.includes('fuel') || itemName.includes('gas') || itemName.includes('petrol')) {
      categoryTotals.fuel += amount;
    } else if (itemName.includes('meal') || itemName.includes('food') || itemName.includes('dining')) {
      categoryTotals.meals += amount;
    } else {
      categoryTotals.other += amount;
    }
    
    categoryTotals.total += amount;
  });
  
  // Generate HTML content that can be converted to PDF
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
          
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            color: #333333;
            line-height: 1.4;
          }
          
          .page {
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            background: white;
            position: relative;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          
          /* Top Spacing */
          .top-spacing {
            height: 20px;
            background-color: #ffffff;
          }
          
          /* Header Section */
          .header {
            background-color: #1E3A8A;
            color: white;
            padding: 25px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-height: 80px;
          }
          
          .company-logo {
            display: flex;
            align-items: center;
            gap: 15px;
            flex: 1;
          }
          
          .logo-square {
            width: 45px;
            height: 45px;
            background-color: white;
            color: black;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: bold;
            border-radius: 4px;
            flex-shrink: 0;
          }
          
          .company-info {
            flex: 1;
          }
          
          .company-info h1 {
            margin: 0;
            font-size: 20px;
            font-weight: bold;
            line-height: 1.2;
          }
          
          .header-instructions {
            font-size: 11px;
            text-align: right;
            max-width: 180px;
            line-height: 1.3;
            flex-shrink: 0;
          }
          
          /* Employee Details Section */
          .employee-details {
            background-color: #f5f5f5;
            padding: 20px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e0e0e0;
          }
          
          .employee-info {
            display: flex;
            gap: 40px;
            flex: 1;
          }
          
          .info-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          
          .info-label {
            font-weight: bold;
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .info-value {
            font-size: 13px;
            font-weight: normal;
            color: #333;
          }
          
          /* Category Icons */
          .category-icons {
            display: flex;
            gap: 8px;
            flex-shrink: 0;
          }
          
          .category-icon {
            width: 28px;
            height: 28px;
            background-color: #000000;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            border-radius: 3px;
          }
          
          /* Expense Table */
          .expense-table {
            margin: 25px 30px;
            border-collapse: collapse;
            width: calc(100% - 60px);
          }
          
          .expense-table th {
            background-color: #444444;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .expense-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 11px;
            vertical-align: top;
          }
          
          .expense-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .amount-column {
            text-align: right;
            font-weight: bold;
          }
          
          .date-column {
            width: 80px;
          }
          
          .description-column {
            width: 200px;
          }
          
          .category-column {
            width: 60px;
            text-align: center;
          }
          
          /* Financial Summary */
          .financial-summary {
            margin: 25px 30px;
            text-align: right;
          }
          
          .summary-row {
            display: flex;
            justify-content: flex-end;
            gap: 20px;
            margin-bottom: 8px;
            align-items: center;
          }
          
          .summary-label {
            font-weight: bold;
            font-size: 13px;
            color: #333;
          }
          
          .summary-value {
            font-weight: bold;
            font-size: 13px;
            min-width: 80px;
            text-align: right;
            color: #333;
          }
          
          .total-row {
            border-top: 2px solid #000;
            padding-top: 8px;
            margin-top: 12px;
          }
          
          .total-row .summary-label,
          .total-row .summary-value {
            font-size: 15px;
            font-weight: bold;
          }
          
          /* Footer */
          .footer {
            margin: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 9px;
            color: #666;
          }
          
          .additional-info {
            margin-top: 15px;
          }
          
          .additional-info h4 {
            margin: 0 0 10px 0;
            font-size: 11px;
            color: #333;
            font-weight: bold;
          }
          
          .additional-info p {
            margin: 5px 0;
            font-size: 9px;
            line-height: 1.3;
          }
          
          /* Print styles */
          @media print {
            body { margin: 0; }
            .page { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Top Spacing -->
          <div class="top-spacing"></div>
          
          <!-- Header -->
          <div class="header">
            <div class="company-logo">
              <div class="logo-square">PA</div>
              <div class="company-info">
                <h1>PROPEL APPS<br>Monthly Business Expense Report</h1>
              </div>
            </div>
            <div class="header-instructions">
              Please attach all receipts of expenses and submit copy to Human Resources.
            </div>
          </div>
          
          <!-- Employee Details -->
          <div class="employee-details">
            <div class="employee-info">
              <div class="info-group">
                <div class="info-label">EMPLOYEE NAME:</div>
                <div class="info-value">${expense.reportName || 'Employee Name'}</div>
              </div>
              <div class="info-group">
                <div class="info-label">EMPLOYEE ID:</div>
                <div class="info-value">#${expense.reportHeaderId}</div>
              </div>
              <div class="info-group">
                <div class="info-label">DEPARTMENT:</div>
                <div class="info-value">${expense.items[0]?.DepartmentCode || 'Department'}</div>
              </div>
              <div class="info-group">
                <div class="info-label">MANAGER:</div>
                <div class="info-value">Manager Name</div>
              </div>
            </div>
            <div class="category-icons">
              <div class="category-icon">✈️</div>
              <div class="category-icon">🏨</div>
              <div class="category-icon">⛽</div>
              <div class="category-icon">🍽️</div>
            </div>
          </div>
          
          <!-- Expense Table -->
          <table class="expense-table">
            <thead>
              <tr>
                <th class="date-column">DATE</th>
                <th class="description-column">EXPENSE DESCRIPTION</th>
                <th class="category-column">TRAVEL</th>
                <th class="category-column">LODGING</th>
                <th class="category-column">FUEL</th>
                <th class="category-column">MEALS</th>
                <th class="category-column">OTHER*</th>
                <th class="category-column">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${expense.items.map((item, index) => {
                const amount = parseFloat(item.Amount);
                const itemName = item.ExpenseItem.toLowerCase();
                let travel = '', lodging = '', fuel = '', meals = '', other = '';
                
                if (itemName.includes('travel') || itemName.includes('flight') || itemName.includes('airfare')) {
                  travel = `$${amount.toFixed(2)}`;
                } else if (itemName.includes('lodging') || itemName.includes('hotel') || itemName.includes('accommodation')) {
                  lodging = `$${amount.toFixed(2)}`;
                } else if (itemName.includes('fuel') || itemName.includes('gas') || itemName.includes('petrol')) {
                  fuel = `$${amount.toFixed(2)}`;
                } else if (itemName.includes('meal') || itemName.includes('food') || itemName.includes('dining')) {
                  meals = `$${amount.toFixed(2)}`;
                } else {
                  other = `$${amount.toFixed(2)}`;
                }
                
                return `
                  <tr>
                    <td>${item.TransactionDate}</td>
                    <td>${item.ExpenseItem}</td>
                    <td class="category-column">${travel}</td>
                    <td class="category-column">${lodging}</td>
                    <td class="category-column">${fuel}</td>
                    <td class="category-column">${meals}</td>
                    <td class="category-column">${other}</td>
                    <td class="amount-column">$${amount.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <!-- Financial Summary -->
          <div class="financial-summary">
            <div class="summary-row">
              <div class="summary-label">SUBTOTAL</div>
              <div class="summary-value">$${categoryTotals.total.toFixed(2)}</div>
            </div>
            <div class="summary-row">
              <div class="summary-label">ADVANCES</div>
              <div class="summary-value">$0.00</div>
            </div>
            <div class="summary-row total-row">
              <div class="summary-label">TOTAL</div>
              <div class="summary-value">$${categoryTotals.total.toFixed(2)}</div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div>Generated on ${currentDate} at ${currentTime}</div>
            <div class="additional-info">
              <h4>Additional Information for "OTHER" expenses:</h4>
              ${expense.items.filter(item => {
                const itemName = item.ExpenseItem.toLowerCase();
                return !itemName.includes('travel') && !itemName.includes('lodging') && 
                       !itemName.includes('fuel') && !itemName.includes('meal');
              }).map(item => `
                <p>${item.TransactionDate} ($${parseFloat(item.Amount).toFixed(2)}) - ${item.ExpenseItem}${item.BusinessPurpose ? `: ${item.BusinessPurpose}` : ''}</p>
              `).join('')}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
  
  return htmlContent;
}; 