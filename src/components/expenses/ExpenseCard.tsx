import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';
import { formatTransactionDate } from '../../utils/dateUtils';
import { ExpenseDetail } from '../../hooks/useExpenseDetails';

// Interface for grouped expenses
export interface GroupedExpenseItem {
  id: string; // ReportHeaderId
  reportHeaderId: string;
  reportName: string;
  reportDate: string;
  title: string;
  amount: number;
  totalAmount: number;
  status: 'approved' | 'pending' | 'rejected';
  date: string;
  itemCount: number;
  category: string;
  items: ExpenseDetail[]; // All expense details for this report
  // Additional fields from the API
  businessPurpose?: string;
  departmentCode?: string;
  currency?: string;
  location?: string;
  supplier?: string;
  comments?: string;
  numberOfDays?: string;
  toLocation?: string;
}

interface GroupedExpenseCardProps {
  item: GroupedExpenseItem;
  onPress: (id: string) => void;
  onMorePress?: () => void;
}

export const GroupedExpenseCard: React.FC<GroupedExpenseCardProps> = ({
  item,
  onPress,
  onMorePress
}) => {
  const { colors, shadows } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'rejected':
        return colors.error;
      default:
        return colors.placeholder;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Feather name="check-circle" size={16} color={colors.success} />;
      case 'pending':
        return <Feather name="clock" size={16} color={colors.warning} />;
      case 'rejected':
        return <Feather name="alert-circle" size={16} color={colors.error} />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        shadows.medium
      ]}
      onPress={() => onPress(item.id)}
      activeOpacity={0.7}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.leftHeader}>
          <Text style={[styles.idLabel, { color: colors.placeholder }]}>
            Report ID
          </Text>
          <Text style={[styles.reportId, { color: colors.text }]} numberOfLines={1}>
            #{item.reportHeaderId}
          </Text>
        </View>

        <View style={styles.rightHeader}>
          <View style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            {getStatusIcon(item.status)}
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.contentRow}>
          <View style={styles.leftContent}>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Feather name="calendar" size={14} color={colors.placeholder} />
                <Text style={[styles.detailText, { color: colors.placeholder }]} numberOfLines={1}>
                  {formatTransactionDate(item.reportDate || item.date)}
                </Text>
              </View>

              {item.departmentCode && (
                <View style={styles.detailItem}>
                  <Feather name="briefcase" size={14} color={colors.placeholder} />
                  <Text style={[styles.detailText, { color: colors.placeholder }]} numberOfLines={1}>
                    {item.departmentCode}
                  </Text>
                </View>
              )}

              {item.location && (
                <View style={styles.detailItem}>
                  <Feather name="map-pin" size={14} color={colors.placeholder} />
                  <Text style={[styles.detailText, { color: colors.placeholder }]} numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>
              )}

              {item.supplier && (
                <View style={styles.detailItem}>
                  <Feather name="user" size={14} color={colors.placeholder} />
                  <Text style={[styles.detailText, { color: colors.placeholder }]} numberOfLines={1}>
                    {item.supplier}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.rightContent}>
            <View style={[styles.itemCountChip, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.itemCountText, { color: colors.primary }]}>
                {item.itemCount} {item.itemCount === 1 ? 'Item' : 'Items'}
              </Text>
            </View>
            
            <Text
              style={[
                styles.amountLarge,
                {
                  color: colors.text,
                  textAlign: 'right',
                  alignSelf: 'flex-end',
                }
              ]}
            >
              ${item.totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  // Styles for GroupedExpenseCard
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  idLabel: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  reportId: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
  },
  itemCountChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemCountText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  mainContent: {
    gap: 16,
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  leftContent: {
    flex: 1,
    marginRight: 16,
  },
  rightContent: {
    width: 'auto',
    minWidth: 80,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: 8,
  },
  amountLarge: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    textAlign: 'right',
    alignSelf: 'flex-end',
  },
  detailsGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  detailText: {
    fontSize: SIZES.small,
    flex: 1,
  },
}); 