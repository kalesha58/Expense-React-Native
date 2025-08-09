import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { Header } from '../components/layout';
import { ExpenseDetail } from '../hooks/useExpenseDetails';
import { SIZES, FONTS } from '../constants/theme';
import { formatTransactionDate } from '../utils/dateUtils';
import { AttachmentScrollView } from '../components/expenses';
import { ProcessedExpenseItem } from '../utils/itemizationUtils';

interface RouteParams {
  lineItem: ExpenseDetail;
  itemizedGroup?: ProcessedExpenseItem[];
}

export const LineItemDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors, shadows } = useTheme();

  const { lineItem, itemizedGroup } = route.params as RouteParams;

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

  const handleViewAttachments = () => {
    // View attachments for line item
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Line Item Details"
        showBackButton={true}
      />

      <ScrollView
        style={styles.scrollableContent}
        contentContainerStyle={styles.scrollableContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Line Item Header Card */}
        <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.medium]}>
          <View style={styles.headerSection}>
            <View style={styles.titleSection}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>
                {lineItem.ExpenseItem}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lineItem.ExpenseStatus) + '15' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(lineItem.ExpenseStatus) }]}>
                  {getStatusText(lineItem.ExpenseStatus)}
                </Text>
              </View>
            </View>
            <View style={styles.amountSection}>
              <Text style={[styles.amountLabel, { color: colors.placeholder }]}>
                Amount
              </Text>
              <Text style={[styles.amountValue, { color: colors.text }]}>
                {lineItem.Currency} {parseFloat(lineItem.Amount).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Details
          </Text>
          
          <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.small]}>
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: colors.primary + '15' }]}>
                <Feather name="calendar" size={16} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                  Transaction Date
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatTransactionDate(lineItem.TransactionDate)}
                </Text>
              </View>
            </View>

            {lineItem.Location && (
              <View style={styles.detailRow}>
                <View style={[styles.detailIcon, { backgroundColor: colors.secondary + '15' }]}>
                  <Feather name="map-pin" size={16} color={colors.secondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                    Location
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {lineItem.Location}
                  </Text>
                </View>
              </View>
            )}

            {lineItem.Supplier && (
              <View style={styles.detailRow}>
                <View style={[styles.detailIcon, { backgroundColor: colors.warning + '15' }]}>
                  <Feather name="user" size={16} color={colors.warning} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                    Supplier
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {lineItem.Supplier}
                  </Text>
                </View>
              </View>
            )}

            {lineItem.BusinessPurpose && (
              <View style={styles.detailRow}>
                <View style={[styles.detailIcon, { backgroundColor: colors.success + '15' }]}>
                  <Feather name="briefcase" size={16} color={colors.success} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                    Business Purpose
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {lineItem.BusinessPurpose}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: colors.primary + '15' }]}>
                <Feather name="hash" size={16} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                  Line ID
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {lineItem.LineId}
                </Text>
              </View>
            </View>

            {lineItem.DepartmentCode && (
              <View style={styles.detailRow}>
                <View style={[styles.detailIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Feather name="building" size={16} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.placeholder }]}>
                    Department
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {lineItem.DepartmentCode}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Itemized Items Section */}
        {itemizedGroup && itemizedGroup.length > 1 && (
          <View style={styles.itemizedSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Itemized Breakdown
            </Text>
            
            <View style={[styles.itemizedCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.small]}>
              {itemizedGroup.slice(1).map((item, index) => (
                <View key={item.LineId} style={styles.itemizedItem}>
                  <View style={styles.itemizedItemHeader}>
                    <Text style={[styles.itemizedItemTitle, { color: colors.text }]}>
                      {item.ExpenseItem}
                    </Text>
                    <Text style={[styles.itemizedItemAmount, { color: colors.text }]}>
                      {item.Currency} {parseFloat(item.Amount).toFixed(2)}
                    </Text>
                  </View>
                  
                  {item.Location && (
                    <Text style={[styles.itemizedItemLocation, { color: colors.placeholder }]}>
                      {item.Location}
                    </Text>
                  )}
                  
                  {index < itemizedGroup.length - 2 && (
                    <View style={[styles.itemizedDivider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Attachments Section */}
        <View style={styles.attachmentsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Attachments
          </Text>
          <TouchableOpacity
            style={[styles.viewAttachmentsButton, { backgroundColor: colors.primary }]}
            onPress={handleViewAttachments}
          >
            <Feather name="paperclip" size={20} color="#FFFFFF" />
            <Text style={styles.viewAttachmentsText}>
              View Attachments
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollableContentContainer: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },
  headerCard: {
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
    marginRight: 16,
  },
  itemTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 24,
    fontFamily: FONTS.bold,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONTS.medium,
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: SIZES.small,
    marginBottom: 4,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  amountValue: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    lineHeight: 24,
    fontFamily: FONTS.bold,
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: FONTS.medium,
  },
  detailsCard: {
    borderRadius: SIZES.radius,
    padding: 16,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    lineHeight: 18,
    fontFamily: FONTS.medium,
  },
  attachmentsSection: {
    marginBottom: 24,
  },
  viewAttachmentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: SIZES.radius,
    gap: 8,
  },
  viewAttachmentsText: {
    color: '#FFFFFF',
    fontSize: SIZES.font,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  itemizedSection: {
    marginBottom: 24,
    paddingHorizontal: SIZES.padding,
  },
  itemizedCard: {
    borderRadius: SIZES.radius,
    padding: 16,
    borderWidth: 1,
    marginTop: 12,
  },
  itemizedItem: {
    paddingVertical: 8,
  },
  itemizedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemizedItemTitle: {
    fontSize: SIZES.font,
    fontWeight: '600',
    fontFamily: FONTS.medium,
    flex: 1,
  },
  itemizedItemAmount: {
    fontSize: SIZES.font,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  itemizedItemLocation: {
    fontSize: SIZES.small,
    fontFamily: FONTS.regular,
  },
  itemizedDivider: {
    height: 1,
    marginTop: 8,
  },
});
