import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Header } from '../components/layout/Header';
import { SearchBar } from '../components/forms/SearchBar';
import { DepartmentListItem } from '../components/lists/DepartmentListItem';
import useDepartments, { Department } from '../hooks/useDepartments';
import Feather from 'react-native-vector-icons/Feather';
import { replace } from '../utils/NavigationUtils';
import { logger } from '../utils/logger';

const DepartmentScreen = () => {
    const { colors, shadows } = useTheme();
    const { departments, loading, error } = useDepartments();
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Department | null>(null);
  
    const filteredDepartments = useMemo(() => {
      if (!search.trim()) return departments;
      return departments.filter(dep =>
        dep.departmentName.toLowerCase().includes(search.toLowerCase()) ||
        dep.departmentCode.toLowerCase().includes(search.toLowerCase())
      );
    }, [departments, search]);

    useEffect(() => {
      logger.info('DepartmentScreen loaded', { 
        departmentsCount: departments.length,
        loading,
        error 
      });
      
      // Add more detailed logging
      console.log('DepartmentScreen - departments:', departments);
      console.log('DepartmentScreen - loading:', loading);
      console.log('DepartmentScreen - error:', error);
      console.log('DepartmentScreen - filteredDepartments:', filteredDepartments);
    }, [departments, loading, error, filteredDepartments]);
  
    const handleContinue = async () => {
      if (selected) {
        try {
          logger.info('Navigating to Activity screen', { selectedDepartment: selected.departmentName });
          // You can pass the selected department as a param if needed
          await replace('Activity');
        } catch (error) {
          logger.error('Navigation error', { error });
        }
      }
    };
  
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Header title="Select Department" showBackButton showThemeToggle />
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or code"
            style={styles.searchBar}
          />
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : error ? (
            <Text style={[styles.error, { color: colors.error }]}>Failed to load departments.</Text>
          ) : filteredDepartments.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Feather name="search" size={48} color={colors.placeholder} style={{ marginBottom: 8 }} />
              <Text style={[styles.noResultsText, { color: colors.placeholder }]}>No departments found</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              <FlatList
                data={filteredDepartments}
                keyExtractor={(item: Department) => item.id}
                renderItem={({ item }: { item: Department }) => (
                  <DepartmentListItem
                    department={item}
                    isSelected={selected?.id === item.id}
                    onPress={() => setSelected(item)}
                  />
                )}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={10}
              />
            </View>
          )}
          <View style={[styles.footer, { backgroundColor: colors.background }]}> 
            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: selected ? colors.button : colors.disabled }]}
              disabled={!selected}
              onPress={handleContinue}
              activeOpacity={selected ? 0.7 : 1}
            >
              <Text style={[styles.continueText, { color: '#fff' }]}>Continue</Text>
              <Feather name="arrow-right" size={20} color="#fff" style={styles.continueIcon} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 0,
    },
    searchBar: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
    },
    listContainer: {
      flex: 1,
      marginTop: 8,
    },
    listContent: {
      paddingVertical: 8,
      paddingBottom: 100,
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: '#eee',
    },
    continueBtn: {
      width: '100%',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    continueText: {
      fontSize: 18,
      fontWeight: 'bold',
      marginRight: 8,
    },
    continueIcon: {
      marginLeft: 8,
    },
    error: {
      textAlign: 'center',
      marginTop: 40,
      fontSize: 16,
    },
    welcomeSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      borderRadius: 16,
      borderWidth: 1.5,
      padding: 16,
    },
    welcomeIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    welcomeTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    welcomeSubtitle: {
      fontSize: 14,
      fontWeight: '500',
      opacity: 0.85,
    },
    noResultsContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 48,
      marginBottom: 24,
    },
    noResultsText: {
      fontSize: 16,
      fontWeight: '500',
      opacity: 0.8,
    },
  });

export default DepartmentScreen;