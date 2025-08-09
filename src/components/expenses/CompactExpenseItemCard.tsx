import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { ExpenseDetail } from '../../hooks/useExpenseDetails';
import { SIZES, FONTS } from '../../constants/theme';
import { formatTransactionDate } from '../../utils/dateUtils';

interface CompactExpenseItemCardProps {
  item: ExpenseDetail;
  onViewAttachments: (item: ExpenseDetail) => void;
  onViewDetails?: (item: ExpenseDetail) => void;
  isLoadingAttachments: boolean;
  selectedItemId?: string;
  hasItemized?: boolean;
  itemizedCount?: number;
}

export const CompactExpenseItemCard: React.FC<CompactExpenseItemCardProps> = ({
  item,
  onViewAttachments,
  onViewDetails,
  isLoadingAttachments,
  selectedItemId,
  hasItemized = false,
  itemizedCount = 0,
}) => {
  const { colors, shadows } = useTheme();

  const handleCardPress = () => {
    if (onViewDetails) {
      onViewDetails(item);
    } else {
      // Fallback to attachments if no details handler
      onViewAttachments(item);
    }
  };

  const handleAttachmentPress = () => {
    onViewAttachments(item);
  };

  const isSelected = selectedItemId === item.LineId;

  return (
    <View style={[
      styles.expenseItemCard,
      {
        backgroundColor: colors.card,
        borderColor: isSelected ? colors.primary : colors.border,
      },
      shadows.small
    ]}>
      <View style={styles.expenseItemHeader}>
        <TouchableOpacity
          style={styles.leftSection}
          onPress={handleCardPress}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Feather name="file-text" size={16} color={colors.primary} />
          </View>
          <View style={styles.itemInfo}>
            <View style={styles.titleRow}>
              <Text style={[styles.expenseItemTitle, { color: colors.text }]} numberOfLines={1}>
                {item.ExpenseItem}
              </Text>
              {hasItemized && (
                <View style={[styles.itemizedTag, { backgroundColor: colors.secondary + '15' }]}>
                  <Feather name="list" size={10} color={colors.secondary} />
                  <Text style={[styles.itemizedText, { color: colors.secondary }]}>
                    Has Itemized ({itemizedCount})
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.expenseItemDate, { color: colors.placeholder }]}>
              {formatTransactionDate(item.TransactionDate)}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.rightSection}>
          <Text style={[styles.expenseItemAmount, { color: colors.text }]}>
            {item.Currency} {parseFloat(item.Amount).toFixed(2)}
          </Text>
          <TouchableOpacity
            style={[styles.attachmentButton, { backgroundColor: colors.primary + '08' }]}
            onPress={handleAttachmentPress}
            disabled={isLoadingAttachments}
          >
            <Feather 
              name="paperclip" 
              size={14} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  expenseItemCard: {
    borderRadius: SIZES.radius,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  expenseItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  expenseItemTitle: {
    fontSize: SIZES.font,
    fontWeight: '600',
    fontFamily: FONTS.medium,
    flex: 1,
  },
  itemizedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  itemizedText: {
    fontSize: SIZES.small - 1,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  expenseItemDate: {
    fontSize: SIZES.small,
    fontFamily: FONTS.regular,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expenseItemAmount: {
    fontSize: SIZES.font,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  attachmentButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
