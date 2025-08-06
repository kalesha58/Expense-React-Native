import React, { useState, useCallback, useMemo, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../hooks/useTheme';
import { Header } from '../../components/layout/Header';
import { 
  ExpenseCard, 
  GroupedExpenseCard,
  FilterTabs, 
  SearchBar, 
  EmptyState, 
  LoadingFooter, 
  FloatingActionButton,
  type ExpenseItem,
  type GroupedExpenseItem,
  type FilterOption
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
      reportName: firstItem.ReportName,
      reportDate: firstItem.ReportDate,
      title: firstItem.ReportName || `Expense Report ${reportHeaderId}`,
      amount: totalAmount,
      totalAmount: totalAmount,
      status: groupStatus,
      date: firstItem.TransactionDate,
      items: items,
      itemCount: items.length,
      category: items.length > 1 ? `${items.length} Items` : firstItem.ExpenseItem,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('approved');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSearch, setShowSearch] = useState(false);
  
  // Refs for performance
  const flatListRef = useRef<FlatList<any>>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Transform API data to grouped ExpenseItem format
  const allExpenses = useMemo<GroupedExpenseItem[]>(() => {
    const transformed = transformExpenseDetailsToGroups(expenseDetails);
    console.log('ExpenseScreen - expenseDetails:', expenseDetails.length);
    console.log('ExpenseScreen - transformed grouped expenses:', transformed.length);
    return transformed;
  }, [expenseDetails]);

  // Memoized filtered and paginated data
  const { filteredExpenses, totalExpenses, approvedExpenses, pendingExpenses, rejectedExpenses } = useMemo(() => {
    let filtered = allExpenses;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter(expense => 
        expense.title.toLowerCase().includes(searchTerm) ||
        expense.reportName.toLowerCase().includes(searchTerm) ||
        expense.category.toLowerCase().includes(searchTerm) ||
        expense.businessPurpose?.toLowerCase().includes(searchTerm) ||
        expense.location?.toLowerCase().includes(searchTerm) ||
        expense.supplier?.toLowerCase().includes(searchTerm) ||
        expense.departmentCode?.toLowerCase().includes(searchTerm) ||
        expense.comments?.toLowerCase().includes(searchTerm) ||
        expense.currency?.toLowerCase().includes(searchTerm) ||
        expense.id?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Calculate statistics from complete dataset (not filtered)
    const totalExpenses = allExpenses.length;
    const approvedExpenses = allExpenses.filter(e => e.status === 'approved').length;
    const pendingExpenses = allExpenses.filter(e => e.status === 'pending').length;
    const rejectedExpenses = allExpenses.filter(e => e.status === 'rejected').length;
    
    // Apply status filter
    filtered = filtered.filter(expense => expense.status === selectedFilter);
    
    // Apply pagination with smooth loading
    const startIndex = 0;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    const paginatedExpenses = filtered.slice(startIndex, endIndex);
    
    return {
      filteredExpenses: paginatedExpenses,
      totalExpenses,
      approvedExpenses,
      pendingExpenses,
      rejectedExpenses,
    };
  }, [allExpenses, searchQuery, selectedFilter, currentPage]);
  
  // Optimized search handler with debouncing
  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search to avoid excessive filtering
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 300);
  }, []);
  
  // Load more data handler
  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMoreData && filteredExpenses.length < totalExpenses) {
      setIsLoading(true);
      
      // Use requestAnimationFrame for smoother transitions
      requestAnimationFrame(() => {
        setCurrentPage(prev => {
          const newPage = prev + 1;
          // Check if we've loaded all data
          if (newPage * ITEMS_PER_PAGE >= totalExpenses) {
            setHasMoreData(false);
          }
          return newPage;
        });
        
        // Small delay to show loading state without blocking UI
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      });
    }
  }, [isLoading, hasMoreData, filteredExpenses.length, totalExpenses, currentPage]);
  
  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      await refetch();
      setCurrentPage(1);
      setHasMoreData(true);
    } catch (error) {
      console.error('Failed to refresh expense data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);
  
  const handleCreateExpense = useCallback(() => {
    navigate('CreateExpense', {});
  }, []);

  const handleFilterChange = useCallback((filter: string) => {
    setSelectedFilter(filter);
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  const handleExpensePress = useCallback((id: string) => {
    console.log('Expense pressed with id:', id);
    console.log('Available grouped expenses:', allExpenses.length);
    
    // Find the grouped expense by ReportHeaderId
    const groupedExpense = allExpenses.find(expense => expense.reportHeaderId === id);
    
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

  const handleSearchToggle = useCallback(() => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  }, [showSearch]);

  const handleMorePress = useCallback(() => {
    console.log('More options pressed');
  }, []);
  
  // Memoized key extractor
  const keyExtractor = useCallback((item: GroupedExpenseItem) => item.id, []);
  
  // Memoized expense item renderer
  const renderExpenseItem = useCallback(({ item }: { item: GroupedExpenseItem }) => (
    <GroupedExpenseCard
      item={item}
      onPress={handleExpensePress}
      onMorePress={handleMorePress}
    />
  ), [handleExpensePress, handleMorePress]);

  // Memoized filter options
  const filterOptions: FilterOption[] = useMemo(() => [
    { key: 'approved', label: 'Approved', count: approvedExpenses },
    { key: 'pending', label: 'Pending', count: pendingExpenses },
    { key: 'rejected', label: 'Rejected', count: rejectedExpenses },
  ], [approvedExpenses, pendingExpenses, rejectedExpenses]);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Expenses" 
        showThemeToggle={true}
        rightComponent={
          <TouchableOpacity onPress={handleSearchToggle}>
            <Feather 
              name={showSearch ? "x" : "search"} 
              size={24} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        }
      />
      
      {/* Search Bar - Only show when search is active */}
      {showSearch && (
        <>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus={true}
          />
          {searchQuery.trim() && (
            <View style={[styles.searchResultsInfo, { backgroundColor: colors.card }]}>
              <Text style={[styles.searchResultsText, { color: colors.placeholder }]}>
                {filteredExpenses.length} result{filteredExpenses.length !== 1 ? 's' : ''} found
              </Text>
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchButton}
              >
                <Feather name="x" size={16} color={colors.placeholder} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
      
      {/* Filter Tabs */}
      <FilterTabs
        filters={filterOptions}
        selectedFilter={selectedFilter}
        onFilterChange={handleFilterChange}
      />
      
      <FlatList
        ref={flatListRef}
        data={filteredExpenses}
        keyExtractor={keyExtractor}
        renderItem={renderExpenseItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing || apiLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          searchQuery.trim() ? (
            <EmptyState 
              title="No search results found"
              subtitle={`No expenses match "${searchQuery}". Try different keywords or check your spelling.`}
              icon="search"
            />
          ) : (
            <EmptyState />
          )
        }
        ListFooterComponent={<LoadingFooter isLoading={isLoading} />}
        // Performance optimizations for smoother scrolling
        removeClippedSubviews={false}
        maxToRenderPerBatch={5}
        windowSize={5}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
        // Smooth scrolling configuration
        scrollEventThrottle={16}
        decelerationRate="fast"
        bounces={true}
        alwaysBounceVertical={false}
        // Prevent layout shifts
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
      />
      
      <FloatingActionButton onPress={handleCreateExpense} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: SIZES.padding,
    paddingBottom: 100,
  },
  searchResultsInfo: {
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.radius,
    borderRadius: SIZES.radius,
    marginTop: SIZES.base,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchResultsText: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    marginRight: SIZES.base,
  },
  clearSearchButton: {
    padding: SIZES.base,
  },
}); 