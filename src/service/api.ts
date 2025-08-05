import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiInfo } from '../../@types/api';
import { logger } from '../utils/logger';

const BASE_URL = 'https://testnode.propelapps.com/EBS';

interface ApiResponse<T = unknown> {
  metadata?: Array<{
    name: string;
    type: string;
  }>;
  data?: T[];
  success?: boolean;
  message?: string;
  token?: string;
  user?: Record<string, unknown>;
}

interface LoginResponse {
  STATUS: string;
  USER_NAME: string;
  USER_ID: string;
  TIMESTAMP: string;
  TIMEZONE_OFFSET: string;
  FULL_NAME: string;
  PERSON_ID: string;
  RESPONSIBILITY: string;
  SET_OF_BOOK_ID: string;
  DEFAULT_ORG_ID: string;
  DEFAULT_OU_NAME: string;
  DEFAULT_INV_ORG_ID: string;
  DEFAULT_INV_ORG_NAME: string;
  DEFAULT_INV_ORG_CODE: string;
  RESPONSIBILITY_ID: string;
  RESP_APPLICATION_ID: string;
}

interface LoginRequest {
  username: string;
  password: string;
  isSSO: string;
}

interface ExpenseReportData {
  operation: 'save' | 'create';
  [key: string]: unknown;
}

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token;
  } catch (error) {
    logger.error('Error getting auth token', { error });
    return null;
  }
};

// Generic API request function
export const apiRequest = async <T = unknown>(
  endpoint: string,
  method: string,
  data?: unknown,
  requiresAuth = true,
): Promise<T> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      headers.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    };

    logger.debug('Making API request', {
      url: `${BASE_URL}${endpoint}`,
      method,
      headers,
      body: data,
    });

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // Check if response is JSON by checking content-type header
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json') ?? false;

    let responseData: T;
    if (isJson) {
      try {
        responseData = await response.json();
      } catch (parseError) {
        logger.error('JSON parse error', { parseError });
        throw new Error('Invalid JSON response from server');
      }
    } else {
      // Handle non-JSON responses (HTML error pages, plain text, etc.)
      const textResponse = await response.text();
      logger.error('Non-JSON response received', { textResponse });
      throw new Error(`Server error: ${response.status} - ${response.statusText}`);
    }

    if (!response.ok) {
      const errorMessage = (responseData as ApiResponse)?.message || `API request failed: ${response.status}`;
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    logger.error('API request error', { error, endpoint, method });
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (username: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    const loginData: LoginRequest = {
      username,
      password,
      isSSO: 'N',
    };

    const response = await apiRequest<ApiResponse<LoginResponse>>('/20D/login', 'POST', loginData, false);

    // Check if we have data and the first item has STATUS
    if (response.data && response.data.length > 0) {
      const loginData = response.data[0] as LoginResponse;
      
      // Check if login was successful (STATUS = '1' means success, '0' means failure)
      if (loginData.STATUS === '1') {
        // Store user data in AsyncStorage
        const userData = {
          username: loginData.USER_NAME,
          userId: loginData.USER_ID,
          fullName: loginData.FULL_NAME,
          personId: loginData.PERSON_ID,
          responsibility: loginData.RESPONSIBILITY,
          defaultOrgId: loginData.DEFAULT_ORG_ID,
          defaultOrgName: loginData.DEFAULT_OU_NAME,
          defaultInvOrgId: loginData.DEFAULT_INV_ORG_ID,
          defaultInvOrgName: loginData.DEFAULT_INV_ORG_NAME,
          defaultInvOrgCode: loginData.DEFAULT_INV_ORG_CODE,
          responsibilityId: loginData.RESPONSIBILITY_ID,
          respApplicationId: loginData.RESP_APPLICATION_ID,
          timestamp: loginData.TIMESTAMP,
          timezoneOffset: loginData.TIMEZONE_OFFSET,
        };
        
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('authToken', 'authenticated'); // Store a token indicator
        
        return {
          ...response,
          success: true,
          user: userData,
        };
      } else {
        // Login failed
        throw new Error('Invalid username or password.');
      }
    } else {
      // No data returned
      throw new Error('Login failed. Please try again.');
    }
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  },

  getCurrentUser: async (): Promise<Record<string, unknown> | null> => {
    try {
      const userString = await AsyncStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      logger.error('Error getting current user', { error });
      return null;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await getAuthToken();
    return !!token;
  },
};

// Expense API
export const expenseAPI = {
  createExpenseReport: async (reportData: unknown, operation: 'save' | 'create'): Promise<ApiResponse> => {
    const data: ExpenseReportData = {
      ...(reportData as Record<string, unknown>),
      operation,
    };
    return apiRequest<ApiResponse>('/23B/createExpenseReport', 'POST', data, false);
  },

  getExpenseReports: async (): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('/23B/getExpenseReports', 'GET', undefined, false);
  },

  getExpenseReportDetails: async (reportId: string): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>(`/23B/getExpenseReportDetails/${reportId}`, 'GET', undefined, false);
  },
};

// Department API
export const departmentAPI = {
  getAllDepartments: async (): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('/23B/getAllDepartments/%22%22', 'GET', undefined, false);
  },
};

// Currency API
export const currencyAPI = {
  getCurrencies: async (): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('/23B/getCurrencies/%22%22', 'GET', undefined, false);
  },

  getCurrenciesMetadata: async (): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('/23B/getCurrencies/metadata', 'GET', undefined, false);
  },
};

// Expense Notification API
export const expenseNotificationAPI = {
  getExpenseNotificationDetails: async (notificationId: string = '1015084'): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>(`/23B/getExpenseNotificationDetails/${notificationId}/%22%22`, 'GET', undefined, false);
  },

  getExpenseNotificationMetadata: async (): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('/23B/getExpenseNotificationDetails/metadata', 'GET', undefined, false);
  },
};

// Expense Item API
export const expenseItemAPI = {
  getExpenseItem: async (itemId: string = '7923'): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>(`/23B/getExpenseItem/${itemId}/%22%22`, 'GET', undefined, false);
  },

  getExpenseItemMetadata: async (itemId: string = '7923'): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>(`/23B/getExpenseItem/${itemId}/metadata`, 'GET', undefined, false);
  },
};

// Expense Details API
export const expenseDetailsAPI = {
  getExpenseDetails: async (reportId: string = '32849', itemId: string = '7923'): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>(`/23B/getExpenseDetails/${reportId}/${itemId}/%22%22`, 'GET', undefined, false);
  },

  getExpenseDetailsMetadata: async (): Promise<ApiResponse> => {
    return apiRequest<ApiResponse>('/23B/getExpenseDetails/metadata', 'GET', undefined, false);
  },
};

export async function fetchApi(apiInfo: ApiInfo): Promise<unknown> {
  try {
    const response = await fetch(apiInfo.endpoint);

    // Check if response is JSON by checking content-type header
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json') ?? false;

    if (!response.ok) {
      if (isJson) {
        const errorData = await response.json();
        throw new Error((errorData as ApiResponse).message || `API error: ${response.status}`);
      } else {
        const textResponse = await response.text();
        logger.error('Non-JSON error response', { textResponse });
        throw new Error(`API error: ${response.status} - ${response.statusText}`);
      }
    }

    if (!isJson) {
      const textResponse = await response.text();
      logger.error('Non-JSON response received', { textResponse });
      throw new Error('Server returned non-JSON response');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error(`Error fetching ${apiInfo.name}`, { error });
    throw error;
  }
}

export const attachmentAPI = {
  getAttachments: async (lineId?: string) => {
    try {
      // Use the full URL since this is an external API
      const endpoint = lineId 
        ? `https://testnode.propelapps.com/EBS/0220/getListOfAttachments/OIE_LINE_ATTACHMENTS/${encodeURIComponent(lineId)}/%22%22`
        : 'https://testnode.propelapps.com/EBS/0220/getListOfAttachments/OIE_LINE_ATTACHMENTS/%22%22/%22%22';
      
      logger.info('Calling attachment API with endpoint:', endpoint);
      
      // Use fetch directly since this is an external API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'ExpenseApp/1.0',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        logger.info('Attachment API response status:', { status: response.status, statusText: response.statusText });

        if (!response.ok) {
          const errorText = await response.text();
          logger.error('Attachment API error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        // Check if response has content
        const responseText = await response.text();
        logger.info('Attachment API raw response text:', responseText);
        
        if (!responseText || responseText.trim() === '') {
          logger.warn('Empty response from attachment API');
          return { AttachmentList: [] };
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        logger.info('Response content type:', contentType);
        
        // If it's not JSON, log the raw response and return empty
        if (contentType && !contentType.includes('application/json')) {
          logger.warn('Non-JSON response received:', { contentType, responseText });
          return { AttachmentList: [] };
        }

        // Try to parse JSON
        let data;
        try {
          data = JSON.parse(responseText);
          logger.info('Attachments API parsed response:', { data });
        } catch (parseError) {
          logger.error('JSON parse error for attachment API:', {
            responseText,
            parseError,
            lineId,
            contentType
          });
          
          // If it looks like HTML or other non-JSON content, return empty
          if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
            logger.warn('HTML response received, treating as no attachments');
            return { AttachmentList: [] };
          }
          
          throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
        }

        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          logger.error('Attachment API request timed out');
          throw new Error('Request timed out after 10 seconds');
        }
        logger.error('Error fetching attachments:', error);
        throw error;
      }
    } catch (error) {
      logger.error('Error fetching attachments:', error);
      throw error;
    }
  },

  // Test function to check if the API is accessible
  testAttachmentAPI: async () => {
    try {
      const endpoint = 'https://testnode.propelapps.com/EBS/0220/getListOfAttachments/OIE_LINE_ATTACHMENTS/%22%22/%22%22';
      logger.info('Testing attachment API endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'ExpenseApp/1.0',
        },
      });

      logger.info('Test response status:', response.status);
      
      if (response.ok) {
        const responseText = await response.text();
        logger.info('Test API raw response text:', responseText);
        
        if (!responseText || responseText.trim() === '') {
          logger.warn('Empty response from test API');
          return { success: true, data: { AttachmentList: [] } };
        }

        try {
          const data = JSON.parse(responseText);
          logger.info('Test API parsed response:', data);
          return { success: true, data };
        } catch (parseError) {
          logger.error('JSON parse error for test API:', {
            responseText,
            parseError
          });
          return { 
            success: false, 
            error: `JSON Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}` 
          };
        }
      } else {
        const errorText = await response.text();
        logger.error('Test API error:', errorText);
        return { success: false, error: errorText };
      }
    } catch (error) {
      logger.error('Test API exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};
