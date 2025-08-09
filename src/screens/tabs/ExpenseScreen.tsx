import React, { useState, useCallback, useMemo, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity,
  Text,
} from 'react-native';

import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../hooks/useTheme';
import { Header } from '../../components/layout/Header';
import { 
  ExpenseTabView,
  SearchModal, 
  EmptyState, 
  type GroupedExpenseItem
} from '../../components/expenses';
import { SIZES } from '../../constants/theme';
import { navigate } from '../../utils/NavigationUtils';
import useExpenseDetails, { type ExpenseDetail } from '../../hooks/useExpenseDetails';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList>;

// Transform expense details to grouped ExpenseItem format
const transformExpenseDetailsToGroups = (expenseDetails: ExpenseDetail[]): GroupedExpenseItem[] => {
  // Group expenses by ReportHeaderId
  const groupedMap = new Map<string, ExpenseDetail[]>();
  
  expenseDetails.forEach((detail) => {
    const reportHeaderId = detail.ReportHeaderId;
    if (!groupedMap.has(reportHeaderId)) {
      groupedMap.set(reportHeaderId, []);
    }
    groupedMap.get(reportHeaderId)!.push(detail);
  });

  // Transform grouped data to GroupedExpenseItem format
  return Array.from(groupedMap.entries()).map(([reportHeaderId, items]) => {
    // Calculate total amount for the group
    const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.Amount) || 0), 0);
    
    // Calculate parent items count (items with ItemizationParentId: "-1")
    const parentItemsCount = items.filter(item => item.ItemizationParentId === '-1').length;
    
    // Determine the most critical status (rejected > pending > approved)
    const statusCounts = {
      approved: 0,
      pending: 0,
      rejected: 0,
    };

    items.forEach((item) => {
      if (item.ExpenseStatus === 'INVOICED') {
        statusCounts.approved++;
      } else if (item.ExpenseStatus === 'Pending Manager Approval') {
        statusCounts.pending++;
      } else {
        statusCounts.rejected++;
      }
    });

    let groupStatus: 'approved' | 'pending' | 'rejected';
    if (statusCounts.rejected > 0) {
      groupStatus = 'rejected';
    } else if (statusCounts.pending > 0) {
      groupStatus = 'pending';
    } else {
      groupStatus = 'approved';
    }

    // Use the first item for common report information
    const firstItem = items[0];
    

    return {
      id: reportHeaderId,
      reportHeaderId: reportHeaderId,
      reportName: firstItem.ReportName || `EXP-${reportHeaderId}`,
      reportDate: firstItem.ReportDate || firstItem.TransactionDate,
      title: firstItem.ReportName || `Expense Report ${reportHeaderId}`,
      amount: totalAmount,
      totalAmount: totalAmount,
      status: groupStatus,
      date: firstItem.TransactionDate,
      items: items,
      itemCount: parentItemsCount,
      category: parentItemsCount > 1 ? `${parentItemsCount} Items` : firstItem.ExpenseItem,
      // Additional fields from the API
      businessPurpose: firstItem.BusinessPurpose,
      departmentCode: firstItem.DepartmentCode,
      currency: firstItem.Currency,
      location: firstItem.Location,
      supplier: firstItem.Supplier,
      comments: firstItem.Comments,
      numberOfDays: firstItem.NumberOfDays,
      toLocation: firstItem.ToLocation,
    };
  });
};

// Pagination settings
const ITEMS_PER_PAGE = 20;

export const ExpenseScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { expenseDetails, loading: apiLoading, error, refetch } = useExpenseDetails();
  
  // Debug logging
  console.log('ExpenseScreen - API Loading:', apiLoading);
  console.log('ExpenseScreen - Error:', error);
  console.log('ExpenseScreen - Raw expenseDetails:', expenseDetails);
  
  // State management
  const [showSearchModal, setShowSearchModal] = useState(false);
  


  // Transform API data to grouped ExpenseItem format
  const allExpenses = useMemo<GroupedExpenseItem[]>(() => {
    const transformed = transformExpenseDetailsToGroups(expenseDetails);
    console.log('ExpenseScreen - expenseDetails:', expenseDetails.length);
    console.log('ExpenseScreen - transformed grouped expenses:', transformed.length);
    return transformed;
  }, [expenseDetails]);


  
  // Handle search modal toggle
  const handleSearchToggle = useCallback(() => {
    setShowSearchModal(!showSearchModal);
  }, [showSearchModal]);
  




  const handleExpensePress = useCallback((id: string) => {
    console.log('Expense pressed with id:', id);
    console.log('Available grouped expenses:', allExpenses.length);
    console.log('All available IDs:', allExpenses.map(e => ({ id: e.id, reportHeaderId: e.reportHeaderId, reportName: e.reportName })));
    
    // Find the grouped expense by ReportHeaderId or id
    const groupedExpense = allExpenses.find(expense => expense.reportHeaderId === id || expense.id === id);
    
    console.log('Found groupedExpense:', groupedExpense);
    
    if (groupedExpense) {
      console.log('Navigating to expense details:', groupedExpense);
      try {
        // Transform to the format expected by ExpenseDetailsScreen
        const expenseDetail = {
          reportHeaderId: groupedExpense.reportHeaderId,
          reportName: groupedExpense.reportName,
          reportDate: groupedExpense.reportDate,
          totalAmount: groupedExpense.totalAmount,
          currency: groupedExpense.currency || 'USD',
          status: groupedExpense.status,
          items: groupedExpense.items,
        };
        
        navigation.navigate('ExpenseDetails', { expense: expenseDetail });
        console.log('Navigation call completed');
      } catch (error) {
        console.error('Navigation error:', error);
      }
    } else {
      console.log('Grouped expense not found for id:', id);
      console.log('Available ReportHeaderIds:', allExpenses.map(e => e.reportHeaderId));
    }
  }, [allExpenses, navigation]);

  // Handle search result selection
  const handleSearchResultSelect = useCallback((expenseId: string) => {
    console.log('Search result selected:', expenseId);
    
    // Find the expense by id (which should match reportHeaderId)
    const expense = allExpenses.find(e => e.id === expenseId || e.reportHeaderId === expenseId);
    
    if (expense) {
      console.log('Found expense for search result:', expense);
      
      // Close the search modal first
      setShowSearchModal(false);
      
      // Use the reportHeaderId to navigate (this is what handleExpensePress expects)
      const idToUse = expense.reportHeaderId || expense.id;
      console.log('Navigating with ID:', idToUse);
      
      // Small delay to ensure modal closes before navigation
      setTimeout(() => {
        handleExpensePress(idToUse);
      }, 100);
    } else {
      console.log('No expense found for search result ID:', expenseId);
      console.log('Available expenses:', allExpenses.map(e => ({ id: e.id, reportHeaderId: e.reportHeaderId })));
    }
  }, [allExpenses, handleExpensePress]);

  const handleMorePress = useCallback(() => {
    console.log('More options pressed');
  }, []);

  // Handle search modal close
  const handleSearchModalClose = useCallback(() => {
    setShowSearchModal(false);
  }, []);
  

  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Expenses" 
        showThemeToggle={true}
        rightComponent={
          <TouchableOpacity 
            onPress={handleSearchToggle}
            style={{ padding: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6 }}
          >
            <Feather 
              name="search" 
              size={24} 
              color={colors.white} 
            />
          </TouchableOpacity>
        }
      />
      
      {/* Expense Tab View */}
      <ExpenseTabView
        expenses={allExpenses}
        onExpensePress={handleExpensePress}
        onMorePress={handleMorePress}
        isSearchActive={showSearchModal}
        loading={apiLoading}
      />

      {/* Search Modal */}
      <SearchModal
        visible={showSearchModal}
        onClose={handleSearchModalClose}
        expenses={allExpenses}
        onSelectExpense={handleSearchResultSelect}
      />
      

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 