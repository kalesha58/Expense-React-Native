import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { syncService, SyncProgress, SyncResult, SyncOptions } from '../service/syncService';
import { SyncStatus } from '../constants/appsettings';
import { logger } from '../utils/logger';

interface SyncContextType {
  // State
  isSyncRunning: boolean;
  syncProgress: SyncProgress;
  syncResults: SyncResult[];
  syncStatuses: SyncStatus[];
  failedApis: string[];
  
  // Actions
  startSync: (options?: SyncOptions) => Promise<SyncResult[]>;
  stopSync: () => void;
  retryFailedApis: () => Promise<SyncResult[]>;
  refreshSyncStatus: () => Promise<void>;
  
  // Utilities
  getApiStatus: (apiName: string) => SyncStatus | undefined;
  hasFailedApis: boolean;
  syncCompletionPercentage: number;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const [isSyncRunning, setIsSyncRunning] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    status: 'idle',
  });
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);

  // Computed values
  const failedApis = syncResults
    .filter(result => !result.success)
    .map(result => result.apiName);

  const hasFailedApis = failedApis.length > 0;

  const syncCompletionPercentage = syncProgress.total > 0 
    ? Math.round((syncProgress.completed / syncProgress.total) * 100)
    : 0;

  // Initialize sync status on mount
  useEffect(() => {
    refreshSyncStatus();
  }, []);

  // Monitor sync service state
  useEffect(() => {
    const checkSyncState = () => {
      const isRunning = syncService.isSyncRunning();
      setIsSyncRunning(isRunning);
      
      if (!isRunning && syncProgress.status === 'in_progress') {
        setSyncProgress(prev => ({ ...prev, status: 'completed' }));
      }
    };

    const interval = setInterval(checkSyncState, 1000);
    return () => clearInterval(interval);
  }, [syncProgress.status]);

  const startSync = async (options: SyncOptions = {}): Promise<SyncResult[]> => {
    try {
      logger.info('Starting sync from context', { options });
      
      setIsSyncRunning(true);
      setSyncResults([]);
      
      const results = await syncService.startSync({
        ...options,
        onProgress: (progress) => {
          setSyncProgress(progress);
          logger.info('Sync progress updated', { progress });
        },
        onApiComplete: (result) => {
          setSyncResults(prev => [...prev, result]);
          logger.info('API sync completed', { result });
        },
      });

      setSyncResults(results);
      await refreshSyncStatus();
      
      logger.info('Sync completed from context', { 
        totalResults: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      });

      return results;
    } catch (error) {
      logger.error('Sync failed from context', { error });
      setSyncProgress(prev => ({ ...prev, status: 'failed' }));
      throw error;
    } finally {
      setIsSyncRunning(false);
    }
  };

  const stopSync = () => {
    logger.info('Stopping sync from context');
    syncService.stopSync();
    setIsSyncRunning(false);
    setSyncProgress(prev => ({ ...prev, status: 'paused' }));
  };

  const retryFailedApis = async (): Promise<SyncResult[]> => {
    try {
      logger.info('Retrying failed APIs from context', { failedApis });
      
      const failedResults = syncResults.filter(result => !result.success);
      const results = await syncService.retryFailedApis(failedResults, {
        onProgress: (progress) => {
          setSyncProgress(progress);
        },
        onApiComplete: (result) => {
          setSyncResults(prev => {
            const updated = prev.map(r => 
              r.apiName === result.apiName ? result : r
            );
            return updated;
          });
        },
      });

      // Update results with retry results
      setSyncResults(prev => {
        const updated = [...prev];
        results.forEach(result => {
          const index = updated.findIndex(r => r.apiName === result.apiName);
          if (index !== -1) {
            updated[index] = result;
          }
        });
        return updated;
      });

      await refreshSyncStatus();
      
      logger.info('Retry completed', { 
        retryResults: results.length,
        successful: results.filter(r => r.success).length,
      });

      return results;
    } catch (error) {
      logger.error('Retry failed', { error });
      throw error;
    }
  };

  const refreshSyncStatus = async (): Promise<void> => {
    try {
      const statuses = await syncService.getSyncStatus();
      setSyncStatuses(statuses);
      logger.info('Sync status refreshed', { statuses });
    } catch (error) {
      logger.error('Failed to refresh sync status', { error });
    }
  };

  const getApiStatus = (apiName: string): SyncStatus | undefined => {
    return syncStatuses.find(status => status.name === apiName);
  };

  const contextValue: SyncContextType = {
    // State
    isSyncRunning,
    syncProgress,
    syncResults,
    syncStatuses,
    failedApis,
    
    // Actions
    startSync,
    stopSync,
    retryFailedApis,
    refreshSyncStatus,
    
    // Utilities
    getApiStatus,
    hasFailedApis,
    syncCompletionPercentage,
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};

// Export for external use
export type { SyncContextType }; 