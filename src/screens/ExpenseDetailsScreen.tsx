import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../hooks/useTheme';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { AttachmentViewer } from '../components/expenses/AttachmentViewer';
import { SIZES, FONTS } from '../constants/theme';
import { useAttachments } from '../hooks/useAttachments';

interface ExpenseDetail {
  LineId: string;
  ExpenseItem: string;
  Amount: string;
  Currency: string;
  TransactionDate: string;
  ExpenseStatus: string;
  BusinessPurpose: string;
  DepartmentCode: string;
  Location: string;
  Supplier: string;
  Comments: string;
  ReportName: string;
  NumberOfDays: string;
  ToLocation: string;
}

interface RouteParams {
  expense: ExpenseDetail;
}

export const ExpenseDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors, shadows } = useTheme();
  
  console.log('ExpenseDetailsScreen - route.params:', route.params);
  
  const { expense } = route.params as RouteParams;
  
  console.log('ExpenseDetailsScreen - expense:', expense);
  
  // Fetch attachments for this expense - manual trigger
  const { attachments, loading: attachmentsLoading, error: attachmentsError, hasLoaded, loadAttachments } = useAttachments(expense?.LineId);

  
  // Trigger attachment loading when screen loads
  React.useEffect(() => {
    console.log('ExpenseDetailsScreen - useEffect triggered:', {
      lineId: expense?.LineId,
      hasLoaded,
      attachmentsLoading
    });
    
    if (expense?.LineId && !hasLoaded && !attachmentsLoading) {
      console.log('ExpenseDetailsScreen - Triggering attachment load for LineId:', expense.LineId);
      loadAttachments();
    }
  }, [expense?.LineId, hasLoaded, attachmentsLoading]); // Added attachmentsLoading to prevent concurrent calls
  
  if (!expense) {
    console.log('ExpenseDetailsScreen - No expense found in params');
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title="Expense Details" 
          showBackButton={true}
        />
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: colors.text }]}>
            Expense report not found
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.button,
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 16,
            }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'INVOICED':
        return colors.success;
      case 'Pending Manager Approval':
        return colors.warning;
      case 'REJECTED':
        return colors.error;
      default:
        return colors.placeholder;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'INVOICED':
        return <Feather name="check-circle" size={20} color={colors.success} />;
      case 'Pending Manager Approval':
        return <Feather name="clock" size={20} color={colors.warning} />;
      case 'REJECTED':
        return <Feather name="alert-circle" size={20} color={colors.error} />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'INVOICED':
        return 'Approved';
      case 'Pending Manager Approval':
        return 'Pending';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  // Download handler for receipts with placeholder
  const handleDownloadReceipt = async () => {
    Alert.alert(
      'Download Receipt',
      'Receipt download functionality will be implemented here.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => {} },
      ]
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Expense Details" 
        showBackButton={true}
        rightComponent={
          <TouchableOpacity style={styles.shareButton}>
            <Feather name="share-2" size={20} color={colors.primary} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Expense Summary Card */}
        <View style={[
          styles.headerCard, 
          { 
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          shadows.medium
        ]}>
          <View style={styles.expenseHeader}>
            <View style={styles.titleSection}>
              <Text style={[styles.expenseTitle, { color: colors.text }]}>
                {expense.ExpenseItem}
              </Text>
              <View style={styles.statusChip}>
                {getStatusIcon(expense.ExpenseStatus)}
                <Text 
                  style={[
                    styles.statusText, 
                    { color: getStatusColor(expense.ExpenseStatus) }
                  ]}
                >
                  {getStatusText(expense.ExpenseStatus)}
                </Text>
              </View>
            </View>
            
            <View style={styles.amountSection}>
              <Text style={[styles.amountLabel, { color: colors.placeholder }]}>
                Total Amount
              </Text>
              <Text style={[styles.amountValue, { color: colors.text }]}>
                {expense.Currency} {parseFloat(expense.Amount).toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Feather name="file-text" size={16} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                  Report ID
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {expense.LineId}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Feather name="calendar" size={16} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                  Date
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {expense.TransactionDate}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Feather name="dollar-sign" size={16} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                  Expense Type
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {expense.ExpenseItem}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Feather name="building" size={16} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                  Department
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {expense.DepartmentCode}
                </Text>
              </View>
            </View>

            {expense.Location && (
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Feather name="map-pin" size={16} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                    Location
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {expense.Location}
                  </Text>
                </View>
              </View>
            )}

            {expense.Supplier && (
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Feather name="user" size={16} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                    Supplier
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {expense.Supplier}
                  </Text>
                </View>
              </View>
            )}

            {expense.NumberOfDays && (
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Feather name="clock" size={16} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                    Number of Days
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {expense.NumberOfDays}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
        
        {/* Purpose Card */}
        {expense.BusinessPurpose && (
          <View style={[
            styles.purposeCard, 
            { 
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            shadows.small
          ]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Business Purpose
            </Text>
            <Text style={[styles.purposeText, { color: colors.text }]}>
              {expense.BusinessPurpose}
            </Text>
          </View>
        )}

        {/* Comments Card */}
        {expense.Comments && (
          <View style={[
            styles.purposeCard, 
            { 
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            shadows.small
          ]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Comments
            </Text>
            <Text style={[styles.purposeText, { color: colors.text }]}>
              {expense.Comments}
            </Text>
          </View>
        )}
        
        {/* Receipt Section */}
        <View style={[
          styles.receiptCard, 
          { 
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          shadows.small
        ]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Attachments & Receipts
          </Text>
          
          {!hasLoaded ? (
            <View style={styles.receiptPlaceholder}>
              <Feather name="loader" size={48} color={colors.placeholder} />
              <Text style={[styles.receiptPlaceholderText, { color: colors.placeholder }]}>
                Loading receipts...
              </Text>
              <Text style={[styles.receiptPlaceholderText, { color: colors.placeholder, fontSize: 12 }]}>
                LineId: {expense?.LineId}
              </Text>
            </View>
          ) : attachmentsLoading ? (
            <View style={styles.receiptPlaceholder}>
              <Feather name="loader" size={48} color={colors.placeholder} />
              <Text style={[styles.receiptPlaceholderText, { color: colors.placeholder }]}>
                Fetching receipts...
              </Text>
            </View>
          ) : attachmentsError ? (
            <View style={styles.receiptPlaceholder}>
              <Feather name="alert-circle" size={48} color={colors.error} />
              <Text style={[styles.receiptPlaceholderText, { color: colors.error }]}>
                Failed to load receipts
              </Text>
              <Text style={[styles.receiptPlaceholderText, { color: colors.placeholder, fontSize: 12 }]}>
                {attachmentsError}
              </Text>
              <TouchableOpacity 
                style={[
                  styles.downloadButton, 
                  { backgroundColor: colors.primary }
                ]}
                onPress={() => loadAttachments()}
              >
                <Feather name="refresh-cw" size={16} color="#FFFFFF" />
                <Text style={styles.downloadText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.downloadButton, 
                  { backgroundColor: colors.warning, marginTop: 8 }
                ]}
                onPress={async () => {
                  try {
                    const { attachmentAPI } = await import('../service/api');
                    const result = await attachmentAPI.testAttachmentAPI();
                    console.log('Manual API test result:', result);
                    Alert.alert('API Test Result', JSON.stringify(result, null, 2));
                  } catch (error) {
                    console.error('Manual API test error:', error);
                    Alert.alert('API Test Error', error instanceof Error ? error.message : 'Unknown error');
                  }
                }}
              >
                <Feather name="activity" size={16} color="#FFFFFF" />
                <Text style={styles.downloadText}>Test API</Text>
              </TouchableOpacity>
            </View>
          ) : attachments.length > 0 ? (
            <AttachmentViewer 
              attachments={attachments} 
              onDownload={handleDownloadReceipt} 
              onRetry={loadAttachments}
              loading={attachmentsLoading}
              error={attachmentsError}
            />
          ) : (
            <View style={styles.receiptPlaceholder}>
              <Feather name="image" size={48} color={colors.placeholder} />
              <Text style={[styles.receiptPlaceholderText, { color: colors.placeholder }]}>
                No receipts available for this expense
              </Text>
              <TouchableOpacity 
                style={[
                  styles.downloadButton, 
                  { backgroundColor: colors.primary }
                ]}
                onPress={handleDownloadReceipt}
              >
                <Feather name="upload" size={16} color="#FFFFFF" />
                <Text style={styles.downloadText}>Upload Receipt</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {expense.ExpenseStatus === 'Pending Manager Approval' && (
            <>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: colors.button,
                  padding: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                  marginRight: 6,
                }}
                onPress={() => {}}
              >
                <Text style={{ color: colors.button, fontWeight: '600' }}>Edit Report</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.error,
                  padding: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                  marginLeft: 6,
                }}
                onPress={() => {}}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Cancel Report</Text>
              </TouchableOpacity>
            </>
          )}
          
          {expense.ExpenseStatus === 'REJECTED' && (
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.button,
                padding: 16,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={() => {}}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Resubmit with Changes</Text>
            </TouchableOpacity>
          )}
          
          {expense.ExpenseStatus === 'INVOICED' && (
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.button,
                padding: 16,
                borderRadius: 8,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
              onPress={() => {}}
            >
              <Feather name="download" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Download Report</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Help Section */}
        <View style={[
          styles.helpCard,
          { 
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          shadows.small
        ]}>
          <View style={styles.helpHeader}>
            <Feather name="help-circle" size={20} color={colors.primary} />
            <Text style={[styles.helpTitle, { color: colors.text }]}>
              Need Help?
            </Text>
          </View>
          <Text style={[styles.helpText, { color: colors.placeholder }]}>
            • Download receipts for your records{'\n'}
            • Share expense reports with your team{'\n'}
            • Contact support for any questions{'\n'}
            • Review line items for accuracy
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  notFoundText: {
    fontSize: SIZES.large,
    textAlign: 'center',
    fontFamily: FONTS.medium,
  },
  shareButton: {
    padding: 4,
  },
  headerCard: {
    borderRadius: SIZES.radius,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  expenseHeader: {
    marginBottom: 16,
  },
  titleSection: {
    marginBottom: 12,
  },
  expenseTitle: {
    fontSize: SIZES.xlarge,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 32,
    fontFamily: FONTS.bold,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statusText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONTS.medium,
  },
  amountSection: {
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: SIZES.small,
    marginBottom: 4,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  amountValue: {
    fontSize: SIZES.xxlarge,
    fontWeight: 'bold',
    lineHeight: 40,
    fontFamily: FONTS.bold,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 20,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: SIZES.small,
    marginBottom: 2,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  detailValue: {
    fontSize: SIZES.font,
    fontWeight: '600',
    lineHeight: 20,
    fontFamily: FONTS.medium,
  },
  purposeCard: {
    borderRadius: SIZES.radius,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: FONTS.medium,
  },
  purposeText: {
    fontSize: SIZES.font,
    lineHeight: 24,
    fontFamily: FONTS.regular,
  },
  receiptCard: {
    borderRadius: SIZES.radius,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  receiptPlaceholder: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: SIZES.radius,
    gap: 12,
  },
  receiptPlaceholderText: {
    fontSize: SIZES.font,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
    gap: 6,
  },
  downloadText: {
    color: '#FFFFFF',
    fontSize: SIZES.small,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  helpCard: {
    borderRadius: SIZES.radius,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  helpTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  helpText: {
    fontSize: SIZES.small,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
}); 