import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../hooks/useTheme';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { DatePicker } from '../components/ui/DatePicker';
import { ReceiptUpload } from '../components/ui/ReceiptUpload';
import { SIZES } from '../constants/theme';
import { navigate } from '../utils/NavigationUtils';
import useDepartments, { type Department } from '../hooks/useDepartments';
import useExpenseItems, { type ExpenseItem } from '../hooks/useExpenseItems';
import { FONTS } from '../constants/theme';

interface ExpenseFormData {
  title: string;
  amount: string;
  currency: string;
  date: Date;
  expenseType: string;
  department: string;
  businessPurpose: string;
  location: string;
  supplier: string;
  comments: string;
  receiptFiles: Array<{ uri: string; name?: string; mimeType?: string }>;
}

const CURRENCIES = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'GBP', value: 'GBP' },
  { label: 'INR', value: 'INR' },
];

export const CreateExpenseScreen: React.FC = () => {
  const { colors } = useTheme();
  const { departments } = useDepartments();
  const { expenseItems, loading: expenseItemsLoading } = useExpenseItems();
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    title: '',
    amount: '',
    currency: 'USD',
    date: new Date(),
    expenseType: '',
    department: '',
    businessPurpose: '',
    location: '',
    supplier: '',
    comments: '',
    receiptFiles: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = useCallback((field: keyof ExpenseFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleDateChange = useCallback((date: Date) => {
    updateFormData('date', date);
  }, [updateFormData]);

  const handleReceiptUpload = useCallback((files: Array<{ uri: string; name?: string; mimeType?: string }>) => {
    setFormData(prev => ({
      ...prev,
      receiptFiles: files,
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter an expense title');
      return false;
    }
    
    if (!formData.amount.trim() || parseFloat(formData.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }
    
    if (!formData.expenseType) {
      Alert.alert('Error', 'Please select an expense type');
      return false;
    }
    
    if (!formData.department) {
      Alert.alert('Error', 'Please select a department');
      return false;
    }
    
    if (!formData.businessPurpose.trim()) {
      Alert.alert('Error', 'Please enter a business purpose');
      return false;
    }
    
    return true;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: Implement API call to create expense
      console.log('Submitting expense:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Success',
        'Expense created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigate('Expense'),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create expense:', error);
      Alert.alert('Error', 'Failed to create expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel',
      'Are you sure you want to cancel? All entered data will be lost.',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => navigate('Expense'),
        },
      ]
    );
  }, []);

  const departmentOptions = departments.map((dept: Department) => ({
    label: `${dept.departmentCode} - ${dept.departmentName}`,
    value: dept.departmentCode + ' - ' + dept.departmentName,
  }));

  const expenseTypeOptions = expenseItems.length > 0 
    ? expenseItems.map((item: ExpenseItem) => ({
        label: item.expenseItem,
        value: item.id,
      }))
    : [
        { label: 'Hotel', value: 'hotel' },
        { label: 'Airfare', value: 'airfare' },
        { label: 'Car Rental', value: 'car_rental' },
        { label: 'Meal', value: 'meal' },
        { label: 'Dinner', value: 'dinner' },
        { label: 'Breakfast', value: 'breakfast' },
        { label: 'Telephone', value: 'telephone' },
        { label: 'Entertainment', value: 'entertainment' },
        { label: 'Cab', value: 'cab' },
      ];

  // Debug logging
  console.log('Expense Items Loading:', expenseItemsLoading);
  console.log('Expense Items Count:', expenseItems.length);
  console.log('Expense Type Options:', expenseTypeOptions);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Create Expense"
        showThemeToggle={true}
        rightComponent={
          <TouchableOpacity onPress={handleCancel}>
            <Feather name="x" size={24} color={colors.primary} />
          </TouchableOpacity>
        }
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="file-text" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Basic Information
              </Text>
            </View>
            
            <Input
              label="Expense Title"
              value={formData.title}
              onChangeText={(text) => updateFormData('title', text)}
              placeholder="Enter expense title"
            />
            
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Input
                  label="Amount"
                  value={formData.amount}
                  onChangeText={(text) => updateFormData('amount', text)}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfWidth}>
                <Dropdown
                  label="Currency"
                  value={formData.currency}
                  options={CURRENCIES}
                  onChange={(value: string) => updateFormData('currency', value)}
                />
              </View>
            </View>
            
            <DatePicker
              label="Expense Date"
              value={formData.date}
              onChange={handleDateChange}
            />
          </View>

          {/* Expense Type and Department */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="tag" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Classification
              </Text>
            </View>
            
            <Dropdown
              label="Expense Type"
              value={formData.expenseType}
              options={expenseTypeOptions}
              onChange={(value: string) => updateFormData('expenseType', value)}
              placeholder={expenseItemsLoading ? "Loading expense types..." : "Select expense type"}
              disabled={expenseItemsLoading}
            />
            
            <Dropdown
              label="Department"
              value={formData.department}
              options={departmentOptions}
              onChange={(value: string) => updateFormData('department', value)}
            />
          </View>

          {/* Business Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="briefcase" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Business Details
              </Text>
            </View>
            
            <Input
              label="Business Purpose"
              value={formData.businessPurpose}
              onChangeText={(text) => updateFormData('businessPurpose', text)}
              placeholder="Describe the business purpose"
              multiline
              numberOfLines={3}
            />
            
            <Input
              label="Location"
              value={formData.location}
              onChangeText={(text) => updateFormData('location', text)}
              placeholder="Enter location"
            />
            
            <Input
              label="Supplier/Vendor"
              value={formData.supplier}
              onChangeText={(text) => updateFormData('supplier', text)}
              placeholder="Enter supplier or vendor name"
            />
          </View>

          {/* Additional Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="info" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Additional Information
              </Text>
            </View>
            
            <Input
              label="Comments"
              value={formData.comments}
              onChangeText={(text) => updateFormData('comments', text)}
              placeholder="Add any additional comments"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Receipt Upload */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="camera" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Receipt
              </Text>
            </View>
            
            <ReceiptUpload
              value={formData.receiptFiles}
              onChange={handleReceiptUpload}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button */}
      <View style={[styles.submitContainer, { backgroundColor: colors.background }]}>
        <Button
          title={isSubmitting ? "Creating..." : "Create Expense"}
          onPress={handleSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding,
    paddingBottom: 120, // Increased for better spacing with submit button
  },
  section: {
    marginBottom: SIZES.large, // 18px - consistent spacing
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.font, // 14px - consistent spacing
    gap: SIZES.base, // 8px - consistent gap
  },
  sectionTitle: {
    fontSize: SIZES.large, // 18px - consistent font size
    fontWeight: '600',
    fontFamily: FONTS.medium, // Consistent font family
  },
  row: {
    flexDirection: 'row',
    gap: SIZES.font, // 14px - consistent gap
  },
  halfWidth: {
    flex: 1,
  },
  submitContainer: {
    padding: SIZES.padding, // 16px - consistent padding
    paddingVertical: SIZES.font, // 14px - vertical padding
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: 'transparent', // Let theme handle background
  },
}); 