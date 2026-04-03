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
    
    // Excel'deki toplam aylık sabit maliyet (1 AVM veya genel)
    const fixedCosts = FINANCIAL_CONFIG.SABIT_MALIYETLER.KIRA_ZAFER_PLAZA + 
                       FINANCIAL_CONFIG.SABIT_MALIYETLER.AIDAT_ZAFER_PLAZA +
                       FINANCIAL_CONFIG.SABIT_MALIYETLER.KIRA_MAVIBAHCE + 
                       FINANCIAL_CONFIG.SABIT_MALIYETLER.AIDAT_MAVIBAHCE;

    const totalNetRevenue = this.calculateTotalNetRevenue(totalRevenue);
    
    // Basitleştirilmiş Kar: Net Gelir - (Sabit Maliyet / 30 gün) (Günlük bakılıyorsa)
    // Eğer tüm ay ise: Net Gelir - Sabit Maliyet
    const dailyFixedCost = fixedCosts / 30;
    const netProfit = totalNetRevenue - (totalSessions > 0 ? dailyFixedCost : 0); // Günlük yaklaşım

    return {
      totalRevenue,
      totalPaidSessions: totalSessions,
      netRevenuePerSession: totalSessions > 0 ? totalNetRevenue / totalSessions : 0,
      totalNetRevenue,
      fixedCosts,
      netProfit: netProfit * (1 - FINANCIAL_CONFIG.ORANLAR.GELIR_VERGISI), // Vergiden sonra
      breakEvenSessionsPerMonth: this.calculateBreakEvenSessions(fixedCosts, 240), // 240 Excel'deki sabit net gelir/oturum
      isProfitable: netProfit > 0
    };
  }
};
