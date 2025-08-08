import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Header } from '../../components/layout/Header';
import { SIZES } from '../../constants/theme';
import { navigate } from '../../utils/NavigationUtils';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList>;



export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { colors, shadows } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  

  

  
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Reimbursements" 
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
                    <Feather name="edit-3" size={24} color={colors.secondary} />
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
                    <Feather name="list" size={24} color={colors.primary} />
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
                    <Feather name="activity" size={24} color={colors.success} />
                  </View>
                </View>
                
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Transaction History
                </Text>
                
                <Text style={[styles.cardDescription, { color: colors.placeholder }]}>
                  View recent activity
                </Text>
              </TouchableOpacity>
              
              {/* Empty space to maintain card size */}
              <View style={styles.reimbursementCard} />
            </View>
          </View>
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
    paddingHorizontal: SIZES.padding,
    paddingTop: 8, // Reduced from SIZES.padding (16) to 8
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
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    aspectRatio: 1.2,
  },
  cardIconContainer: {
    marginBottom: SIZES.padding,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: SIZES.small,
    textAlign: 'center',
    lineHeight: 18,
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