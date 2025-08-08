import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';
import useExpenseItems from '../../hooks/useExpenseItems';
import { RootStackParamList } from '../../navigation/AppNavigator';

interface TypeSelectorProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  containerStyle?: any;
  disabled?: boolean;
}

export const TypeSelector: React.FC<TypeSelectorProps> = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  containerStyle,
  disabled = false,
}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { expenseItems } = useExpenseItems();

  const handlePress = () => {
    if (disabled) return;

    navigation.navigate('ExpenseTypeSelection', {
      onSelect: onChange,
      currentValue: value,
    });
  };

  const getDisplayValue = () => {
    if (!value) return placeholder;
    
    // Find the expense item that matches the selected value
    const selectedItem = expenseItems.find(item => item.expenseItem === value);
    if (selectedItem) {
      return selectedItem.expenseItem; // Show the actual item name
    }
    
    return value; // Fallback to the value
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.selector,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.error : colors.border,
          },
          disabled && { opacity: 0.6 }
        ]}
        onPress={handlePress}
        disabled={disabled}
      >
        <Text
          style={[
            styles.selectorText,
            { color: value ? colors.text : colors.placeholder }
          ]}
        >
          {getDisplayValue()}
        </Text>
        <Feather 
          name="chevron-down" 
          size={20} 
          color={colors.placeholder} 
        />
      </TouchableOpacity>
      
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectorText: {
    fontSize: 16,
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
});
