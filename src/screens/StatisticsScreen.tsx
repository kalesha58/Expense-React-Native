import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../hooks/useTheme';
import { SIZES, FONTS } from '../constants/theme';
import useExpenseDetails, { ExpenseDetail } from '../hooks/useExpenseDetails';
import { Header } from '../components/layout/Header';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface StatusData {
  name: string;
  amount: number;
  transactionCount: number;
  color: string;
  icon: string;
  percentage: number;
}



// Enhanced Status Card Component
const PremiumStatusCard: React.FC<{
  status: StatusData;
  index: number;
}> = ({ status, index }) => {
  const { colors, shadows } = useTheme();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 100,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.premiumStatusCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: status.color,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
        shadows.medium,
      ]}
    >
      <View style={styles.statusCardHeader}>
        <View style={[styles.statusIcon, { backgroundColor: status.color + '15' }]}>
          <Feather name={status.icon} size={18} color={status.color} />
        </View>
        <View style={styles.statusCardContent}>
          <Text style={[styles.statusName, { color: colors.text }]}>{status.name}</Text>
          <Text style={[styles.statusAmount, { color: colors.text }]}>
            ${status.amount.toFixed(2)}
          </Text>
        </View>
        <View style={styles.statusCardRight}>
          <Text style={[styles.statusPercentage, { color: status.color }]}>
            {status.percentage.toFixed(1)}%
          </Text>
          <Text style={[styles.transactionCount, { color: colors.placeholder }]}>
            {status.transactionCount} transactions
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

export const StatisticsScreen: React.FC = () => {
  const { colors, shadows } = useTheme();
  const { expenseDetails, loading, error } = useExpenseDetails();
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('January');

  // Set default year when component mounts
  useEffect(() => {
    if (!selectedYear) {
      setSelectedYear('2025'); // Set default to 2025
    }
  }, [selectedYear]);



  // Filter options - based on your data having 2024 and 2025 entries
  const yearOptions = ['2024', '2025'];
  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Enhanced chart colors for all possible statuses
  const chartColors = [
    '#10B981', // Green - Approved/Invoiced
    '#F59E0B', // Orange - Pending
    '#EF4444', // Red - Rejected
    '#3B82F6', // Blue - Additional status
    '#8B5CF6', // Purple - Additional status
  ];

  // Status icons mapping for all possible statuses
  const statusIcons: { [key: string]: string } = {
    'APPROVED': 'check-circle',
    'PENDING': 'clock',
    'REJECTED': 'x-circle',
    'INVOICED': 'file-text',
    'PAID': 'dollar-sign',
    'DRAFT': 'edit',
    'SUBMITTED': 'upload',
  };

  // Process expense data to create statistics by status
  const statistics = useMemo(() => {
    // Use real expense details data
    const dataToProcess = expenseDetails || [];
    
    if (!dataToProcess || dataToProcess.length === 0) {
      return {
        totalAmount: 0,
        statuses: [],
        chartData: [],
      };
    }

    // Filter by selected year and month using TransactionDate
    const filteredData = dataToProcess.filter((expense) => {
      if (!expense.TransactionDate) return false;
      
      try {
        let expenseDate: Date;
        
        // Handle different date formats
        const hasMonthAbbr = /JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC/i.test(expense.TransactionDate);
        if (expense.TransactionDate.includes('-') && hasMonthAbbr) {
          // Handle format like "01-JAN-25" or "12-DEC-24"
          const parts = expense.TransactionDate.split('-');
          if (parts.length === 3) {
            const day = parts[0];
            const monthAbbr = parts[1];
            const year = parts[2];
            
            // Convert 2-digit year to 4-digit
            const fullYear = year.length === 2 ? (parseInt(year) > 50 ? `19${year}` : `20${year}`) : year;
            
            // Convert month abbreviation to number
            const monthMap: { [key: string]: string } = {
              'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
              'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
              'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
            };
            
            const monthNum = monthMap[monthAbbr.toUpperCase()];
            if (monthNum) {
              // Create date in YYYY-MM-DD format
              expenseDate = new Date(`${fullYear}-${monthNum}-${day}`);
            } else {
              expenseDate = new Date(expense.TransactionDate);
            }
          } else {
            expenseDate = new Date(expense.TransactionDate);
          }
        } else {
          // Handle standard date formats
          expenseDate = new Date(expense.TransactionDate);
        }
        
        // Check if date is valid
        if (isNaN(expenseDate.getTime())) {
          return false;
        }
        
        const expenseYear = expenseDate.getFullYear().toString();
        const expenseMonth = expenseDate.toLocaleString('en-US', { month: 'long' });
        
        return expenseYear === selectedYear && expenseMonth === selectedMonth;
      } catch (error) {
        return false;
      }
    });

    // Group expenses by status
    const statusMap = new Map<string, StatusData>();

    filteredData.forEach((expense) => {
      const status = expense.ExpenseStatus?.toUpperCase() || 'PENDING';
      const amount = expense.Amount ? parseFloat(expense.Amount.toString()) || 0 : 0;

      if (statusMap.has(status)) {
        const existing = statusMap.get(status)!;
        existing.amount += amount;
        existing.transactionCount += 1;
      } else {
        statusMap.set(status, {
          name: status,
          amount,
          transactionCount: 1,
          color: chartColors[statusMap.size % chartColors.length],
          icon: statusIcons[status] || 'clock',
          percentage: 0,
        });
      }
    });

    const statuses = Array.from(statusMap.values());
    const totalAmount = statuses.reduce((sum, status) => sum + status.amount, 0);

    // Calculate percentages
    statuses.forEach((status) => {
      status.percentage = totalAmount > 0 ? (status.amount / totalAmount) * 100 : 0;
    });

    // Create chart data for react-native-chart-kit
    const chartData = statuses.map((status, index) => ({
      name: status.name || 'Unknown',
      population: Math.max(status.amount || 0, 0), // Ensure positive numbers
      color: status.color || '#10B981',
      legendFontColor: colors.text || '#000000',
      legendFontSize: 12,
    })).filter(item => item.population > 0); // Only include items with positive values

    return {
      totalAmount,
      statuses,
      chartData,
    };
  }, [expenseDetails, selectedYear, selectedMonth, colors.text, chartColors, statusIcons]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Statistics" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading statistics...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Statistics" showBackButton />
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>Failed to load statistics</Text>
          <Text style={[styles.errorSubtext, { color: colors.placeholder }]}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Statistics" showBackButton />

      {/* Compact Filter Section */}
      <View style={[styles.filterSection, { backgroundColor: colors.card }]}>
        {/* Inline Filter Controls */}
        <View style={styles.inlineFilterControls}>
          {/* Current Selection Display */}
          <View style={styles.currentSelectionDisplay}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
              {selectedMonth} {selectedYear}
            </Text>
            <Text style={[styles.filterSectionSubtitle, { color: colors.placeholder }]}>
              Tap to change filter
            </Text>
          </View>

          {/* Year Tabs - Compact */}
          <View style={[styles.yearTabsCompact, { backgroundColor: colors.background }]}>
            {yearOptions.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearTabCompact,
                  {
                    backgroundColor: year === selectedYear ? colors.primary : 'transparent',
                  }
                ]}
                onPress={() => setSelectedYear(year)}
              >
                <Text style={[
                  styles.yearTabCompactText,
                  { 
                    color: year === selectedYear ? '#FFFFFF' : colors.text,
                    fontWeight: year === selectedYear ? '600' : '500'
                  }
                ]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Horizontal Month Scroll */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.monthScrollView}
          contentContainerStyle={styles.monthScrollContent}
        >
          {monthOptions.map((month) => (
            <TouchableOpacity
              key={month}
              style={[
                styles.monthScrollItem,
                {
                  backgroundColor: month === selectedMonth ? colors.primary : colors.background,
                  borderColor: month === selectedMonth ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setSelectedMonth(month)}
            >
              <Text style={[
                styles.monthScrollText,
                { 
                  color: month === selectedMonth ? '#FFFFFF' : colors.text,
                  fontWeight: month === selectedMonth ? '600' : '500'
                }
              ]}>
                {month.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Chart Card */}
        <View style={[styles.premiumChartCard, { backgroundColor: colors.card }, shadows.large]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Expense Distribution
            </Text>
            <Text style={[styles.chartSubtitle, { color: colors.placeholder }]}>
              Status breakdown for {selectedMonth} {selectedYear}
            </Text>
          </View>
          
          {/* Chart Center Info */}
          <View style={styles.chartCenterInfo}>
            <Text style={[styles.chartCenterAmount, { color: colors.text }]}>
              ${statistics.totalAmount.toFixed(2)}
            </Text>
            <Text style={[styles.chartCenterLabel, { color: colors.placeholder }]}>
              Total Spent
            </Text>
            <View style={styles.chartCenterDivider} />
            <Text style={[styles.chartCenterSubtext, { color: colors.placeholder }]}>
              {selectedMonth} {selectedYear}
            </Text>
          </View>

          {/* React Native Chart Kit Pie Chart */}
          <View style={styles.chartContainer}>
            {statistics.chartData && statistics.chartData.length > 0 ? (
              <PieChart
                data={statistics.chartData}
                width={screenWidth - SIZES.padding * 4}
                height={200}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  color: (opacity = 1) => colors.text,
                  labelColor: (opacity = 1) => colors.text,
                  style: {
                    borderRadius: 16,
                  },
                  propsForLabels: {
                    fontSize: 12,
                    fontWeight: 'bold',
                  },
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                absolute
                hasLegend={true}
                center={[0, 0]}
                avoidFalseZero={true}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Feather name="pie-chart" size={48} color={colors.placeholder} />
                <Text style={[styles.noDataText, { color: colors.placeholder }]}>
                  No chart data available
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Premium Status Breakdown */}
        <View style={styles.premiumStatusSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Status Breakdown
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.placeholder }]}>
              Detailed expense analysis for {selectedMonth} {selectedYear}
            </Text>
          </View>

          {statistics.statuses.length > 0 ? (
            statistics.statuses.map((status, index) => (
              <PremiumStatusCard key={status.name} status={status} index={index} />
            ))
          ) : (
            <View style={[styles.noStatusCard, { backgroundColor: colors.card }, shadows.small]}>
              <Feather name="inbox" size={48} color={colors.placeholder} />
              <Text style={[styles.noStatusTitle, { color: colors.text }]}>
                No Expenses Found
              </Text>
              <Text style={[styles.noStatusSubtitle, { color: colors.placeholder }]}>
                There are no expenses for {selectedMonth} {selectedYear}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: SIZES.font,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: SIZES.large,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: SIZES.font,
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Compact Filter Section
  filterSection: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
  },
  inlineFilterControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  currentSelectionDisplay: {
    flex: 1,
  },
  filterSectionTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
  },
  filterSectionSubtitle: {
    fontSize: SIZES.small,
    marginTop: 2,
  },
  
  // Compact Year Tabs
  yearTabsCompact: {
    flexDirection: 'row',
    borderRadius: SIZES.radius,
    padding: 2,
  },
  yearTabCompact: {
    paddingHorizontal: SIZES.base,
    paddingVertical: 6,
    borderRadius: SIZES.radius - 2,
    minWidth: 50,
    alignItems: 'center',
  },
  yearTabCompactText: {
    fontSize: SIZES.small,
  },
  
  // Horizontal Month Scroll
  monthScrollView: {
    marginBottom: SIZES.base,
  },
  monthScrollContent: {
    paddingHorizontal: SIZES.padding,
    gap: SIZES.base,
  },
  monthScrollItem: {
    paddingHorizontal: SIZES.base,
    paddingVertical: 6,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthScrollText: {
    fontSize: SIZES.small,
    textAlign: 'center',
  },
  
  // Premium Chart Card
  premiumChartCard: {
    marginTop: SIZES.base,
    marginBottom: SIZES.padding,
    borderRadius: SIZES.radius * 2,
    padding: SIZES.padding * 1.5,
    position: 'relative',
    overflow: 'hidden',
  },
  chartHeader: {
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  chartTitle: {
    fontSize: SIZES.extraLarge,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: SIZES.font,
    textAlign: 'center',
  },
  chartCenterInfo: {
    alignItems: 'center',
    marginBottom: SIZES.padding,
    paddingVertical: SIZES.padding,
  },
  chartCenterAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chartCenterLabel: {
    fontSize: SIZES.font,
    marginBottom: SIZES.base,
  },
  chartCenterDivider: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginVertical: SIZES.base,
  },
  chartCenterSubtext: {
    fontSize: SIZES.small,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: SIZES.base,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.padding * 2,
  },
  noDataText: {
    marginTop: SIZES.base,
    fontSize: SIZES.font,
  },
  
  // Premium Status Section
  premiumStatusSection: {
    marginBottom: SIZES.padding,
  },
  sectionHeader: {
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: SIZES.font,
  },
  
  // Premium Status Cards
  premiumStatusCard: {
    padding: SIZES.padding,
    borderRadius: SIZES.radius * 1.5,
    marginBottom: SIZES.base,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.base,
  },
  statusCardContent: {
    flex: 1,
  },
  statusName: {
    fontSize: SIZES.font,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusAmount: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
  },
  statusCardRight: {
    alignItems: 'flex-end',
  },
  statusPercentage: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionCount: {
    fontSize: SIZES.small,
  },
  
  // No Status Card
  noStatusCard: {
    padding: SIZES.padding * 2,
    borderRadius: SIZES.radius * 1.5,
    alignItems: 'center',
  },
  noStatusTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
    marginTop: SIZES.padding,
  },
  noStatusSubtitle: {
    fontSize: SIZES.font,
    marginTop: SIZES.base,
    textAlign: 'center',
  },
});