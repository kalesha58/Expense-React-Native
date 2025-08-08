import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';

interface CreateExpenseFABProps {
  onPress: () => void;
  visible: boolean;
}

export const CreateExpenseFAB: React.FC<CreateExpenseFABProps> = ({
  onPress,
  visible,
}) => {
  const { colors, shadows } = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);

  if (!visible) return null;

  return (
    <>
      <TouchableOpacity
        style={[styles.floatingAddButton, { backgroundColor: colors.primary }, shadows.medium]}
        onPress={onPress}
        onPressIn={() => setShowTooltip(true)}
        onPressOut={() => setShowTooltip(false)}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {showTooltip && (
        <View style={[styles.tooltipContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.tooltipArrow} />
          <Text style={[styles.tooltipText, { color: colors.text }]}>
            Add Line Item
          </Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  floatingAddButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: 160,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    right: 20,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'inherit',
  },
  tooltipText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 