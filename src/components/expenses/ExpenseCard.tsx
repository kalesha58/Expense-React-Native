import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';
import { formatTransactionDate } from '../../utils/dateUtils';

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  status: 'approved' | 'pending' | 'rejected';
  date: string;
  items: number;
  category: string;
  // Additional fields from API
  businessPurpose?: string;
  departmentCode?: string;
  currency?: string;
  location?: string;
  supplier?: string;
  comments?: string;
  reportName?: string;
  numberOfDays?: string;
  toLocation?: string;
}

interface ExpenseCardProps {
  item: ExpenseItem;
  onPress: (id: string) => void;
  onMorePress?: () => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ 
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
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.categoryChip, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.categoryText, { color: colors.primary }]}>
              {item.category}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={onMorePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="more-horizontal" size={20} color={colors.placeholder} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.mainInfo}>
          <View style={styles.amountSection}>
            <Feather name="dollar-sign" size={16} color={colors.primary} />
            <Text style={[styles.amount, { color: colors.text }]}>
              ${item.amount.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Feather name="calendar" size={14} color={colors.placeholder} />
              <Text style={[styles.detailText, { color: colors.placeholder }]}>
                {formatTransactionDate(item.date)}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Feather name="file-text" size={14} color={colors.placeholder} />
              <Text style={[styles.detailText, { color: colors.placeholder }]}>
                {item.items} {item.items === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.actions}>
          <View style={[
            styles.statusChip,
            { backgroundColor: getStatusColor(item.status) + '15' }
          ]}>
            {getStatusIcon(item.status)}
            <Text 
              style={[
                styles.statusText, 
                { color: getStatusColor(item.status) }
              ]}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
          
          <Feather name="arrow-right" size={16} color={colors.placeholder} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radius,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    marginBottom: 8,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  moreButton: {
    padding: 4,
  },
  content: {
    gap: 16,
  },
  mainInfo: {
    gap: 12,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amount: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
  },
  details: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: SIZES.small,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
}); 