import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';
import { Department } from '../../hooks/useDepartments';

interface DepartmentListItemProps {
  department: Department;
  onPress: () => void;
  isSelected?: boolean;
}

export const DepartmentListItem: React.FC<DepartmentListItemProps> = ({
  department,
  onPress,
  isSelected = false,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: isSelected ? colors.primary + '10' : colors.card,
          borderLeftColor: isSelected ? colors.primary : 'transparent',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[
            styles.title, 
            { 
              color: isSelected ? colors.primary : colors.text,
              fontWeight: isSelected ? '600' : '500'
            }
          ]}>
            {department.departmentName}
          </Text>
          <Text style={[
            styles.code, 
            { 
              color: isSelected ? colors.primary + '80' : colors.placeholder 
            }
          ]}>
            Code: {department.departmentCode}
          </Text>
        </View>
        
        <View style={styles.rightSection}>
          {isSelected ? (
            <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          ) : (
            <Text style={[styles.arrow, { color: colors.placeholder }]}>›</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 3,
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: SIZES.medium,
    marginBottom: 2,
  },
  code: {
    fontSize: SIZES.small,
    fontWeight: '400',
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  arrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 