import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';
import { Header } from '../../components/layout/Header';
import Feather from 'react-native-vector-icons/Feather';
import { replace, navigate } from '../../utils/NavigationUtils';

// Language options
const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
];

export const SettingsScreen: React.FC = () => {
  const { logout, user } = useAuth();
  const { colors, isDark, setTheme, theme } = useTheme();
  
  // User preferences state
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            replace('Login');
          },
        },
      ]
    );
  };
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change functionality coming soon!');
  };
  
  const getLanguageLabel = (value: string) => {
    const language = LANGUAGE_OPTIONS.find(lang => lang.value === value);
    return language ? language.label : 'English';
  };
  
  const handleLanguageSelect = (value: string) => {
    setSelectedLanguage(value);
    setLanguageDropdownOpen(false);
  };
  
  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode
  ) => {
    return (
      <TouchableOpacity 
        style={[styles.settingItem, { borderBottomColor: colors.border }]}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.settingItemLeft}>
          {icon}
          <Text style={[styles.settingItemText, { color: colors.text }]}>
            {title}
          </Text>
        </View>
        
        {rightComponent || (
          onPress && <Feather name="chevron-right" size={20} color={colors.placeholder} />
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Settings" />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Account
          </Text>
          
          {renderSettingItem(
            <Feather name="user" size={22} color={colors.primary} />,
            'Profile',
            () => {
              navigate('Profile');
            }
          )}
          
          {renderSettingItem(
            <Feather name="lock" size={22} color={colors.primary} />,
            'Change Password',
            handleChangePassword
          )}
          
          {renderSettingItem(
            <Feather name="log-out" size={22} color={colors.error} />,
            'Logout',
            handleLogout
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Preferences
          </Text>
          
          {renderSettingItem(
            <Feather name="moon" size={22} color={colors.primary} />,
            'Dark Mode',
            undefined,
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.disabled, true: colors.primary + '80' }}
              thumbColor={isDark ? colors.primary : '#f4f3f4'}
            />
          )}
          
          {/* Language Selection */}
          <View style={styles.languageSettingContainer}>
            {renderSettingItem(
              <Feather name="globe" size={22} color={colors.primary} />,
              'Language',
              () => setLanguageDropdownOpen(!languageDropdownOpen),
              <View style={styles.languageValueContainer}>
                <Text style={[styles.languageValueText, { color: colors.placeholder }]}>
                  {getLanguageLabel(selectedLanguage)}
                </Text>
                <Feather 
                  name={languageDropdownOpen ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.placeholder} 
                />
              </View>
            )}
            
            {languageDropdownOpen && (
              <View style={[styles.languageDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {LANGUAGE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.languageOption,
                      { 
                        borderBottomColor: colors.border,
                        backgroundColor: option.value === selectedLanguage ? colors.primary + '10' : 'transparent'
                      }
                    ]}
                    onPress={() => handleLanguageSelect(option.value)}
                  >
                    <Text style={[
                      styles.languageOptionText,
                      { 
                        color: option.value === selectedLanguage ? colors.primary : colors.text,
                        fontWeight: option.value === selectedLanguage ? '600' : '400'
                      }
                    ]}>
                      {option.label}
                    </Text>
                    {option.value === selectedLanguage && (
                      <Feather name="check" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          {renderSettingItem(
            <Feather name="bell" size={22} color={colors.primary} />,
            'Notifications',
            () => {
              Alert.alert('Notifications', 'Notification settings coming soon!');
            }
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Reports & Analytics
          </Text>
          
          {renderSettingItem(
            <Feather name="bar-chart-2" size={22} color={colors.primary} />,
            'Statistics',
            () => {
              navigate('Statistics');
            }
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Support
          </Text>
          
          {renderSettingItem(
            <Feather name="help-circle" size={22} color={colors.primary} />, 
            'Help & Support',
            () => {
              Alert.alert('Help & Support', 'Help and support coming soon!');
            }
          )}
          
          {renderSettingItem(
            <Feather name="info" size={22} color={colors.primary} />,
            'About',
            () => {
              navigate('About');
            }
          )}
        </View>
        
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.placeholder }]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.copyrightText, { color: colors.placeholder }]}>
            © 2024 Expense Manager. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingItemText: {
    fontSize: SIZES.font,
  },
  languageSettingContainer: {
    position: 'relative',
  },
  languageValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageValueText: {
    fontSize: SIZES.font,
    fontWeight: '500',
  },
  languageDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: SIZES.radius,
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  languageOptionText: {
    fontSize: SIZES.font,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  versionText: {
    fontSize: SIZES.small,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: SIZES.small,
  },
});