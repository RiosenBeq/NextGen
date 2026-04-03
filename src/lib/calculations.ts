import { FINANCIAL_CONFIG } from './config';
import { CabinData } from './kabinRapor';

export interface FinancialSummary {
  totalRevenue: number;
  totalPaidSessions: number;
  netRevenuePerSession: number;
  totalNetRevenue: number; // After KDV and Commission
  fixedCosts: number;
  netProfit: number; // After Tax
  breakEvenSessionsPerMonth: number;
  isProfitable: boolean;
}

export const FinanceCalculator = {
  /**
   * Excel'deki 'Net Gelir/Oturum' mantığı ile oturum başına geliri hesaplar.
   * Net Gelir = Brüt - (KDV + Komisyon)
   */
  calculateNetRevenuePerSession(grossRevenue: number, sessions: number): number {
    if (sessions === 0) return 0;
    const grossPerSession = grossRevenue / sessions;
    const netPerSession = grossPerSession * (1 - FINANCIAL_CONFIG.ORANLAR.KOMISYON) / (1 + FINANCIAL_CONFIG.ORANLAR.KDV);
    return netPerSession;
  },

  /**
   * Toplan Net Gelir (KDV ve Komisyon düşülmüş)
   */
  calculateTotalNetRevenue(grossRevenue: number): number {
    // Brüt fiyattan önce %15 komisyon düşülür (Varsayım: OsesSensin sistemi komisyonunu brüt üzerinden alıyor)
    // Kalan tutardan KDV ayrıştırılır.
    const netBeforeVAT = grossRevenue * (1 - FINANCIAL_CONFIG.ORANLAR.KOMISYON);
    const netAfterVAT = netBeforeVAT / (1 + FINANCIAL_CONFIG.ORANLAR.KDV);
    return netAfterVAT;
  },

  /**
   * Başa Baş Noktası (Oturum Sayısı)
   */
  calculateBreakEvenSessions(fixedCosts: number, netRevenuePerSession: number): number {
    if (netRevenuePerSession === 0) return 0;
    return Math.ceil(fixedCosts / netRevenuePerSession);
  },

  /**
   * Kabin verilerinden finansal özet üretir
   */
  summarizeKabinPerformance(cabins: CabinData[]): FinancialSummary {
    const totalRevenue = cabins.reduce((acc, c) => acc + (c.today_revenue || 0), 0);
    const totalSessions = cabins.reduce((acc, c) => acc + (c.paid_sessions || 0), 0);
    
    // Zafer Plaza ve Mavi Bahçe için ayrı ayrı hesapla (Kabin isimlerinden çıkarım yapıyoruz)
    const bursaKabins = cabins.filter(c => c.cabin_name.toLowerCase().includes('bursa'));
    const izmirKabins = cabins.filter(c => c.cabin_name.toLowerCase().includes('izmir') || c.cabin_name.toLowerCase().includes('mavibah'));

    // Günlük ciroyu aya projeksiyon yapıyoruz (Hesaplamalar genelde aylık bazlıdır)
    const bursaRevenueMonthly = bursaKabins.reduce((acc, c) => acc + (c.today_revenue || 0), 0) * 30;
    const izmirRevenueMonthly = izmirKabins.reduce((acc, c) => acc + (c.today_revenue || 0), 0) * 30;

    // Zafer Plaza Ciro Payı: 40k üstü %15
    const bursaCiroPayiMonthly = bursaRevenueMonthly > FINANCIAL_CONFIG.SABIT_MALIYETLER.ZAFER_PLAZA.CIRO_ESIK 
      ? (bursaRevenueMonthly - FINANCIAL_CONFIG.SABIT_MALIYETLER.ZAFER_PLAZA.CIRO_ESIK) * FINANCIAL_CONFIG.SABIT_MALIYETLER.ZAFER_PLAZA.CIRO_PAY_ORAN 
      : 0;
    
    // Mavi Bahçe Ciro Payı: 30k üstü %15
    const izmirCiroPayiMonthly = izmirRevenueMonthly > FINANCIAL_CONFIG.SABIT_MALIYETLER.MAVIBAHCE.CIRO_ESIK 
      ? (izmirRevenueMonthly - FINANCIAL_CONFIG.SABIT_MALIYETLER.MAVIBAHCE.CIRO_ESIK) * FINANCIAL_CONFIG.SABIT_MALIYETLER.MAVIBAHCE.CIRO_PAY_ORAN 
      : 0;

    // Sabit Maliyetler (Kira + %20 KDV + Aidat)
    // Zafer: Kira + %20 KDV + Aidat (KDV'siz)
    const zaferFixed = (FINANCIAL_CONFIG.SABIT_MALIYETLER.ZAFER_PLAZA.KIRA * 1.20) + FINANCIAL_CONFIG.SABIT_MALIYETLER.ZAFER_PLAZA.AIDAT;
    // Mavi: Kira + %20 KDV + Aidat
    const maviFixed = (FINANCIAL_CONFIG.SABIT_MALIYETLER.MAVIBAHCE.KIRA * 1.20) + FINANCIAL_CONFIG.SABIT_MALIYETLER.MAVIBAHCE.AIDAT;

    const totalFixedCostsMonthly = zaferFixed + maviFixed + FINANCIAL_CONFIG.SABIT_MALIYETLER.PERSONEL;
    const totalExtraCostsMonthly = bursaCiroPayiMonthly + izmirCiroPayiMonthly;
    
    // Toplam Gider (Aylık)
    const totalCostsMonthly = totalFixedCostsMonthly + totalExtraCostsMonthly;

    // Net Gelir (Aylık projeksiyon)
    const totalNetRevenueMonthly = this.calculateTotalNetRevenue(totalRevenue) * 30;
    const netProfitMonthly = totalNetRevenueMonthly - totalCostsMonthly;

    return {
      totalRevenue: totalRevenue * 30, // Projeksiyon
      totalPaidSessions: totalSessions * 30,
      netRevenuePerSession: totalSessions > 0 ? (totalNetRevenueMonthly / (totalSessions * 30)) : 0,
      totalNetRevenue: totalNetRevenueMonthly,
      fixedCosts: totalFixedCostsMonthly,
      netProfit: netProfitMonthly * (1 - FINANCIAL_CONFIG.ORANLAR.GELIR_VERGISI),
      breakEvenSessionsPerMonth: Math.round(totalCostsMonthly / 240), // 240 TL net gelir/oturum baz alındı
      isProfitable: netProfitMonthly > 0
    };
  }
};
