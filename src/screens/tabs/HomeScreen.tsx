import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { SIZES } from '../../constants/theme';
import { navigate } from '../../utils/NavigationUtils';
import useExpenseDetails, { type ExpenseDetail } from '../../hooks/useExpenseDetails';
import { formatTransactionDate } from '../../utils/dateUtils';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

// Transform expense details to grouped format
const transformExpenseDetailsToGroups = (expenseDetails: ExpenseDetail[]) => {
  // Group expenses by ReportHeaderId
  const groupedMap = new Map<string, ExpenseDetail[]>();
  
  expenseDetails.forEach((detail) => {
    const reportHeaderId = detail.ReportHeaderId;
    if (!groupedMap.has(reportHeaderId)) {
      groupedMap.set(reportHeaderId, []);
    }
    groupedMap.get(reportHeaderId)!.push(detail);
  });

  // Transform grouped data
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
    };
  });
};

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { colors, shadows } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { expenseDetails, loading } = useExpenseDetails();
  
  // Transform expense details to grouped format
  const groupedExpenses = React.useMemo(() => {
    if (!expenseDetails || expenseDetails.length === 0) {
      return [];
    }
    
    return transformExpenseDetailsToGroups(expenseDetails);
  }, [expenseDetails]);
  
  // Transform grouped expenses to recent expenses format
  const recentExpenses = React.useMemo(() => {
    if (!groupedExpenses || groupedExpenses.length === 0) {
      return [];
    }
    
    // Take the most recent 3 grouped expenses
    return groupedExpenses
      .slice(0, 3)
      .map((expense) => {
        return {
          id: expense.reportHeaderId,
          title: expense.reportName || expense.title,
          amount: expense.totalAmount,
          status: expense.status,
          date: expense.reportDate,
          itemCount: expense.itemCount,
        };
      });
  }, [groupedExpenses]);
  
  // Calculate statistics from grouped expenses
  const statistics = React.useMemo(() => {
    if (!groupedExpenses || groupedExpenses.length === 0) {
      return { total: 0, pending: 0, approved: 0, rejected: 0 };
    }
    
    const total = groupedExpenses.length;
    const pending = groupedExpenses.filter(e => e.status === 'pending').length;
    const approved = groupedExpenses.filter(e => e.status === 'approved').length;
    const rejected = groupedExpenses.filter(e => e.status === 'rejected').length;
    
    return { total, pending, approved, rejected };
  }, [groupedExpenses]);
  
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
  
  const handleCreateExpense = () => {
    navigate('CreateExpense');
  };
  
  const handleViewAllExpenses = () => {
    navigate('Expense');
  };

  const handleTransactionHistory = () => {
    // Navigate to transaction history
    console.log('Transaction history');
  };

  const handleViewExpenseDetails = (id: string) => {
    // Find the grouped expense by ReportHeaderId
    const groupedExpense = groupedExpenses.find(expense => expense.reportHeaderId === id);
    
    if (groupedExpense) {
      console.log('Navigating to expense details from HomeScreen:', groupedExpense);
      
      // Transform to the format expected by ExpenseDetailsScreen
      const expenseDetail = {
        reportHeaderId: groupedExpense.reportHeaderId,
        reportName: groupedExpense.reportName,
        reportDate: groupedExpense.reportDate,
        totalAmount: groupedExpense.totalAmount,
        currency: 'USD', // Default currency
        status: groupedExpense.status,
        items: groupedExpense.items,
      };
      
      navigation.navigate('ExpenseDetails', { expense: expenseDetail });
    } else {
      console.log('Grouped expense not found for id:', id);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Dashboard" 
        showThemeToggle={true}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContent}>
            <Text style={[styles.welcomeText, { color: colors.placeholder }]}>
              Welcome back,
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.username || 'User'}
            </Text>
          </View>
          <View style={[styles.welcomeIcon, { backgroundColor: colors.primary + '15' }]}>
            <Feather name="home" size={24} color={colors.primary} />
          </View>
        </View>
        
        {/* Main Modules Grid */}
        <View style={styles.modulesGrid}>
          {/* Create Expense Module */}
          <TouchableOpacity 
            style={[
              styles.moduleTile,
              { backgroundColor: colors.card, borderColor: colors.border },
              shadows.medium
            ]}
            onPress={handleCreateExpense}
          >
            <View style={styles.moduleHeader}>
              <View style={[styles.moduleIcon, { backgroundColor: colors.primary + '15' }]}>
                <Feather name="plus-circle" size={24} color={colors.primary} />
              </View>
              <View style={styles.moduleBadge}>
                <Text style={[styles.moduleBadgeText, { color: colors.primary }]}>
                  NEW
                </Text>
              </View>
            </View>
            
            <View style={styles.moduleContent}>
              <Text style={[styles.moduleTitle, { color: colors.text }]}>
                Create Expense
              </Text>
              <Text style={[styles.moduleDescription, { color: colors.placeholder }]}>
                Submit new expense report
              </Text>
            </View>
            
            <View style={styles.moduleFooter}>
              <Text style={[styles.moduleStatValue, { color: colors.text }]}>
                5 min
              </Text>
              <Feather name="arrow-right" size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>
          
          {/* View Expenses Module */}
          <TouchableOpacity 
            style={[
              styles.moduleTile,
              { backgroundColor: colors.card, borderColor: colors.border },
              shadows.medium
            ]}
            onPress={handleViewAllExpenses}
          >
            <View style={styles.moduleHeader}>
              <View style={[styles.moduleIcon, { backgroundColor: colors.secondary + '15' }]}>
                <Feather name="file-text" size={24} color={colors.secondary} />
              </View>
              <View style={[styles.moduleBadge, { backgroundColor: colors.warning + '15' }]}>
                <Text style={[styles.moduleBadgeText, { color: colors.warning }]}>
                  {statistics.total}
                </Text>
              </View>
            </View>
            
            <View style={styles.moduleContent}>
              <Text style={[styles.moduleTitle, { color: colors.text }]}>
                View Expenses
              </Text>
              <Text style={[styles.moduleDescription, { color: colors.placeholder }]}>
                Browse all reports
              </Text>
            </View>
            
            <View style={styles.moduleFooter}>
              <Text style={[styles.moduleStatValue, { color: colors.text }]}>
                {statistics.pending} pending
              </Text>
              <Feather name="arrow-right" size={16} color={colors.secondary} />
            </View>
          </TouchableOpacity>
          
          {/* Transaction History Module */}
          <TouchableOpacity 
            style={[
              styles.moduleTile,
              { backgroundColor: colors.card, borderColor: colors.border },
              shadows.medium
            ]}
            onPress={handleTransactionHistory}
          >
            <View style={styles.moduleHeader}>
              <View style={[styles.moduleIcon, { backgroundColor: colors.success + '15' }]}>
                <Feather name="activity" size={24} color={colors.success} />
              </View>
              <View style={[styles.moduleBadge, { backgroundColor: colors.success + '15' }]}>
                <Text style={[styles.moduleBadgeText, { color: colors.success }]}>
                  LIVE
                </Text>
              </View>
            </View>
            
            <View style={styles.moduleContent}>
              <Text style={[styles.moduleTitle, { color: colors.text }]}>
                History
              </Text>
              <Text style={[styles.moduleDescription, { color: colors.placeholder }]}>
                View transaction logs
              </Text>
            </View>
            
            <View style={styles.moduleFooter}>
              <Text style={[styles.moduleStatValue, { color: colors.text }]}>
                {statistics.total} total
              </Text>
              <Feather name="arrow-right" size={16} color={colors.success} />
            </View>
          </TouchableOpacity>
        </View>
        

        
        {/* Recent Expenses Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Expenses
            </Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={handleViewAllExpenses}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                View All
              </Text>
              <Feather name="arrow-right" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.loadingText, { color: colors.placeholder }]}>
                Loading expenses...
              </Text>
            </View>
          ) : recentExpenses.length > 0 ? (
            recentExpenses.map((expense) => (
              <TouchableOpacity
                key={expense.id}
                style={[
                  styles.expenseCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  shadows.small
                ]}
                onPress={() => handleViewExpenseDetails(expense.id)}
              >
                <View style={styles.expenseCardContent}>
                  <View style={styles.expenseHeader}>
                    <View style={styles.expenseInfo}>
                      <Text style={[styles.expenseTitle, { color: colors.text }]} numberOfLines={1}>
                        {expense.title}
                      </Text>
                      <Text style={[styles.expenseDate, { color: colors.placeholder }]}>
                        {formatTransactionDate(expense.date)}
                      </Text>
                      {/* Removed businessPurpose and location as they are not in the new grouped structure */}
                    </View>
                    <View style={[
                      styles.statusChip,
                      { backgroundColor: getStatusColor(expense.status) + '15' }
                    ]}>
                      {getStatusIcon(expense.status)}
                      <Text style={[styles.statusText, { color: getStatusColor(expense.status) }]}>
                        {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.expenseFooter}>
                    <Text style={[styles.expenseAmount, { color: colors.text }]}>
                      ${expense.amount.toFixed(2)}
                    </Text>
                    <Feather name="arrow-right" size={16} color={colors.placeholder} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                No recent expenses found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    padding: SIZES.padding,
    paddingBottom: 40,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: SIZES.font,
    marginBottom: 4,
  },
  userName: {
    fontSize: SIZES.xxlarge,
    fontWeight: 'bold',
    lineHeight: 36,
  },
  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modulesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  moduleTile: {
    borderRadius: SIZES.radius,
    padding: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 120,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  moduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  moduleBadgeText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  moduleContent: {
    marginBottom: 12,
  },
  moduleTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: SIZES.small,
    lineHeight: 16,
  },
  moduleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleStatValue: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: SIZES.font,
    fontWeight: '500',
  },

  expenseCard: {
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  expenseCardContent: {
    gap: 12,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseInfo: {
    flex: 1,
    marginRight: 12,
  },
  expenseTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: SIZES.small,
  },
  expensePurpose: {
    fontSize: SIZES.small,
    marginTop: 2,
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
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseAmount: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
  },
  loadingContainer: {
    borderRadius: SIZES.radius,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: SIZES.medium,
  },
  emptyContainer: {
    borderRadius: SIZES.radius,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: SIZES.medium,
  },
}); 