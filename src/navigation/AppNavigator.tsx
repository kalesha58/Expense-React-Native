import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import DepartmentScreen from '../screens/DepartmentScreen';
import SplashScreen from '../screens/SplashScreen';
import ActivityScreen from '../screens/ActivityScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AboutScreen from '../screens/AboutScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AccountScreen from '../screens/AccountScreen';
import { CreateExpenseScreen } from '../screens/CreateExpenseScreen';
import { ExpenseDetailsScreen } from '../screens/ExpenseDetailsScreen';
import { navigationRef } from '../utils/NavigationUtils';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  SelectDepartment: undefined;
  Activity: undefined;
  Dashboard: undefined;
  About: undefined;
  Profile: undefined;
  Account: undefined;
  CreateExpense: undefined;
  ExpenseDetails: { 
    expense: {
      LineId: string;
      ExpenseItem: string;
      Amount: string;
      Currency: string;
      TransactionDate: string;
      ExpenseStatus: string;
      BusinessPurpose: string;
      DepartmentCode: string;
      Location: string;
      Supplier: string;
      Comments: string;
      ReportName: string;
      NumberOfDays: string;
      ToLocation: string;
    };
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SelectDepartment" component={DepartmentScreen} />
        <Stack.Screen name="Activity" component={ActivityScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Account" component={AccountScreen} />
        <Stack.Screen name="CreateExpense" component={CreateExpenseScreen} />
        <Stack.Screen name="ExpenseDetails" component={ExpenseDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 