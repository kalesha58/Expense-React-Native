import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../hooks/useTheme';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { DatePicker } from '../components/ui/DatePicker';
import { SIZES } from '../constants/theme';
import { ItemizedExpenseFormModal } from '../components/expenses';
import { AsyncStorageService } from '../services/asyncStorage';

interface IItemizedExpense {
  id: string;
  amount: string;
  currency: string;
  expenseType: string;
  date: Date;
  location: string;
  supplier: string;
  comment: string;
}

interface IRouteParams {
  mainExpense?: {
    name: string;
    receiptAmount: number;
    currency: string;
  };
  lineItemId?: string;
  onItemizedUpdate?: (count: number) => void;
  onAmountUpdate?: (newAmount: number) => void;
}

export const ItemizedBusinessExpensesScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, shadows } = useTheme();
  
  // Get params passed from previous screen
  const params = route.params as IRouteParams;
  const mainExpense = params?.mainExpense || {
    name: 'Dinner',
    receiptAmount: 5588.00,
    currency: 'USD'
  };
  
  const lineItemId = params?.lineItemId || '';
  const onItemizedUpdate = params?.onItemizedUpdate;
  const onAmountUpdate = params?.onAmountUpdate;

  // Debug logging
  console.log('🔍 ItemizedBusinessExpensesScreen Debug:', {
    params,
    mainExpense,
    lineItemId,
    hasUpdateCallback: !!onItemizedUpdate,
    hasAmountUpdateCallback: !!onAmountUpdate
  });

  const [itemizedExpenses, setItemizedExpenses] = useState<IItemizedExpense[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<IItemizedExpense | undefined>(undefined);

  // Load existing itemized expenses when screen loads
  useEffect(() => {
    const loadExistingItemizedExpenses = async () => {
      console.log('📥 Loading itemized expenses for lineItemId:', lineItemId);
      
      if (lineItemId) {
        try {
          const existingItemized = await AsyncStorageService.getItemizedExpenses(lineItemId);
          console.log('📦 Raw itemized data from storage:', existingItemized);
          
          // Convert ItemizedEntry to IItemizedExpense format
          const convertedItems: IItemizedExpense[] = existingItemized.map(item => ({
            id: item.id,
            amount: item.amount.toString(),
            currency: item.currency || mainExpense.currency,
            expenseType: item.expenseType || '',
            date: item.date ? new Date(item.date) : new Date(),
            location: item.location || '',
            supplier: item.supplier || '',
            comment: item.comment || '',
          }));
          
          console.log('✅ Converted itemized items:', convertedItems);
          setItemizedExpenses(convertedItems);
        } catch (error) {
          console.error('❌ Error loading existing itemized expenses:', error);
        }
      } else {
        console.log('⚠️ No lineItemId provided - showing empty state');
      }
    };

    loadExistingItemizedExpenses();
  }, [lineItemId, mainExpense.currency]);

  // Sync amount when user navigates back (on screen focus/blur)
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Only sync if there are itemized expenses
      if (itemizedExpenses.length > 0) {
        const itemizedTotal = calculateItemizedTotal();
        console.log(`📤 Auto-syncing amount on navigation back: ${itemizedTotal}`);
        
        // Update the line item amount in parent screen
        if (onAmountUpdate) {
          onAmountUpdate(itemizedTotal);
        }
      }
    });

    return unsubscribe;
  }, [navigation, itemizedExpenses, onAmountUpdate]);

  const calculateItemizedTotal = () => {
    return itemizedExpenses.reduce((total, item) => {
      return total + (parseFloat(item.amount) || 0);
    }, 0);
  };

  const validateItemizedExpenses = () => {
    const newErrors: Record<string, string> = {};
    
    itemizedExpenses.forEach((item, index) => {
      if (!item.amount.trim()) {
        newErrors[`amount_${index}`] = 'Amount is required';
      } else if (isNaN(parseFloat(item.amount)) || parseFloat(item.amount) <= 0) {
        newErrors[`amount_${index}`] = 'Amount must be positive';
      }
      if (!item.expenseType.trim()) {
        newErrors[`expenseType_${index}`] = 'Expense type is required';
      }
      if (!item.location.trim()) {
        newErrors[`location_${index}`] = 'Location is required';
      }
      if (!item.supplier.trim()) {
        newErrors[`supplier_${index}`] = 'Supplier is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddItemizedExpense = () => {
    setEditingItem(undefined);
    setShowFormModal(true);
  };

  const handleEditItemizedExpense = (item: IItemizedExpense) => {
    setEditingItem(item);
    setShowFormModal(true);
  };

  const handleUpdateItemizedExpense = (index: number, field: keyof IItemizedExpense, value: string | Date) => {
    const updatedItems = [...itemizedExpenses];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItemizedExpenses(updatedItems);
    
    // Clear error for this field
    const errorKey = `${field}_${index}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const handleRemoveItemizedExpense = (index: number) => {
    const updatedItems = itemizedExpenses.filter((_, i) => i !== index);
    setItemizedExpenses(updatedItems);
  };

  const handleSaveItemFromModal = (item: IItemizedExpense) => {
    if (editingItem) {
      // Update existing item
      const updatedItems = itemizedExpenses.map(existing => 
        existing.id === editingItem.id ? item : existing
      );
      setItemizedExpenses(updatedItems);
    } else {
      // Add new item
      setItemizedExpenses([...itemizedExpenses, item]);
    }
    setShowFormModal(false);
    setEditingItem(undefined);
  };

  // Business validation dialog for amount mismatch
  const showAmountMismatchDialog = (itemizedTotal: number, lineItemAmount: number) => {
    const difference = itemizedTotal - lineItemAmount;
    
    Alert.alert(
      '💼 Business Expense Validation',
      `⚠️ Amount Mismatch Detected\n\n` +
      `📋 Line Item Amount: ${mainExpense.currency} ${lineItemAmount.toFixed(2)}\n` +
      `📝 Itemized Total: ${mainExpense.currency} ${itemizedTotal.toFixed(2)}\n` +
      `📈 Difference: +${mainExpense.currency} ${difference.toFixed(2)}\n\n` +
      `🏢 Business Policy:\n` +
      `Itemized expenses cannot exceed the original receipt amount without proper justification.\n\n` +
      `📋 Your Options:`,
      [
        {
          text: '✏️ Change Amounts',
          style: 'default',
          onPress: () => {
            // Stay in itemized screen to modify amounts
            console.log('💡 User chose to modify itemized amounts');
          }
        },
        {
          text: '✅ Proceed Anyway',
          style: 'destructive',
          onPress: () => {
            // Auto-adjust line item amount and proceed
            handleProceedWithMismatch(itemizedTotal);
          }
        },
        {
          text: '❌ Cancel',
          style: 'cancel',
          onPress: () => {
            console.log('🚫 User cancelled save operation');
          }
        }
      ],
      { cancelable: true }
    );
  };

  // Handle proceeding with amount mismatch (auto-adjust line item)
  const handleProceedWithMismatch = async (newAmount: number) => {
    try {
      console.log(`🔄 Auto-adjusting line item amount from ${mainExpense.receiptAmount} to ${newAmount}`);
      
      // Update the main expense amount
      const updatedMainExpense = {
        ...mainExpense,
        receiptAmount: newAmount
      };

      // Update the line item amount in parent screen via callback
      if (onAmountUpdate) {
        onAmountUpdate(newAmount);
      }
      
      Alert.alert(
        '✅ Amount Adjusted',
        `Line item amount has been automatically updated to ${mainExpense.currency} ${newAmount.toFixed(2)} to match your itemized total.\n\n` +
        `📝 Note: This adjustment ensures your itemized expenses align with company expense policies.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Proceed with save using updated amount, but don't show success popup
              proceedWithSave(updatedMainExpense, false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error adjusting line item amount:', error);
      Alert.alert('Error', 'Failed to adjust line item amount. Please try again.');
    }
  };

  // Proceed with save after handling mismatch
  const proceedWithSave = async (updatedMainExpense = mainExpense, showSuccessPopup = true) => {
    try {
      // Convert IItemizedExpense to ItemizedEntry format for storage
      const itemizedEntries = itemizedExpenses.map(item => ({
        id: item.id,
        lineItemId: lineItemId,
        description: `${item.expenseType} - ${item.supplier}`,
        amount: parseFloat(item.amount),
        currency: item.currency,
        expenseType: item.expenseType,
        date: item.date.toISOString(),
        location: item.location,
        supplier: item.supplier,
        comment: item.comment,
        itemDescription: `${item.expenseType} - ${item.supplier}`,
        startDate: item.date.toISOString(),
        numberOfDays: '1',
        justification: item.comment,
        merchantName: item.supplier,
      }));

      // Save to AsyncStorage
      await AsyncStorageService.setItemizedExpenses(lineItemId, itemizedEntries);

      // Notify parent screen of the count update
      if (onItemizedUpdate) {
        onItemizedUpdate(itemizedExpenses.length);
      }

      if (showSuccessPopup) {
        Alert.alert('Success', 'Itemized expenses saved successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        // Direct navigation without success popup
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving itemized expenses:', error);
      Alert.alert('Error', 'Failed to save itemized expenses. Please try again.');
    }
  };

  const handleSaveItemizedExpenses = async () => {
    if (itemizedExpenses.length === 0) {
      Alert.alert('No Items', 'Please add at least one itemized expense');
      return;
    }

    if (!validateItemizedExpenses()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again');
      return;
    }

    const itemizedTotal = calculateItemizedTotal();
    const lineItemAmount = mainExpense.receiptAmount;
    
    // Always update the line item amount to match itemized total
    console.log(`🔄 Syncing line item amount: ${lineItemAmount} → ${itemizedTotal}`);
    
    // Update the line item amount in parent screen
    if (onAmountUpdate) {
      onAmountUpdate(itemizedTotal);
    }

    // Check for significant mismatch and show business validation popup
    const difference = Math.abs(itemizedTotal - lineItemAmount);
    const percentDifference = lineItemAmount > 0 ? (difference / lineItemAmount) * 100 : 0;
    
    if (itemizedTotal > lineItemAmount && percentDifference > 5) {
      // Show validation popup for significant increases (>5%)
      showAmountMismatchDialog(itemizedTotal, lineItemAmount);
      return;
    }

    // Proceed with save (amount already synced)
    await proceedWithSave();
  };

  // Debug render state
  console.log('🎨 Rendering ItemizedBusinessExpensesScreen:', {
    itemizedExpensesCount: itemizedExpenses.length,
    showFormModal,
    editingItem: !!editingItem
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Itemized Business Expenses" 
        showBackButton 
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Expense Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.small]}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              Main Expense: {mainExpense.name}
            </Text>
            {itemizedExpenses.length > 0 && (
              <View style={[styles.syncBadge, { backgroundColor: colors.success + '15' }]}>
                <Feather name="refresh-cw" size={12} color={colors.success} />
                <Text style={[styles.syncText, { color: colors.success }]}>
                  Auto-Sync
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.placeholder }]}>
                Original Amount
              </Text>
              <Text style={[styles.summaryAmount, { color: colors.placeholder }]}>
                {mainExpense.receiptAmount.toFixed(2)} {mainExpense.currency}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.placeholder }]}>
                Itemized Total
              </Text>
              <Text style={[styles.summaryAmount, { color: colors.primary, fontWeight: '700' }]}>
                {calculateItemizedTotal().toFixed(2)} {mainExpense.currency}
              </Text>
            </View>
          </View>
          
          {itemizedExpenses.length > 0 && (
            <View style={[styles.syncNotice, { backgroundColor: colors.primary + '08' }]}>
              <Feather name="info" size={14} color={colors.primary} />
              <Text style={[styles.syncNoticeText, { color: colors.primary }]}>
                Line item amount will be automatically updated to match itemized total
              </Text>
            </View>
          )}
        </View>

        {/* Itemized Expenses Section */}
        <View style={[styles.itemizedCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.small]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Itemized Expenses
            </Text>
            <View style={[styles.countBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.countText, { color: colors.primary }]}>
                {itemizedExpenses.length}
              </Text>
            </View>
          </View>

          {itemizedExpenses.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '08' }]}>
                <Feather name="receipt" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No itemized expenses yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
                Add your first itemized expense
              </Text>
              <TouchableOpacity
                style={[styles.emptyAddButton, { borderColor: colors.primary }]}
                onPress={handleAddItemizedExpense}
                activeOpacity={0.7}
              >
                <Feather name="plus" size={16} color={colors.primary} />
                <Text style={[styles.emptyAddButtonText, { color: colors.primary }]}>
                  Add Itemized Expense
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.itemizedList}>
              {itemizedExpenses.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemizedItem, { borderColor: colors.border }]}
                  onPress={() => handleEditItemizedExpense(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemizedHeader}>
                    <Text style={[styles.itemNumber, { color: colors.text }]}>
                      Item {index + 1}
                    </Text>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        onPress={() => handleEditItemizedExpense(item)}
                        style={styles.editButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Feather name="edit-2" size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRemoveItemizedExpense(index)}
                        style={styles.removeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Feather name="x" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.itemDetails}>
                    <View style={styles.itemDetailRow}>
                      <Text style={[styles.itemDetailLabel, { color: colors.placeholder }]}>
                        Amount:
                      </Text>
                      <Text style={[styles.itemDetailValue, { color: colors.text }]}>
                        {item.currency} {item.amount}
                      </Text>
                    </View>
                    
                    <View style={styles.itemDetailRow}>
                      <Text style={[styles.itemDetailLabel, { color: colors.placeholder }]}>
                        Type:
                      </Text>
                      <Text style={[styles.itemDetailValue, { color: colors.text }]}>
                        {item.expenseType || 'Not set'}
                      </Text>
                    </View>
                    
                    <View style={styles.itemDetailRow}>
                      <Text style={[styles.itemDetailLabel, { color: colors.placeholder }]}>
                        Location:
                      </Text>
                      <Text style={[styles.itemDetailValue, { color: colors.text }]}>
                        {item.location || 'Not set'}
                      </Text>
                    </View>
                    
                    <View style={styles.itemDetailRow}>
                      <Text style={[styles.itemDetailLabel, { color: colors.placeholder }]}>
                        Supplier:
                      </Text>
                      <Text style={[styles.itemDetailValue, { color: colors.text }]}>
                        {item.supplier || 'Not set'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Total Validation Warning */}
        {itemizedExpenses.length > 0 && calculateItemizedTotal() !== mainExpense.receiptAmount && (
          <View style={[styles.warningCard, { backgroundColor: colors.warning + '10', borderColor: colors.warning + '30' }]}>
            <View style={styles.warningContent}>
              <Feather name="alert-triangle" size={20} color={colors.warning} />
              <View style={styles.warningText}>
                <Text style={[styles.warningTitle, { color: colors.warning }]}>
                  Amount Mismatch
                </Text>
                <Text style={[styles.warningMessage, { color: colors.text }]}>
                  Itemized total ({calculateItemizedTotal().toFixed(2)}) doesn't match receipt amount ({mainExpense.receiptAmount.toFixed(2)})
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button - Only show when there are items */}
      {itemizedExpenses.length > 0 && (
        <TouchableOpacity
          style={[styles.floatingActionButton, { backgroundColor: colors.button }]}
          onPress={handleAddItemizedExpense}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Bottom Actions - Save Button */}
      {itemizedExpenses.length > 0 && (
        <View style={[styles.bottomActions, { backgroundColor: colors.background + 'E6', borderTopColor: colors.border + '80' }]}>
          <Button
            title="Save Itemized Expenses"
            onPress={handleSaveItemizedExpenses}
            style={styles.saveButton}
          />
        </View>
      )}

      {/* Itemized Expense Form Modal */}
      <ItemizedExpenseFormModal
        visible={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingItem(undefined);
        }}
        onSave={handleSaveItemFromModal}
        editItem={editingItem}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120, // Extra padding for floating button and bottom actions
  },
  summaryCard: {
    borderRadius: SIZES.radius * 1.5,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: SIZES.large,
    fontWeight: '700',
    flex: 1,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  syncText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  syncNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  syncNoticeText: {
    fontSize: SIZES.small,
    flex: 1,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: SIZES.small,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: SIZES.medium,
    fontWeight: '600',
  },
  itemizedCard: {
    borderRadius: SIZES.radius * 1.5,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginTop: 12,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: SIZES.small,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 2,
    borderRadius: 12,
    gap: 8,
  },
  emptyAddButtonText: {
    fontSize: SIZES.font,
    fontWeight: '600',
  },
  itemizedList: {
    gap: 16,
  },
  itemizedItem: {
    borderWidth: 1,
    borderRadius: SIZES.radius,
    padding: 16,
  },
  itemizedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemNumber: {
    fontSize: SIZES.medium,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  itemDetails: {
    gap: 8,
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDetailLabel: {
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  itemDetailValue: {
    fontSize: SIZES.small,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  inputContainer: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 12,
  },
  warningCard: {
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    marginBottom: 4,
  },
  warningMessage: {
    fontSize: SIZES.small,
    lineHeight: 18,
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 12,
  },
  addButton: {
    marginBottom: 0,
  },
  saveButton: {
    flex: 1,
    marginBottom: 0,
  },
});
