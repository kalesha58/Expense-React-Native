/**
 * @format
 */

import { receiptExtractionAPI } from '../src/service/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('Receipt Extraction API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle new response structure with Response and Success fields', async () => {
    const mockResponse = {
      Response: {
        business_name: "Villa Contentezza",
        items: [
          {
            quantity: 7,
            description: "Nights in apartment Lido",
            price: 700
          },
          {
            quantity: 28,
            description: "Breakfast",
            price: 280
          }
        ],
        total_amount: 1060,
        from_location: null,
        to_location: null,
        Expense_Type: "Hotel",
        check_in_date: "2025-08-11",
        check_out_date: "2025-08-18"
      },
      Success: true
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockResponse))
    });

    const result = await receiptExtractionAPI.extractReceiptDetails('base64image');

    expect(result).toEqual({
      business_name: "Villa Contentezza",
      items: [
        {
          description: "Nights in apartment Lido",
          price: 700
        },
        {
          description: "Breakfast",
          price: 280
        }
      ]
    });
  });

  test('should handle legacy response structure for backward compatibility', async () => {
    const mockResponse = {
      business_name: "Test Business",
      items: [
        {
          description: "Test Item",
          price: 100
        }
      ]
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockResponse))
    });

    const result = await receiptExtractionAPI.extractReceiptDetails('base64image');

    expect(result).toEqual(mockResponse);
  });

  test('should throw error for invalid response structure', async () => {
    const mockResponse = {
      Response: {
        business_name: "Test Business"
        // Missing items array
      },
      Success: true
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockResponse))
    });

    await expect(receiptExtractionAPI.extractReceiptDetails('base64image'))
      .rejects
      .toThrow('Invalid response structure from receipt extraction service');
  });

  test('should throw error when Success is not true', async () => {
    const mockResponse = {
      Response: {
        business_name: "Test Business",
        items: []
      },
      Success: false
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockResponse))
    });

    await expect(receiptExtractionAPI.extractReceiptDetails('base64image'))
      .rejects
      .toThrow('Invalid response structure from receipt extraction service');
  });
});
