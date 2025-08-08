import React from 'react';
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

const AppContent = () => {
  const { colors, isDark } = useTheme();
  
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