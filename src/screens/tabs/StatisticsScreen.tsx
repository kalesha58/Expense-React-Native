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
import { useTheme } from '../../hooks/useTheme';
import { SIZES, FONTS } from '../../constants/theme';
import useExpenseDetails, { ExpenseDetail } from '../../hooks/useExpenseDetails';
import { Header } from '../../components/layout/Header';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface StatusData {
  name: string;
  amount: number;
  transactionCount: number;
  color: string;
  icon: string;
  percentage: number;
}

// Filter Dropdown Component for Year
const FilterDropdown: React.FC<{
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ label, value, options, onSelect, isOpen, onToggle }) => {
  const { colors, shadows } = useTheme();

  return (
    <View style={styles.filterContainer}>
      <Text style={[styles.filterLabel, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.filterDropdown, { backgroundColor: colors.card, borderColor: colors.border }, shadows.small]}
        onPress={onToggle}
      >
        <Text style={[styles.filterValue, { color: colors.text }]}>{value}</Text>
        <Feather 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={16} 
          color={colors.placeholder} 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={[styles.filterOptions, { backgroundColor: colors.card, borderColor: colors.border }, shadows.medium]}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.filterOption,
                { borderBottomColor: colors.border },
                value === option && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => {
                onSelect(option);
                onToggle();
              }}
            >
              <Text style={[
                styles.filterOptionText,
                { color: value === option ? colors.primary : colors.text }
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// Month Selector Component with Horizontal Tabs (like reference image)
const MonthSelector: React.FC<{
  selectedMonth: string;
  onMonthSelect: (month: string) => void;
}> = ({ selectedMonth, onMonthSelect }) => {
  const { colors } = useTheme();
  
  // Abbreviated month names to match the reference design
  const months = [
    { full: 'January', abbr: 'Jan' },
    { full: 'February', abbr: 'Feb' },
    { full: 'March', abbr: 'Mar' },
    { full: 'April', abbr: 'Apr' },
    { full: 'May', abbr: 'May' },
    { full: 'June', abbr: 'Jun' },
    { full: 'July', abbr: 'Jul' },
    { full: 'August', abbr: 'Aug' },
    { full: 'September', abbr: 'Sep' },
    { full: 'October', abbr: 'Oct' },
    { full: 'November', abbr: 'Nov' },
    { full: 'December', abbr: 'Dec' },
  ];

  return (
    <View style={styles.monthSelectorContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthScrollContainer}
      >
        {months.map((month) => (
          <TouchableOpacity
            key={month.full}
            style={[
              styles.monthTab,
              { borderColor: colors.border },
              selectedMonth === month.full && [styles.monthTabSelected, { backgroundColor: colors.primary, borderColor: 'transparent' }]
            ]}
            onPress={() => onMonthSelect(month.full)}
          >
            <Text style={[
              styles.monthTabText,
              { color: selectedMonth === month.full ? colors.white : colors.text },
              selectedMonth === month.full && styles.monthTabTextSelected
            ]}>
              {month.abbr}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// Premium Status Card Component
const PremiumStatusCard: React.FC<{
  status: StatusData;
  index: number;
}> = ({ status, index }) => {
  const { colors, shadows } = useTheme();

  return (
    <TouchableOpacity 
      style={[
        styles.premiumStatusCard, 
        { backgroundColor: colors.card }, 
        shadows.large,
        { marginTop: index === 0 ? 0 : SIZES.small }
      ]}
    >
      <View style={styles.premiumStatusCardContent}>
        {/* Enhanced Icon with Gradient Background */}
        <View style={[styles.premiumStatusIcon, { backgroundColor: status.color }]}>
          <View style={styles.iconInnerCircle}>
            <Feather name={status.icon as any} size={18} color={colors.white} />
          </View>
        </View>

        {/* Status Information */}
        <View style={styles.premiumStatusInfo}>
          <Text style={[styles.premiumStatusName, { color: colors.text }]}>
            {status.name}
          </Text>
          <Text style={[styles.premiumStatusTransactions, { color: colors.placeholder }]}>
            {status.transactionCount} Transaction{status.transactionCount !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Amount and Percentage */}
        <View style={styles.premiumStatusAmount}>
          <Text style={[styles.premiumAmountText, { color: colors.text }]}>
            ${status.amount.toFixed(2)}
          </Text>
          <View style={[styles.premiumPercentageBadge, { backgroundColor: status.color }]}>
            <Text style={[styles.premiumPercentageText, { color: colors.white }]}>
              {status.percentage.toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* Premium Chevron */}
        <View style={styles.premiumChevronContainer}>
          <Feather name="chevron-right" size={16} color={colors.placeholder} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const StatisticsScreen: React.FC = () => {
  const { colors, shadows } = useTheme();
  const { expenseDetails, loading, error } = useExpenseDetails();
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('January');
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(true);

  // Set default year when component mounts
  useEffect(() => {
    if (!selectedYear) {
      setSelectedYear('2025'); // Set default to 2025
    }
  }, [selectedYear]);

  // Toggle filter visibility
  const toggleFilterVisibility = () => {
    setIsFilterVisible(!isFilterVisible);
    // Close any open dropdowns when hiding filters
    if (isFilterVisible) {
      setYearDropdownOpen(false);
      setMonthDropdownOpen(false);
    }
  };

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
    
    console.log('Processing real expense data (using TransactionDate):', {
      dataToProcessCount: dataToProcess.length,
      selectedYear,
      selectedMonth
    });

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
          console.warn('Invalid date after parsing:', expense.TransactionDate);
          return false;
        }
        
        const expenseYear = expenseDate.getFullYear().toString();
        const expenseMonth = expenseDate.toLocaleString('en-US', { month: 'long' });
        
        console.log('Date parsing result:', {
          original: expense.TransactionDate,
          parsed: expenseDate.toISOString(),
          year: expenseYear,
          month: expenseMonth,
          selectedYear,
          selectedMonth,
          matches: expenseYear === selectedYear && expenseMonth === selectedMonth
        });
        
        return expenseYear === selectedYear && expenseMonth === selectedMonth;
      } catch (error) {
        console.warn('Error parsing TransactionDate:', expense.TransactionDate, error);
        return false;
      }
    });

    console.log('Filtered data count:', filteredData.length);

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

    console.log('Final statistics:', {
      totalAmount,
      statusesCount: statuses.length,
      chartDataCount: chartData.length
    });

    return {
      totalAmount,
      statuses,
      chartData,
    };
  }, [colors.text, selectedYear, selectedMonth]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Statistics" showThemeToggle={true} />
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
        <Header title="Statistics" showThemeToggle={true} />
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
      <Header title="Statistics" showThemeToggle={true} />

      {/* Filter Section */}
      <View style={[
        styles.filterSection, 
        { 
          backgroundColor: colors.card,
          borderBottomColor: colors.border 
        }
      ]}>
        {/* Year and Month Filters Container */}
        {isFilterVisible && (
          <Animated.View style={styles.filtersContainer}>
            {/* Year Filter */}
            <View style={styles.yearFilterContainer}>
              <FilterDropdown
                label="Select Year"
                value={selectedYear}
                options={yearOptions}
                onSelect={setSelectedYear}
                isOpen={yearDropdownOpen}
                onToggle={() => {
                  setYearDropdownOpen(!yearDropdownOpen);
                }}
              />
            </View>
            
            {/* Month Selector */}
            <View style={styles.monthFilterContainer}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Select Month</Text>
              <MonthSelector 
                selectedMonth={selectedMonth}
                onMonthSelect={setSelectedMonth}
              />
            </View>
          </Animated.View>
        )}
        
        {/* Filter Toggle Button - Always Visible */}
        <View style={styles.filterToggleContainer}>
          <TouchableOpacity 
            style={[
              styles.filterToggleButton,
              { 
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              }
            ]}
            onPress={toggleFilterVisibility}
          >
            <Feather 
              name={isFilterVisible ? "chevron-up" : "chevron-down"} 
              size={18} 
              color={colors.white} 
            />
          </TouchableOpacity>
          <Text style={[styles.filterToggleText, { color: colors.placeholder }]}>
            {isFilterVisible ? 'Hide Filters' : 'Show Filters'}
          </Text>
        </View>
        
        {/* Current Selection Display when hidden */}
        {!isFilterVisible && (
          <View style={styles.compactFilterDisplay}>
            <View style={[styles.compactFilterChip, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.compactFilterText, { color: colors.primary }]}>
                {selectedYear}
              </Text>
            </View>
            <View style={[styles.compactFilterChip, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.compactFilterText, { color: colors.primary }]}>
                {selectedMonth}
              </Text>
            </View>
          </View>
        )}
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

          <View style={styles.premiumStatusList}>
            {statistics.statuses.map((status, index) => (
              <PremiumStatusCard 
                key={status.name} 
                status={status} 
                index={index}
              />
            ))}
          </View>
        </View>

        {/* Empty State */}
        {statistics.statuses.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Feather name="bar-chart-2" size={48} color={colors.placeholder} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Data Available</Text>
            <Text style={[styles.emptySubtext, { color: colors.placeholder }]}>
              No expense data found for {selectedMonth} {selectedYear}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  premiumHeader: {
    paddingTop: SIZES.padding,
    paddingBottom: SIZES.padding * 1.5,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
  },
  backButton: {
    padding: SIZES.small,
    borderRadius: SIZES.radius,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: SIZES.padding,
  },
  premiumHeaderTitle: {
    fontSize: SIZES.large,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  premiumHeaderSubtitle: {
    fontSize: SIZES.small,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 2,
  },

  headerActionButton: {
    padding: SIZES.small,
    borderRadius: SIZES.radius,
  },
  filterSection: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
  },
  filtersContainer: {
    gap: SIZES.padding,
  },
  yearFilterContainer: {
    marginBottom: SIZES.small,
  },
  monthFilterContainer: {
    marginTop: SIZES.small,
  },
  filterToggleContainer: {
    alignItems: 'center',
    marginTop: SIZES.padding,
    marginBottom: SIZES.small,
  },
  filterToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: SIZES.small,
  },
  filterToggleText: {
    fontSize: SIZES.small,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  compactFilterDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SIZES.small,
    marginTop: SIZES.small,
  },
  compactFilterChip: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.small,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  compactFilterText: {
    fontSize: SIZES.small,
    fontFamily: FONTS.medium,
  },
  filterContainer: {
    width: 140,
    position: 'relative',
  },
  filterLabel: {
    fontSize: SIZES.small,
    fontFamily: FONTS.medium,
    marginBottom: SIZES.small,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.small,
    borderRadius: SIZES.radius,
    borderWidth: 1,
  },
  filterValue: {
    fontSize: SIZES.font,
    fontFamily: FONTS.medium,
  },
  filterOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    zIndex: 1000,
    maxHeight: 150,
  },
  filterOption: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.small,
    borderBottomWidth: 1,
  },
  filterOptionText: {
    fontSize: SIZES.font,
    fontFamily: FONTS.medium,
  },
  monthSelectorContainer: {
    marginTop: SIZES.small,
  },
  monthScrollContainer: {
    paddingHorizontal: 0,
    paddingVertical: SIZES.small,
  },
  monthTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTabSelected: {
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  monthTabText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  monthTabTextSelected: {
    fontFamily: FONTS.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding,
  },
  premiumChartCard: {
    borderRadius: 20,
    padding: SIZES.padding * 1.5,
    marginBottom: SIZES.padding * 1.5,
    alignItems: 'center',
  },
  chartHeader: {
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  chartTitle: {
    fontSize: SIZES.large,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: SIZES.small,
    fontFamily: FONTS.regular,
  },
  chartCenterInfo: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 1.5,
    padding: SIZES.small,
  },
  chartCenterAmount: {
    fontSize: SIZES.xxlarge,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  chartCenterLabel: {
    fontSize: SIZES.small,
    fontFamily: FONTS.medium,
    marginBottom: 8,
  },
  chartCenterDivider: {
    width: 30,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 4,
  },
  chartCenterSubtext: {
    fontSize: SIZES.small,
    fontFamily: FONTS.regular,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 200,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: SIZES.padding,
  },
  noDataText: {
    fontSize: SIZES.medium,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginTop: SIZES.small,
  },
  premiumStatusSection: {
    marginTop: SIZES.padding,
  },
  sectionHeader: {
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: SIZES.small,
    fontFamily: FONTS.regular,
  },
  premiumStatusList: {
    gap: SIZES.small,
  },
  premiumStatusCard: {
    borderRadius: 16,
    padding: SIZES.padding * 1.2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  premiumStatusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumStatusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.padding,
    elevation: 2,
  },
  iconInnerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  premiumStatusInfo: {
    flex: 1,
  },
  premiumStatusName: {
    fontSize: SIZES.medium,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  premiumStatusTransactions: {
    fontSize: SIZES.small,
    fontFamily: FONTS.regular,
  },
  premiumStatusAmount: {
    alignItems: 'flex-end',
    marginRight: SIZES.small,
  },
  premiumAmountText: {
    fontSize: SIZES.medium,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  premiumPercentageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  premiumPercentageText: {
    fontSize: SIZES.small,
    fontFamily: FONTS.bold,
  },
  premiumChevronContainer: {
    padding: SIZES.small,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.padding,
    fontSize: SIZES.font,
    fontFamily: FONTS.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  errorText: {
    fontSize: SIZES.large,
    fontFamily: FONTS.bold,
    marginTop: SIZES.padding,
  },
  errorSubtext: {
    fontSize: SIZES.font,
    fontFamily: FONTS.regular,
    marginTop: SIZES.small,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.padding * 3,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.padding,
  },
  emptyTitle: {
    fontSize: SIZES.large,
    fontFamily: FONTS.bold,
    marginTop: SIZES.padding,
  },
  emptySubtext: {
    fontSize: SIZES.font,
    fontFamily: FONTS.regular,
    marginTop: SIZES.small,
    textAlign: 'center',
  },
}); 