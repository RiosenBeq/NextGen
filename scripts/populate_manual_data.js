/**
 * populate_manual_data.js
 * ─────────────────────────────────────────────────────────────────────
 * Gunluk verileri aylik toplam olarak MonthlyPerformance tablosuna
 * dogrudan upsert eder (DailyPerformance tablosu olmadigi icin).
 *
 * sessionCount = Giriş (ücretli seans, sadece bunlar ciro hesaplar)
 * testCount    = Test  (sadece bilgi amaçlı, kayıt edilmez)
 *
 * Run: node scripts/populate_manual_data.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // ── 1. Lokasyonları bul ────────────────────────────────────────────
  const locs = await prisma.location.findMany({ where: { isActive: true } });
  console.log('Aktif lokasyonlar:');
  locs.forEach(l => console.log(`  ${l.id} → ${l.name}`));

  const bursa = locs.find(l => l.name.toLowerCase().includes('bursa') || l.name.toLowerCase().includes('zafer'));
  const izmir = locs.find(l => l.name.toLowerCase().includes('mavibah') || l.name.toLowerCase().includes('izmir'));

  if (!bursa) throw new Error('Bursa lokasyonu bulunamadı!');
  if (!izmir) throw new Error('İzmir lokasyonu bulunamadı!');

  console.log(`\n✅ Bursa → ${bursa.id} (${bursa.name})`);
  console.log(`✅ İzmir → ${izmir.id} (${izmir.name})`);

  // ── 2. Aylık sessionCount hesapla (sadece Giriş sayısı) ────────────
  // Bursa Mart 2026 → 205 giriş
  const bursaMartSessions = [4,5,13,15,10,5,6,10,28,21,15,9,14,3,9,11,9,11,7,0].reduce((a,b)=>a+b,0);
  // Bursa Nisan 2026 → 28 giriş
  const bursaNisanSessions = [4,16,4,3,1].reduce((a,b)=>a+b,0);
  // İzmir Mart 2026 → 263 giriş
  const izmirMartSessions = [3,11,18,39,15,4,8,9,9,17,24,19,24,17,15,19,12].reduce((a,b)=>a+b,0);
  // İzmir Nisan 2026 → 67 giriş
  const izmirNisanSessions = [20,20,16,6,5].reduce((a,b)=>a+b,0);

  console.log('\nHesaplanan aylık toplamlar:');
  console.log(`  Bursa  Mart  2026 : ${bursaMartSessions} seans`);
  console.log(`  Bursa  Nisan 2026 : ${bursaNisanSessions} seans`);
  console.log(`  İzmir  Mart  2026 : ${izmirMartSessions} seans`);
  console.log(`  İzmir  Nisan 2026 : ${izmirNisanSessions} seans`);
  console.log(`  GENEL TOPLAM      : ${bursaMartSessions + bursaNisanSessions + izmirMartSessions + izmirNisanSessions} seans`);

  // ── 3. MonthlyPerformance'a upsert et ─────────────────────────────
  console.log('\n📥 MonthlyPerformance güncelleniyor...');

  const records = [
    { locationId: bursa.id, month: '2026-03', sessionCount: bursaMartSessions },
    { locationId: bursa.id, month: '2026-04', sessionCount: bursaNisanSessions },
    { locationId: izmir.id, month: '2026-03', sessionCount: izmirMartSessions },
    { locationId: izmir.id, month: '2026-04', sessionCount: izmirNisanSessions },
  ];

  for (const rec of records) {
    await prisma.monthlyPerformance.upsert({
      where: {
        locationId_month: {
          locationId: rec.locationId,
          month: new Date(`${rec.month}-01`)
        }
      },
      update: {
        sessionCount: rec.sessionCount,
      },
      create: {
        locationId: rec.locationId,
        month: new Date(`${rec.month}-01`),
        sessionCount: rec.sessionCount,
        extraExpenseAmount: 0,
      }
    });

    const locName = rec.locationId === bursa.id ? 'Bursa' : 'İzmir';
    console.log(`  ✅ ${locName} ${rec.month}: ${rec.sessionCount} seans kaydedildi`);
  }

  console.log('\n🎉 Tüm veriler güncellendi! Dashboard\'u yenileyin.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
