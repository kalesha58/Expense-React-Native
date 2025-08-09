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
import AsyncStorage from '@react-native-async-storage/async-storage';

const DepartmentScreen = () => {
    const { colors } = useTheme();
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
    }, [departments, loading, error, filteredDepartments]);
  
    const handleContinue = async () => {
      if (selected) {
        try {
          logger.info('Navigating to Activity screen', { selectedDepartment: selected.departmentName });
          
          // Store selected department for use in CreateExpenseScreen
          const departmentString = `${selected.departmentCode} - ${selected.departmentName}`;
          await AsyncStorage.setItem('selectedDepartment', departmentString);
          logger.info('Stored selected department', { department: departmentString });
         
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
          
          {/* Search Section */}
          <View style={styles.searchSection}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or code"
              style={styles.searchBar}
            />
          </View>

          {/* Content Area */}
          <View style={styles.contentArea}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textLight }]}>Loading departments...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={48} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>Failed to load departments.</Text>
              </View>
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
          </View>

          {/* Footer */}
          <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}> 
            <TouchableOpacity
              style={[
                styles.continueBtn, 
                { 
                  backgroundColor: selected ? colors.button : colors.disabled,
                }
              ]}
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
    searchSection: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
    },
    searchBar: {
      marginHorizontal: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    contentArea: {
      flex: 1,
    },
    listContainer: {
      flex: 1,
    },
    listContent: {
      paddingTop: 8,
      paddingBottom: 100,
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: 16,
      borderTopWidth: 1,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 40,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      fontWeight: '500',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 40,
    },
    errorText: {
      textAlign: 'center',
      marginTop: 16,
      fontSize: 16,
      fontWeight: '500',
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