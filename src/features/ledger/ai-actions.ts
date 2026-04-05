'use server'

import { getLocationInsights, getSystemParameters } from './actions';
import { createClient } from '@/utils/supabase/server';

/**
 * Performans ve Finans verilerini OpenAI ile analiz eder.
 * Elite CFO persona'sı ile stratejik içgörüler üretir.
 */
export async function analyzeFinancialData() {
  try {
    let apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'OpenAI API Anahtarı bulunamadı (.env).' };
    }

    // Basit temizlik: Çift tire hatası vs. varsa sanitize et 
    if (apiKey.startsWith('sk-proj--')) {
      apiKey = apiKey.replace('sk-proj--', 'sk-proj-');
    }

    // 1. Veri Toplama
    const [insights, params] = await Promise.all([
      getLocationInsights(),
      getSystemParameters()
    ]);

    // Toplam metrikleri hesapla
    const totalRevenue = insights.reduce((acc, loc) => acc + (loc.currentMonthlyProfit / (loc.profitMargin / 100) || 0), 0);
    const totalProfit = insights.reduce((acc, loc) => acc + loc.currentMonthlyProfit, 0);
    const avgRoi = insights.reduce((acc, loc) => acc + loc.roi, 0) / (insights.length || 1);

    // 2. OpenAI Prompt Hazırlığı
    const prompt = `
      Sen "Elite Financial Analyst" ve kıdemli bir CFO'sun. 
      Aşağıdaki finansal verileri analiz et ve profesyonel, stratejik, Türkçe bir rapor hazırla.
      
      VERİLER:
      - Toplam Aylık Tahmini Ciro: ₺${totalRevenue.toLocaleString()}
      - Toplam Aylık Net Kâr: ₺${totalProfit.toLocaleString()}
      - Ortalama ROI (Yatırım Getirisi): %${avgRoi.toFixed(2)}
      - Şube Detayları: ${JSON.stringify(insights.map(i => ({
          isim: i.name,
          gelir: i.currentMonthlyProfit,
          marj: `%${i.profitMargin.toFixed(1)}`,
          yatirim_geri_donusu: `%${i.roi.toFixed(1)}`,
          basabas_noktasi: i.breakEvenSessions + " seans"
        })))}

      İSTENEN FORMAT (Markdown):
      1. **Yapay Zeka Özeti**: Sistemin genel sağlığı hakkında 2-3 cümlelik üst düzey yönetici özeti.
      2. **Kritik Bulgular**: Verilerdeki anomaliler veya dikkat çeken başarılar (en iyi-en kötü performans gibi).
      3. **Stratejik Öneriler**: ROI artırmak veya giderleri optimize etmek için 3 adet somut öneri.
      4. **Risk Analizi**: Varsa operasyonel riskler.

      Dil çok profesyonel, kurumsal ve vizyoner olmalı. 
      Cevabını doğrudan Markdown formatında ver.
    `;

    // 3. API Çağrısı (Fetch ile)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', 
        messages: [
          { role: 'system', content: 'Sen dünya çapında bir finansal analistsin. Sadece profesyonel Türkçe ile analiz yaparsın.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message || 'OpenAI API Hatası');
    }

    const aiAnalysis = result.choices[0].message.content;

    return { 
      success: true, 
      analysis: aiAnalysis 
    };

  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    return { success: false, error: error.message || 'Analiz sırasında bir hata oluştu.' };
  }
}
