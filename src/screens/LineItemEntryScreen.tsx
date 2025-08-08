import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useExpense } from '../hooks/useExpense';
import { useTheme } from '../hooks/useTheme';
import { Header } from '../components/layout/Header';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Dropdown } from '../components/ui/Dropdown';
import { DatePicker } from '../components/ui/DatePicker';
import { ReceiptUpload } from '../components/ui/ReceiptUpload';
import { ReceiptUploadFallback } from '../components/ui/ReceiptUploadFallback';
import { receiptExtractionAPI } from '../service/api';
import { SIZES } from '../constants/theme';
import { EXPENSE_TYPES, CURRENCIES, PROJECT_CODES } from '../constants/mockData';
import { insertExpense } from '../services/sqlite';
import { navigate } from '../utils/NavigationUtils';
import { AsyncStorageService, type LineItem } from '../services/asyncStorage';

type ReceiptFile = {
  uri: string;
  name?: string;
  mimeType?: string;
};

interface ItemizedExpense {
  id: string;
  description: string;
  amount: number;
}

interface ReceiptExtractionResult {
  business_name: string;
  items: Array<{
    description: string;
    price: number;
  }>;
}

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

interface RouteParams {
  editMode?: boolean;
  lineItem?: LineItemData;
  onSave?: (lineItem: LineItemData) => void;
}

export const LineItemEntryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, shadows } = useTheme();
  const { addLineItem, header, lineItems, isLoading, submitReport } = useExpense();

  const params = route.params as RouteParams;
  const isEditMode = params?.editMode || false;
  const existingLineItem = params?.lineItem;
  const onSaveCallback = params?.onSave;

  const [date, setDate] = useState(new Date());
  const [expenseType, setExpenseType] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [location, setLocation] = useState('');
  const [supplier, setSupplier] = useState('');
  const [comments, setComments] = useState('');
  const [itemize, setItemize] = useState(false);
  const [receipts, setReceipts] = useState<ReceiptFile[]>([]);
  const [itemizedExpenses, setItemizedExpenses] = useState<ItemizedExpense[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle receipt extraction results
  const handleReceiptExtraction = React.useCallback((extractionResult: ReceiptExtractionResult) => {
    try {
      console.log('Receipt extraction callback called with:', extractionResult);
      
      // Auto-fill supplier name
      if (extractionResult.business_name) {
        console.log('Setting supplier to:', extractionResult.business_name);
        setSupplier(extractionResult.business_name);
      }

      // Calculate total amount from items
      const totalAmount = extractionResult.items.reduce((sum, item) => sum + item.price, 0);
      console.log('Setting amount to:', totalAmount.toFixed(2));
      setAmount(totalAmount.toFixed(2));

      // If itemization is enabled, populate itemized expenses
      if (itemize && extractionResult.items.length > 0) {
        console.log('Populating itemized expenses:', extractionResult.items);
        const newItemizedExpenses: ItemizedExpense[] = extractionResult.items.map((item, index) => ({
          id: `item_${Date.now()}_${index}`,
          description: item.description,
          amount: item.price,
        }));
        setItemizedExpenses(newItemizedExpenses);
      }

      // Clear any existing errors
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.supplier;
        delete newErrors.amount;
        return newErrors;
      });

      console.log('Receipt extraction processing completed successfully');

    } catch (error) {
      console.error('Error handling receipt extraction:', error);
      Alert.alert('Error', 'Failed to process extracted receipt data');
    }
  }, [itemize]);

  // Populate form with existing data if in edit mode
  useEffect(() => {
    if (isEditMode && existingLineItem) {
      setDate(existingLineItem.date);
      setExpenseType(existingLineItem.expenseType);
      setAmount(existingLineItem.amount);
      setCurrency(existingLineItem.currency);
      setLocation(existingLineItem.location);
      setSupplier(existingLineItem.supplier);
      setComments(existingLineItem.comment);
      setItemize(existingLineItem.itemize || false);
      setReceipts(existingLineItem.receiptFiles || []);
    }
  }, [isEditMode, existingLineItem]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!expenseType) newErrors.expenseType = 'Expense type is required';
    if (!supplier.trim()) newErrors.supplier = 'Supplier name is required';
    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    if (!currency) newErrors.currency = 'Currency is required';
    if (!location.trim()) newErrors.location = 'Location is required';

    // Validate itemized expenses if itemization is enabled
    if (itemize && itemizedExpenses.length > 0) {
      const totalItemizedAmount = itemizedExpenses.reduce((sum, item) => sum + item.amount, 0);
      const formAmount = parseFloat(amount) || 0;
      
      if (Math.abs(totalItemizedAmount - formAmount) > 0.01) {
        newErrors.amount = `Itemized total (${totalItemizedAmount.toFixed(2)}) doesn't match form amount (${formAmount.toFixed(2)})`;
      }
      
      // Check for empty descriptions
      itemizedExpenses.forEach((item, index) => {
        if (!item.description.trim()) {
          newErrors[`itemized_${index}`] = 'Item description is required';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddLineItem = () => {
    if (!validateForm()) return;

    const lineItemData: LineItemData = {
      id: existingLineItem?.id || Date.now().toString(),
      date,
      expenseType,
      supplier,
      amount,
      currency,
      location,
      comment: comments,
      itemize,
      receiptFiles: receipts,
    };

    if (isEditMode && onSaveCallback) {
      onSaveCallback(lineItemData);
    } else {
      // Convert to the format expected by addLineItem
      addLineItem({
        date,
        expenseType,
        supplier,
        amount: parseFloat(amount),
        currency,
        location,
        comments,
        itemize,
        receipts: receipts.length ? receipts : undefined,
      });
    }

    resetForm();
    Alert.alert('Line Item Added', 'You can add another or continue to review.');
  };

  const handleContinueToReview = async () => {
    if (!validateForm()) return;
    try {
      // Create the line item data
      const lineItemData: LineItemData = {
        id: existingLineItem?.id || Date.now().toString(),
        date,
        expenseType,
        supplier,
        amount,
        currency,
        location,
        comment: comments,
        itemize,
        receiptFiles: receipts,
      };

      if (isEditMode && onSaveCallback) {
        // Call the callback for edit mode
        onSaveCallback(lineItemData);
      } else {
        // Convert to the format expected by addLineItem
        addLineItem({
          date,
          expenseType,
          supplier,
          amount: parseFloat(amount),
          currency,
          location,
          comments,
          itemize,
          receipts: receipts.length ? receipts : undefined,
        });
      }

      // Save to AsyncStorage
      const asyncStorageLineItem: LineItem = {
        id: lineItemData.id,
        receipt: receipts.length > 0 ? receipts[0].uri : undefined,
        amount: parseFloat(amount),
        currency,
        expenseType,
        date: date.toISOString(),
        location,
        supplier,
        comment: comments,
        itemized: itemize ? [] : undefined,
      };

      if (isEditMode) {
        await AsyncStorageService.updateLineItem(asyncStorageLineItem);
      } else {
        await AsyncStorageService.addLineItem(asyncStorageLineItem);
      }

      // Navigate back to CreateExpenseScreen where the line item will be displayed
      navigate('CreateExpense');
    } catch (error) {
      console.error('Error saving line item:', error);
      Alert.alert('Error', 'Failed to save line item');
    }
  };

  const resetForm = () => {
    setDate(new Date());
    setExpenseType('');
    setSupplier('');
    setAmount('');
    setCurrency('USD');
    setLocation('');
    setComments('');
    setItemize(false);
    setReceipts([]);
    setItemizedExpenses([]);
    setErrors({});
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={isEditMode ? "Edit Line Item" : "Add Expense Line Item"} showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ReceiptUpload 
          value={receipts} 
          onChange={setReceipts} 
          onExtractionComplete={handleReceiptExtraction}
        />

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.small]}>
          <View style={styles.amountRow}>
            <View style={{ flex: 2 }}>
              <Input
                label="Amount"
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                error={errors.amount}
                containerStyle={styles.inputContainer}
              />
            </View>
            <View style={{ flex: 3 }}>
              <Dropdown
                label="Currency"
                placeholder="Select currency"
                options={CURRENCIES}
                value={currency}
                onChange={setCurrency}
                error={errors.currency}
                containerStyle={styles.inputContainer}
              />
            </View>
          </View>

          <DatePicker
            label="Date"
            value={date}
            onChange={setDate}
            containerStyle={styles.inputContainer}
          />

          <Dropdown
            label="Expense Type"
            placeholder="Select expense type"
            options={EXPENSE_TYPES}
            value={expenseType}
            onChange={setExpenseType}
            error={errors.expenseType}
            containerStyle={styles.inputContainer}
          />

          <Input
            label="Supplier"
            placeholder="Enter supplier name"
            value={supplier}
            onChangeText={setSupplier}
            error={errors.supplier}
            containerStyle={styles.inputContainer}
          />

          <Input
            label="Location"
            placeholder="Enter location"
            value={location}
            onChangeText={setLocation}
            error={errors.location}
            containerStyle={styles.inputContainer}
          />

          <Input
            label="Comment (Optional)"
            placeholder="Enter additional details"
            value={comments}
            onChangeText={setComments}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ height: 80, paddingTop: 12 }}
            containerStyle={styles.inputContainer}
          />

          <View style={styles.itemizeContainer}>
            <Text style={[styles.itemizeLabel, { color: colors.text }]}>
              Itemize this expense?
            </Text>
            <TouchableOpacity
              style={[styles.itemizeToggle, { backgroundColor: itemize ? colors.primary : colors.border }]}
              onPress={() => setItemize(!itemize)}
            >
              <View style={[
                styles.toggleCircle, 
                { 
                  backgroundColor: colors.background,
                  transform: [{ translateX: itemize ? 20 : 0 }]
                }
              ]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Itemized Expenses Section */}
        {itemize && (
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.small]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Itemized Expenses
            </Text>
            
            {itemizedExpenses.length > 0 ? (
              <View style={styles.itemizedList}>
                {itemizedExpenses.map((item, index) => (
                  <View key={item.id} style={[styles.itemizedItem, { borderColor: colors.border }]}>
                    <View style={styles.itemizedItemHeader}>
                      <Text style={[styles.itemizedItemTitle, { color: colors.text }]}>
                        Item {index + 1}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          const newItems = itemizedExpenses.filter((_, i) => i !== index);
                          setItemizedExpenses(newItems);
                        }}
                        style={styles.removeItemButton}
                      >
                        <Feather name="x" size={16} color={colors.error || '#F5222D'} />
                      </TouchableOpacity>
                    </View>
                    
                    <Input
                      label="Description"
                      placeholder="Enter item description"
                      value={item.description}
                      onChangeText={(text) => {
                        const newItems = [...itemizedExpenses];
                        newItems[index] = { ...item, description: text };
                        setItemizedExpenses(newItems);
                      }}
                      containerStyle={styles.itemizedInput}
                    />
                    
                    <Input
                      label="Amount"
                      placeholder="0.00"
                      value={item.amount.toString()}
                      onChangeText={(text) => {
                        const numValue = parseFloat(text) || 0;
                        const newItems = [...itemizedExpenses];
                        newItems[index] = { ...item, amount: numValue };
                        setItemizedExpenses(newItems);
                      }}
                      keyboardType="numeric"
                      containerStyle={styles.itemizedInput}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.emptyItemizedText, { color: colors.placeholder }]}>
                No itemized expenses yet. Upload a receipt to automatically populate items.
              </Text>
            )}
            
            <TouchableOpacity
              style={[styles.addItemButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                const newItem: ItemizedExpense = {
                  id: `item_${Date.now()}`,
                  description: '',
                  amount: 0,
                };
                setItemizedExpenses([...itemizedExpenses, newItem]);
              }}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
              <Text style={styles.addItemButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {!isEditMode && (
            <Button
              title="Add Another"
              onPress={handleAddLineItem}
              variant="outline"
              loading={isLoading}
              style={styles.actionButton}
            />
          )}
          <Button
            title={isEditMode ? "Update" : "Continue"}
            onPress={handleContinueToReview}
            loading={isLoading}
            style={[styles.actionButton, isEditMode && styles.fullWidthButton]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 12 },
  headerSection: { marginBottom: 20 },
  sectionTitle: { fontSize: SIZES.xxlarge, fontWeight: '700', marginBottom: 8 },
  sectionSubtitle: { fontSize: SIZES.medium, lineHeight: 20 },
  formCard: {
    borderRadius: SIZES.radius * 2,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  inputContainer: { marginBottom: 20 },
  amountRow: { flexDirection: 'row', gap: 12 },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: { flex: 1, marginTop: 0, marginBottom: 0 },
  fullWidthButton: { flex: 1 },
  itemizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  itemizeLabel: {
    fontSize: SIZES.medium,
    fontWeight: '600',
  },
  itemizeToggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    transform: [{ translateX: 0 }],
  },
  helpSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: SIZES.radius,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.1)',
  },
  helpTitle: { fontSize: SIZES.medium, fontWeight: '600', marginBottom: 8 },
  helpText: { fontSize: SIZES.small, lineHeight: 18 },
  // Itemized Expenses Styles
  itemizedList: {
    marginBottom: 16,
  },
  itemizedItem: {
    borderWidth: 1,
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 12,
  },
  itemizedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemizedItemTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
  },
  removeItemButton: {
    padding: 4,
  },
  itemizedInput: {
    marginBottom: 12,
  },
  emptyItemizedText: {
    textAlign: 'center',
    fontSize: SIZES.small,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: SIZES.radius,
    gap: 8,
  },
  addItemButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.medium,
    fontWeight: '600',
  },
}); 