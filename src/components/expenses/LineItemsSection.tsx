import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { LineItemCard } from './LineItemCard';
import { SIZES } from '../../constants/theme';

interface LineItemData {
  id: string;
  receiptFiles: Array<{ uri: string; name?: string; mimeType?: string }>;
  amount: string;
  currency: string;
  expenseType: string;
  date: Date;
  location: string;
  supplier: string;
  comment: string;
  itemize?: boolean;
}

interface LineItemsSectionProps {
  lineItems: LineItemData[];
  onEditLineItem: (lineItem: LineItemData) => void;
  onDeleteLineItem: (lineItemId: string) => void;
  onAddLineItem: () => void;
}

export const LineItemsSection: React.FC<LineItemsSectionProps> = ({
  lineItems,
  onEditLineItem,
  onDeleteLineItem,
  onAddLineItem,
}) => {
  const { colors, shadows } = useTheme();

  const calculateTotalAmount = () => {
    return lineItems.reduce((total, item) => {
      return total + parseFloat(item.amount || '0');
    }, 0);
  };

  const formatTotalAmount = () => {
    const total = calculateTotalAmount();
    const currency = lineItems[0]?.currency || 'USD';
    return `${currency} ${total.toFixed(2)}`;
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, shadows.small]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.cardIcon, { backgroundColor: colors.primary + '15' }]}>
            <Feather name="list" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Line Items
          </Text>
          {lineItems.length > 0 && (
            <View style={[styles.itemCount, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.itemCountText, { color: colors.primary }]}>
                {lineItems.length}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {lineItems.length > 0 && (
        <View style={[styles.totalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.totalContent}>
            <Text style={[styles.totalLabel, { color: colors.placeholder }]}>
              Total Amount
            </Text>
            <Text style={[styles.totalAmount, { color: colors.text }]}>
              {formatTotalAmount()}
            </Text>
          </View>
          <View style={[styles.totalIcon, { backgroundColor: colors.primary + '15' }]}>
            <Feather name="dollar-sign" size={16} color={colors.primary} />
          </View>
        </View>
      )}
      
      {lineItems.map((lineItem) => (
        <LineItemCard
          key={lineItem.id}
          lineItem={lineItem}
          onEdit={onEditLineItem}
          onDelete={onDeleteLineItem}
        />
      ))}
      
      {lineItems.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '10' }]}>
            <Feather name="receipt" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Line Items Added
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
            Tap the + button above to add your first expense line item
          </Text>
          <TouchableOpacity
            style={[styles.emptyAddButton, { borderColor: colors.primary }]}
            onPress={onAddLineItem}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={16} color={colors.primary} />
            <Text style={[styles.emptyAddButtonText, { color: colors.primary }]}>
              Add First Line Item
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 0,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  itemCount: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  itemCountText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  totalContent: {
    flex: 1,
  },
  totalLabel: {
    fontSize: SIZES.small,
    marginBottom: 6,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  totalAmount: {
    fontSize: SIZES.large,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  totalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: SIZES.small,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 2,
    borderRadius: 16,
    gap: 10,
  },
  emptyAddButtonText: {
    fontSize: SIZES.font,
    fontWeight: '600',
  },
}); 