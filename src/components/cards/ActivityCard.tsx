import Feather from 'react-native-vector-icons/Feather';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  withSequence,
  withDelay,
  Easing
} from "react-native-reanimated";

import { useTheme } from "../../hooks/useTheme";
import { SIZES } from "../../constants/theme";
import type { ApiInfo, ApiState } from "../../../@types/api";

interface ActivityCardProps {
  apiInfo: ApiInfo;
  state: ApiState;
  index: number;
  onRetry: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ apiInfo, state, index, onRetry }) => {
  const { colors, shadows } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const translateX = useSharedValue(-300);
  const opacity = useSharedValue(0);
  const errorHeight = useSharedValue(0);

  useEffect(() => {
    // Stagger the animations based on index
    translateX.value = withDelay(
      index * 200, 
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
    opacity.value = withDelay(
      index * 200 + 200, 
      withTiming(1, { duration: 300 })
    );
  }, [index]);

  useEffect(() => {
    if (state.status === "success") {
      // Add a little bounce effect on success
      translateX.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    }
  }, [state.status]);

  const toggleExpanded = () => {
    setExpanded(!expanded);
    errorHeight.value = withTiming(expanded ? 0 : 80, { duration: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  const errorAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: errorHeight.value,
      opacity: errorHeight.value > 0 ? withTiming(1) : withTiming(0),
      overflow: "hidden",
    };
  });

  const renderStatusIcon = () => {
    switch (state.status) {
      case "loading":
        return <ActivityIndicator size="small" color={colors.primary} />;
      case "success":
        return <Feather name="check-circle" size={24} color={colors.success} />;
      case "error":
        return <Feather name="x-circle" size={24} color={colors.error} />;
      default:
        return null;
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, shadows.small]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>{apiInfo.name}</Text>
            <Text style={[styles.description, { color: colors.placeholder }]}>{apiInfo.description}</Text>
          </View>
          <View style={styles.statusContainer}>
            {renderStatusIcon()}
          </View>
        </View>

        {state.status === "error" && (
          <Pressable onPress={toggleExpanded} style={styles.errorContainer}>
            <View style={styles.errorHeader}>
              <Feather name="alert-triangle" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {state.error?.message || "An error occurred"}
              </Text>
              <Feather 
                name={expanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={colors.placeholder} 
              />
            </View>
            
            <Animated.View style={[styles.errorDetails, errorAnimatedStyle]}>
              <Text style={[styles.errorDetailsText, { color: colors.placeholder }]}>
                {state.error?.details || "No additional details available"}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.button }]}
                onPress={onRetry}
              >
                <Feather name="refresh-cw" size={16} color="white" />
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </Animated.View>
          </Pressable>
        )}

        {state.status === "success" && (
          <View style={styles.successContainer}>
            <Text style={[styles.successText, { color: colors.success }]}>
              Successfully completed
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    borderRadius: SIZES.radius,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: SIZES.small,
    lineHeight: 18,
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  errorDetails: {
    marginTop: 8,
  },
  errorDetailsText: {
    fontSize: SIZES.small,
    lineHeight: 18,
    marginBottom: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: 'white',
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  successContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  successText: {
    fontSize: SIZES.small,
    fontWeight: '500',
  },
}); 