import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';
import { formatTransactionDate } from '../../utils/dateUtils';
import { ExpenseDetail } from '../../hooks/useExpenseDetails';

const { width: screenWidth } = Dimensions.get('window');

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

  const getStatusBadgeColors = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          backgroundColor: '#E8F5E880', // More transparent light green background
          textColor: '#4CAF50', // Darker green text
        };
      case 'pending':
        return {
          backgroundColor: '#FFF8E180', // More transparent light yellow background
          textColor: '#FF9800', // Darker orange text
        };
      case 'rejected':
        return {
          backgroundColor: '#FFEBEE80', // More transparent light red background
          textColor: '#F44336', // Darker red text
        };
      default:
        return {
          backgroundColor: colors.disabled,
          textColor: colors.placeholder,
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Feather name="check-circle" size={14} color={colors.success} />;
      case 'pending':
        return <Feather name="clock" size={14} color={colors.warning} />;
      case 'rejected':
        return <Feather name="alert-circle" size={14} color={colors.error} />;
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
          borderLeftColor: getStatusColor(item.status),
        },
        shadows.medium
      ]}
      onPress={() => onPress(item.id)}
      activeOpacity={0.7}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.titleContainer}>
          <Text style={[styles.reportTitle, { color: colors.text }]} numberOfLines={2}>
            {item.reportName || item.title}
          </Text>
          <View style={styles.subtitleRow}>
            <Text style={[styles.categoryText, { color: colors.placeholder }]}>
              {item.category || 'Business Travel'}
            </Text>
            <Text style={[styles.dotSeparator, { color: colors.placeholder }]}> • </Text>
            <Text style={[styles.dateText, { color: colors.placeholder }]}>
              {formatTransactionDate(item.reportDate || item.date)}
            </Text>
          </View>
        </View>

        <View style={styles.amountStatusContainer}>
          <Text style={[styles.mainAmount, { color: colors.text }]}>
            ${item.totalAmount.toFixed(2)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColors(item.status).backgroundColor }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusBadgeColors(item.status).textColor }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Details Section */}
      <View style={styles.detailsSection}>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Feather name="check-circle" size={16} color={colors.placeholder} />
            <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
              {item.itemCount} {item.itemCount === 1 ? 'Item' : 'Items'}
            </Text>
          </View>

          {item.location && (
            <View style={styles.detailItem}>
              <Feather name="map-pin" size={16} color={colors.placeholder} />
              <Text style={[styles.detailLabel, { color: colors.placeholder }]} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.detailsRow}>
          {item.businessPurpose && (
            <View style={styles.detailItem}>
              <Feather name="briefcase" size={16} color={colors.placeholder} />
              <Text style={[styles.detailLabel, { color: colors.placeholder }]} numberOfLines={1}>
                {item.businessPurpose}
              </Text>
            </View>
          )}

          {item.supplier && (
            <View style={styles.detailItem}>
              <Feather name="star" size={16} color={colors.placeholder} />
              <Text style={[styles.detailLabel, { color: colors.placeholder }]} numberOfLines={1}>
                {item.supplier}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Helper function to get responsive dimensions
const getResponsiveDimensions = () => {
  const isTablet = screenWidth >= 768;
  const isLargePhone = screenWidth >= 414;
  
  return {
    padding: isTablet ? 20 : isLargePhone ? 18 : 16,
    marginBottom: isTablet ? 12 : 8,
    fontSize: {
      title: isTablet ? SIZES.large + 4 : SIZES.large,
      amount: isTablet ? SIZES.large + 4 : SIZES.large + 2,
      text: isTablet ? SIZES.font + 2 : SIZES.font,
      small: isTablet ? SIZES.small + 1 : SIZES.small,
    }
  };
};

const responsiveDims = getResponsiveDimensions();

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radius,
    padding: responsiveDims.padding,
    marginBottom: responsiveDims.marginBottom,
    marginHorizontal: SIZES.base / 2, // Reduced from SIZES.base to SIZES.base/2 (4px instead of 8px)
    borderWidth: 1,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Ensure card takes full available width minus reduced margins
    width: screenWidth - (SIZES.padding * 2) - (SIZES.base), // Reduced from SIZES.base * 2 to SIZES.base
    alignSelf: 'center',
  },
  // New header section styles
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  reportTitle: {
    fontSize: responsiveDims.fontSize.title,
    fontWeight: 'bold',
    marginBottom: 2,
    lineHeight: responsiveDims.fontSize.title + 6,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  categoryText: {
    fontSize: responsiveDims.fontSize.text,
    fontWeight: '500',
  },
  dotSeparator: {
    fontSize: responsiveDims.fontSize.text,
    fontWeight: '500',
  },
  dateText: {
    fontSize: responsiveDims.fontSize.text,
    fontWeight: '500',
  },
  amountStatusContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  mainAmount: {
    fontSize: responsiveDims.fontSize.amount,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: responsiveDims.fontSize.small - 1,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Details section styles
  detailsSection: {
    gap: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailLabel: {
    fontSize: responsiveDims.fontSize.text,
    fontWeight: '500',
    flex: 1,
  },
  // Legacy styles for backward compatibility
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
  detailText: {
    fontSize: SIZES.small,
    flex: 1,
  },
}); 