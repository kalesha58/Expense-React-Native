import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dropdown } from '../ui/Dropdown';
import { DatePicker } from '../ui/DatePicker';
import { TypeSelector } from '../ui/ExpenseTypeSelector';
import { SIZES } from '../../constants/theme';
import { CURRENCIES } from '../../constants/mockData';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IItemizedExpense {
  id: string;
  amount: string;
  currency: string;
  expenseType: string;
  date: Date;
  location: string;
  supplier: string;
  comment: string;
  // New required fields for payload
  numberOfDays?: string;
}

interface IItemizedExpenseFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (item: IItemizedExpense) => void;
  editItem?: IItemizedExpense;
}

export const ItemizedExpenseFormModal: React.FC<IItemizedExpenseFormModalProps> = ({
  visible,
  onClose,
  onSave,
  editItem,
}) => {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [formData, setFormData] = useState<IItemizedExpense>({
    id: '',
    amount: '',
    currency: 'USD',
    expenseType: '',
    date: new Date(),
    location: '',
    supplier: '',
    comment: '',
    numberOfDays: '1',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (editItem) {
      setFormData(editItem);
    } else {
      setFormData({
        id: `itemized_${Date.now()}`,
        amount: '',
        currency: 'USD',
        expenseType: '',
        date: new Date(),
        location: '',
        supplier: '',
        comment: '',
        numberOfDays: '1',
      });
    }
    setErrors({});
  }, [editItem, visible]);

  // Animate modal
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);

  const updateFormField = (field: keyof IItemizedExpense, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be positive';
    }
    
    if (!formData.expenseType.trim()) {
      newErrors.expenseType = 'Expense type is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!formData.supplier.trim()) {
      newErrors.supplier = 'Supplier is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    onSave(formData);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop, 
          { 
            opacity: backdropAnim,
            backgroundColor: 'rgba(0, 0, 0, 0.6)' 
          }
        ]}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          onPress={handleClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Modal Content */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            backgroundColor: colors.background,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Modal Handle */}
        <View style={styles.modalHandle}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {editItem ? 'Edit Item' : 'Add Item'}
          </Text>
          <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: colors.border + '30' }]}>
            <Feather name="x" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Form Content */}
        <ScrollView 
          style={styles.formContent}
          contentContainerStyle={styles.formContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Amount and Currency Row */}
          <View style={styles.amountRow}>
            <View style={{ flex: 2 }}>
              <Input
                label="Amount*"
                placeholder="Amount*"
                value={formData.amount}
                onChangeText={(text) => updateFormField('amount', text)}
                keyboardType="numeric"
                error={errors.amount}
                containerStyle={styles.inputContainer}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Dropdown
                label="Currency"
                placeholder="USD"
                options={CURRENCIES}
                value={formData.currency}
                onChange={(value) => updateFormField('currency', value)}
                containerStyle={styles.inputContainer}
              />
            </View>
          </View>

          {/* Expense Type Selector */}
          <TypeSelector
            label="Expense Type*"
            placeholder="Expense Type*"
            value={formData.expenseType}
            onChange={(value) => updateFormField('expenseType', value)}
            error={errors.expenseType}
            containerStyle={styles.inputContainer}
          />

          {/* Date Picker */}
          <DatePicker
            label=""
            value={formData.date}
            onChange={(date) => updateFormField('date', date)}
            containerStyle={styles.inputContainer}
          />

          {/* Location Input */}
          <Input
            label=""
            placeholder="Location"
            value={formData.location}
            onChangeText={(text) => updateFormField('location', text)}
            error={errors.location}
            containerStyle={styles.inputContainer}
          />

          {/* Supplier Input */}
          <Input
            label=""
            placeholder="Supplier"
            value={formData.supplier}
            onChangeText={(text) => updateFormField('supplier', text)}
            error={errors.supplier}
            containerStyle={styles.inputContainer}
          />

          {/* Comment Input */}
          <Input
            label=""
            placeholder="Comment"
            value={formData.comment}
            onChangeText={(text) => updateFormField('comment', text)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ height: 80, paddingTop: 12 }}
            containerStyle={styles.inputContainer}
          />

          {/* Number of Days Input */}
          <Input
            label=""
            placeholder="Number of Days"
            value={formData.numberOfDays}
            onChangeText={(text) => updateFormField('numberOfDays', text)}
            keyboardType="numeric"
            error={errors.numberOfDays}
            containerStyle={styles.inputContainer}
          />


        </ScrollView>

        {/* Bottom Actions */}
        <View style={[styles.bottomActions, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Button
            title={editItem ? "UPDATE ITEM" : "ADD ITEM"}
            onPress={handleSave}
            style={styles.saveButton}
          />
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  modalHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    position: 'relative',
  },
  modalTitle: {
    fontSize: SIZES.large,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 24,
    top: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContent: {
    flex: 1,
  },
  formContentContainer: {
    padding: 24,
    paddingBottom: 40,
    gap: 4,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  inputContainer: {
    marginBottom: 20,
  },
  bottomActions: {
    padding: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
  },
  saveButton: {
    marginBottom: 0,
    borderRadius: 16,
    paddingVertical: 16,
  },
});
