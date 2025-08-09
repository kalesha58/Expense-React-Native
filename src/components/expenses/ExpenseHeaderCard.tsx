import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { SIZES, FONTS } from '../../constants/theme';
import { formatTransactionDate } from '../../utils/dateUtils';

interface GroupedExpenseDetail {
  reportHeaderId: string;
  reportName: string;
  reportDate: string;
  totalAmount: number;
  currency: string;
  status: 'approved' | 'pending' | 'rejected';
  items: any[];
}

interface ExpenseHeaderCardProps {
  expense: GroupedExpenseDetail;
  parentItemsCount?: number; // Optional count for parent items only
}

export const ExpenseHeaderCard: React.FC<ExpenseHeaderCardProps> = ({ expense, parentItemsCount }) => {
  const { colors, shadows } = useTheme();
  
  console.log('ExpenseHeaderCard - Received expense data:', {
    reportDate: expense.reportDate,
    reportName: expense.reportName,
    reportHeaderId: expense.reportHeaderId
  });

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
        return <Feather name="check-circle" size={20} color={colors.success} />;
      case 'pending':
        return <Feather name="clock" size={20} color={colors.warning} />;
      case 'rejected':
        return <Feather name="alert-circle" size={20} color={colors.error} />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  return (
    <View style={[
      styles.headerCard,
      {
        backgroundColor: colors.card,
        borderColor: colors.border,
      },
      shadows.medium
    ]}>
      {/* Status Badge */}
      <View style={[
        styles.statusBadge,
        { backgroundColor: getStatusColor(expense.status) + '15' }
      ]}>
        {getStatusIcon(expense.status)}
        <Text
          style={[
            styles.statusBadgeText,
            { color: getStatusColor(expense.status) }
          ]}
        >
          {getStatusText(expense.status)}
        </Text>
      </View>

      <View style={styles.reportHeader}>
        <View style={styles.reportTitleSection}>
          <Text style={[styles.reportTitle, { color: colors.text }]}>
            {expense.reportName || `EXP-${expense.reportHeaderId}`}
          </Text>
          <Text style={[styles.reportSubtitle, { color: colors.placeholder }]}>
            Report #{expense.reportHeaderId}
          </Text>
        </View>

        <View style={styles.amountSection}>
          <Text style={[styles.amountLabel, { color: colors.placeholder }]}>
            Total Amount
          </Text>
          <Text style={[styles.amountValue, { color: colors.text }]}>
            {expense.currency} {expense.totalAmount.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.detailsGrid}>
        <View style={styles.headerDetailRow}>
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Feather name="hash" size={16} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                Report ID
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {expense.reportHeaderId}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Feather name="calendar" size={16} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                Report Date
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatTransactionDate(expense.reportDate)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerDetailRow}>
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Feather name="list" size={16} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                Items Count
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {parentItemsCount !== undefined ? parentItemsCount : expense.items.length} {(parentItemsCount !== undefined ? parentItemsCount : expense.items.length) === 1 ? 'Item' : 'Items'}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Feather name="help-circle" size={16} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                Department
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {expense.items[0]?.DepartmentCode || 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    marginHorizontal: SIZES.padding,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusBadgeText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONTS.medium,
  },
  reportHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reportTitleSection: {
    flex: 1,
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 24,
    fontFamily: FONTS.bold,
  },
  reportSubtitle: {
    fontSize: SIZES.small,
    fontWeight: '500',
    lineHeight: 16,
    fontFamily: FONTS.medium,
  },
  amountSection: {
    marginBottom: 6,
    alignItems: 'flex-end',
    flex: 1,
  },
  amountLabel: {
    fontSize: SIZES.small,
    marginBottom: 2,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    textAlign: 'right',
  },
  amountValue: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    lineHeight: 24,
    fontFamily: FONTS.bold,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 12,
  },
  detailsGrid: {
    gap: 12,
  },
  headerDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: SIZES.small,
    marginBottom: 1,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  detailValue: {
    fontSize: SIZES.font,
    fontWeight: '600',
    lineHeight: 18,
    fontFamily: FONTS.medium,
  },
}); 