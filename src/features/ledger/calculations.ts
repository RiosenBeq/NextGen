export interface CalculationParams {
  sessionPrice: number;
  iyzicoCommissionRate: number; // %2
  nayaxCommissionRate: number;  // %2
  fixedRent: number;
  duesAmount: number;
  revenueShareRate: number; // Ciro Payı %
  investmentAmount?: number; // Toplam yatırım (ROI için)
  defaultVatRate?: number; // 20% by default
}

export interface CalculationResult {
  grossRevenue: number;
  totalCommission: number;
  iyzicoCommission: number;
  nayaxCommission: number;
  revenueShare: number; 
  totalAvmExpense: number; 
  totalExpense: number;
  netCash: number;
  okanShare: number;
  talhaShare: number;
  furkanShare: number;
  alpShare: number;
  breakEvenSessions: number;
  profitMargin: number;
  roiPercentage?: number;
  isProfitable: boolean;
}

/**
 * Calculates monthly cash flow including commissions, AVM expenses, and operational costs.
 * AS PER USER REQUEST: Session revenue (e.g., 300 TL) is treated as GROSS (no KDV deduction from revenue).
 * Expenses however SHOULD include KDV where applicable.
 */
export function calculateMonthlyCashFlow(
  sessionCount: number,
  extraExpenseAmountWithVat: number,
  params: CalculationParams
): CalculationResult {
  // 1. Brüt Gelir (300 TL / seans - KDV düşülmez)
  const grossRevenue = sessionCount * params.sessionPrice;

  // 2. Komisyonlar — iyzico %2 + Nayax %2 = %4 (Brüt ciro üzerinden)
  const iyzicoCommission = grossRevenue * (params.iyzicoCommissionRate / 100);
  const nayaxCommission = grossRevenue * (params.nayaxCommissionRate / 100);
  const totalCommission = iyzicoCommission + nayaxCommission;

  // 3. AVM Gideri — Max(Sabit Kira, Ciro * Pay) Mantığı
  const calculatedRevenueShare = grossRevenue * (params.revenueShareRate / 100);
  const revenueShare = calculatedRevenueShare > params.fixedRent 
    ? calculatedRevenueShare - params.fixedRent
    : 0;

  // 4. Toplam AVM Gideri (Sabit Kira + Aidat + Kirayı Aşan Kısım)
  const totalAvmExpense = params.fixedRent + params.duesAmount + revenueShare;

  // 5. Toplam Giderler (AVM + Komisyon + Ek masraflar - KDV DAHİL)
  const totalExpense = totalCommission + totalAvmExpense + extraExpenseAmountWithVat;

  // 6. Net Nakit Akış = Brüt Gelir - Tüm Giderler (KDV Dahil Giderler)
  const netCash = grossRevenue - totalExpense;

  // 7. Kar Paylaşımı (4 Hissedar × %25)
  const shareRate = 0.25;
  const okanShare = netCash * shareRate;
  const talhaShare = netCash * shareRate;
  const furkanShare = netCash * shareRate;
  const alpShare = netCash * shareRate;

  // 8. Stratejik Metrikler
  const isProfitable = netCash > 0;
  
  // Break-even: Sabit giderler / (Birim Fiyat - Brüt Komisyonlar)
  const fixedCosts = params.fixedRent + params.duesAmount;
  const netRevenuePerSession = params.sessionPrice * (1 - (params.iyzicoCommissionRate + params.nayaxCommissionRate) / 100);
  
  const breakEvenSessions = netRevenuePerSession > 0 
    ? Math.ceil(fixedCosts / netRevenuePerSession) 
    : 0;
  
  const profitMargin = grossRevenue > 0 ? (netCash / grossRevenue) * 100 : 0;
  
  const roiPercentage = (params.investmentAmount && params.investmentAmount > 0)
    ? (netCash / params.investmentAmount) * 100
    : undefined;

  return {
    grossRevenue,
    totalCommission,
    iyzicoCommission,
    nayaxCommission,
    revenueShare,
    totalAvmExpense,
    totalExpense,
    netCash,
    okanShare,
    talhaShare,
    furkanShare,
    alpShare,
    breakEvenSessions,
    profitMargin,
    roiPercentage,
    isProfitable,
  };
}

