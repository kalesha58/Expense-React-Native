import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';

interface LoadingFooterProps {
  isLoading: boolean;
  text?: string;
}

export const LoadingFooter: React.FC<LoadingFooterProps> = ({
  isLoading,
  text = "Loading more expenses...",
}) => {
  const { colors } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, fadeAnim]);

  if (!isLoading) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={[styles.text, { color: colors.placeholder }]}>
        {text}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  text: {
    fontSize: SIZES.small,
    fontWeight: '500',
  },
}); 