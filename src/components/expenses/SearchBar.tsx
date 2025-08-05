import React from 'react';
import { View, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../ui/Input';
import { SIZES } from '../../constants/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Search by expense, report name, supplier, location...",
  autoFocus = false,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.card, borderColor: colors.border }
    ]}>
      <Feather name="search" size={20} color={colors.placeholder} />
      <Input
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        containerStyle={styles.inputContainer}
        style={styles.input}
        autoFocus={autoFocus}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    marginHorizontal: SIZES.padding,
    marginTop: 8,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  input: {
    fontSize: SIZES.font,
  },
}); 