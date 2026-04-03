export interface CalculationParams {
  sessionPrice: number;
  kdvRate: number;
  totalCommissionRate: number; // Iyzico + Nayax
  alpShareRate: number;
  ngbShareRate: number;
  fixedRent: number;
  duesAmount: number;
  rentKdvRate: number;
}

export function calculateMonthlyCashFlow(
  sessionCount: number,
  extraExpense: number,
  params: CalculationParams
) {
  // Gelirler
  const grossRevenue = sessionCount * params.sessionPrice;
  const collectedKdv = grossRevenue * (params.kdvRate / (100 + params.kdvRate));
  const netRevenue = grossRevenue - collectedKdv;

  // Komisyonlar
  const totalCommission = grossRevenue * (params.totalCommissionRate / 100);

  // Sabit AVM Giderleri
  const rentKdv = params.fixedRent * (params.rentKdvRate / 100);
  const totalAvmExpense = params.fixedRent + params.duesAmount + rentKdv;

  // Toplam Gider
  const totalExpense = totalCommission + totalAvmExpense + extraExpense;

  // Kâr Zarar ve Nakit
  const netCash = grossRevenue - totalExpense; // Excel Nakit Akış mantığı (KDV dahil Brüt - Nakit Çıkışları)

  // Pay Dağılımı
  const alpShare = netCash * (params.alpShareRate / 100);
  const ngbShare = netCash * (params.ngbShareRate / 100);

  return {
    grossRevenue,
    collectedKdv,
    netRevenue,
    totalCommission,
    totalAvmExpense,
    totalExpense,
    netCash,
    alpShare,
    ngbShare,
  };
}
