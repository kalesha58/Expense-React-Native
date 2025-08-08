import { databaseManager, TableSchema } from '../utils/database';
import { API_SETTINGS, SYNC_CONFIG, NETWORK_CONFIG, ApiConfig, SyncStatus } from '../constants/appsettings';
import { apiRequest } from './api';
import { logger } from '../utils/logger';

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  currentApi?: string;
  status: 'idle' | 'in_progress' | 'completed' | 'failed' | 'paused';
}

export interface SyncResult {
  success: boolean;
  apiName: string;
  dataCount?: number;
  error?: string;
  duration?: number;
}

export interface SyncOptions {
  departmentId?: string;
  forceSync?: boolean;
  skipFailed?: boolean;
  onProgress?: (progress: SyncProgress) => void;
  onApiComplete?: (result: SyncResult) => void;
}

interface MetadataField {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

interface MetadataResponse {
  metadata?: MetadataField[];
  fields?: MetadataField[];
  columns?: MetadataField[];
  success?: boolean;
  message?: string;
}

class SyncService {
  private isRunning = false;
  private currentProgress: SyncProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    status: 'idle',
  };

  /**
   * Initialize the sync service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing sync service...');
      await databaseManager.initialize();
      logger.info('Sync service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize sync service', { error });
      throw error;
    }
  }

  /**
   * Start the sync process
   */
  async startSync(options: SyncOptions = {}): Promise<SyncResult[]> {
    if (this.isRunning) {
      logger.warn('Sync already in progress');
      return [];
    }

    this.isRunning = true;
    const startTime = Date.now();
    const results: SyncResult[] = [];

    try {
      logger.info('Starting sync process', { options });
      
      // Initialize database if not already done
      await this.initialize();

      // Filter APIs based on requirements
      const apisToSync = this.filterApisToSync(options);
      this.currentProgress = {
        total: apisToSync.length,
        completed: 0,
        failed: 0,
        status: 'in_progress',
      };

      logger.info('APIs to sync', { count: apisToSync.length, apis: apisToSync.map(a => a.name) });

      // Update progress
      this.updateProgress(options.onProgress);

      // Sync each API
      for (const apiConfig of apisToSync) {
        if (!this.isRunning) {
          logger.info('Sync process stopped');
          break;
        }

        this.currentProgress.currentApi = apiConfig.name;
        this.updateProgress(options.onProgress);

        const result = await this.syncApi(apiConfig, options);
        results.push(result);

        if (result.success) {
          this.currentProgress.completed++;
        } else {
          this.currentProgress.failed++;
          
          // Stop on first failure if not skipping failed
          if (!options.skipFailed) {
            logger.error('Sync failed, stopping process', { apiName: apiConfig.name });
            break;
          }
        }

        this.updateProgress(options.onProgress);
        
        // Notify API completion
        if (options.onApiComplete) {
          options.onApiComplete(result);
        }

        // Add delay between API calls to prevent overwhelming the server
        if (apisToSync.indexOf(apiConfig) < apisToSync.length - 1) {
          await this.delay(1000);
        }
      }

      const totalDuration = Date.now() - startTime;
      logger.info('Sync process completed', { 
        totalDuration, 
        results: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      });

      this.currentProgress.status = this.currentProgress.failed > 0 ? 'failed' : 'completed';
      this.updateProgress(options.onProgress);

      return results;

    } catch (error) {
      logger.error('Sync process failed', { error });
      this.currentProgress.status = 'failed';
      this.updateProgress(options.onProgress);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Stop the sync process
   */
  stopSync(): void {
    logger.info('Stopping sync process');
    this.isRunning = false;
    this.currentProgress.status = 'paused';
  }

  /**
   * Get current sync progress
   */
  getProgress(): SyncProgress {
    return { ...this.currentProgress };
  }

  /**
   * Check if sync is running
   */
  isSyncRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Filter APIs to sync based on options
   */
  private filterApisToSync(options: SyncOptions): ApiConfig[] {
    let apis = API_SETTINGS;

    // Filter by required APIs if not forcing sync
    if (!options.forceSync) {
      apis = apis.filter(api => api.isRequired);
    }
    return apis;
  }

  /**
   * Sync a single API
   */
  async syncApi(apiConfig: ApiConfig, options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      apiName: apiConfig.name,
    };

    try {
      logger.info('Starting API sync', { apiName: apiConfig.name });

      // 1. Get or create table schema dynamically from metadata
      const schema = await this.getDynamicTableSchema(apiConfig);

      // Convert dynamic schema to match TableSchema type
      const convertedSchema: TableSchema = {
        name: schema.name,
        columns: schema.columns.map(col => ({
          name: col.name,
          type: col.type as "TEXT" | "INTEGER" | "REAL" | "BLOB" | "NUMERIC",
          ...(col.constraints ? { constraints: col.constraints } : {})
        }))
      };

      await databaseManager.createTable(convertedSchema);

      // 2. Fetch data from API
      const data = await this.fetchApiData(apiConfig, options);
      if (!data || data.length === 0) {
        logger.warn('No data received from API', { apiName: apiConfig.name });
        result.success = true;
        result.dataCount = 0;
        return result;
      }

      // 3. Insert data into database
      const insertedCount = await databaseManager.insertData(apiConfig.tableName, data);
      
      result.success = true;
      result.dataCount = insertedCount;
      result.duration = Date.now() - startTime;

      // Simplified console log for data insertion
      console.log(`Data inserted: ${apiConfig.tableName} - ${insertedCount} records`);
      console.log('Data:', data);

      logger.info('API sync completed successfully', { 
        apiName: apiConfig.name, 
        dataCount: insertedCount,
        duration: result.duration,
      });

    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);
      result.duration = Date.now() - startTime;

      logger.error('API sync failed', { 
        apiName: apiConfig.name, 
        error: result.error,
        duration: result.duration,
      });
    }

    return result;
  }

  /**
   * Get dynamic table schema from API metadata
   */
  private async getDynamicTableSchema(apiConfig: ApiConfig) {
    try {
      logger.info('Fetching dynamic schema from metadata', { apiName: apiConfig.name });
      
      // Fetch metadata from backend
      const metadataResponse = await this.fetchApiMetadata(apiConfig);
      
      // Parse metadata to create dynamic schema
      const schema = this.parseMetadataToDynamicSchema(metadataResponse, apiConfig.tableName);
      
      logger.info('Dynamic schema created successfully', { 
        apiName: apiConfig.name, 
        columns: schema.columns.length 
      });
      
      return schema;
    } catch (error) {
      logger.error('Failed to get dynamic schema, using fallback', { 
        apiName: apiConfig.name, 
        error 
      });
      
      // Fallback to a basic schema if metadata fails
      return this.createFallbackSchema(apiConfig.tableName);
    }
  }

  /**
   * Fetch API metadata
   */
  private async fetchApiMetadata(apiConfig: ApiConfig): Promise<MetadataResponse> {
    try {
      const response = await apiRequest(
        apiConfig.metadataEndpoint,
        'GET',
        undefined,
        false
      );

      logger.info('Metadata fetched successfully', { apiName: apiConfig.name });
      // Ensure the response is of type MetadataResponse, or throw if not
      if (
        typeof response !== 'object' ||
        response === null ||
        (!('metadata' in response) && !('fields' in response) && !('columns' in response))
      ) {
        logger.error('Invalid metadata response format', { apiName: apiConfig.name, response });
        throw new Error('Invalid metadata response format');
      }
      return response as MetadataResponse;
    } catch (error) {
      logger.error('Failed to fetch metadata', { apiName: apiConfig.name, error });
      throw error;
    }
  }

  /**
   * Parse metadata to dynamic schema
   */
  private parseMetadataToDynamicSchema(metadata: MetadataResponse, tableName: string) {
    try {
      // Extract fields from different possible response formats
      let fields: MetadataField[] = [];
      
      if (metadata.metadata && Array.isArray(metadata.metadata)) {
        fields = metadata.metadata;
      } else if (metadata.fields && Array.isArray(metadata.fields)) {
        fields = metadata.fields;
      } else if (metadata.columns && Array.isArray(metadata.columns)) {
        fields = metadata.columns;
      } else {
        logger.warn('No metadata fields found in response', { metadata });
        throw new Error('No metadata fields found');
      }

      // Convert metadata fields to table columns
      const columns = fields.map(field => ({
        name: field.name,
        type: this.mapApiTypeToSqliteType(field.type),
        constraints: this.getFieldConstraints(field),
      }));

      // Add sync metadata columns
      columns.push(
        { name: 'LastSync', type: 'TEXT', constraints: [] },
        { name: 'SyncStatus', type: 'TEXT', constraints: [] }
      );

      return {
        name: tableName,
        columns,
      };
    } catch (error) {
      logger.error('Failed to parse metadata to schema', { error, metadata });
      throw new Error('Invalid metadata format');
    }
  }

  /**
   * Get field constraints based on metadata
   */
  private getFieldConstraints(field: MetadataField): string[] {
    const constraints: string[] = [];
    
    // Add PRIMARY KEY constraint for ID fields
    if (field.name.toLowerCase().includes('id') && field.name.toLowerCase() !== 'userid') {
      constraints.push('PRIMARY KEY');
    }
    
    // Add NOT NULL constraint for required fields
    if (field.required) {
      constraints.push('NOT NULL');
    }
    
    return constraints;
  }

  /**
   * Create fallback schema when metadata is unavailable
   */
  private createFallbackSchema(tableName: string) {
    logger.info('Creating fallback schema', { tableName });
    
    return {
      name: tableName,
      columns: [
        { name: 'ID', type: 'TEXT', constraints: ['PRIMARY KEY'] },
        { name: 'Data', type: 'TEXT' },
        { name: 'LastSync', type: 'TEXT' },
        { name: 'SyncStatus', type: 'TEXT' }
      ],
    };
  }

  /**
   * Fetch API data
   */
  private async fetchApiData(apiConfig: ApiConfig, options: SyncOptions): Promise<any[]> {
    try {
      const response = await apiRequest(
        apiConfig.dataEndpoint,
        'GET',
        undefined,
        false
      );

      // Handle different response formats
      let data: any[] = [];

      // Ensure 'response' is typed to avoid 'unknown' errors
      const resp: any = response;

      if (resp.data && Array.isArray(resp.data)) {
        data = resp.data;
      } else if (resp.Response && Array.isArray(resp.Response)) {
        data = resp.Response;
      } else if (resp.data && Array.isArray(resp.data) && resp.data.length > 0 && Array.isArray(resp.data[0])) {
        data = resp.data[0];
      } else {
        logger.warn('Unexpected response format', { apiName: apiConfig.name, response });
        data = [];
      }

      // Add sync metadata to each record
      const syncTimestamp = new Date().toISOString();
      data = data.map(item => ({
        ...item,
        LastSync: syncTimestamp,
      }));

      logger.info('Data fetched successfully', { 
        apiName: apiConfig.name, 
        dataCount: data.length 
      });

      return data;

    } catch (error) {
      logger.error('Failed to fetch data', { apiName: apiConfig.name, error });
      throw error;
    }
  }

  /**
   * Map API data types to SQLite types
   */
  private mapApiTypeToSqliteType(apiType: string): 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB' | 'NUMERIC' {
    const typeMap: Record<string, 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB' | 'NUMERIC'> = {
      'text': 'TEXT',
      'string': 'TEXT',
      'varchar': 'TEXT',
      'char': 'TEXT',
      'number': 'INTEGER',
      'integer': 'INTEGER',
      'int': 'INTEGER',
      'bigint': 'INTEGER',
      'float': 'REAL',
      'real': 'REAL',
      'double': 'REAL',
      'decimal': 'REAL',
      'numeric': 'NUMERIC',
      'date': 'TEXT',
      'datetime': 'TEXT',
      'timestamp': 'TEXT',
      'boolean': 'INTEGER',
      'bool': 'INTEGER',
      'blob': 'BLOB',
      'binary': 'BLOB',
    };

    return typeMap[apiType.toLowerCase()] || 'TEXT';
  }

  /**
   * Update progress and notify callback
   */
  private updateProgress(onProgress?: (progress: SyncProgress) => void) {
    if (onProgress) {
      onProgress({ ...this.currentProgress });
    }
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry failed APIs
   */
  async retryFailedApis(failedResults: SyncResult[], options: SyncOptions = {}): Promise<SyncResult[]> {
    logger.info('Retrying failed APIs', { count: failedResults.length });
    
    const results: SyncResult[] = [];
    
    for (const failedResult of failedResults) {
      const apiConfig = API_SETTINGS.find(api => api.name === failedResult.apiName);
      if (!apiConfig) {
        logger.warn('API config not found for retry', { apiName: failedResult.apiName });
        continue;
      }

      const result = await this.syncApi(apiConfig, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Get sync status for all APIs
   */
  async getSyncStatus(): Promise<SyncStatus[]> {
    const statuses: SyncStatus[] = [];

    for (const apiConfig of API_SETTINGS) {
      try {
        const exists = await databaseManager.tableExists(apiConfig.tableName);
        const data = exists ? await databaseManager.queryData(apiConfig.tableName) : [];
        
        statuses.push({
          name: apiConfig.name,
          status: exists ? 'completed' : 'pending',
          lastSync: data.length > 0 ? new Date(data[0].LastSync) : undefined,
          dataCount: data.length,
        });
      } catch (error) {
        statuses.push({
          name: apiConfig.name,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return statuses;
  }

  /**
   * Get dynamic schema for a specific API (for testing/debugging)
   */
  async getDynamicSchema(apiName: string): Promise<any> {
    const apiConfig = API_SETTINGS.find(api => api.name === apiName);
    if (!apiConfig) {
      throw new Error(`API config not found: ${apiName}`);
    }

    return await this.getDynamicTableSchema(apiConfig);
  }
}

// Export singleton instance
export const syncService = new SyncService();