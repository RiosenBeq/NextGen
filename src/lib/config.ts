/**
 * Finansal Hesaplamalar İçin Sabitler (Excel'den)
 */
export const FINANCIAL_CONFIG = {
  SABIT_MALIYETLER: {
    ZAFER_PLAZA: {
      KIRA: 40000,
      AIDAT: 7500, // KDV eklenmiyor
      CIRO_ESIK: 40000,
      CIRO_PAY_ORAN: 0.15
    },
    MAVIBAHCE: {
      KIRA: 30000,
      AIDAT: 1100,
      CIRO_ESIK: 30000,
      CIRO_PAY_ORAN: 0.15
    },
    PERSONEL: 8000,
  },
  ORANLAR: {
    KDV: 0.20,
    KOMISYON: 0.15,
    GELIR_VERGISI: 0.20
  },
  BIRIM_FIYAT: {
    OTURUM_NET: 240
  }
};
