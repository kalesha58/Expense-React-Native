import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { ExpenseDetail } from '../../hooks/useExpenseDetails';
import { SIZES, FONTS } from '../../constants/theme';
import { formatTransactionDate } from '../../utils/dateUtils';

interface ExpenseItemCardProps {
  item: ExpenseDetail;
  onViewAttachments: (item: ExpenseDetail) => void;
  isLoadingAttachments: boolean;
  selectedItemId?: string;
}

export const ExpenseItemCard: React.FC<ExpenseItemCardProps> = ({
  item,
  onViewAttachments,
  isLoadingAttachments,
  selectedItemId,
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

  return (
    <View style={[
      styles.expenseItemCard,
      {
        backgroundColor: colors.card,
        borderColor: colors.border,
      },
      shadows.small
    ]}>
      <View style={styles.expenseItemHeader}>
        <View style={styles.expenseItemTitle}>
          <Text style={[styles.expenseItemTitleText, { color: colors.text }]}>
            {item.ExpenseItem}
          </Text>
          <View style={[
            styles.itemStatusChip,
            { backgroundColor: getStatusColor(item.ExpenseStatus) + '15' }
          ]}>
            <Text style={[styles.itemStatusText, { color: getStatusColor(item.ExpenseStatus) }]}>
              {item.ExpenseStatus === 'INVOICED' ? 'Approved' :
               item.ExpenseStatus === 'Pending Manager Approval' ? 'Pending' : 'Rejected'}
            </Text>
          </View>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.expenseItemAmount, { color: colors.text }]}>
            {item.Currency} {parseFloat(item.Amount).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.expenseItemDetails}>
        <View style={styles.detailRow}>
          <View style={[styles.detailIconSmall, { backgroundColor: colors.primary + '15' }]}>
            <Feather name="calendar" size={12} color={colors.primary} />
          </View>
          <Text style={[styles.detailText, { color: colors.placeholder }]}>
            {formatTransactionDate(item.TransactionDate)}
          </Text>
        </View>

        {item.Location && (
          <View style={styles.detailRow}>
            <View style={[styles.detailIconSmall, { backgroundColor: colors.secondary + '15' }]}>
              <Feather name="map-pin" size={12} color={colors.secondary} />
            </View>
            <Text style={[styles.detailText, { color: colors.placeholder }]} numberOfLines={1}>
              {item.Location}
            </Text>
          </View>
        )}

        {item.Supplier && (
          <View style={styles.detailRow}>
            <View style={[styles.detailIconSmall, { backgroundColor: colors.warning + '15' }]}>
              <Feather name="user" size={12} color={colors.warning} />
            </View>
            <Text style={[styles.detailText, { color: colors.placeholder }]} numberOfLines={1}>
              {item.Supplier}
            </Text>
          </View>
        )}

        {item.BusinessPurpose && (
          <View style={styles.detailRow}>
            <View style={[styles.detailIconSmall, { backgroundColor: colors.success + '15' }]}>
              <Feather name="briefcase" size={12} color={colors.success} />
            </View>
            <Text style={[styles.detailText, { color: colors.placeholder }]} numberOfLines={2}>
              {item.BusinessPurpose}
            </Text>
          </View>
        )}
      </View>

      {/* View Attachments Strip */}
      <TouchableOpacity
        style={[
          styles.viewAttachmentsStrip,
          { backgroundColor: colors.primary + '10', borderColor: colors.primary + '20' }
        ]}
        onPress={() => onViewAttachments(item)}
        disabled={isLoadingAttachments}
      >
        <View style={styles.viewAttachmentsContent}>
          <Feather name="paperclip" size={16} color={colors.primary} />
          <Text style={[styles.viewAttachmentsText, { color: colors.primary }]}>
            View Attachments
          </Text>
          {isLoadingAttachments && selectedItemId === item.LineId && (
            <Feather name="loader" size={16} color={colors.primary} style={styles.loadingIcon} />
          )}
        </View>
        <Feather name="chevron-right" size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  expenseItemCard: {
    borderRadius: SIZES.radius,
    padding: 16,
    borderWidth: 1,
  },
  expenseItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseItemTitle: {
    flex: 1,
    marginRight: 10,
  },
  expenseItemTitleText: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    lineHeight: 24,
    fontFamily: FONTS.bold,
  },
  itemStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  itemStatusText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONTS.medium,
  },
  expenseItemAmount: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    lineHeight: 24,
    fontFamily: FONTS.bold,
  },
  expenseItemDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: SIZES.small,
    lineHeight: 18,
    fontFamily: FONTS.regular,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  detailIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAttachmentsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: 'transparent',
    marginTop: 12,
  },
  viewAttachmentsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewAttachmentsText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  loadingIcon: {
    marginLeft: 8,
  },
}); 