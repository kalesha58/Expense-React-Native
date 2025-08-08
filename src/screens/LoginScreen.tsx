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

const VERSION = 'EXP25A-V1.0.3';

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
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleInputChange = (field: keyof LoginFormData, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    setIsLoginLoading(true);

    try {
      logger.info('Login attempt', { username: formData.username });
      const loginPromise = login(formData.username, formData.password);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout. Please try again.')), 30000)
      );
      await Promise.race([loginPromise, timeoutPromise]);
      logger.info('Login successful, navigating to department screen');
      await replace('SelectDepartment');
    } catch (error) {
      logger.error('Login failed', { 
        error, 
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorType: typeof error,
        username: formData.username,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          setError('Request timeout. Please check your internet connection and try again.');
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          setError('Network error. Please check your internet connection.');
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          setError('Invalid username or password.');
        } else if (error.message.includes('500') || error.message.includes('Server')) {
          setError('Server error. Please try again later.');
        } else if (error.message.includes('Invalid username or password')) {
          setError('Invalid username or password. Please check your credentials.');
        } else if (error.message.includes('Server returned no data')) {
          setError('Server error. Please try again later.');
        } else {
          setError(error.message || 'Login failed. Please try again.');
        }
      } else {
        logger.error('Non-Error object caught in login', { error, errorType: typeof error });
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleDemo = async (): Promise<void> => {
    setError('');
    setIsDemoLoading(true);

    try {
      logger.info('Demo login attempt');
      await login('demo@propelapps.com', 'demo123');
      logger.info('Demo login successful, navigating to department screen');
      await replace('SelectDepartment');
    } catch (error) {
      logger.error('Demo login failed', { error });
      setError('Demo login failed. Please try again.');
    } finally {
      setIsDemoLoading(false);
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
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.appTitle}>Expense App</Text>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
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

            {/* Form Section */}
            <View style={styles.formContainer}>
              {/* Username Input */}
              <View
                style={[
                  styles.inputContainer,
                  error.toLowerCase().includes('username') && styles.inputError,
                ]}
              >
                <View style={styles.inputIconContainer}>
                  <Feather name="user" size={20} color="#09658A" />
                </View>
                <TextInput
                  style={styles.input}
                  autoCapitalize="none"
                  value={formData.username}
                  placeholder="Username"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={(value) => handleInputChange('username', value)}
                  editable={!isLoginLoading && !isDemoLoading}
                />
              </View>

              {/* Password Input */}
              <View
                style={[
                  styles.inputContainer,
                  error.toLowerCase().includes('password') && styles.inputError,
                ]}
              >
                <View style={styles.inputIconContainer}>
                  <Feather name="lock" size={20} color="#09658A" />
                </View>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={formData.password}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  onChangeText={(value) => handleInputChange('password', value)}
                  editable={!isLoginLoading && !isDemoLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  disabled={isLoginLoading || isDemoLoading}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#09658A"
                  />
                </TouchableOpacity>
              </View>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.loginButton, isLoginLoading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoginLoading || isDemoLoading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoginLoading ? 'LOGGING IN...' : 'LOGIN'}
                  </Text>
                </TouchableOpacity>

                {/* Demo Button */}
                <TouchableOpacity
                  style={[styles.demoButton, isDemoLoading && styles.buttonDisabled]}
                  onPress={handleDemo}
                  disabled={isLoginLoading || isDemoLoading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.demoButtonText}>
                    {isDemoLoading ? 'LOADING...' : 'DEMO'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.versionText}>Version - Propel.{VERSION}</Text>
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
      backgroundColor: '#F8FAFC',
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: '#F8FAFC',
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    appTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#09658A',
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      justifyContent: 'center',
    },
    formContainer: {
      width: '100%',
      maxWidth: 400,
      alignSelf: 'center',
    },
    inputContainer: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    inputIconContainer: {
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      paddingVertical: 15,
      paddingRight: 16,
      fontSize: 16,
      color: '#374151',
      backgroundColor: 'transparent',
    },
    passwordInput: {
      paddingRight: 50,
    },
    inputError: {
      borderColor: '#EF4444',
      borderWidth: 1.5,
    },
    passwordToggle: {
      position: 'absolute',
      right: 16,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonContainer: {
      marginTop: 24,
      gap: 16,
    },
    loginButton: {
      width: '100%',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: colors.button || '#09658A',
      shadowColor: '#09658A',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    loginButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      letterSpacing: 1,
    },
    demoButton: {
      width: '100%',
      borderRadius: 12,
      paddingVertical: 6,
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: '#09658A',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    demoButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#09658A',
      letterSpacing: 1,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    errorBox: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      backgroundColor: '#FEE2E2',
      borderLeftWidth: 4,
      borderLeftColor: '#EF4444',
      shadowColor: '#EF4444',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    errorText: {
      marginLeft: 12,
      flex: 1,
      fontSize: 14,
      color: '#991B1B',
      fontWeight: '500',
    },
    footer: {
      padding: 24,
      alignItems: 'center',
    },
    versionText: {
      fontSize: 12,
      color: '#000000',
      marginBottom: 16,
      textAlign: 'center',
      fontWeight: '500',
    },
    logoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoImage: {
      width: 120,
      height: 40,
      marginBottom: 8,
    },
  });

export default LoginScreen;