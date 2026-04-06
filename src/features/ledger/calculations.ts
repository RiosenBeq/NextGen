export interface CalculationParams {
  sessionPrice: number;
  iyzicoCommissionRate: number; // %2
  nayaxCommissionRate: number;  // %2
  fixedRent: number;
  duesAmount: number;
  revenueShareRate: number; // Ciro Payı %
  investmentAmount?: number; // Toplam yatırım (ROI için)
  defaultVatRate?: number; // 20% by default
  month?: string; // YYYY-MM
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

  // 3. AVM Gideri — Kira Sonrası Cirodan Pay (Kullanıcı İsteği: Ciro - Kira > 0 ise %15)
  // İSTİSNA: Her yıl Mart ayında (YYYY-03) Ciro Payı ödenmeyecek.
  let revenueShare = 0;
  const monthId = params.month?.slice(0, 7);
  const isMarch = Boolean(monthId && monthId.endsWith('-03'));
  
  if (!isMarch) {
    const revenueAboveRent = Math.max(0, grossRevenue - params.fixedRent);
    revenueShare = revenueAboveRent * (params.revenueShareRate / 100);
  }

  // 4. Toplam AVM Gideri (Ham Kira + %20 KDV + Aidat + Kirayı Aşan Ciro Payı)
  const fixedRentWithVat = params.fixedRent * 1.20;
  const totalAvmExpense = fixedRentWithVat + params.duesAmount + revenueShare;

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
  
  // Break-even: Sabit giderler (KDV Dahil Kira + Aidat) / (Oturum Başı Net Gelir)
  const fixedCosts = (params.fixedRent * 1.20) + params.duesAmount;
  const netRevenuePerSession = params.sessionPrice * 0.96; // 300 - 4% (2% Nayax + 2% iyzico)
  
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
