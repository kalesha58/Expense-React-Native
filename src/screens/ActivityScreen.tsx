import React, { useCallback } from "react";
import { StyleSheet, Text, View, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS
} from "react-native-reanimated";
import Feather from "react-native-vector-icons/Feather";

import { ActivityCard } from "../components/cards/ActivityCard";
import { useTheme } from "../hooks/useTheme";
import { SIZES } from "../constants/theme";
import { Header } from "../components/layout/Header";
import type { ApiState, ApiInfo } from "../../@types/api";
import { replace } from "../utils/NavigationUtils";
import { departmentAPI, currencyAPI, expenseNotificationAPI, expenseItemAPI, expenseDetailsAPI } from "../service/api";
import { API_SETTINGS } from "../constants/appsettings";
import { logger } from "../utils/logger";
import { databaseManager } from "../utils/database";

const { width } = Dimensions.get('window');

// Convert API settings to ApiInfo format for ActivityCard
const apiSequence: ApiInfo[] = API_SETTINGS.map(api => ({
  id: api.name,
  name: api.displayName,
  description: api.description || `Loading ${api.displayName.toLowerCase()} data`,
  endpoint: api.dataEndpoint
}));

// Direct API calls without complex sync service
const useApiSequence = () => {
  const isRunningRef = React.useRef(false);
  const [state, setState] = React.useState<Record<string, ApiState>>({
    departments: { status: "idle" as const },
    currencies: { status: "idle" as const },
    expense_notifications: { status: "idle" as const },
    expense_items: { status: "idle" as const },
    expense_details: { status: "idle" as const },
  });
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isComplete, setIsComplete] = React.useState(false);

  // Direct API call function
  const executeApiCall = async (apiName: string) => {
    setState(prev => ({
      ...prev,
      [apiName]: { status: "loading" as const }
    }));

    try {
      logger.info('Starting direct API call', { apiName });
      
      let response: any;
      let dataCount = 0;

      // Initialize database first
      try {
        await databaseManager.initialize();
      } catch (dbInitError) {
        // Failed to initialize database
      }

      // Call the appropriate API based on the name
      switch (apiName) {
        case 'departments':
          response = await departmentAPI.getAllDepartments();
          break;
        case 'currencies':
          response = await currencyAPI.getCurrencies();
          break;
        case 'expense_notifications':
          response = await expenseNotificationAPI.getExpenseNotificationDetails();
          break;
        case 'expense_items':
          response = await expenseItemAPI.getExpenseItem();
          break;
        case 'expense_details':
          response = await expenseDetailsAPI.getExpenseDetails();
          break;
        default:
          throw new Error(`Unknown API: ${apiName}`);
      }

      // Log the raw response for debugging (simplified)
      // console.log(`API response received: ${apiName}`);

      // Process the response
      if (response && (response.data || response.Response)) {
        const data = response.data || response.Response;
        dataCount = Array.isArray(data) ? data.length : 0;
        
        // Insert data into database if it's an array
        if (Array.isArray(data) && data.length > 0) {
          try {
            // Get the table name from API settings
            const apiConfig = API_SETTINGS.find(config => config.name === apiName);
            if (apiConfig) {
              // Check if table exists, if not create one using metadata
              const tableExists = await databaseManager.tableExists(apiConfig.tableName);
              if (!tableExists) {
                // console.log(`Creating table ${apiConfig.tableName} using metadata...`);
                
                // Try to get metadata first, fallback to data-based schema
                let columns: any[] = [];
                try {
                  // Fetch metadata for proper schema
                  let metadataResponse: any;
                  switch (apiName) {
                    case 'departments':
                      metadataResponse = await departmentAPI.getAllDepartmentsMetadata();
                      break;
                    case 'currencies':
                      metadataResponse = await currencyAPI.getCurrenciesMetadata();
                      break;
                    case 'expense_notifications':
                      metadataResponse = await expenseNotificationAPI.getExpenseNotificationMetadata();
                      break;
                    case 'expense_items':
                      metadataResponse = await expenseItemAPI.getExpenseItemMetadata();
                      break;
                    case 'expense_details':
                      metadataResponse = await expenseDetailsAPI.getExpenseDetailsMetadata();
                      break;
                    default:
                      throw new Error(`No metadata API for ${apiName}`);
                  }
                  
                  // Parse metadata to create columns
                  if (metadataResponse && (metadataResponse.metadata || metadataResponse.fields || metadataResponse.columns)) {
                    const metadata = metadataResponse.metadata || metadataResponse.fields || metadataResponse.columns;
                    columns = metadata.map((field: any) => ({
                      name: field.name,
                      type: 'TEXT' as const, // Default to TEXT for simplicity
                      constraints: []
                    }));
                    // console.log(`Metadata-based schema created for ${apiConfig.tableName}`);
                  } else {
                    throw new Error('Invalid metadata response');
                  }
                } catch (metadataError) {
                  // console.log(`Metadata fetch failed for ${apiName}, using data-based schema:`, metadataError);
                  // Fallback to data-based schema
                  const firstItem = data[0];
                  columns = Object.keys(firstItem).map(key => ({
                    name: key,
                    type: 'TEXT' as const,
                    constraints: []
                  }));
                }
                
                await databaseManager.createTable({
                  name: apiConfig.tableName,
                  columns
                });
                // console.log(`Table ${apiConfig.tableName} created successfully`);
              }
              
              // Insert data into database
              const insertedCount = await databaseManager.insertData(apiConfig.tableName, data);
              
              // Simplified console log for data insertion
              // console.log(`Data inserted: ${apiConfig.tableName} - ${insertedCount} records`);
              // console.log('Data:', data);
            }
          } catch (dbError) {
            // console.error(`Failed to insert data into ${apiName} table:`, dbError);
          }
        }
        
        setState(prev => ({
          ...prev,
          [apiName]: { 
            status: "success" as const,
            data: { 
              message: `${apiName} data loaded successfully`,
              count: dataCount
            }
          }
        }));
        // console.log(`API call completed: ${apiName} - ${dataCount} records`);
      } else {
        logger.warn('Invalid response format', { apiName, response });
        throw new Error('Invalid response format - no data found');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('API call failed', { apiName, error: errorMessage, fullError: error });
      
      setState(prev => ({
        ...prev,
        [apiName]: { 
          status: "error" as const, 
          error: `Failed to load ${apiName} data: ${errorMessage}` 
        }
      }));
    }
  };

  const retryApi = async (apiName: string) => {
    logger.info('Retrying API', { apiName });
    await executeApiCall(apiName);
  };

  const resetSequence = async () => {
    // Prevent multiple simultaneous resets
    if (isRunningRef.current) {
      return;
    }
    
    isRunningRef.current = true;
    setIsComplete(false);
    setCurrentStep(0);

    // Reset all states to idle
    setState({
      departments: { status: "idle" as const },
      currencies: { status: "idle" as const },
      expense_notifications: { status: "idle" as const },
      expense_items: { status: "idle" as const },
      expense_details: { status: "idle" as const },
    });

    // Execute APIs sequentially with delays
    const apis = ['departments', 'currencies', 'expense_notifications', 'expense_items', 'expense_details'];
    
    for (let i = 0; i < apis.length; i++) {
      const apiName = apis[i];
      setCurrentStep(i);
      
      // Add delay between API calls
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      await executeApiCall(apiName);
    }

    // Mark as complete
    setIsComplete(true);
    isRunningRef.current = false;
    // console.log('All API sequences completed');
  };

  return {
    state,
    retryApi,
    resetSequence,
    apiSequence,
    currentStep,
    isComplete
  };
};

export default function ActivityScreen() {
  const { colors, shadows } = useTheme();
  const { state, retryApi, resetSequence, apiSequence, currentStep, isComplete } = useApiSequence();
  
  // Log when ActivityScreen is mounted
  React.useEffect(() => {
    // console.log('ActivityScreen mounted');
  }, []);
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(30);
  const progressOpacity = useSharedValue(0);
  const progressScale = useSharedValue(0.8);
  const statsOpacity = useSharedValue(0);
  const statsTranslateY = useSharedValue(20);
  
  // Initialize animations when component mounts
  React.useEffect(() => {
    // Reset animation values
    headerOpacity.value = 0;
    headerTranslateY.value = 30;
    progressOpacity.value = 0;
    progressScale.value = 0.8;
    statsOpacity.value = 0;
    statsTranslateY.value = 20;
    
    // Start animations with delays and smooth easing
    headerOpacity.value = withDelay(200, withTiming(1, { 
      duration: 600, 
      easing: Easing.out(Easing.cubic) 
    }));
    headerTranslateY.value = withDelay(200, withTiming(0, { 
      duration: 600, 
      easing: Easing.out(Easing.cubic) 
    }));
    
    progressOpacity.value = withDelay(400, withTiming(1, { 
      duration: 500, 
      easing: Easing.out(Easing.cubic) 
    }));
    progressScale.value = withDelay(400, withTiming(1, { 
      duration: 500, 
      easing: Easing.out(Easing.cubic) 
    }));
    
    statsOpacity.value = withDelay(600, withTiming(1, { 
      duration: 500, 
      easing: Easing.out(Easing.cubic) 
    }));
    statsTranslateY.value = withDelay(600, withTiming(0, { 
      duration: 500, 
      easing: Easing.out(Easing.cubic) 
    }));
  }, []);

  // Reset API sequence when screen comes into focus (but not animations)
  useFocusEffect(
    useCallback(() => {
      // Only reset if not already in progress
      if (!isComplete && state.departments.status === "idle") {
        resetSequence();
      }
    }, []) // Remove resetSequence from dependencies to prevent infinite loop
  );

  const getApiState = (apiId: string): ApiState => {
    return state[apiId] || { status: "idle" };
  };

  const completedCount = apiSequence.filter((api: ApiInfo) => getApiState(api.id).status === "success").length;
  const totalCount = apiSequence.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Navigate to Dashboard after 5 seconds if all APIs are successful
  React.useEffect(() => {
    if (isComplete && completedCount === totalCount) {
      // Delay navigation to show completion message
      const timer = setTimeout(() => {
        replace('Dashboard');
      }, 2000); // 5 seconds delay
      
      return () => clearTimeout(timer);
    }
  }, [isComplete, completedCount, totalCount]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progressOpacity.value,
    transform: [{ scale: progressScale.value }],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [{ translateY: statsTranslateY.value }],
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Activity" 
        showThemeToggle={true}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={resetSequence}
            tintColor={colors.primary}
          />
        }
      >

        {/* Progress Section */}
        <Animated.View style={[styles.progressSection, progressAnimatedStyle]}>
          <View style={[
            styles.progressCard,
            { backgroundColor: colors.card, borderColor: colors.border },
            shadows.medium
          ]}>
            <View style={styles.progressHeader}>
              <View style={styles.progressTitleSection}>
                <Feather name="activity" size={24} color={colors.primary} />
                <Text style={[styles.progressTitle, { color: colors.text }]}>
                  System Progress
                </Text>
              </View>
              <View style={[
                styles.progressBadge,
                { backgroundColor: isComplete ? colors.success + '15' : colors.warning + '15' }
              ]}>
                <Text style={[
                  styles.progressBadgeText,
                  { color: isComplete ? colors.success : colors.warning }
                ]}>
                  {isComplete ? 'Complete' : 'In Progress'}
            </Text>
          </View>
        </View>

            <View style={styles.progressContent}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: isComplete ? colors.success : colors.primary
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: colors.placeholder }]}>
                {completedCount} of {totalCount} services initialized
              </Text>
        </View>
          </View>
        </Animated.View>


        {/* Services Section */}
        <View style={styles.servicesSection}>
          <View style={styles.servicesHeader}>
            <Text style={[styles.servicesTitle, { color: colors.text }]}>
              Service Status
            </Text>
            <Text style={[styles.servicesSubtitle, { color: colors.placeholder }]}>
              Real-time initialization progress
            </Text>
          </View>
          
          {apiSequence.map((api: ApiInfo, index: number) => (
            <ActivityCard
              key={api.id}
              apiInfo={api}
              state={getApiState(api.id)}
              index={index}
              onRetry={() => retryApi(api.id)}
            />
          ))}
        </View>


        {/* Sync Button for Failed APIs */}
        {isComplete && apiSequence.some((api: ApiInfo) => getApiState(api.id).status === "error") && !apiSequence.every((api: ApiInfo) => getApiState(api.id).status === "success") && (
          <View style={[
            styles.syncContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
            shadows.medium
          ]}>
            <View style={[styles.syncIcon, { backgroundColor: colors.warning + '15' }]}>
              <Feather name="refresh-cw" size={32} color={colors.warning} />
            </View>
            <Text style={[styles.syncTitle, { color: colors.text }]}>
              Some Services Failed
            </Text>
            <Text style={[styles.syncText, { color: colors.placeholder }]}>
              Some APIs failed to load. Click sync to retry failed services.
            </Text>
            <TouchableOpacity
              style={[styles.syncButton, { backgroundColor: colors.button }]}
              onPress={resetSequence}
            >
              <Feather name="refresh-cw" size={20} color="#fff" />
              <Text style={[styles.syncButtonText, { color: '#fff' }]}>
                Sync Again
              </Text>
            </TouchableOpacity>
        </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: SIZES.xxlarge,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.medium,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressCard: {
    borderRadius: SIZES.radius,
    padding: 20,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
  },
  progressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBadgeText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  progressContent: {
    gap: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: SIZES.radius,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  servicesSection: {
    marginBottom: 24,
  },
  servicesHeader: {
    marginBottom: 16,
  },
  servicesTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
    marginBottom: 4,
  },
  servicesSubtitle: {
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  completeContainer: {
    borderRadius: SIZES.radius,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  completeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: SIZES.xlarge,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  completeText: {
    fontSize: SIZES.medium,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  completeFeatures: {
    gap: 12,
  },
  completeFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completeFeatureText: {
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  syncContainer: {
    borderRadius: SIZES.radius,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 16,
  },
  syncIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  syncTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  syncText: {
    fontSize: SIZES.medium,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
     syncButtonText: {
     fontSize: SIZES.medium,
    fontWeight: '600',
   },
   dashboardButton: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 24,
     paddingVertical: 12,
     borderRadius: 8,
     gap: 8,
     marginTop: 20,
   },
   dashboardButtonText: {
     fontSize: SIZES.medium,
     fontWeight: '600',
  },
});