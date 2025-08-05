import { departmentAPI, authAPI } from '../service/api';
import { logger } from './logger';

export interface DebugResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

export class DepartmentAPIDebugger {
  private results: DebugResult[] = [];

  /**
   * Run comprehensive debug test
   */
  async debugDepartmentAPI(): Promise<DebugResult[]> {
    this.results = [];
    
    logger.info('Starting department API debug...');

    // Step 1: Check authentication
    await this.testAuthentication();
    
    // Step 2: Test raw fetch without auth
    await this.testRawFetchWithoutAuth();
    
    // Step 3: Test raw fetch with auth
    await this.testRawFetchWithAuth();
    
    // Step 4: Test API service call
    await this.testAPIServiceCall();
    
    // Step 5: Test different auth methods
    await this.testDifferentAuthMethods();

    logger.info('Department API debug completed', { 
      totalSteps: this.results.length,
      successful: this.results.filter(r => r.success).length,
      failed: this.results.filter(r => !r.success).length,
    });

    return this.results;
  }

  private async testAuthentication(): Promise<void> {
    const startTime = Date.now();
    const result: DebugResult = {
      step: 'Authentication Check',
      success: false,
    };

    try {
      const isAuth = await authAPI.isAuthenticated();
      const currentUser = await authAPI.getCurrentUser();
      
      result.success = isAuth;
      result.data = { isAuth, currentUser };
      result.duration = Date.now() - startTime;
      
      logger.info('Authentication test completed', result);
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.duration = Date.now() - startTime;
      logger.error('Authentication test failed', { error: result.error });
    }

    this.results.push(result);
  }

  private async testRawFetchWithoutAuth(): Promise<void> {
    const startTime = Date.now();
    const result: DebugResult = {
      step: 'Raw Fetch Without Auth',
      success: false,
    };

    try {
      const url = 'https://testnode.propelapps.com/EBS/23B/getAllDepartments/%22%22';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      result.data = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      };

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          result.success = true;
          result.data = { ...result.data, responseData: data };
        } else {
          const textResponse = await response.text();
          result.data = { ...result.data, textResponse };
        }
      } else {
        const errorText = await response.text();
        result.error = `HTTP ${response.status}: ${errorText}`;
      }

      result.duration = Date.now() - startTime;
      logger.info('Raw fetch without auth completed', result);
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.duration = Date.now() - startTime;
      logger.error('Raw fetch without auth failed', { error: result.error });
    }

    this.results.push(result);
  }

  private async testRawFetchWithAuth(): Promise<void> {
    const startTime = Date.now();
    const result: DebugResult = {
      step: 'Raw Fetch With Auth',
      success: false,
    };

    try {
      const token = await authAPI.isAuthenticated();
      if (!token) {
        result.error = 'Not authenticated';
        result.duration = Date.now() - startTime;
        this.results.push(result);
        return;
      }

      const url = 'https://testnode.propelapps.com/EBS/23B/getAllDepartments/%22%22';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer authenticated', // Using the stored token
        },
      });

      result.data = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      };

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          result.success = true;
          result.data = { ...result.data, responseData: data };
        } else {
          const textResponse = await response.text();
          result.data = { ...result.data, textResponse };
        }
      } else {
        const errorText = await response.text();
        result.error = `HTTP ${response.status}: ${errorText}`;
      }

      result.duration = Date.now() - startTime;
      logger.info('Raw fetch with auth completed', result);
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.duration = Date.now() - startTime;
      logger.error('Raw fetch with auth failed', { error: result.error });
    }

    this.results.push(result);
  }

  private async testAPIServiceCall(): Promise<void> {
    const startTime = Date.now();
    const result: DebugResult = {
      step: 'API Service Call',
      success: false,
    };

    try {
      const response = await departmentAPI.getAllDepartments();
      
      result.success = true;
      result.data = {
        hasData: !!response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        responseKeys: Object.keys(response),
        dataLength: response.data ? (Array.isArray(response.data) ? response.data.length : 'not array') : 'no data'
      };
      
      result.duration = Date.now() - startTime;
      logger.info('API service call completed', result);
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.duration = Date.now() - startTime;
      logger.error('API service call failed', { error: result.error });
    }

    this.results.push(result);
  }

  private async testDifferentAuthMethods(): Promise<void> {
    const startTime = Date.now();
    const result: DebugResult = {
      step: 'Different Auth Methods',
      success: false,
    };

    try {
      const url = 'https://testnode.propelapps.com/EBS/23B/getAllDepartments/%22%22';
      const authMethods = [
        { name: 'No Auth', headers: { 'Content-Type': 'application/json' } as Record<string, string> },
        { name: 'Bearer Token', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer authenticated' } as Record<string, string> },
        { name: 'Basic Auth', headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic YXV0aGVudGljYXRlZA==' } as Record<string, string> },
        { name: 'Custom Header', headers: { 'Content-Type': 'application/json', 'X-Auth-Token': 'authenticated' } as Record<string, string> },
      ];

      const results: any[] = [];
      
      for (const method of authMethods) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: method.headers,
          });

          const responseData: any = {
            method: method.name,
            status: response.status,
            statusText: response.statusText,
            success: response.ok,
          };

          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
              const data = await response.json();
              responseData.data = data;
            } else {
              const textResponse = await response.text();
              responseData.textResponse = textResponse;
            }
          } else {
            const errorText = await response.text();
            responseData.error = errorText;
          }

          results.push(responseData);
        } catch (error) {
          results.push({
            method: method.name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      result.success = results.some((r: any) => r.success);
      result.data = results;
      result.duration = Date.now() - startTime;
      
      logger.info('Different auth methods test completed', result);
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.duration = Date.now() - startTime;
      logger.error('Different auth methods test failed', { error: result.error });
    }

    this.results.push(result);
  }

  /**
   * Print debug results
   */
  printResults(): void {
    console.log('\n=== Department API Debug Results ===');
    
    this.results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.step}`);
      console.log(`   Success: ${result.success}`);
      console.log(`   Duration: ${result.duration}ms`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.data) {
        console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
      }
    });
  }
}

// Export singleton instance
export const departmentAPIDebugger = new DepartmentAPIDebugger(); 