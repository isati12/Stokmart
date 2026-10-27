import { DemandPeriod, Product, TSBAnalysisResult, TSBSettings } from '../types/inventory';

/**
 * Service level to Z-score mapping (Standard Normal Distribution)
 */
export const SERVICE_LEVEL_Z_SCORES: Record<number, number> = {
  0.90: 1.282,
  0.95: 1.645,
  0.98: 2.054,
  0.99: 2.326,
};

/**
 * Format IDR currency
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with localized decimals
 */
export function formatDec(value: number, decimals = 2): string {
  return value.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Calculate Teunter-Syntetos-Babai (TSB) for a given series of demand
 * Reference: Teunter, Syntetos, Babai (2011) EJOR
 */
export function calculateTSB(
  product: Product,
  settings: TSBSettings
): TSBAnalysisResult {
  const { alpha, beta, serviceLevel } = settings;
  const history = product.demandHistory || [];
  const n = history.length;

  if (n === 0) {
    return getFallbackTSBResult(product, settings);
  }

  // 1. Inisialisasi awal
  // Temukan nilai non-nol pertama untuk inisialisasi demand magnitude z_0
  const nonZeroDemands = history.filter((d) => d > 0);
  const initialZ = nonZeroDemands.length > 0 ? nonZeroDemands[0] : 1;
  const initialP = Math.max(0.05, nonZeroDemands.length / n);

  let currentZ = initialZ;
  let currentP = initialP;

  const periods: DemandPeriod[] = [];

  for (let t = 0; t < n; t++) {
    const y_t = history[t];

    if (y_t > 0) {
      // Ada permintaan di periode ini
      currentZ = alpha * y_t + (1 - alpha) * currentZ;
      currentP = beta * 1 + (1 - beta) * currentP;
    } else {
      // Tidak ada permintaan di periode ini (y_t = 0)
      // Magnitude z_t tidak berubah (dipertahankan)
      // Probabilitas p_t meluruh ke bawah! Inilah kunci keunggulan TSB atas Croston
      currentP = (1 - beta) * currentP;
    }

    const forecast = currentZ * currentP;

    periods.push({
      period: t + 1,
      label: `Hari ${t + 1}`,
      actualDemand: y_t,
      z_t: Number(currentZ.toFixed(4)),
      p_t: Number(currentP.toFixed(4)),
      forecast: Number(forecast.toFixed(4)),
    });
  }

  // Forecast untuk periode berikutnya
  const forecastPerDay = currentZ * currentP;

  // 2. Perhitungan Statistik Varians & Deviasi Standar Permintaan
  const meanDemand = history.reduce((acc, v) => acc + v, 0) / n;
  const variance =
    n > 1
      ? history.reduce((acc, v) => acc + Math.pow(v - meanDemand, 2), 0) / (n - 1)
      : 0.1;
  const standardDeviation = Math.sqrt(variance);

  // 3. Lead Time & Safety Stock
  const leadTime = product.leadTimeDays || 3;
  const demandDuringLeadTime = forecastPerDay * leadTime;

  const zScore = SERVICE_LEVEL_Z_SCORES[serviceLevel] || 1.645;
  // Safety Stock = Z * sqrt(LeadTime) * standardDeviation
  // Mengakomodasi ketidakpastian permintaan intermiten selama lead time
  const safetyStock = Math.ceil(zScore * Math.sqrt(leadTime) * standardDeviation);

  // 4. Reorder Point (ROP) & Order-Up-To Level (S)
  const reorderPoint = Math.ceil(demandDuringLeadTime + safetyStock);
  
  // Target Stock Level (Order-Up-To S)
  // Menjamin ketersediaan stok hingga lead time berikutnya plus buffer siklus
  const cycleStock = Math.ceil(forecastPerDay * (leadTime * 2.5));
  const orderUpToLevel = Math.max(reorderPoint + 5, reorderPoint + cycleStock);

  // 5. Rekomendasi Restok
  const currentStock = product.currentStock;
  let recommendedRestockQty = 0;
  if (currentStock <= reorderPoint) {
    recommendedRestockQty = Math.max(1, orderUpToLevel - currentStock);
  }

  // 6. Penentuan Status Stok
  let stockStatus: TSBAnalysisResult['stockStatus'] = 'OPTIMAL';
  if (currentStock <= 0) {
    stockStatus = 'OUT_OF_STOCK';
  } else if (currentStock <= reorderPoint) {
    stockStatus = 'CRITICAL';
  } else if (currentStock <= reorderPoint * 1.3) {
    stockStatus = 'WARNING';
  } else if (currentStock > orderUpToLevel * 1.6) {
    stockStatus = 'OVERSTOCK';
  }

  const daysOfInventoryLeft =
    forecastPerDay > 0.001
      ? Math.round(currentStock / forecastPerDay)
      : 999;

  return {
    productId: product.id,
    alpha,
    beta,
    periods,
    lastZ: currentZ,
    lastP: currentP,
    forecastPerDay,
    leadTimeDays: leadTime,
    demandDuringLeadTime,
    variance,
    standardDeviation,
    safetyStock,
    reorderPoint,
    orderUpToLevel,
    recommendedRestockQty,
    stockStatus,
    daysOfInventoryLeft,
    totalPeriodsWithDemand: nonZeroDemands.length,
    demandFrequencyRatio: nonZeroDemands.length / n,
  };
}

/**
 * Fallback jika histori kosong
 */
function getFallbackTSBResult(product: Product, settings: TSBSettings): TSBAnalysisResult {
  const leadTime = product.leadTimeDays || 3;
  return {
    productId: product.id,
    alpha: settings.alpha,
    beta: settings.beta,
    periods: [],
    lastZ: 1,
    lastP: 0.1,
    forecastPerDay: 0.1,
    leadTimeDays: leadTime,
    demandDuringLeadTime: 0.3,
    variance: 0,
    standardDeviation: 0,
    safetyStock: 2,
    reorderPoint: 3,
    orderUpToLevel: 10,
    recommendedRestockQty: product.currentStock <= 3 ? 10 - product.currentStock : 0,
    stockStatus: product.currentStock <= 3 ? 'CRITICAL' : 'OPTIMAL',
    daysOfInventoryLeft: 30,
    totalPeriodsWithDemand: 0,
    demandFrequencyRatio: 0,
  };
}

/**
 * Bandingkan metode TSB dengan Croston dan Simple Moving Average (SMA)
 * untuk menunjukkan efektivitas TSB dalam menangani obsolescence
 */
export function compareForecastingMethods(history: number[], alpha = 0.2, beta = 0.15, smaWindow = 5) {
  const n = history.length;
  if (n === 0) return [];

  // Croston variables
  const nonZeros = history.filter((d) => d > 0);
  let crostonZ = nonZeros.length > 0 ? nonZeros[0] : 1;
  let crostonP = 1 / Math.max(1, n / Math.max(1, nonZeros.length)); // inter-arrival estimate

  // TSB variables
  let tsbZ = crostonZ;
  let tsbP = Math.max(0.05, nonZeros.length / n);

  const results = [];

  for (let t = 0; t < n; t++) {
    const y_t = history[t];

    // TSB Update
    if (y_t > 0) {
      tsbZ = alpha * y_t + (1 - alpha) * tsbZ;
      tsbP = beta * 1 + (1 - beta) * tsbP;
    } else {
      tsbP = (1 - beta) * tsbP;
    }
    const tsbForecast = tsbZ * tsbP;

    // Croston Update (Croston HANYA update ketika ada demand > 0)
    if (y_t > 0) {
      crostonZ = alpha * y_t + (1 - alpha) * crostonZ;
      // Croston interval update
      crostonP = beta * 1 + (1 - beta) * crostonP;
    }
    const crostonForecast = crostonZ * crostonP;

    // SMA Window
    const windowSlice = history.slice(Math.max(0, t - smaWindow + 1), t + 1);
    const smaForecast = windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length;

    results.push({
      period: t + 1,
      actual: y_t,
      tsb: Number(tsbForecast.toFixed(3)),
      croston: Number(crostonForecast.toFixed(3)),
      sma: Number(smaForecast.toFixed(3)),
    });
  }

  return results;
}
