import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../hooks/useTheme';
import { Header } from '../components/layout/Header';
import { SIZES } from '../constants/theme';
import useExpenseItems from '../hooks/useExpenseItems';

interface ExpenseTypeOption {
  label: string;
  value: string;
  id: string;
}

interface RouteParams {
  onSelect?: (expenseType: string) => void;
  currentValue?: string;
}

export const ExpenseTypeSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, shadows } = useTheme();
  const { expenseItems, loading, error } = useExpenseItems();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<ExpenseTypeOption[]>([]);

  const params = route.params as RouteParams;
  const currentValue = params?.currentValue || '';

  // Generate options from expense items
  const generateOptions = (): ExpenseTypeOption[] => {
    
    if (expenseItems.length > 0) {
      // Use all expense items individually (no grouping)
      return expenseItems.map(item => ({
        label: item.expenseItem, // Show the actual item name
        value: item.expenseItem, // Use item name as value
        id: item.id, // Use unique item ID
      }));
    }
    
    // Fallback options if no database items
    return [
      { label: 'Hotel', value: 'Hotel', id: 'hotel_1' },
      { label: 'Airfare', value: 'Airfare', id: 'airfare_1' },
      { label: 'Car Rental', value: 'Car Rental', id: 'car_rental_1' },
      { label: 'Meal', value: 'Meal', id: 'meal_1' },
      { label: 'Dinner', value: 'Dinner', id: 'dinner_1' },
      { label: 'Breakfast', value: 'Breakfast', id: 'breakfast_1' },
      { label: 'Telephone', value: 'Telephone', id: 'telephone_1' },
      { label: 'Entertainment', value: 'Entertainment', id: 'entertainment_1' },
      { label: 'Cab', value: 'Cab', id: 'cab_1' },
      { label: 'Transportation', value: 'Transportation', id: 'transportation_1' },
      { label: 'Office Supplies', value: 'Office Supplies', id: 'office_supplies_1' },
      { label: 'Training', value: 'Training', id: 'training_1' },
      { label: 'Miscellaneous', value: 'Miscellaneous', id: 'miscellaneous_1' },
    ];
  };

  // Filter options based on search query
  useEffect(() => {
    if (expenseItems && expenseItems.length > 0) {
      // Generating options from expense items
      const uniqueTypes = [...new Set(expenseItems.map(item => item.expenseItem))];
      const options = uniqueTypes.map((type, index) => ({
        id: index.toString(),
        label: type,
        value: type,
      }));
      setFilteredOptions(options);
      // Generated expense type options
      // Unique expense types
    }
  }, [expenseItems]);

  const handleSelectExpenseType = (expenseType: string) => {
    if (params?.onSelect) {
      params.onSelect(expenseType);
    }
    navigation.goBack();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const renderExpenseTypeItem = ({ item }: { item: ExpenseTypeOption }) => (
    <TouchableOpacity
      style={[
        styles.expenseTypeItem,
        { 
          backgroundColor: colors.card, 
          borderColor: colors.border,
          ...shadows.small
        },
        currentValue === item.value && {
          borderColor: colors.primary,
          backgroundColor: colors.primary + '10',
        }
      ]}
      onPress={() => handleSelectExpenseType(item.value)}
    >
      <Text style={[
        styles.expenseTypeText,
        { color: colors.text }
      ]}>
        {item.label}
      </Text>
      {currentValue === item.value && (
        <Feather 
          name="check" 
          size={20} 
          color={colors.primary} 
          style={styles.checkIcon}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Expense Type" 
        showBackButton={true}
      />
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={20} color={colors.placeholder} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search Expense Type"
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
            <Feather name="x" size={20} color={colors.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      {/* Expense Types List */}
      <FlatList
        data={filteredOptions}
        renderItem={renderExpenseTypeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="search" size={48} color={colors.placeholder} />
            <Text style={[styles.emptyText, { color: colors.placeholder }]}>
              No expense types found
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.placeholder }]}>
              Try adjusting your search
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SIZES.padding,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 20,
  },
  expenseTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  expenseTypeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: 8,
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
