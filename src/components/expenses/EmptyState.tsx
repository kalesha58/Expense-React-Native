import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  icon?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No expenses found",
  subtitle = "Try adjusting your search or filters",
  icon = "file-text",
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: colors.primary + '15' }]}>
        <Feather name={icon as any} size={48} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.subtitle, { color: colors.placeholder }]}>
        {subtitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: SIZES.large,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.font,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 