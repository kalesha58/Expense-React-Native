import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';

interface ISkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  shimmer?: boolean;
}

export const SkeletonLoader: React.FC<ISkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = SIZES.radius,
  style,
  shimmer = true,
}) => {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shimmer) {
      const shimmerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );
      shimmerAnimation.start();

      return () => shimmerAnimation.stop();
    }
  }, [shimmer, shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
        },
        style,
      ]}
    >
      {shimmer && (
        <Animated.View
          style={[
            styles.shimmer,
            {
              opacity: shimmerOpacity,
              backgroundColor: colors.card,
              borderRadius,
            },
          ]}
        />
      )}
    </View>
  );
};

// Skeleton for expense card
export const ExpenseCardSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.cardSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Left accent bar */}
      <SkeletonLoader width={4} height="100%" borderRadius={0} style={styles.accentBar} />
      
      <View style={styles.cardContent}>
        {/* Header section */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <SkeletonLoader width={180} height={20} />
            <SkeletonLoader width={140} height={14} style={{ marginTop: 6 }} />
          </View>
          <View style={styles.headerRight}>
            <SkeletonLoader width={80} height={24} />
            <SkeletonLoader width={70} height={18} style={{ marginTop: 6 }} />
          </View>
        </View>

        {/* Details section */}
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <SkeletonLoader width={16} height={16} borderRadius={8} />
            <SkeletonLoader width={60} height={14} />
          </View>
          <View style={styles.detailRow}>
            <SkeletonLoader width={16} height={16} borderRadius={8} />
            <SkeletonLoader width={100} height={14} />
          </View>
        </View>
      </View>
    </View>
  );
};

// Skeleton for tab header
export const TabHeaderSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.tabHeaderSkeleton, { borderBottomColor: colors.border }]}>
      {[1, 2, 3].map((_, index) => (
        <View key={index} style={styles.tabSkeleton}>
          <SkeletonLoader width={80} height={16} />
          <SkeletonLoader width={24} height={16} borderRadius={12} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  );
};

// Complete skeleton for expense list
export const ExpenseListSkeleton: React.FC<{ itemCount?: number }> = ({ itemCount = 5 }) => {
  return (
    <View style={styles.listSkeleton}>
      {Array.from({ length: itemCount }, (_, index) => (
        <ExpenseCardSkeleton key={index} />
      ))}
    </View>
  );
};

// Skeleton for search results
export const SearchResultSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.searchResultSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.searchResultLeft}>
        <SkeletonLoader width={44} height={44} borderRadius={22} />
        <View style={styles.searchResultInfo}>
          <SkeletonLoader width={160} height={16} />
          <SkeletonLoader width={120} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      <View style={styles.searchResultRight}>
        <SkeletonLoader width={70} height={18} />
        <SkeletonLoader width={60} height={16} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  cardSkeleton: {
    borderRadius: SIZES.radius,
    padding: 0,
    marginBottom: 8,
    borderWidth: 1,
    minHeight: 100,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  cardContent: {
    padding: 16,
    paddingLeft: 16 + 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  cardDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabHeaderSkeleton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tabSkeleton: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  listSkeleton: {
    padding: SIZES.padding * 1.5,
    paddingBottom: SIZES.padding * 3,
  },
  searchResultSkeleton: {
    borderRadius: SIZES.radius * 2,
    padding: SIZES.padding * 1.5,
    marginBottom: SIZES.padding,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SIZES.padding,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultRight: {
    alignItems: 'flex-end',
  },
});
