import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { SIZES, FONTS } from '../../constants/theme';

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

interface LineItemCardProps {
  lineItem: LineItemData;
  onEdit: (lineItem: LineItemData) => void;
  onDelete: (lineItemId: string) => void;
}

export const LineItemCard: React.FC<LineItemCardProps> = ({
  lineItem,
  onEdit,
  onDelete,
}) => {
  const { colors } = useTheme();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: string, currency: string) => {
    return `${currency} ${parseFloat(amount).toFixed(2)}`;
  };

  const getExpenseTypeLabel = (expenseType: string) => {
    // Extract label from expense type value (assuming format: "id - label")
    const parts = expenseType.split(' - ');
    return parts.length > 1 ? parts[1] : expenseType;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header with receipt thumbnail and actions */}
      <View style={styles.header}>
        <View style={styles.receiptContainer}>
          {lineItem.receiptFiles.length > 0 ? (
            <Image
              source={{ uri: lineItem.receiptFiles[0].uri }}
              style={styles.receiptThumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.noReceipt, { backgroundColor: colors.border }]}>
              <Feather name="image" size={16} color={colors.textLight} />
            </View>
          )}
        </View>
        
        <View style={styles.actions}>
                     <TouchableOpacity
             style={[styles.actionButton, { backgroundColor: '#000000' }]}
             onPress={() => onEdit(lineItem)}
           >
             <Feather name="edit-2" size={14} color={colors.white} />
           </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={() => onDelete(lineItem.id)}
          >
            <Feather name="trash-2" size={14} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.mainInfo}>
          <Text style={[styles.expenseType, { color: colors.text }]}>
            {getExpenseTypeLabel(lineItem.expenseType)}
          </Text>
                     <Text style={[styles.amount, { color: '#000000' }]}>
             {formatAmount(lineItem.amount, lineItem.currency)}
           </Text>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Feather name="calendar" size={12} color={colors.textLight} />
            <Text style={[styles.detailText, { color: colors.textLight }]}>
              {formatDate(lineItem.date)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={12} color={colors.textLight} />
            <Text style={[styles.detailText, { color: colors.textLight }]}>
              {lineItem.location}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Feather name="briefcase" size={12} color={colors.textLight} />
            <Text style={[styles.detailText, { color: colors.textLight }]}>
              {lineItem.supplier}
            </Text>
          </View>
        </View>

        {lineItem.comment && (
          <View style={styles.commentContainer}>
            <Text style={[styles.commentText, { color: colors.textLight }]} numberOfLines={2}>
              {lineItem.comment}
            </Text>
          </View>
        )}

                 {lineItem.itemize && (
           <View style={styles.itemizeBadge}>
             <Feather name="list" size={10} color="#000000" />
             <Text style={[styles.itemizeText, { color: '#000000' }]}>
               Itemized
             </Text>
           </View>
         )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginBottom: SIZES.font,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.font,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  receiptContainer: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
  },
  receiptThumbnail: {
    width: '100%',
    height: '100%',
  },
  noReceipt: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: SIZES.base,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: SIZES.font,
  },
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.font,
  },
  expenseType: {
    fontSize: SIZES.font,
    fontFamily: FONTS.medium,
    flex: 1,
  },
  amount: {
    fontSize: SIZES.large,
    fontFamily: FONTS.bold,
  },
  details: {
    gap: SIZES.base,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base,
  },
  detailText: {
    fontSize: SIZES.small,
    fontFamily: FONTS.regular,
  },
  commentContainer: {
    marginTop: SIZES.font,
    paddingTop: SIZES.font,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  commentText: {
    fontSize: SIZES.small,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
  },
  itemizeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base,
    marginTop: SIZES.font,
    paddingTop: SIZES.font,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  itemizeText: {
    fontSize: SIZES.small,
    fontFamily: FONTS.medium,
  },
}); 