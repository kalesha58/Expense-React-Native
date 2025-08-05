import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';

import { useTheme } from '../hooks/useTheme';
import { CustomTabBar } from '../components/navigation/CustomTabBar';
import { HomeScreen } from './tabs/HomeScreen';
import { ExpenseScreen } from './tabs/ExpenseScreen';
import { StatisticsScreen } from './tabs/StatisticsScreen';
import { SettingsScreen } from './tabs/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function DashboardScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Tab.Navigator
        tabBar={props => <CustomTabBar {...props} />}
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'Expense') {
              iconName = 'credit-card';
            } else if (route.name === 'Statistics') {
              iconName = 'bar-chart-2';
            } else if (route.name === 'Settings') {
              iconName = 'settings';
            }

            return <Feather name={iconName as any} size={size} color={color} />;
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Expense" component={ExpenseScreen} />
        <Tab.Screen name="Statistics" component={StatisticsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 