import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../ui/Input';
import { Dropdown } from '../ui/Dropdown';
import { SIZES } from '../../constants/theme';

interface Department {
  departmentCode: string;
  departmentName: string;
}

interface BasicDetailsCardProps {
  title: string;
  department: string;
  departments: Department[];
  onTitleChange: (title: string) => void;
  onDepartmentChange: (department: string) => void;
}

export const BasicDetailsCard: React.FC<BasicDetailsCardProps> = ({
  title,
  department,
  departments,
  onTitleChange,
  onDepartmentChange,
}) => {
  const { colors, shadows } = useTheme();

  const departmentOptions = departments.map((dept: Department) => ({
    label: `${dept.departmentCode} - ${dept.departmentName}`,
    value: dept.departmentCode + ' - ' + dept.departmentName,
  }));

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, shadows.small]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.cardIcon, { backgroundColor: colors.primary + '15' }]}>
            <Feather name="file-text" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Basic Details
          </Text>
        </View>
      </View>
      
      <Input
        label="Expense Title"
        value={title}
        onChangeText={onTitleChange}
        placeholder="Enter Business Purpose"
        containerStyle={styles.inputContainer}
      />
      
      <Dropdown
        label="Department"
        value={department}
        options={departmentOptions}
        onChange={onDepartmentChange}
        containerStyle={styles.inputContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 12,
  },
}); 