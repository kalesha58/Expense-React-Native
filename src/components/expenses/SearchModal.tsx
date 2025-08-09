import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Dimensions,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';
import { GroupedExpenseItem } from './ExpenseCard';
import { formatTransactionDate } from '../../utils/dateUtils';
import { SearchResultSkeleton } from '../ui';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ISearchModalProps {
  visible: boolean;
  onClose: () => void;
  expenses: GroupedExpenseItem[];
  onSelectExpense: (expenseId: string) => void;
  loading?: boolean;
}

interface ISearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  status: 'approved' | 'pending' | 'rejected';
  date: string;
  category: string;
}

export const SearchModal: React.FC<ISearchModalProps> = ({
  visible,
  onClose,
  expenses,
  onSelectExpense,
  loading = false,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Transform expenses to search result format
  const searchResults = useMemo<ISearchResultItem[]>(() => {
    if (!searchQuery.trim()) return [];

    const searchTerm = searchQuery.toLowerCase();
    return expenses
      .filter(expense => 
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
      )
      .map(expense => ({
        id: expense.id,
        title: expense.reportName || expense.title,
        subtitle: `${expense.category || 'Business Travel'} • ${formatTransactionDate(expense.reportDate || expense.date)}`,
        amount: `$${expense.totalAmount.toFixed(2)}`,
        status: expense.status,
        date: expense.reportDate || expense.date,
        category: expense.category || 'Business Travel',
      }));
  }, [expenses, searchQuery]);

  // Animation and focus logic
  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // Focus search input
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 350);
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      slideAnim.setValue(50);
    }
  }, [visible]);

  // Handle result selection
  const handleSelectResult = useCallback((resultId: string) => {
    console.log('SearchModal: Result selected:', resultId);
    onSelectExpense(resultId);
    setSearchQuery('');
    // Don't close here - let the parent handle it
  }, [onSelectExpense]);

  // Handle modal close
  const handleClose = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  // Get status color
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

  // Get status badge colors
  const getStatusBadgeColors = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          backgroundColor: '#E8F5E8',
          textColor: '#4CAF50',
        };
      case 'pending':
        return {
          backgroundColor: '#FFF8E1',
          textColor: '#FF9800',
        };
      case 'rejected':
        return {
          backgroundColor: '#FFEBEE',
          textColor: '#F44336',
        };
      default:
        return {
          backgroundColor: colors.disabled,
          textColor: colors.placeholder,
        };
    }
  };

  // Create a separate component for animated search result item
  const AnimatedSearchResultItem: React.FC<{ item: ISearchResultItem; index: number }> = ({ item, index }) => {
    const itemAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(itemAnim, {
        toValue: 1,
        duration: 200,
        delay: index * 50,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, [index]);

    return (
      <Animated.View
        style={[
          {
            opacity: itemAnim,
            transform: [
              {
                translateY: itemAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.resultItem,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.text,
            },
          ]}
          onPress={() => handleSelectResult(item.id)}
          activeOpacity={0.8}
        >
          {/* Left accent bar */}
          <View style={[
            styles.resultAccent,
            { backgroundColor: getStatusBadgeColors(item.status).textColor }
          ]} />
          
          <View style={styles.resultContent}>
            <View style={styles.resultLeft}>
              <View style={[styles.resultIcon, { backgroundColor: colors.primary + '15' }]}>
                <Feather name="file-text" size={18} color={colors.primary} />
              </View>
              <View style={styles.resultInfo}>
                <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.resultSubtitleRow}>
                  <Feather name="calendar" size={12} color={colors.placeholder} />
                  <Text style={[styles.resultSubtitle, { color: colors.placeholder }]} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.resultRight}>
              <Text style={[styles.resultAmount, { color: colors.text }]}>
                {item.amount}
              </Text>
              <View style={[
                styles.resultStatusBadge,
                { 
                  backgroundColor: getStatusBadgeColors(item.status).backgroundColor,
                  borderColor: getStatusBadgeColors(item.status).textColor + '20',
                }
              ]}>
                <Text style={[
                  styles.resultStatusText,
                  { color: getStatusBadgeColors(item.status).textColor }
                ]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.placeholder} style={styles.chevron} />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render search result item
  const renderSearchResult = useCallback(({ item, index }: { item: ISearchResultItem; index: number }) => (
    <AnimatedSearchResultItem item={item} index={index} />
  ), []);

  // Enhanced empty state with skeleton support
  const renderEmptyState = () => {
    if (loading && searchQuery.trim()) {
      // Show skeleton loading for search results
      return (
        <View style={styles.searchSkeletonContainer}>
          {Array.from({ length: 4 }, (_, index) => (
            <SearchResultSkeleton key={index} />
          ))}
        </View>
      );
    }

    if (!searchQuery.trim()) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '08' }]}>
            <Feather name="search" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Search Expenses
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
            Type to search through your expense reports by name, category, location, or amount
          </Text>
          <View style={styles.searchTips}>
            <View style={styles.tipItem}>
              <Feather name="zap" size={14} color={colors.primary} />
              <Text style={[styles.tipText, { color: colors.placeholder }]}>
                Quick search by typing keywords
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Feather name="filter" size={14} color={colors.primary} />
              <Text style={[styles.tipText, { color: colors.placeholder }]}>
                Filter by status or category
              </Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIconContainer, { backgroundColor: colors.warning + '10' }]}>
          <Feather name="search" size={32} color={colors.warning} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No results found
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
          Try adjusting your search terms or check the spelling
        </Text>
        <TouchableOpacity 
          style={[styles.clearSearchTip, { backgroundColor: colors.primary + '08' }]}
          onPress={() => setSearchQuery('')}
        >
          <Feather name="x" size={16} color={colors.primary} />
          <Text style={[styles.clearSearchText, { color: colors.primary }]}>
            Clear search
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Enhanced Blur Background */}
        <Animated.View 
          style={[
            styles.blurBackground, 
            { 
              backgroundColor: 'rgba(0,0,0,0.8)',
              opacity: fadeAnim,
            }
          ]} 
        />

        {/* Enhanced Modal Content */}
        <Animated.View 
          style={[
            styles.modalContainer, 
            { 
              backgroundColor: colors.background,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            }
          ]}
        >
          {/* Enhanced Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerTop}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Search Expenses
                </Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <View style={[styles.closeButtonBg, { backgroundColor: colors.border }]}>
                    <Feather name="x" size={18} color={colors.text} />
                  </View>
                </TouchableOpacity>
              </View>
              
              <View style={[
                styles.searchContainer, 
                { 
                  backgroundColor: colors.card, 
                  borderColor: searchQuery.length > 0 ? colors.primary : colors.border,
                  shadowColor: colors.text,
                }
              ]}>
                <View style={[styles.searchIconContainer, { backgroundColor: colors.primary + '08' }]}>
                  <Feather name="search" size={18} color={colors.primary} />
                </View>
                <TextInput
                  ref={searchInputRef}
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search by name, category, location..."
                  placeholderTextColor={colors.placeholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                    <View style={[styles.clearButtonBg, { backgroundColor: colors.placeholder + '20' }]}>
                      <Feather name="x" size={14} color={colors.placeholder} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Results Count */}
          {searchQuery.trim() && searchResults.length > 0 && (
            <View style={[styles.resultsHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.resultsCount, { color: colors.text }]}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </Text>
            </View>
          )}

          {/* Results List */}
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderSearchResult}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={renderEmptyState}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '100%',
    maxWidth: SCREEN_WIDTH * 0.95,
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderRadius: SIZES.radius * 3,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.3,
    shadowRadius: 25,
  },
  header: {
    paddingTop: SIZES.padding * 1.5,
    paddingHorizontal: SIZES.padding * 1.5,
    paddingBottom: SIZES.padding,
    borderBottomWidth: 1,
  },
  headerContent: {
    gap: SIZES.padding,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.xlarge,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: SIZES.base / 2,
  },
  closeButtonBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius * 2,
    borderWidth: 2,
    gap: SIZES.base,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.medium,
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearButton: {
    padding: SIZES.base / 2,
  },
  clearButtonBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsHeader: {
    paddingHorizontal: SIZES.padding * 1.5,
    paddingVertical: SIZES.base,
    borderBottomWidth: 1,
  },
  resultsCount: {
    fontSize: SIZES.font,
    fontWeight: '600',
  },
  listContent: {
    padding: SIZES.padding * 1.5,
    paddingBottom: SIZES.padding * 3,
  },
  resultItem: {
    borderRadius: SIZES.radius * 2,
    padding: 0,
    marginBottom: SIZES.padding,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  resultAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.padding * 1.5,
    paddingLeft: SIZES.padding * 1.5 + 8,
  },
  resultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SIZES.padding,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
    gap: 4,
  },
  resultTitle: {
    fontSize: SIZES.medium,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  resultSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultSubtitle: {
    fontSize: SIZES.font,
    fontWeight: '500',
  },
  resultRight: {
    alignItems: 'flex-end',
    gap: SIZES.base,
  },
  resultAmount: {
    fontSize: SIZES.large,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  resultStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  resultStatusText: {
    fontSize: SIZES.small - 1,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chevron: {
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding * 4,
    paddingHorizontal: SIZES.padding * 2,
    gap: SIZES.padding * 1.5,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.base,
  },
  emptyTitle: {
    fontSize: SIZES.xlarge,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: SIZES.medium,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SIZES.padding,
  },
  searchTips: {
    gap: SIZES.base,
    alignItems: 'center',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base,
  },
  tipText: {
    fontSize: SIZES.font,
    fontWeight: '500',
  },
  clearSearchTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius * 2,
  },
  clearSearchText: {
    fontSize: SIZES.font,
    fontWeight: '600',
  },
  searchSkeletonContainer: {
    padding: SIZES.padding * 1.5,
    paddingBottom: SIZES.padding * 3,
  },
});
