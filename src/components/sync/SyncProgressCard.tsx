import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import Feather from 'react-native-vector-icons/Feather';
import { SyncProgress, SyncResult } from '../../service/syncService';
import { logger } from '../../utils/logger';

interface SyncProgressCardProps {
  progress: SyncProgress;
  results: SyncResult[];
  onRetry?: () => void;
  onStop?: () => void;
  style?: any;
}

export const SyncProgressCard: React.FC<SyncProgressCardProps> = ({
  progress,
  results,
  onRetry,
  onStop,
  style,
}) => {
  const { colors, shadows } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (progress.status === 'in_progress') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      animatedValue.setValue(0);
    }
  }, [progress.status, animatedValue]);

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'in_progress':
        return 'refresh-cw';
      case 'completed':
        return 'check-circle';
      case 'failed':
        return 'alert-circle';
      case 'paused':
        return 'pause-circle';
      default:
        return 'circle';
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'in_progress':
        return colors.primary;
      case 'completed':
        return colors.success;
      case 'failed':
        return colors.error;
      case 'paused':
        return colors.warning;
      default:
        return colors.placeholder;
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'in_progress':
        return progress.currentApi 
          ? `Syncing ${progress.currentApi}...`
          : 'Initializing sync...';
      case 'completed':
        return 'Sync completed successfully';
      case 'failed':
        return 'Sync failed';
      case 'paused':
        return 'Sync paused';
      default:
        return 'Ready to sync';
    }
  };

  const progressPercentage = progress.total > 0 
    ? (progress.completed / progress.total) * 100 
    : 0;

  const failedResults = results.filter(result => !result.success);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }, shadows.medium, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <Animated.View style={[
            styles.iconContainer,
            { 
              backgroundColor: getStatusColor() + '15',
              opacity: progress.status === 'in_progress' ? animatedValue : 1,
            }
          ]}>
            <Feather 
              name={getStatusIcon() as any} 
              size={24} 
              color={getStatusColor()} 
            />
          </Animated.View>
          <View style={styles.statusText}>
            <Text style={[styles.statusTitle, { color: colors.text }]}>
              {getStatusText()}
            </Text>
            <Text style={[styles.statusSubtitle, { color: colors.placeholder }]}>
              {progress.completed} of {progress.total} APIs completed
            </Text>
          </View>
        </View>
        
        {progress.status === 'in_progress' && onStop && (
          <TouchableOpacity 
            style={[styles.stopButton, { backgroundColor: colors.error + '15' }]}
            onPress={onStop}
          >
            <Feather name="stop-circle" size={20} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      {progress.total > 0 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: getStatusColor(),
                  width: `${progressPercentage}%`,
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: colors.placeholder }]}>
            {Math.round(progressPercentage)}%
          </Text>
        </View>
      )}

      {/* Failed APIs */}
      {failedResults.length > 0 && (
        <View style={styles.failedContainer}>
          <View style={styles.failedHeader}>
            <Feather name="alert-triangle" size={16} color={colors.error} />
            <Text style={[styles.failedTitle, { color: colors.error }]}>
              Failed APIs ({failedResults.length})
            </Text>
          </View>
          
          {failedResults.map((result, index) => (
            <View key={index} style={styles.failedItem}>
              <Text style={[styles.failedApiName, { color: colors.text }]}>
                {result.apiName}
              </Text>
              <Text style={[styles.failedError, { color: colors.placeholder }]}>
                {result.error}
              </Text>
            </View>
          ))}
          
          {onRetry && (
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.button }]}
              onPress={onRetry}
            >
              <Feather name="refresh-cw" size={16} color="#FFFFFF" />
              <Text style={[styles.retryText, { color: '#FFFFFF' }]}>
                Retry Failed APIs
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Success Summary */}
      {progress.status === 'completed' && progress.completed > 0 && (
        <View style={styles.successContainer}>
          <View style={styles.successHeader}>
            <Feather name="check-circle" size={16} color={colors.success} />
            <Text style={[styles.successTitle, { color: colors.success }]}>
              Sync Summary
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.placeholder }]}>
              Total APIs:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {progress.total}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.placeholder }]}>
              Successful:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {progress.completed}
            </Text>
          </View>
          
          {progress.failed > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.placeholder }]}>
                Failed:
              </Text>
              <Text style={[styles.summaryValue, { color: colors.error }]}>
                {progress.failed}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  failedContainer: {
    marginTop: 8,
  },
  failedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  failedTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  failedItem: {
    marginBottom: 6,
    paddingLeft: 22,
  },
  failedApiName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  failedError: {
    fontSize: 12,
    fontWeight: '400',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  successContainer: {
    marginTop: 8,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 