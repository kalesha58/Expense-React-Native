import React, { useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({ 
  state, 
  descriptors, 
  navigation 
}) => {
  const { colors, shadows } = useTheme();
  const animatedValues = React.useRef(
    state.routes.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Animate the active tab
    state.routes.forEach((route: any, index: number) => {
      const isFocused = state.index === index;
      Animated.spring(animatedValues[index], {
        toValue: isFocused ? 1 : 0,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
    });
  }, [state.index]);

  return (
    <View style={[styles.customTabBar, { backgroundColor: colors.card }, shadows.medium]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const scale = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.1],
        });

        const translateY = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        });

        const opacity = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1],
        });

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabButton}
          >
            <Animated.View
              style={[
                styles.tabContent,
                {
                  transform: [{ scale }, { translateY }],
                  opacity,
                },
              ]}
            >
              {isFocused && (
                <Animated.View
                  style={[
                    styles.activeIndicator,
                    {
                      backgroundColor: colors.primary,
                      transform: [
                        {
                          scale: animatedValues[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}
              
              <View style={styles.iconContainer}>
                {options.tabBarIcon({ 
                  focused: isFocused, 
                  color: isFocused ? colors.primary : colors.placeholder, 
                  size: 24 
                })}
              </View>
              
              <Animated.Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? colors.primary : colors.placeholder,
                    transform: [
                      {
                        scale: animatedValues[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {label}
              </Animated.Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  customTabBar: {
    flexDirection: 'row',
    height: 80,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 60,
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 6,
    height: 6,
    borderRadius: 3,
    alignSelf: 'center',
  },
  iconContainer: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 