import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Text,
  Platform,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { SIZES } from '../constants/theme';
import Feather from 'react-native-vector-icons/Feather';
import { replace } from '../utils/NavigationUtils';
import { logger } from '../utils/logger';

const VERSION = 'EXP2025A-V1.0.0';

interface LoginFormData {
  username: string;
  password: string;
}

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const { colors, isDark, setTheme, theme } = useTheme();
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof LoginFormData, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      setError('Username is required.');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Password is required.');
      return false;
    }
    return true;
  };

  const handleLogin = async (): Promise<void> => {
    if (!validateForm()) return;

    setError('');
    setIsLoading(true);
    
    try {
      logger.info('Login attempt', { username: formData.username });
      
      // Add timeout to prevent hanging
      const loginPromise = login(formData.username, formData.password);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout. Please try again.')), 30000)
      );
      
      // Call the actual login API through AuthContext with timeout
      await Promise.race([loginPromise, timeoutPromise]);
      
      logger.info('Login successful, navigating to department screen');
      // Navigate to department screen after successful authentication
      await replace('SelectDepartment');
    } catch (error) {
      logger.error('Login failed', { error, username: formData.username });
      
      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          setError('Request timeout. Please check your internet connection and try again.');
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          setError('Network error. Please check your internet connection.');
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          setError('Invalid username or password.');
        } else if (error.message.includes('500') || error.message.includes('Server')) {
          setError('Server error. Please try again later.');
        } else {
          setError(error.message || 'Login failed. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async (): Promise<void> => {
    setError('');
    setIsLoading(true);
    
    try {
      logger.info('Demo login attempt');
      
      // Use demo credentials
      await login('demo@propelapps.com', 'demo123');
      
      logger.info('Demo login successful, navigating to department screen');
      await replace('SelectDepartment');
    } catch (error) {
      logger.error('Demo login failed', { error });
      setError('Demo login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = (): void => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const clearError = (): void => {
    setError('');
  };

  const styles = createStyles(colors, isDark);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Mobile Expenses</Text>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            {/* Login Title */}
            <Text style={styles.loginTitle}>Login</Text>

            {/* Error Box */}
            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={20} color={colors.expense} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={clearError}>
                  <Feather name="x" size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Feather name="user" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithIcon,
                  error.toLowerCase().includes('username') && styles.inputError,
                ]}
                autoCapitalize="none"
                value={formData.username}
                placeholder="demo@propelapps.com"
                placeholderTextColor="#999"
                onChangeText={(value) => handleInputChange('username', value)}
                editable={!isLoading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.passwordContainer}>
              <Feather name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithIcon,
                  styles.passwordInput,
                  error.toLowerCase().includes('password') && styles.inputError,
                ]}
                value={formData.password}
                placeholder="Enter Password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                onChangeText={(value) => handleInputChange('password', value)}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={isLoading}
              >
                {showPassword ? (
                  <Feather name="eye-off" size={20} color="#666" />
                ) : (
                  <Feather name="eye" size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>

            {/* Demo Button */}
            <TouchableOpacity
              style={[styles.demoButton, isLoading && styles.buttonDisabled]}
              onPress={handleDemo}
              disabled={isLoading}
            >
              <Text style={styles.demoButtonText}>
                {isLoading ? 'Loading...' : 'Demo'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.versionText}>Version - {VERSION}</Text>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/images/Propel-Apps-Logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    header: {
      backgroundColor: '#1E3A8A',
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
    },
    loginTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: '#333',
      marginBottom: 24,
    },
    input: {
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      fontSize: 16,
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E5E5',
      color: '#333',
    },
    inputError: {
      borderColor: '#EF4444',
    },
    inputContainer: {
      width: '100%',
      position: 'relative',
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    inputWithIcon: {
      paddingLeft: 48,
    },
    inputIcon: {
      position: 'absolute',
      left: 16,
      top: '50%',
      transform: [{ translateY: -10 }],
      zIndex: 1,
      width: 20,
      height: 20,
    },
    passwordContainer: {
      width: '100%',
      position: 'relative',
      marginBottom: 24,
    },
    passwordInput: {
      paddingRight: 48,
    },
    passwordToggle: {
      position: 'absolute',
      right: 16,
      top: '50%',
      transform: [{ translateY: -10 }],
    },
    loginButton: {
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      marginBottom: 12,
      width: '100%',
      backgroundColor: colors.button,
    },
    loginButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    demoButton: {
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: '#1E3A8A',
    },
    demoButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#1E3A8A',
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    errorBox: {
      padding: 12,
      borderRadius: 8,
      borderLeftWidth: 4,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      backgroundColor: '#FFE5E5',
      borderLeftColor: '#EF4444',
    },
    errorText: {
      marginLeft: 8,
      flex: 1,
      fontSize: 14,
      color: '#333',
    },
    footer: {
      padding: 24,
      alignItems: 'center',
    },
    versionText: {
      fontSize: 12,
      color: '#999',
      marginBottom: 16,
    },
    logoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoImage: {
      width: 120,
      height: 60,
    },
  });

export default LoginScreen; 