export interface CalculationParams {
  sessionPrice: number;
  iyzicoCommissionRate: number; // %2
  nayaxCommissionRate: number;  // %2
  fixedRent: number;
  duesAmount: number;
  revenueShareRate: number; // Ciro Payı %
  investmentAmount?: number; // Toplam yatırım (ROI için)
}

export interface CalculationResult {
  grossRevenue: number;
  totalCommission: number;
  iyzicoCommission: number;
  nayaxCommission: number;
  revenueShare: number; // Kirayı aşan ciro payı
  totalAvmExpense: number; // Sabit kira + Aidat + Kirayı aşan ciro payı
  totalExpense: number;
  netCash: number;
  okanShare: number;
  talhaShare: number;
  furkanShare: number;
  alpShare: number;
  // Strategic Metrics
  breakEvenSessions: number;     // Kaç seansta kafa kafaya?
  profitMargin: number;          // Kar marjı (%)
  roiPercentage?: number;        // Yatırımın ne kadarı geri döndü (Aylık bazda %)
  isProfitable: boolean;
}

export function calculateMonthlyCashFlow(
  sessionCount: number,
  extraExpense: number,
  params: CalculationParams
): CalculationResult {
  // 1. Brüt Gelir 
  const grossRevenue = sessionCount * params.sessionPrice;

  // 2. Komisyonlar — iyzico %2 + Nayax %2 = %4 (Brüt ciro üzerinden)
  const iyzicoCommission = grossRevenue * (params.iyzicoCommissionRate / 100);
  const nayaxCommission = grossRevenue * (params.nayaxCommissionRate / 100);
  const totalCommission = iyzicoCommission + nayaxCommission;

  // 3. AVM Gideri — (AVM'lere Kira + Aidat. Eğer ki ciro payı kirayı geçerse, o zaman aradaki farkı da revenue share olarak öderiz, veya 'Max(Kira, Ciro * Pay)')
  const calculatedRevenueShare = grossRevenue * (params.revenueShareRate / 100);
  const revenueShare = calculatedRevenueShare > params.fixedRent 
    ? calculatedRevenueShare - params.fixedRent
    : 0;

  // 4. Toplam AVM Gideri (Sabit Kira + Aidat + Kirayı Aşan Kısım Varsa O)
  const totalAvmExpense = params.fixedRent + params.duesAmount + revenueShare;

  // 5. Toplam Giderler (AVM + Komisyon + Ek masraf)
  const totalExpense = totalCommission + totalAvmExpense + extraExpense;

  // 6. Net Nakit Akış = Brüt Gelir - Tüm Giderler
  const netCash = grossRevenue - totalExpense;

  // 7. Kar Paylaşımı (4 Hissedar × %25)
  const shareRate = 25 / 100;
  const okanShare = netCash * shareRate;
  const talhaShare = netCash * shareRate;
  const furkanShare = netCash * shareRate;
  const alpShare = netCash * shareRate;

  // 8. Stratejik Metrikler
  const isProfitable = netCash > 0;
  
  // Break-even: Sabit giderler / oturum başına net gelir
  // Net gelir/oturum = (Fiyat - Komisyonlar) = 300 * (1 - 0.04) = 288 TL
  const fixedCosts = params.fixedRent + params.duesAmount;
  const netRevenuePerSession = params.sessionPrice > 0
    ? params.sessionPrice * (1 - (params.iyzicoCommissionRate + params.nayaxCommissionRate) / 100)
    : 0;
  const breakEvenSessions = netRevenuePerSession > 0 
    ? Math.ceil(fixedCosts / netRevenuePerSession) 
    : 0;
  
  // Kâr marjı = Net Nakit / Brüt Gelir
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
