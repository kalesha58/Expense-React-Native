import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { StatusBar, Platform } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from './src/context/ThemeContext';
import { useTheme } from './src/hooks/useTheme';
import { AuthProvider } from './src/context/AuthContext';
import { SyncProvider } from './src/context/SyncContext';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/utils/NavigationUtils';
import { permissionService } from './src/services/permissionService';

const AppContent = () => {
  const { colors, isDark } = useTheme();
  
  // Request permissions on app startup
  useEffect(() => {
    const initializePermissions = async () => {
      try {
        const permissions = await permissionService.requestAllPermissions();
        console.log('App permissions initialized:', permissions);
        
        // Check for missing critical permissions
        const missingPermissions: string[] = [];
        if (!permissions.camera) missingPermissions.push('Camera');
        
        if (missingPermissions.length > 0) {
          console.warn('Missing permissions:', missingPermissions);
          // Note: We're not showing alert on startup to avoid interrupting user flow
          // Permissions will be requested when specific features are used
        }
      } catch (error) {
        console.error('Error initializing permissions:', error);
      }
    };

    initializePermissions();
  }, []);
  
  return (
    <>
      <StatusBar 
        backgroundColor={colors.primary}
        barStyle="light-content"
        translucent={false}
        animated={true}
      />
      <AppNavigator />
    </>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ThemeProvider>
          <AuthProvider>
            <SyncProvider>
              <AppContent />
            </SyncProvider>
          </AuthProvider>
        </ThemeProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

export default App;