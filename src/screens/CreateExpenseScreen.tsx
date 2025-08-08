import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Banner } from '../components/ui/Banner';
import { SIZES } from '../constants/theme';
import useDepartments from '../hooks/useDepartments';
import { 
  BasicDetailsCard, 
  LineItemsSection, 
  CreateExpenseFAB 
} from '../components/expenses';
import { useExpenseForm } from '../hooks/useExpenseForm';

export const CreateExpenseScreen: React.FC = () => {
  const { colors } = useTheme();
  const { departments } = useDepartments();
  
  const {
    formData,
    isLoading,
    isSubmitting,
    banner,
    updateFormData,
    handleAddLineItem,
    handleEditLineItem,
    handleDeleteLineItem,
    handleSubmit,
  } = useExpenseForm();



  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Create Expense" showThemeToggle={true} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Create Expense"
        showThemeToggle={true}
      />
      
      {/* Fixed Basic Details Section */}
      <View style={[styles.fixedSection, { backgroundColor: colors.background }]}>
        <BasicDetailsCard
          title={formData.title}
          department={formData.department}
          departments={departments}
          onTitleChange={(title) => updateFormData('title', title)}
          onDepartmentChange={(department) => updateFormData('department', department)}
        />
      </View>

      {/* Scrollable Line Items Section */}
      <KeyboardAvoidingView
        style={styles.scrollableSection}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LineItemsSection
            lineItems={formData.lineItems}
            onEditLineItem={handleEditLineItem}
            onDeleteLineItem={handleDeleteLineItem}
            onAddLineItem={handleAddLineItem}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button */}
      <View style={[styles.submitContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title={isSubmitting ? "Creating..." : "Create Expense"}
          onPress={handleSubmit}
          disabled={isSubmitting || formData.lineItems.length === 0}
          loading={isSubmitting}
          style={styles.submitButton}
        />
      </View>

      {/* Floating Action Button */}
      <CreateExpenseFAB
          onPress={handleAddLineItem}
        visible={formData.lineItems.length > 0}
      />

      {/* Status Banner */}
      <Banner
        visible={banner.visible}
        type={banner.type}
        title={banner.title}
        message={banner.message}
        onClose={() => {
          // The banner will be hidden by the onAction callback in the hook
        }}
        onAction={banner.onAction}
        actionText={banner.actionText}
        autoHide={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: SIZES.medium,
    fontWeight: '600',
  },
  fixedSection: {
    padding: 16,
    paddingBottom: 8,
  },
  scrollableSection: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  submitContainer: {
    padding: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
  },
  submitButton: {
    borderRadius: 12,
  },
}); 