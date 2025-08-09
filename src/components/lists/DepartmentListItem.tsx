import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SIZES } from '../../constants/theme';
import { Department } from '../../hooks/useDepartments';
import Feather from 'react-native-vector-icons/Feather';

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
          backgroundColor: isSelected ? colors.primary + '08' : colors.background,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
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
            {department.departmentCode}
          </Text>
        </View>
        
        <View style={styles.rightSection}>
          {isSelected ? (
            <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
              <Feather name="check" size={14} color="#fff" />
            </View>
          ) : (
            <Feather 
              name="chevron-right" 
              size={18} 
              color={colors.placeholder} 
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 