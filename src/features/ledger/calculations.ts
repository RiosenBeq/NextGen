export interface CalculationParams {
  sessionPrice: number;
  kdvRate: number;
  iyzicoCommissionRate: number; // %2
  nayaxCommissionRate: number;   // %2
  fixedRent: number;
  duesAmount: number;
  rentKdvRate: number;
  revenueShareRate: number; // Ciro Payı %
  revenueThreshold: number; // Ciro Eşiği (TL)
  applyRentVat: boolean;    // Kira KDV uygulansın mı?
  rentVatWithholdingRate?: number; // Tevkifat oranı (örn: 9/10 için 90, 2/10 için 20)
  investmentAmount?: number; // Toplam yatırım (ROI için)
}

export interface CalculationResult {
  grossRevenue: number;
  collectedKdv: number;
  netRevenue: number;
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
  rentKdv: number;
  rentVatWithholding: number;    // Tevkifat Tutarı
  actualRentVatPayment: number;  // Tevkifat sonrası ödenen KDV
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
  // 1. Brüt Gelir (KDV Dahil)
  const grossRevenue = sessionCount * params.sessionPrice;

  // 2. Tahsil Edilen KDV
  const collectedKdv = grossRevenue * (params.kdvRate / (100 + params.kdvRate));

  // 3. Net Gelir (KDV Hariç)
  const netRevenue = grossRevenue - collectedKdv;

  // 4. Komisyonlar (iyzico+nayax)
  const iyzicoCommission = grossRevenue * (params.iyzicoCommissionRate / 100);
  const nayaxCommission = grossRevenue * (params.nayaxCommissionRate / 100);
  const totalCommission = iyzicoCommission + nayaxCommission;

  // 5. Kira KDV ve Tevkifat
  const rawRentVat = params.applyRentVat ? (params.fixedRent * params.rentKdvRate / 100) : 0;
  const rentVatWithholding = params.rentVatWithholdingRate 
    ? (rawRentVat * params.rentVatWithholdingRate / 100)
    : 0;
  const actualRentVatPayment = rawRentVat - rentVatWithholding;

  // 6. Ciro Payı (Revenue Share)
  const revenueShare = grossRevenue > params.revenueThreshold 
    ? (grossRevenue - params.revenueThreshold) * (params.revenueShareRate / 100)
    : 0;

  // 7. Sabit Giderler (Seans bağımsız: Kira + Aidat + Ödenen KDV)
  const fixedCosts = params.fixedRent + params.duesAmount + actualRentVatPayment;

  // 8. Toplam AVM Gideri
  const totalAvmExpense = fixedCosts + revenueShare;

  // 9. Toplam Giderler
  const totalExpense = totalCommission + totalAvmExpense + extraExpense;

  // 10. Net Nakit
  const netCash = grossRevenue - totalExpense;

  // 11. Kar Paylaşımı (4 Hissedar %25)
  const shareRate = 25 / 100;
  const okanShare = netCash * shareRate;
  const talhaShare = netCash * shareRate;
  const furkanShare = netCash * shareRate;
  const alpShare = netCash * shareRate;

  // 12. Stratejik Metrikler
  const isProfitable = netCash > 0;
  const breakEvenSessions = Math.ceil(totalExpense / params.sessionPrice);
  const profitMargin = netRevenue > 0 ? (netCash / netRevenue) * 100 : 0;
  
  const roiPercentage = (params.investmentAmount && params.investmentAmount > 0)
    ? (netCash / params.investmentAmount) * 100
    : undefined;

  return {
    grossRevenue,
    collectedKdv,
    netRevenue,
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
    rentKdv: rawRentVat,
    rentVatWithholding,
    actualRentVatPayment,
    breakEvenSessions,
    profitMargin,
    roiPercentage,
    isProfitable,
  };
}
