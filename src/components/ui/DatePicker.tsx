import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
  StyleProp,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';

type DatePickerProps = {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  datePickerStyle?: StyleProp<ViewStyle>;
  errorStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  placeholder?: string;
  format?: string; // Date format string
};

export const DatePicker = ({
  label,
  value,
  onChange,
  error,
  containerStyle,
  labelStyle,
  datePickerStyle,
  errorStyle,
  disabled = false,
  placeholder = 'Select date',
  format = 'MM/DD/YYYY',
}: DatePickerProps) => {
  const { colors } = useTheme();
  
  // Format date for display
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'MM/DD/YYYY':
      default:
        return `${month}/${day}/${year}`;
    }
  };
  
  const openDatePicker = () => {
    if (!disabled) {
      // For now, show an alert with date options
      // In a real app, you would use @react-native-community/datetimepicker
      Alert.alert(
        'Select Date',
        'Date picker functionality would be implemented here.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Today', 
            onPress: () => onChange(new Date()) 
          },
          { 
            text: 'Yesterday', 
            onPress: () => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              onChange(yesterday);
            } 
          },
        ]
      );
    }
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }, labelStyle]}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.datePicker,
          { 
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : colors.border,
            opacity: disabled ? 0.7 : 1,
          },
          datePickerStyle,
        ]}
        onPress={openDatePicker}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text 
          style={[
            styles.dateText, 
            { 
              color: value ? colors.text : colors.placeholder 
            }
          ]}
        >
          {value ? formatDate(value) : placeholder}
        </Text>
        <Feather name="calendar" size={20} color={colors.placeholder} />
      </TouchableOpacity>
      
      {error && (
        <Text style={[styles.error, { color: colors.error }, errorStyle]}>
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
    fontSize: SIZES.font,
    marginBottom: 8,
    fontWeight: '500',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    height: 48,
  },
  dateText: {
    fontSize: SIZES.font,
    flex: 1,
  },
  error: {
    fontSize: SIZES.font - 2,
    marginTop: 4,
  },
});