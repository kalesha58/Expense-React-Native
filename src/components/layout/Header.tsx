import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';

type HeaderProps = {
  title: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  showThemeToggle?: boolean;
};

export const Header = ({
  title,
  showBackButton = false,
  rightComponent,
  showThemeToggle = false,
}: HeaderProps) => {
  const { colors, isDark, setTheme, theme } = useTheme();
  const navigation = useNavigation();
  
  const handleBack = () => {
    navigation.goBack();
  };
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.primary, 
        borderBottomColor: colors.primary,
        paddingTop: Platform.OS === 'ios' ? 44 : 0,
      }
    ]}>
      <View style={styles.content}>
        <View style={styles.leftContainer}>
          {showBackButton && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={24} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={[styles.title, { color: colors.white }]} numberOfLines={1}>
          {title}
        </Text>
        
        <View style={styles.rightContainer}>
          {showThemeToggle && (
            <TouchableOpacity 
              style={styles.themeToggle} 
              onPress={toggleTheme}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                          {isDark ? (
              <Feather name="sun" size={24} color={colors.white} />
            ) : (
              <Feather name="moon" size={24} color={colors.white} />
            )}
            </TouchableOpacity>
          )}
          
          {rightComponent && rightComponent}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    minHeight: Platform.OS === 'ios' ? 88 : 64,
    width: '100%',
    zIndex: 1000,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: SIZES.large,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  rightContainer: {
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  themeToggle: {
    padding: 4,
    marginRight: 8,
  },
}); 