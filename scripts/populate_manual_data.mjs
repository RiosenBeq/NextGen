/**
 * populate_manual_data.mjs
 * ─────────────────────────────────────────────────────────────────────
 * MonthlyPerformance tablosunu Supabase client üzerinden günceller.
 * sessionCount = Giriş (ücretli seans)
 *
 * Run: node scripts/populate_manual_data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // ── 1. Lokasyonları bul ────────────────────────────────────────────
  const { data: locs, error: locErr } = await supabase
    .from('Location')
    .select('*')
    .eq('isActive', true);

  if (locErr) throw locErr;

  console.log('Aktif lokasyonlar:');
  locs.forEach(l => console.log(`  ${l.id} → ${l.name}`));

  const bursa = locs.find(l => l.name.toLowerCase().includes('bursa') || l.name.toLowerCase().includes('zafer'));
  const izmir = locs.find(l => l.name.toLowerCase().includes('mavibah') || l.name.toLowerCase().includes('izmir'));

  if (!bursa) throw new Error('Bursa lokasyonu bulunamadı!');
  if (!izmir) throw new Error('İzmir lokasyonu bulunamadı!');

  console.log(`\n✅ Bursa → ${bursa.id} (${bursa.name})`);
  console.log(`✅ İzmir → ${izmir.id} (${izmir.name})`);

  // ── 2. Aylık sessionCount hesapla (sadece Giriş sayısı) ────────────
  //
  // Bursa Mart 2026 (Giriş sütunu):
  // 4+5+13+15+10+5+6+10+28+21+15+9+14+3+9+11+9+11+7+0 = 205
  const bursaMartSessions = [4,5,13,15,10,5,6,10,28,21,15,9,14,3,9,11,9,11,7,0].reduce((a,b)=>a+b,0);

  // Bursa Nisan 2026 (Giriş sütunu):
  // 4+16+4+3+1 = 28
  const bursaNisanSessions = [4,16,4,3,1].reduce((a,b)=>a+b,0);

  // İzmir Mart 2026 (Giriş sütunu):
  // 3+11+18+39+15+4+8+9+9+17+24+19+24+17+15+19+12 = 263
  const izmirMartSessions = [3,11,18,39,15,4,8,9,9,17,24,19,24,17,15,19,12].reduce((a,b)=>a+b,0);

  // İzmir Nisan 2026 (Giriş sütunu):
  // 20+20+16+6+5 = 67
  const izmirNisanSessions = [20,20,16,6,5].reduce((a,b)=>a+b,0);

  console.log('\nHesaplanan aylık toplamlar (sadece ücretli giriş):');
  console.log(`  Bursa  Mart  2026 : ${bursaMartSessions} seans`);
  console.log(`  Bursa  Nisan 2026 : ${bursaNisanSessions} seans`);
  console.log(`  İzmir  Mart  2026 : ${izmirMartSessions} seans`);
  console.log(`  İzmir  Nisan 2026 : ${izmirNisanSessions} seans`);
  console.log(`  GENEL TOPLAM      : ${bursaMartSessions + bursaNisanSessions + izmirMartSessions + izmirNisanSessions} seans`);

  // ── 3. Mevcut kayıtları temizle ─────────────────────────────────────
  console.log('\n🗑️  Mevcut MonthlyPerformance kayıtları temizleniyor...');
  const { error: delErr } = await supabase
    .from('MonthlyPerformance')
    .delete()
    .in('locationId', [bursa.id, izmir.id]);

  if (delErr) {
    console.warn('⚠️  Temizleme hatası (devam ediliyor):', delErr.message);
  } else {
    console.log('   ✅ Temizlendi.');
  }

  // ── 4. Yeni kayıtları ekle ─────────────────────────────────────────
  console.log('\n📥 MonthlyPerformance güncelleniyor...');

  const records = [
    {
      id: `perf_bursa_2026_03`,
      locationId: bursa.id,
      month: '2026-03-01T00:00:00.000Z',
      sessionCount: bursaMartSessions,
      extraExpenseAmount: 0,
    },
    {
      id: `perf_bursa_2026_04`,
      locationId: bursa.id,
      month: '2026-04-01T00:00:00.000Z',
      sessionCount: bursaNisanSessions,
      extraExpenseAmount: 0,
    },
    {
      id: `perf_izmir_2026_03`,
      locationId: izmir.id,
      month: '2026-03-01T00:00:00.000Z',
      sessionCount: izmirMartSessions,
      extraExpenseAmount: 0,
    },
    {
      id: `perf_izmir_2026_04`,
      locationId: izmir.id,
      month: '2026-04-01T00:00:00.000Z',
      sessionCount: izmirNisanSessions,
      extraExpenseAmount: 0,
    },
  ];

  const { error: insertErr } = await supabase
    .from('MonthlyPerformance')
    .upsert(records, { onConflict: 'id' });

  if (insertErr) throw insertErr;

  for (const rec of records) {
    const locName = rec.locationId === bursa.id ? 'Bursa' : 'İzmir';
    const monthLabel = rec.month.slice(0, 7);
    console.log(`  ✅ ${locName} ${monthLabel}: ${rec.sessionCount} seans`);
  }

  console.log('\n🎉 Tüm veriler güncellendi! Dashboard\'u yenileyin.');
}

main().catch(err => {
  console.error('\n❌ HATA:', err.message || err);
  process.exit(1);
});
