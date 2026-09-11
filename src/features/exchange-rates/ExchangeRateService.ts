import { storage } from '@/lib/storage';

// ---------------------------------------------------------------------------
// ExchangeRateService
// ---------------------------------------------------------------------------

export interface ExchangeRateService {
  getRate(fromCurrency: string, toCurrency: string, date: string): Promise<number>;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

const KEY_PREFIX = 'exchangerates.';

/**
 * Fetches the exchange rate between two currencies for a specific date.
 * Tries to read from MMKV cache first, then falls back to a mock/CBE API.
 */
class ExchangeRateServiceImpl implements ExchangeRateService {
  async getRate(fromCurrency: string, toCurrency: string, date: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const cacheKey = `${KEY_PREFIX}${date}.${fromCurrency}_${toCurrency}`;
    const cached = storage.getNumber(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // Check inverse rate in cache
    const inverseCacheKey = `${KEY_PREFIX}${date}.${toCurrency}_${fromCurrency}`;
    const inverseCached = storage.getNumber(inverseCacheKey);
    if (inverseCached !== undefined) {
      return 1 / inverseCached;
    }

    // Fetch from provider
    const rate = await this.fetchFromProvider(fromCurrency, toCurrency, date);
    
    // Cache the result
    storage.set(cacheKey, rate);
    
    return rate;
  }

  private async fetchFromProvider(fromCurrency: string, toCurrency: string, date: string): Promise<number> {
    const fromLower = fromCurrency.toLowerCase();
    const toLower = toCurrency.toLowerCase();
    
    // The API uses 'latest' for today, or YYYY-MM-DD for historical.
    // Try the specific date first.
    let rate = await this.tryFetchFawazahmed(fromLower, toLower, date);
    
    // If the specific date fails (e.g. today's data isn't compiled yet, or the date is too old), 
    // fallback to 'latest'.
    if (rate === null) {
      rate = await this.tryFetchFawazahmed(fromLower, toLower, 'latest');
    }
    
    if (rate !== null) {
      return Number(rate.toFixed(6));
    }

    throw new Error(`Failed to fetch exchange rate for ${fromCurrency} to ${toCurrency}`);
  }

  private async tryFetchFawazahmed(fromLower: string, toLower: string, date: string): Promise<number | null> {
    try {
      const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${fromLower}.json`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      if (data && data[fromLower] && data[fromLower][toLower]) {
        return data[fromLower][toLower];
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}

export const exchangeRateService = new ExchangeRateServiceImpl();
