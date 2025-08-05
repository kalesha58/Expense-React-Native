import React from 'react';
import 'react-native-gesture-handler';

import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { SyncProvider } from './src/context/SyncContext';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/utils/NavigationUtils';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SyncProvider>
          <AppNavigator />
        </SyncProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;