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

import { CreateExpenseScreen } from '../screens/CreateExpenseScreen';
import { ExpenseDetailsScreen } from '../screens/ExpenseDetailsScreen';
import { LineItemDetailsScreen } from '../screens/LineItemDetailsScreen';
import { LineItemEntryScreen } from '../screens/LineItemEntryScreen';
import { ExpenseTypeSelectionScreen } from '../screens/ExpenseTypeSelectionScreen';
import { ItemizedBusinessExpensesScreen } from '../screens/ItemizedBusinessExpensesScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { navigationRef } from '../utils/NavigationUtils';
import { ExpenseDetail } from '../hooks/useExpenseDetails';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  SelectDepartment: undefined;
  Activity: undefined;
  Dashboard: undefined;
  About: undefined;
  Profile: undefined;
  CreateExpense: {
    receiptImage?: string;
    extractedData?: {
      business_name: string;
      items: Array<{
        description: string;
        price: number;
        quantity?: number;
      }>;
      total_amount?: number;
      expense_type?: string;
      Expense_Type?: string;
      from_location?: string | null;
      to_location?: string | null;
      check_in_date?: string;
      check_out_date?: string;
    };
    startExtractionInBackground?: boolean;
  } | undefined;
  LineItemEntry: {
    onSave?: (lineItem: any) => void;
    editMode?: boolean;
    lineItem?: any;
  };
  ExpenseTypeSelection: {
    onSelect?: (expenseType: string) => void;
    currentValue?: string;
  };
  ExpenseDetails: { 
    expense: {
      reportHeaderId: string;
      reportName: string;
      reportDate: string;
      totalAmount: number;
      currency: string;
      status: 'approved' | 'pending' | 'rejected';
      items: ExpenseDetail[];
    };
  };
  LineItemDetails: {
    lineItem: ExpenseDetail;
    itemizedGroup?: any[];
  };
  ItemizedBusinessExpenses: {
    mainExpense?: {
      name: string;
      receiptAmount: number;
      currency: string;
    };
  };
  Statistics: undefined;
  Camera: {
    onImageCaptured?: (imageUri: string) => void;
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
        <Stack.Screen name="CreateExpense" component={CreateExpenseScreen} />
        <Stack.Screen name="LineItemEntry" component={LineItemEntryScreen} />
        <Stack.Screen name="ExpenseTypeSelection" component={ExpenseTypeSelectionScreen} />
        <Stack.Screen name="ExpenseDetails" component={ExpenseDetailsScreen} />
        <Stack.Screen name="LineItemDetails" component={LineItemDetailsScreen} />
        <Stack.Screen name="ItemizedBusinessExpenses" component={ItemizedBusinessExpensesScreen} />
        <Stack.Screen name="Statistics" component={StatisticsScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 