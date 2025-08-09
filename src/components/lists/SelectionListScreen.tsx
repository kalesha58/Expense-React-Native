import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Header } from '../layout/Header';
import { SearchBar } from '../forms/SearchBar';
import Feather from 'react-native-vector-icons/Feather';
import { replace } from '../../utils/NavigationUtils';
import { logger } from '../../utils/logger';

// Generic item interface
export interface SelectionItem {
  id: string;
  title: string;
  subtitle?: string;
  code?: string;
  [key: string]: any; // Allow additional properties
}

// Props for the selection list component
interface SelectionListScreenProps {
  // Data and state
  items: SelectionItem[];
  loading: boolean;
  error: string | null;
  
  // Configuration
  title: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  
  // Callbacks
  onItemSelect: (item: SelectionItem) => void;
  onContinue: (selectedItem: SelectionItem) => void;
  onBack?: () => void;
  
  // Navigation
  nextScreen: string;
  showBackButton?: boolean;
  showThemeToggle?: boolean;
  
  // Customization
  renderItem?: (item: SelectionItem, isSelected: boolean, onPress: () => void) => React.ReactElement;
  filterItems?: (items: SelectionItem[], searchQuery: string) => SelectionItem[];
  getItemKey?: (item: SelectionItem) => string;
  getItemTitle?: (item: SelectionItem) => string;
  getItemSubtitle?: (item: SelectionItem) => string;
  
  // Styling
  containerStyle?: any;
  listStyle?: any;
}

export const SelectionListScreen: React.FC<SelectionListScreenProps> = ({
  // Data
  items,
  loading,
  error,
  
  // Configuration
  title,
  searchPlaceholder = "Search...",
  emptyMessage = "No items found",
  loadingMessage = "Loading...",
  errorMessage = "Failed to load items",
  
  // Callbacks
  onItemSelect,
  onContinue,
  onBack,
  
  // Navigation
  nextScreen,
  showBackButton = true,
  showThemeToggle = true,
  
  // Customization
  renderItem,
  filterItems,
  getItemKey,
  getItemTitle,
  getItemSubtitle,
  
  // Styling
  containerStyle,
  listStyle,
}) => {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SelectionItem | null>(null);

  useEffect(() => {
    logger.info('SelectionListScreen loaded', { 
      title,
      itemsCount: items.length,
      loading,
      error 
    });
  }, [title, items, loading, error]);

  // Default filter function
  const defaultFilterItems = (items: SelectionItem[], searchQuery: string) => {
    if (!searchQuery.trim()) return items;
    return items.filter(item => {
      const title = getItemTitle ? getItemTitle(item) : item.title;
      const subtitle = getItemSubtitle ? getItemSubtitle(item) : item.subtitle;
      const code = item.code;
      
      const searchLower = searchQuery.toLowerCase();
      return (
        title.toLowerCase().includes(searchLower) ||
        (subtitle && subtitle.toLowerCase().includes(searchLower)) ||
        (code && code.toLowerCase().includes(searchLower))
      );
    });
  };

  // Filter items based on search
  const filteredItems = useMemo(() => {
    const filterFn = filterItems || defaultFilterItems;
    return filterFn(items, search);
  }, [items, search, filterItems]);

  // Handle item selection
  const handleItemSelect = (item: SelectionItem) => {
    setSelected(item);
    onItemSelect(item);
  };

  // Handle continue
  const handleContinue = async () => {
    if (selected) {
      try {
        logger.info('Navigating to next screen', { 
          selectedItem: getItemTitle ? getItemTitle(selected) : selected.title,
          nextScreen 
        });
        onContinue(selected);
        await replace(nextScreen);
      } catch (error) {
        logger.error('Navigation error', { error });
      }
    }
  };

  // Default render item function
  const defaultRenderItem = (item: SelectionItem, isSelected: boolean, onPress: () => void) => {
    const title = getItemTitle ? getItemTitle(item) : item.title;
    const subtitle = getItemSubtitle ? getItemSubtitle(item) : item.subtitle;
    
    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          { 
            backgroundColor: isSelected ? colors.primary + '08' : colors.card,
            borderLeftColor: isSelected ? colors.primary : 'transparent',
          },
        ]}
        onPress={onPress}
        activeOpacity={0.6}
      >
        <View style={styles.itemContent}>
          <View style={styles.textContainer}>
            <Text style={[
              styles.title, 
              { 
                color: isSelected ? colors.primary : colors.text,
                fontWeight: isSelected ? '600' : '500'
              }
            ]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[
                styles.subtitle, 
                { 
                  color: isSelected ? colors.primary + '80' : colors.placeholder 
                }
              ]}>
                {subtitle}
              </Text>
            )}
          </View>
          
          <View style={styles.rightSection}>
            {isSelected ? (
              <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            ) : (
              <Text style={[styles.arrow, { color: colors.placeholder }]}>›</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }, containerStyle]}> 
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Header 
          title={title} 
          showBackButton={showBackButton} 
          showThemeToggle={showThemeToggle}
        />
        
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={searchPlaceholder}
          style={styles.searchBar}
        />
        
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.messageText, { color: colors.placeholder }]}>
              {loadingMessage}
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Feather name="alert-circle" size={48} color={colors.error} style={{ marginBottom: 8 }} />
            <Text style={[styles.messageText, { color: colors.error }]}>
              {errorMessage}
            </Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.centerContainer}>
            <Feather name="search" size={48} color={colors.placeholder} style={{ marginBottom: 8 }} />
            <Text style={[styles.messageText, { color: colors.placeholder }]}>
              {emptyMessage}
            </Text>
          </View>
        ) : (
          <View style={[styles.listContainer, listStyle]}>
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => getItemKey ? getItemKey(item) : item.id}
              renderItem={({ item }) => {
                const isSelected = selected?.id === item.id;
                const onPress = () => handleItemSelect(item);
                
                if (renderItem) {
                  return renderItem(item, isSelected, onPress);
                }
                return defaultRenderItem(item, isSelected, onPress);
              }}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={10}
            />
          </View>
        )}
        
        <View style={[styles.footer, { backgroundColor: colors.background }]}> 
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: selected ? colors.button : colors.disabled }]}
            disabled={!selected}
            onPress={handleContinue}
            activeOpacity={selected ? 0.7 : 1}
          >
            <Text style={[styles.continueText, { color: '#fff' }]}>Continue</Text>
            <Feather name="arrow-right" size={20} color="#fff" style={styles.continueIcon} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
  },
  searchBar: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  listContainer: {
    flex: 1,
    marginTop: 8,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 100,
  },
  itemContainer: {
    borderLeftWidth: 3,
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  arrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  continueBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  continueText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  continueIcon: {
    marginLeft: 8,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
    marginBottom: 24,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },
}); 