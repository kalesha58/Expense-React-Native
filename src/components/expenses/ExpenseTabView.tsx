import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';
import { GroupedExpenseCard, type GroupedExpenseItem } from './ExpenseCard';
import { ExpenseListSkeleton, TabHeaderSkeleton } from '../ui';

interface ExpenseTabViewProps {
  expenses: GroupedExpenseItem[];
  onExpensePress: (id: string) => void;
  onMorePress?: () => void;
  isSearchActive?: boolean;
  loading?: boolean;
}

type TabStatus = 'approved' | 'pending' | 'rejected';

export const ExpenseTabView: React.FC<ExpenseTabViewProps> = ({
  expenses,
  onExpensePress,
  onMorePress,
  isSearchActive = false,
  loading = false
}) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabStatus>('approved');
  const [pagerRef, setPagerRef] = useState<PagerView | null>(null);

  // Filter expenses by status
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => expense.status === activeTab);
  }, [expenses, activeTab]);

  // Tab options
  const tabs: { key: TabStatus; label: string; count: number }[] = useMemo(() => {
    const approvedCount = expenses.filter(e => e.status === 'approved').length;
    const pendingCount = expenses.filter(e => e.status === 'pending').length;
    const rejectedCount = expenses.filter(e => e.status === 'rejected').length;

    return [
      { key: 'approved', label: 'Approved', count: approvedCount },
      { key: 'pending', label: 'Pending', count: pendingCount },
      { key: 'rejected', label: 'Rejected', count: rejectedCount },
    ];
  }, [expenses]);

  const handleTabPress = useCallback((tabKey: TabStatus) => {
    setActiveTab(tabKey);
    const tabIndex = tabs.findIndex(tab => tab.key === tabKey);
    pagerRef?.setPage(tabIndex);
  }, [tabs, pagerRef]);

  const handlePageChange = useCallback((page: number) => {
    const newTab = tabs[page]?.key;
    if (newTab) {
      setActiveTab(newTab);
    }
  }, [tabs]);

  const renderExpenseItem = useCallback(({ item }: { item: GroupedExpenseItem }) => (
    <GroupedExpenseCard
      item={item}
      onPress={onExpensePress}
      onMorePress={onMorePress}
    />
  ), [onExpensePress, onMorePress]);

  const getStatusColor = (status: TabStatus) => {
    switch (status) {
      case 'approved':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'rejected':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  // Show skeleton loading state
  if (loading) {
    return (
      <View style={styles.container}>
        {/* Skeleton Tab Headers */}
        <TabHeaderSkeleton />
        
        {/* Skeleton Content */}
        <ExpenseListSkeleton itemCount={6} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Headers */}
      <View style={[styles.tabHeader, isSearchActive && styles.tabHeaderWithSearch]}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && {
                backgroundColor: colors.primary + '08',
                borderBottomColor: colors.primary,
              }
            ]}
            onPress={() => handleTabPress(tab.key)}
          >
            <View style={styles.tabContent}>
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === tab.key ? colors.primary : colors.placeholder }
                ]}
              >
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[
                  styles.countBadge,
                  { backgroundColor: activeTab === tab.key ? colors.primary : colors.placeholder }
                ]}>
                  <Text style={[
                    styles.countText,
                    { color: colors.card }
                  ]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pager View */}
      <PagerView
        ref={setPagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={(e) => handlePageChange(e.nativeEvent.position)}
      >
        {tabs.map((tab) => {
          const tabExpenses = expenses.filter(expense => expense.status === tab.key);
          
          return (
            <View key={tab.key} style={styles.pageContainer}>
              {tabExpenses.length === 0 && !loading ? (
                // Show skeleton when tab is empty but not in global loading state
                <ExpenseListSkeleton itemCount={3} />
              ) : (
                <FlatList
                  data={tabExpenses}
                  keyExtractor={(item) => item.id}
                  renderItem={renderExpenseItem}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  bounces={true}
                  alwaysBounceVertical={false}
                  removeClippedSubviews={false}
                  maxToRenderPerBatch={5}
                  windowSize={5}
                  initialNumToRender={10}
                  updateCellsBatchingPeriod={50}
                  scrollEventThrottle={16}
                  decelerationRate="fast"
                  maintainVisibleContentPosition={{
                    minIndexForVisible: 0,
                    autoscrollToTopThreshold: 10,
                  }}
                />
              )}
            </View>
          );
        })}
      </PagerView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabHeaderWithSearch: {
    marginTop: SIZES.base,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 18, // Add space for the badge
  },
  tabLabel: {
    fontSize: SIZES.medium,
    fontWeight: '600',
  },
  countBadge: {
    position: 'absolute',
    top: -8,
    right: -6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 16,
    minHeight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: SIZES.small - 2,
    fontWeight: '600',
    lineHeight: 12,
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.padding,
    paddingBottom: 100,
  },
});
