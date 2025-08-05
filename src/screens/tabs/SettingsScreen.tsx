import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';
import { Header } from '../../components/layout/Header';
import Feather from 'react-native-vector-icons/Feather';
import { replace, navigate } from '../../utils/NavigationUtils';

export const SettingsScreen: React.FC = () => {
  const { logout, user } = useAuth();
  const { colors, isDark, setTheme, theme } = useTheme();
  
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
            <Feather name="settings" size={22} color={colors.primary} />,
            'Account Settings',
            () => {
              navigate('Account');
            }
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
    </SafeAreaView>
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