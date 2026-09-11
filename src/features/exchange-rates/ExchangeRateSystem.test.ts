import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exchangeRateService } from './ExchangeRateService';
import { storage } from '@/lib/storage';

vi.mock('@/lib/storage', () => ({
  storage: {
    getNumber: vi.fn(),
    set: vi.fn(),
  },
}));

describe('ExchangeRateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 1 for same-currency conversions', async () => {
    const rate = await exchangeRateService.getRate('EGP', 'EGP', '2026-08-05');
    expect(rate).toBe(1);
    expect(storage.getNumber).not.toHaveBeenCalled();
  });

  it('uses cached rate if available', async () => {
    (storage.getNumber as any).mockImplementation((key: string) => {
      if (key === 'exchangerates.2026-08-05.USD_EGP') return 50.62;
      return undefined;
    });

    const rate = await exchangeRateService.getRate('USD', 'EGP', '2026-08-05');
    expect(rate).toBe(50.62);
    expect(storage.set).not.toHaveBeenCalled();
  });

  it('uses inverse cached rate if available', async () => {
    (storage.getNumber as any).mockImplementation((key: string) => {
      if (key === 'exchangerates.2026-08-05.EGP_USD') return 0.019755;
      return undefined;
    });

    const rate = await exchangeRateService.getRate('USD', 'EGP', '2026-08-05');
    expect(rate).toBeCloseTo(1 / 0.019755);
    expect(storage.set).not.toHaveBeenCalled();
  });

  it('fetches and caches rate if not in cache', async () => {
    (storage.getNumber as any).mockReturnValue(undefined);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        usd: {
          egp: 50.62
        }
      })
    } as any);

    const rate = await exchangeRateService.getRate('USD', 'EGP', '2026-08-05');
    
    expect(global.fetch).toHaveBeenCalledWith('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@2026-08-05/v1/currencies/usd.json');
    expect(rate).toBe(50.62);
    expect(storage.set).toHaveBeenCalledWith('exchangerates.2026-08-05.USD_EGP', 50.62);
  });
});
