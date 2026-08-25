import { PopularStock } from './types';

/**
 * Rounds a price to the nearest valid tick size according to IDX (Bursa Efek Indonesia) regulations:
 * - Price < 200: Tick = 1
 * - Price 200 - < 500: Tick = 2
 * - Price 500 - < 2000: Tick = 5
 * - Price 2000 - < 5000: Tick = 10
 * - Price >= 5000: Tick = 25
 */
export function roundToIDXTick(price: number): number {
  if (isNaN(price) || price <= 0) return 0;

  if (price < 200) {
    return Math.round(price);
  } else if (price < 500) {
    return Math.round(price / 2) * 2;
  } else if (price < 2000) {
    return Math.round(price / 5) * 5;
  } else if (price < 5000) {
    return Math.round(price / 10) * 10;
  } else {
    return Math.round(price / 25) * 25;
  }
}

/**
 * Returns the tick size for a given price in IDX
 */
export function getIDXTickSize(price: number): number {
  if (price < 200) return 1;
  if (price < 500) return 2;
  if (price < 2000) return 5;
  if (price < 5000) return 10;
  return 25;
}

/**
 * Cleans and normalizes ticker symbol to Yahoo Finance IDX format
 * Example: 'bbca' -> 'BBCA.JK', 'TLKM.JK' -> 'TLKM.JK'
 */
export function normalizeIDXTicker(rawTicker: string): { cleanSymbol: string; yahooSymbol: string } {
  let clean = rawTicker.trim().toUpperCase();
  // Remove spaces and special characters
  clean = clean.replace(/[^A-Z0-9.]/g, '');

  if (clean.endsWith('.JK')) {
    const symbolOnly = clean.replace('.JK', '');
    return { cleanSymbol: symbolOnly, yahooSymbol: clean };
  }

  return { cleanSymbol: clean, yahooSymbol: `${clean}.JK` };
}

/**
 * Curated list of high-liquidity IDX stocks popular for swing trading
 */
export const POPULAR_IDX_STOCKS: PopularStock[] = [
  { ticker: 'BBCA', name: 'Bank Central Asia Tbk', sector: 'Financials' },
  { ticker: 'BBRI', name: 'Bank Rakyat Indonesia Tbk', sector: 'Financials' },
  { ticker: 'BMRI', name: 'Bank Mandiri Tbk', sector: 'Financials' },
  { ticker: 'BBNI', name: 'Bank Negara Indonesia Tbk', sector: 'Financials' },
  { ticker: 'TLKM', name: 'Telkom Indonesia Tbk', sector: 'Telecommunication' },
  { ticker: 'ASII', name: 'Astra International Tbk', sector: 'Automotive / Conglomerate' },
  { ticker: 'MEDC', name: 'Medco Energi Internasional Tbk', sector: 'Oil & Gas' },
  { ticker: 'ADRO', name: 'Adaro Energy Indonesia Tbk', sector: 'Energy / Coal' },
  { ticker: 'PTBA', name: 'Bukit Asam Tbk', sector: 'Energy / Coal' },
  { ticker: 'AMMN', name: 'Amman Mineral Internasional Tbk', sector: 'Basic Materials / Copper' },
  { ticker: 'ANTM', name: 'Aneka Tambang Tbk', sector: 'Metals & Mining' },
  { ticker: 'INCO', name: 'Vale Indonesia Tbk', sector: 'Metals & Mining' },
  { ticker: 'BRPT', name: 'Barito Pacific Tbk', sector: 'Energy / Petrochemicals' },
  { ticker: 'ICBP', name: 'Indofood CBP Sukses Makmur Tbk', sector: 'Consumer Non-Cyclicals' },
  { ticker: 'ACES', name: 'Aspirasi Hidup Indonesia Tbk', sector: 'Consumer Cyclicals' },
  { ticker: 'GOTO', name: 'GoTo Gojek Tokopedia Tbk', sector: 'Technology' },
];

/**
 * Formats a currency number in Indonesian Rupiah (IDR)
 */
export function formatIDR(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return 'Rp -';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats large volume numbers (K, M, B)
 */
export function formatVolume(volume: number | undefined): string {
  if (volume === undefined || isNaN(volume)) return '-';
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(2)}B`;
  }
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }
  return volume.toString();
}
