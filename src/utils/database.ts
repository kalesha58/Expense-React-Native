// @ts-expect-error: No types for 'react-native-sqlite-storage'
import SQLite from 'react-native-sqlite-storage';
import { logger } from './logger';

// Enable debugging only in development mode
if (__DEV__) {
  SQLite.DEBUG(true);
}
SQLite.enablePromise(true);

export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB' | 'NUMERIC';
  constraints?: string[]; // e.g., ['PRIMARY KEY', 'NOT NULL', 'UNIQUE']
}

export interface DatabaseConfig {
  name: string;
  location?: string;
  createFromLocation?: string;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private database: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize the database connection
   */
  async initialize(config: DatabaseConfig = { name: 'expense_app.db' }): Promise<void> {
    if (this.isInitialized && this.database) {
      logger.info('Database already initialized');
      return;
    }

    try {
      logger.info('Initializing database...', { config });
      
      this.database = await SQLite.openDatabase({
        name: config.name,
        location: config.location || 'default',
        createFromLocation: config.createFromLocation,
      });

      this.isInitialized = true;
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database', { error });
    }
  }

  /**
   * Get the database instance
   */
  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.database || !this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.database;
  }

  /**
   * Check if a table exists
   */
  async tableExists(tableName: string): Promise<boolean> {
    try {
      const db = this.getDatabase();
      const result = await db.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName]
      );
      return result[0].rows.length > 0;
    } catch (error) {
      logger.error('Error checking if table exists', { tableName, error });
      return false;
    }
  }

  /**
   * Create a table based on schema
   */
  async createTable(schema: TableSchema): Promise<void> {
    try {
      const db = this.getDatabase();
      const exists = await this.tableExists(schema.name);
      
      if (exists) {
        logger.info('Table already exists', { tableName: schema.name });
        return;
      }

      const columns = schema.columns.map(col => {
        const constraints = col.constraints ? ` ${col.constraints.join(' ')}` : '';
        return `${col.name} ${col.type}${constraints}`;
      }).join(', ');

      const createTableSQL = `CREATE TABLE IF NOT EXISTS ${schema.name} (${columns})`;
      
      logger.info('Creating table', { tableName: schema.name, sql: createTableSQL });
      await db.executeSql(createTableSQL);
      
      logger.info('Table created successfully', { tableName: schema.name });
    } catch (error) {
      logger.error('Failed to create table', { schema, error });
      throw new Error(`Failed to create table ${schema.name}: ${error}`);
    }
  }

  /**
   * Insert data into a table
   */
  async insertData(tableName: string, data: any[]): Promise<number> {
    try {
      const db = this.getDatabase();
      
      if (data.length === 0) {
        logger.info('No data to insert', { tableName });
        return 0;
      }

      // Get column names from first data item
      const columns = Object.keys(data[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const insertSQL = `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

      let insertedCount = 0;
      
      for (const row of data) {
        const values = columns.map(col => row[col]);
        await db.executeSql(insertSQL, values);
        insertedCount++;
      }

      // Simplified console log for database insertion
      logger.info('Data inserted successfully', { 
        tableName, 
        insertedCount,
        totalRows: data.length 
      });
      
      return insertedCount;
    } catch (error) {
      logger.error('Failed to insert data', { tableName, error });
      throw new Error(`Failed to insert data into ${tableName}: ${error}`);
    }
  }

  /**
   * Query data from a table
   */
  async queryData(tableName: string, whereClause?: string, params?: any[]): Promise<any[]> {
    try {
      const db = this.getDatabase();
      const sql = whereClause 
        ? `SELECT * FROM ${tableName} WHERE ${whereClause}`
        : `SELECT * FROM ${tableName}`;
      
      const result = await db.executeSql(sql, params || []);
      const rows = result[0].rows.raw();
      
      logger.info('Data queried successfully', { 
        tableName, 
        rowCount: rows.length 
      });
      
      return rows;
    } catch (error) {
      logger.error('Failed to query data', { tableName, whereClause, error });
      throw new Error(`Failed to query data from ${tableName}: ${error}`);
    }
  }

  /**
   * Clear all data from a table
   */
  async clearTable(tableName: string): Promise<void> {
    try {
      const db = this.getDatabase();
      await db.executeSql(`DELETE FROM ${tableName}`);
      logger.info('Table cleared successfully', { tableName });
    } catch (error) {
      logger.error('Failed to clear table', { tableName, error });
      throw new Error(`Failed to clear table ${tableName}: ${error}`);
    }
  }

  /**
   * Drop a table
   */
  async dropTable(tableName: string): Promise<void> {
    try {
      const db = this.getDatabase();
      await db.executeSql(`DROP TABLE IF EXISTS ${tableName}`);
      logger.info('Table dropped successfully', { tableName });
    } catch (error) {
      logger.error('Failed to drop table', { tableName, error });
      throw new Error(`Failed to drop table ${tableName}: ${error}`);
    }
  }

  /**
   * Get table schema information
   */
  async getTableSchema(tableName: string): Promise<ColumnDefinition[]> {
    try {
      const db = this.getDatabase();
      const result = await db.executeSql(`PRAGMA table_info(${tableName})`);
      const rows = result[0].rows.raw();
      
      return rows.map((row: any) => ({
        name: row.name,
        type: row.type.toUpperCase(),
        constraints: row.notnull ? ['NOT NULL'] : [],
      }));
    } catch (error) {
      logger.error('Failed to get table schema', { tableName, error });
      throw new Error(`Failed to get schema for table ${tableName}: ${error}`);
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.database) {
      try {
        await this.database.close();
        this.database = null;
        this.isInitialized = false;
        logger.info('Database connection closed');
      } catch (error) {
        logger.error('Failed to close database', { error });
      }
    }
  }

  /**
   * Execute a raw SQL query (use with caution)
   */
  async executeRaw(sql: string, params?: any[]): Promise<any> {
    try {
      const db = this.getDatabase();
      const result = await db.executeSql(sql, params || []);
      return result[0];
    } catch (error) {
      logger.error('Failed to execute raw SQL', { sql, error });
      throw new Error(`Failed to execute SQL: ${error}`);
    }
  }

  /**
   * Get expense items from expense_items table
   */
  async getExpenseItems(): Promise<any[]> {
    try {
      logger.info('Fetching expense items from database...');
      
      // Check if table exists first
      const tableExists = await this.tableExists('expense_items');
      if (!tableExists) {
        logger.warn('expense_items table does not exist');
        return [];
      }
      
      // Query all expense items
      const items = await this.queryData('expense_items');
      
      logger.info('Expense items fetched successfully', { 
        count: items.length,
        sampleItem: items.length > 0 ? items[0] : null 
      });
      
      return items;
    } catch (error) {
      logger.error('Failed to fetch expense items', { error });
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();

// Export types for external use
export type { DatabaseManager }; 