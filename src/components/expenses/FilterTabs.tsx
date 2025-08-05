import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';

export interface FilterOption {
  key: string;
  label: string;
  count: number;
}

interface FilterTabsProps {
  filters: FilterOption[];
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  filters,
  selectedFilter,
  onFilterChange,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.tab,
            selectedFilter === filter.key && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            }
          ]}
          onPress={() => onFilterChange(filter.key)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            { 
              color: selectedFilter === filter.key ? '#FFFFFF' : colors.text 
            }
          ]}>
            {filter.label}
          </Text>
          <View style={[
            styles.count,
            { 
              backgroundColor: selectedFilter === filter.key 
                ? 'rgba(255,255,255,0.2)' 
                : colors.primary + '15'
            }
          ]}>
            <Text style={[
              styles.countText,
              { 
                color: selectedFilter === filter.key ? '#FFFFFF' : colors.primary 
              }
            ]}>
              {filter.count}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.padding,
    paddingBottom: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  tabText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  count: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  countText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
}); 