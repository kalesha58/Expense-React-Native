import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';

import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { launchCamera, ImagePickerResponse, MediaType, CameraOptions } from 'react-native-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Header } from '../../components/layout/Header';
import { SIZES } from '../../constants/theme';
import { navigate } from '../../utils/NavigationUtils';
import { RootStackParamList } from '../../navigation/AppNavigator';
import useExpenseDetails from '../../hooks/useExpenseDetails';


type NavigationProp = StackNavigationProp<RootStackParamList>;



export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { colors, shadows } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { expenseDetails, loading } = useExpenseDetails();

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to camera to capture receipts.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS permissions are handled by react-native-image-picker
        return true;
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  };

  const handleCameraPress = () => {
    // Navigate directly to Camera screen which handles everything
    navigate('Camera');
  };
  
  // Process and format real expense data
  const getFormattedExpenses = () => {
    if (!expenseDetails || expenseDetails.length === 0) {
      return [];
    }

    // Take the latest 3 expenses and format them
    return expenseDetails.slice(0, 3).map((expense, index) => {
      // Map expense types to appropriate icons and colors
      const iconMap: { [key: string]: { icon: string; color: string } } = {
        'MILEAGE': { icon: 'car', color: '#10B981' },
        'TRAVEL': { icon: 'plane', color: '#3B82F6' },
        'AIRFARE': { icon: 'plane', color: '#3B82F6' },
        'MEAL': { icon: 'coffee', color: '#F59E0B' },
        'LUNCH': { icon: 'coffee', color: '#F59E0B' },
        'DINNER': { icon: 'coffee', color: '#F59E0B' },
        'HOTEL': { icon: 'home', color: '#8B5CF6' },
        'TRANSPORT': { icon: 'truck', color: '#6B7280' },
        'OTHER': { icon: 'file-text', color: '#6B7280' }
      };

      const expenseType = expense.ExpenseItem?.toUpperCase() || 'OTHER';
      const iconData = iconMap[expenseType] || iconMap['OTHER'];

      // Format date
      const formatDate = (dateStr: string) => {
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
        } catch {
          return dateStr;
        }
      };

      // Format amount
      const formatAmount = (amount: string | number) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return isNaN(numAmount) ? '0.00' : `$${numAmount.toFixed(2)}`;
      };

      return {
        id: expense.LineId || index.toString(),
        category: expense.ExpenseItem || 'Expense',
        date: formatDate(expense.ReportDate || ''),
        location: expense.Supplier || expense.Location || '',
        amount: formatAmount(expense.Amount || 0),
        icon: iconData.icon,
        color: iconData.color
      };
    });
  };

  const availableExpenses = getFormattedExpenses();

  const handleViewExpenses = () => {
    navigate('Expense');
  };

  const handleExpenseClaim = () => {
    navigate('CreateExpense');
  };

  const handleTransactionHistory = () => {
    navigate('TransactionHistory');
  };


  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Home" 
        showThemeToggle={true}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        {/* <View style={styles.welcomeSection}>
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
        </View> */}
        
        {/* Reimbursements Section */}
        <View style={styles.reimbursementsSection}>
          <View style={styles.cardsContainer}>
            {/* First Row */}
            <View style={styles.cardRow}>
              {/* Create Expense Card */}
              <TouchableOpacity 
                style={[
                  styles.reimbursementCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  shadows.medium
                ]}
                onPress={handleExpenseClaim}
              >
                <View style={styles.cardIconContainer}>
                  <View style={[styles.cardIcon, { backgroundColor: colors.secondary + '15' }]}>
                    <Feather name="edit-3" size={18} color={colors.secondary} />
                  </View>
                </View>
                
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Expense Claim
                </Text>
                
                <Text style={[styles.cardDescription, { color: colors.placeholder }]}>
                  Create a new expense claim
                </Text>
              </TouchableOpacity>

              {/* Expenses Card */}
              <TouchableOpacity 
                style={[
                  styles.reimbursementCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  shadows.medium
                ]}
                onPress={handleViewExpenses}
              >
                <View style={styles.cardIconContainer}>
                  <View style={[styles.cardIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Feather name="list" size={18} color={colors.primary} />
                  </View>
                </View>
                
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Expenses
                </Text>
                
                <Text style={[styles.cardDescription, { color: colors.placeholder }]}>
                  List of your expenses
                </Text>
              </TouchableOpacity>
            </View>

            {/* Second Row */}
            <View style={styles.cardRow}>
              {/* Transaction History Card */}
              <TouchableOpacity 
                style={[
                  styles.reimbursementCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  shadows.medium
                ]}
                onPress={handleTransactionHistory}
              >
                <View style={styles.cardIconContainer}>
                  <View style={[styles.cardIcon, { backgroundColor: colors.success + '15' }]}>
                    <Feather name="activity" size={18} color={colors.success} />
                  </View>
                </View>
                
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Transaction History
                </Text>
                
                <Text style={[styles.cardDescription, { color: colors.placeholder }]}>
                  View recent activity
                </Text>
              </TouchableOpacity>

              {/* Future tile space - can add more features here */}
              <View style={styles.reimbursementCard} />
            </View>
                    </View>
        </View>

        {/* Available Expenses Section */}
        <View style={styles.availableExpensesSection}>
          <View style={styles.availableExpensesHeader}>
            <Text style={[styles.availableExpensesTitle, { color: colors.text }]}>
              Available Expenses
            </Text>
            <TouchableOpacity onPress={handleViewExpenses}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={[styles.expensesLoadingContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.expensesLoadingText, { color: colors.placeholder }]}>
                Loading expenses...
              </Text>
            </View>
          ) : availableExpenses.length > 0 ? (
            <View style={styles.expensesList}>
              {availableExpenses.map((expense) => (
                <TouchableOpacity 
                  key={expense.id} 
                  style={[styles.expenseItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.expenseItemLeft}>
                    <View style={[styles.expenseIcon, { backgroundColor: expense.color + '15' }]}>
                      <Feather name={expense.icon as any} size={16} color={expense.color} />
                    </View>
                    <View style={styles.expenseDetails}>
                      <Text style={[styles.expenseCategory, { color: colors.text }]}>
                        {expense.category}
                      </Text>
                      <Text style={[styles.availableExpenseDate, { color: colors.placeholder }]}>
                        {expense.date}
                      </Text>
                      {expense.location && (
                        <Text style={[styles.expenseLocation, { color: colors.placeholder }]}>
                          {expense.location}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text style={[styles.availableExpenseAmount, { color: colors.text }]}>
                    {expense.amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.noExpensesContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="inbox" size={32} color={colors.placeholder} />
              <Text style={[styles.noExpensesText, { color: colors.text }]}>
                No expenses yet
              </Text>
              <Text style={[styles.noExpensesSubtext, { color: colors.placeholder }]}>
                Create your first expense to see it here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Camera Icon */}
      <TouchableOpacity 
        style={[styles.floatingCameraButton, { backgroundColor: colors.primary }, shadows.large]}
        onPress={handleCameraPress}
      >
        <Feather name="camera" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
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
    paddingHorizontal: SIZES.padding - 4, // Reduced from SIZES.padding (16px) to 12px for wider cards
    paddingTop: SIZES.padding, // Proper spacing from header
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
  reimbursementsSection: {
    marginBottom: SIZES.padding,
  },
  cardsContainer: {
    gap: SIZES.padding,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SIZES.padding,
  },
  reimbursementCard: {
    flex: 1,
    padding: SIZES.base,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 90,
    aspectRatio: 1.5,
  },
  cardIconContainer: {
    marginBottom: SIZES.base,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: SIZES.small,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
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
  
  // Available Expenses Section
  availableExpensesSection: {
    marginTop: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  availableExpensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  availableExpensesTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  expensesList: {
    gap: SIZES.base,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.base,
    borderRadius: SIZES.radius,
    borderWidth: 1,
  },
  expenseItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.base,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: SIZES.font,
    fontWeight: '600',
    marginBottom: 2,
  },
  availableExpenseDate: {
    fontSize: SIZES.small,
    marginBottom: 2,
  },
  expenseLocation: {
    fontSize: SIZES.small,
    opacity: 0.8,
  },
  availableExpenseAmount: {
    fontSize: SIZES.font,
    fontWeight: '600',
  },
  
  // Loading and No Data States
  expensesLoadingContainer: {
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  expensesLoadingText: {
    fontSize: SIZES.font,
  },
  noExpensesContainer: {
    padding: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  noExpensesText: {
    fontSize: SIZES.font,
    fontWeight: '600',
    marginTop: SIZES.base,
  },
  noExpensesSubtext: {
    fontSize: SIZES.small,
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Floating Camera Button
  floatingCameraButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
}); 