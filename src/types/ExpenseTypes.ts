// Expense Type Enums based on API data
export enum ExpenseType {
  // Travel Related
  AIRFARE = 'Airfare',
  HOTEL = 'Hotel',
  ACCOMMODATIONS = 'Accommodations',
  CAR_RENTAL = 'Car Rental',
  CAB = 'Cab',
  TRANSPORTATION = 'Transportation',
  
  // Meals
  MEALS = 'Meals',
  MEAL = 'Meal',
  DINNER = 'Dinner',
  BREAKFAST = 'Breakfast',
  
  // Other
  MISCELLANEOUS = 'Miscellaneous',
  TELEPHONE = 'Telephone',
  ENTERTAINMENT = 'Entertainment',
  TRAVEL = 'Travel',
  OFFICE_SUPPLIES = 'Office Supplies',
  CLIENT_ENTERTAINMENT = 'Client Entertainment',
  TRAINING = 'Training',
}

// Dynamic Field Configuration based on expense type
export interface IExpenseTypeFieldConfig {
  showToLocation: boolean;
  showDailyRates: boolean;
  showNumberOfDays: boolean;
  requiredFields: string[];
  additionalValidation?: (formData: any) => string[];
}

export const EXPENSE_TYPE_FIELD_CONFIG: Record<ExpenseType, IExpenseTypeFieldConfig> = {
  // Travel Related - require ToLocation
  [ExpenseType.AIRFARE]: {
    showToLocation: true,
    showDailyRates: false,
    showNumberOfDays: true,
    requiredFields: ['toLocation', 'numberOfDays'],
  },
  
  [ExpenseType.CAB]: {
    showToLocation: true,
    showDailyRates: false,
    showNumberOfDays: false,
    requiredFields: ['toLocation'],
  },
  
  [ExpenseType.TRANSPORTATION]: {
    showToLocation: true,
    showDailyRates: false,
    showNumberOfDays: false,
    requiredFields: ['toLocation'],
  },
  
  // Accommodation - require DailyRates and NumberOfDays
  [ExpenseType.HOTEL]: {
    showToLocation: false,
    showDailyRates: true,
    showNumberOfDays: true,
    requiredFields: ['dailyRates', 'numberOfDays'],
  },
  
  [ExpenseType.ACCOMMODATIONS]: {
    showToLocation: false,
    showDailyRates: true,
    showNumberOfDays: true,
    requiredFields: ['dailyRates', 'numberOfDays'],
  },
  
  // Car Rental - require DailyRates and NumberOfDays
  [ExpenseType.CAR_RENTAL]: {
    showToLocation: false,
    showDailyRates: true,
    showNumberOfDays: true,
    requiredFields: ['dailyRates', 'numberOfDays'],
  },
  
  // Meals - require NumberOfDays
  [ExpenseType.MEALS]: {
    showToLocation: false,
    showDailyRates: false,
    showNumberOfDays: true,
    requiredFields: ['numberOfDays'],
  },
  
  [ExpenseType.MEAL]: {
    showToLocation: false,
    showDailyRates: false,
    showNumberOfDays: false,
    requiredFields: [],
  },
  
  [ExpenseType.DINNER]: {
    showToLocation: false,
    showDailyRates: false,
    showNumberOfDays: false,
    requiredFields: [],
  },
  
  [ExpenseType.BREAKFAST]: {
    showToLocation: false,
    showDailyRates: false,
    showNumberOfDays: false,
    requiredFields: [],
  },
  
  // Other types - minimal requirements
  [ExpenseType.MISCELLANEOUS]: {
    showToLocation: false,
    showDailyRates: false,
    showNumberOfDays: false,
    requiredFields: [],
  },
  
  [ExpenseType.TELEPHONE]: {
    showToLocation: false,
    showDailyRates: false,
    showNumberOfDays: false,
    requiredFields: [],
  },
  
  [ExpenseType.ENTERTAINMENT]: {
    showToLocation: false,
    showDailyRates: false,
    showNumberOfDays: false,
    requiredFields: [],
  },
  
  [ExpenseType.TRAVEL]: {
    showToLocation: true,
    showDailyRates: false,
    showNumberOfDays: true,
    requiredFields: ['toLocation', 'numberOfDays'],
  },
  
  [ExpenseType.OFFICE_SUPPLIES]: {
    showToLocation: false,
    showDailyRates: false,
    showNumberOfDays: false,
    requiredFields: [],
  },
  
  [ExpenseType.CLIENT_ENTERTAINMENT]: {
    showToLocation: false,
    showDailyRates: false,
    showNumberOfDays: false,
    requiredFields: [],
  },
  
  [ExpenseType.TRAINING]: {
    showToLocation: false,
    showDailyRates: false,
    showNumberOfDays: true,
    requiredFields: ['numberOfDays'],
  },
};

// Utility function to get field configuration for an expense type
export const getExpenseTypeConfig = (expenseType: string): IExpenseTypeFieldConfig => {
  // Try to find exact match first
  const exactMatch = Object.values(ExpenseType).find(type => type === expenseType);
  if (exactMatch && EXPENSE_TYPE_FIELD_CONFIG[exactMatch]) {
    return EXPENSE_TYPE_FIELD_CONFIG[exactMatch];
  }
  
  // Try to find partial match (case-insensitive)
  const partialMatch = Object.values(ExpenseType).find(type => 
    type.toLowerCase().includes(expenseType.toLowerCase()) ||
    expenseType.toLowerCase().includes(type.toLowerCase())
  );
  
  if (partialMatch && EXPENSE_TYPE_FIELD_CONFIG[partialMatch]) {
    return EXPENSE_TYPE_FIELD_CONFIG[partialMatch];
  }
  
  // Default configuration for unknown types
  return {
    showToLocation: false,
    showDailyRates: false,
    showNumberOfDays: false,
    requiredFields: [],
  };
};

// Helper function to check if expense type is travel-related
export const isTravelRelated = (expenseType: string): boolean => {
  const travelTypes = [
    ExpenseType.AIRFARE,
    ExpenseType.CAB,
    ExpenseType.TRANSPORTATION,
    ExpenseType.TRAVEL,
  ];
  
  return travelTypes.some(type => 
    type.toLowerCase() === expenseType.toLowerCase() ||
    expenseType.toLowerCase().includes(type.toLowerCase())
  );
};

// Helper function to check if expense type requires daily rates
export const requiresDailyRates = (expenseType: string): boolean => {
  const dailyRateTypes = [
    ExpenseType.HOTEL,
    ExpenseType.ACCOMMODATIONS,
    ExpenseType.CAR_RENTAL,
  ];
  
  return dailyRateTypes.some(type => 
    type.toLowerCase() === expenseType.toLowerCase() ||
    expenseType.toLowerCase().includes(type.toLowerCase())
  );
};

// Validation function for dynamic fields
export const validateDynamicFields = (
  expenseType: string, 
  formData: Record<string, any>
): string[] => {
  const errors: string[] = [];
  const config = getExpenseTypeConfig(expenseType);
  
  // Check required fields
  config.requiredFields.forEach(field => {
    if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
      switch (field) {
        case 'toLocation':
          errors.push('To Location is required for this expense type');
          break;
        case 'dailyRates':
          errors.push('Daily Rate is required for this expense type');
          break;
        case 'numberOfDays':
          errors.push('Number of Days is required for this expense type');
          break;
        default:
          errors.push(`${field} is required for this expense type`);
      }
    }
  });
  
  // Additional validation
  if (config.showDailyRates && formData.dailyRates) {
    const dailyRate = parseFloat(formData.dailyRates);
    if (isNaN(dailyRate) || dailyRate <= 0) {
      errors.push('Daily Rate must be a positive number');
    }
  }
  
  if (config.showNumberOfDays && formData.numberOfDays) {
    const days = parseInt(formData.numberOfDays);
    if (isNaN(days) || days <= 0) {
      errors.push('Number of Days must be a positive number');
    }
  }
  
  return errors;
};
