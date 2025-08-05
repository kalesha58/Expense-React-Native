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

      // Log the raw response for debugging
      logger.info('API response received', { apiName, response });

      // Process the response
      if (response && (response.data || response.Response)) {
        const data = response.data || response.Response;
        dataCount = Array.isArray(data) ? data.length : 0;
        
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
        logger.info('API call completed successfully', { apiName, dataCount });
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
    logger.info('All API sequences completed');
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
    console.log('ActivityScreen mounted successfully');
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
      }, 5000); // 5 seconds delay
      
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
        {/* Header Section */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <View style={styles.headerContent}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary + '15' }]}>
            <Feather name="activity" size={32} color={colors.primary} />
          </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {isComplete ? 'System Ready!' : 'Initializing System'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.placeholder }]}>
              {isComplete 
                ? 'All systems are operational and ready for use'
                : 'Setting up your experience and configuring services'
              }
            </Text>
          </View>
        </Animated.View>

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

        {/* Stats Section */}
        <Animated.View style={[styles.statsSection, statsAnimatedStyle]}>
          <View style={styles.statsGrid}>
            <View style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              shadows.small
            ]}>
              <View style={[styles.statIcon, { backgroundColor: colors.success + '15' }]}>
                <Feather name="check-circle" size={20} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {completedCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.placeholder }]}>
                Completed
              </Text>
            </View>
            
            <View style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              shadows.small
            ]}>
              <View style={[styles.statIcon, { backgroundColor: colors.warning + '15' }]}>
                <Feather name="clock" size={20} color={colors.warning} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {apiSequence.filter((api: ApiInfo) => getApiState(api.id).status === "loading").length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.placeholder }]}>
                Loading
              </Text>
            </View>
            
            <View style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              shadows.small
            ]}>
              <View style={[styles.statIcon, { backgroundColor: colors.error + '15' }]}>
                <Feather name="alert-circle" size={20} color={colors.error} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {apiSequence.filter((api: ApiInfo) => getApiState(api.id).status === "error").length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.placeholder }]}>
                Errors
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

        {/* Completion Section */}
        {isComplete && apiSequence.every((api: ApiInfo) => getApiState(api.id).status === "success") && (
          <View style={[
            styles.completeContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
            shadows.medium
          ]}>
            <View style={[styles.completeIcon, { backgroundColor: colors.success + '15' }]}>
              <Feather name="check-circle" size={48} color={colors.success} />
            </View>
            <Text style={[styles.completeTitle, { color: colors.text }]}>
              All Systems Operational!
            </Text>
                         <Text style={[styles.completeText, { color: colors.placeholder }]}>
               Your expense management system is fully initialized and ready for use. Redirecting to dashboard...
             </Text>
                         <View style={styles.completeFeatures}>
               <View style={styles.completeFeature}>
                 <Feather name="shield" size={16} color={colors.success} />
                 <Text style={[styles.completeFeatureText, { color: colors.placeholder }]}>
                   Secure authentication
                 </Text>
               </View>
               <View style={styles.completeFeature}>
                 <Feather name="database" size={16} color={colors.success} />
                 <Text style={[styles.completeFeatureText, { color: colors.placeholder }]}>
                   Data synchronization
                 </Text>
               </View>
               <View style={styles.completeFeature}>
                 <Feather name="bell" size={16} color={colors.success} />
                 <Text style={[styles.completeFeatureText, { color: colors.placeholder }]}>
                   Notification system
                 </Text>
               </View>
             </View>
             <TouchableOpacity
               style={[styles.dashboardButton, { backgroundColor: colors.button }]}
               onPress={() => replace('Dashboard')}
             >
               <Feather name="arrow-right" size={20} color="#fff" />
               <Text style={[styles.dashboardButtonText, { color: '#fff' }]}>
                 Go to Dashboard
               </Text>
             </TouchableOpacity>
          </View>
        )}

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