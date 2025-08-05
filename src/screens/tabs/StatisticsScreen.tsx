import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';

export const StatisticsScreen: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Statistics</Text>
      <Text style={[styles.subtitle, { color: colors.placeholder }]}>
        View your expense analytics
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  title: {
    fontSize: SIZES.xxlarge,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: SIZES.medium,
    textAlign: 'center',
  },
}); 