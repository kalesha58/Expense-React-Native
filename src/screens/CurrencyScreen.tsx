import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { currencyAPI } from '../service/api';
import { logger } from '../utils/logger';
import { useTheme } from '../hooks/useTheme';

interface Currency {
  CurrencyID?: string;
  CurrencyCode?: string;
  CurrencyName?: string;
  Symbol?: string;
  ExchangeRate?: number;
  IsActive?: number;
}

const CurrencyScreen: React.FC = () => {
  const { colors } = useTheme();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      logger.info('Fetching currencies...');
      const response = await currencyAPI.getCurrencies();
      
      if (response.data && Array.isArray(response.data)) {
        setCurrencies(response.data as Currency[]);
        logger.info('Currencies fetched successfully', { count: response.data.length });
      } else {
        logger.warn('Unexpected currency response format', { response });
        setCurrencies([]);
      }
    } catch (error) {
      logger.error('Failed to fetch currencies', { error });
      Alert.alert('Error', 'Failed to fetch currencies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      logger.info('Fetching currency metadata...');
      const response = await currencyAPI.getCurrenciesMetadata();
      setMetadata(response);
      logger.info('Currency metadata fetched successfully');
    } catch (error) {
      logger.error('Failed to fetch currency metadata', { error });
      Alert.alert('Error', 'Failed to fetch currency metadata.');
    }
  };

  useEffect(() => {
    fetchCurrencies();
    fetchMetadata();
  }, []);

  const renderCurrency = (currency: Currency, index: number) => (
    <View key={index} style={[styles.currencyItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.currencyHeader}>
        <Text style={[styles.currencyCode, { color: colors.text }]}>{currency.CurrencyCode || 'N/A'}</Text>
        <Text style={[styles.currencySymbol, { color: colors.placeholder }]}>{currency.Symbol || ''}</Text>
      </View>
      <Text style={[styles.currencyName, { color: colors.text }]}>{currency.CurrencyName || 'Unknown Currency'}</Text>
      {currency.ExchangeRate && (
        <Text style={[styles.exchangeRate, { color: colors.placeholder }]}>
          Exchange Rate: {currency.ExchangeRate}
        </Text>
      )}
      <Text style={[styles.status, { color: colors.placeholder }]}>
        Status: {currency.IsActive ? 'Active' : 'Inactive'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Currencies</Text>
        {loading ? (
          <TouchableOpacity style={[styles.refreshButton, { backgroundColor: colors.button }]} onPress={fetchCurrencies}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.button }]} onPress={fetchCurrencies}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.placeholder }]}>Loading currencies...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {currencies.length > 0 ? (
            currencies.map(renderCurrency)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.placeholder }]}>No currencies found</Text>
              <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.button }]} onPress={fetchCurrencies}>
                <Text style={[styles.retryButtonText, { color: colors.white }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {metadata && (
        <View style={[styles.metadataContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.metadataTitle, { color: colors.text }]}>API Metadata</Text>
          <Text style={[styles.metadataText, { color: colors.placeholder }]}>
            {JSON.stringify(metadata, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  currencyItem: {
    margin: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  currencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currencyCode: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  currencySymbol: {
    fontSize: 16,
  },
  currencyName: {
    fontSize: 16,
    marginBottom: 4,
  },
  exchangeRate: {
    fontSize: 14,
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metadataContainer: {
    margin: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  metadataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default CurrencyScreen; 