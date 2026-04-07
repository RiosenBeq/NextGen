/**
 * seed_financial_data.mjs
 * ──────────────────────────────────────────────────────────────────────────
 * Clears and re-seeds:
 *   1. Investment records (Bursa: 349,125 TL | İzmir: 491,375 TL KDV'siz)
 *   2. Expense records (as specified by user)
 *
 * Run: node scripts/seed_financial_data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Location IDs ────────────────────────────────────────────────────────────
// We'll look them up by name so IDs don't get hardcoded wrong
async function getLocations() {
  const { data, error } = await supabase.from('Location').select('*').eq('isActive', true);
  if (error) throw error;
  const bursa = data.find(l => l.name.toLowerCase().includes('bursa') || l.name.toLowerCase().includes('zafer'));
  const izmir = data.find(l => l.name.toLowerCase().includes('izmir') || l.name.toLowerCase().includes('mavibahçe') || l.name.toLowerCase().includes('mavibahce'));
  if (!bursa) throw new Error('Bursa location not found! Check Location table.');
  if (!izmir) throw new Error('İzmir/Mavibahçe location not found! Check Location table.');
  console.log('✅ Bursa:', bursa.name, '→', bursa.id);
  console.log('✅ İzmir:', izmir.name, '→', izmir.id);
  return { bursa, izmir };
}

// ─── 1. Investments ───────────────────────────────────────────────────────────
// User's stated targets:
//   Bursa total (KDV'siz): 349,125 TL
//   İzmir total (KDV'siz): 491,375 TL → KDV dahil: ~840,500 TL bölünmüş olarak
//
// Breakdown:
//   Bursa:
//     Karaoke Box Ünitesi  328,125 TL (nakit, KDV'siz)
//     Nakliye → Depo         6,000 TL
//     Nakliye Depo → Bursa  15,000 TL
//     TOPLAM:              349,125 TL ✓
//
//   İzmir:
//     Karaoke Box Ünitesi  415,625 TL (USD bazlı, KDV yok nakit)
//     Kurulum+Nakliye       32,000 TL
//     (not: 43,750 TL KDV tutarı — toplam KDV dahil: 491,375 TL)
//     TOPLAM KDV'siz:      447,625 TL  →  KDV dahil: 491,375 TL
//     TOPLAM totalAmount:  491,375 TL ✓

async function seedInvestments(bursa, izmir) {
  console.log('\n🌱 Seeding investments...');

  // Remove previous investment records for these locations to avoid duplicates
  const { error: delError } = await supabase
    .from('Investment')
    .delete()
    .in('locationId', [bursa.id, izmir.id]);
  if (delError) {
    console.warn('⚠️  Could not delete old investments:', delError.message);
  } else {
    console.log('🗑️  Cleared old investments for both locations.');
  }

  const investments = [
    // ── Bursa Zafer Plaza ──────────────────────────────────────────────────
    {
      id: `inv_bursa_unit`,
      locationId: bursa.id,
      description: 'Karaoke Box Ünitesi',
      currency: 'TL',
      amountWithoutVat: 328125,
      paymentType: 'Nakit',
      vatAmount: 0,
      totalAmount: 328125,
      shareLogic: '50/50',
      notes: "KDV'siz nakit alındı",
    },
    {
      id: `inv_bursa_nakliye1`,
      locationId: bursa.id,
      description: 'Nakliye → Depo',
      currency: 'TL',
      amountWithoutVat: 6000,
      paymentType: 'Nakit',
      vatAmount: 0,
      totalAmount: 6000,
      shareLogic: '50/50',
      notes: "KDV'siz nakit alındı",
    },
    {
      id: `inv_bursa_nakliye2`,
      locationId: bursa.id,
      description: 'Nakliye Depo → Bursa',
      currency: 'TL',
      amountWithoutVat: 15000,
      paymentType: 'Nakit',
      vatAmount: 0,
      totalAmount: 15000,
      shareLogic: '50/50',
      notes: "KDV'siz nakit alındı",
    },

    // ── İzmir Mavibahçe ───────────────────────────────────────────────────
    // KDV'siz: 447,625 TL + KDV 43,750 TL = KDV Dahil 491,375 TL
    {
      id: `inv_izmir_unit`,
      locationId: izmir.id,
      description: 'Karaoke Box Ünitesi',
      currency: 'TL',
      amountWithoutVat: 415625,
      paymentType: 'Nakit',
      vatAmount: 43750,
      totalAmount: 459375,
      shareLogic: '50/50',
      notes: '9.500 USD — Hızla Kirala üzerinden alındı',
    },
    {
      id: `inv_izmir_kurulum`,
      locationId: izmir.id,
      description: 'Taşıma + Kurulum + Nakliye',
      currency: 'TL',
      amountWithoutVat: 32000,
      paymentType: 'Nakit',
      vatAmount: 0,
      totalAmount: 32000,
      shareLogic: '50/50',
      notes: 'İzmir komple kurulum',
    },
  ];

  const { error } = await supabase.from('Investment').upsert(investments, { onConflict: 'id' });
  if (error) throw error;

  const bursaTotal = investments.filter(i => i.locationId === bursa.id).reduce((s, i) => s + i.totalAmount, 0);
  const izmirTotal = investments.filter(i => i.locationId === izmir.id).reduce((s, i) => s + i.totalAmount, 0);
  console.log(`✅ Bursa toplam yatırım (KDV Dahil): ₺${bursaTotal.toLocaleString('tr-TR')}`);
  console.log(`✅ İzmir toplam yatırım (KDV Dahil): ₺${izmirTotal.toLocaleString('tr-TR')}`);
  console.log(`✅ Genel Toplam: ₺${(bursaTotal + izmirTotal).toLocaleString('tr-TR')}`);
}

// ─── 2. Expenses ─────────────────────────────────────────────────────────────
// User's data:
// Gider Adı              KDV Hariç   Resmi  KDV%  KDV Tutarı  Toplam     AVM           Freq       Tarih
// Kamera                 2,100 TL    EVET   20%   420 TL      2,520 TL   Tümü          tek sefer  2026-03
// Branda (İzmir)         9,000 TL    HAYIR  20%   0 TL        9,000 TL   Mavibahçe     tek sefer  2026-03
// SuperBox               2,000 TL    EVET   20%   400 TL      2,400 TL   Tümü          aylık      -
// Kapı Düzeltildi        2,500 TL    HAYIR  20%   0 TL        2,500 TL   Bursa ZP      tek sefer  2026-03
// Söz Okuma Ekranı       835 TL      HAYIR  20%   0 TL        835 TL     Mavibahçe     tek sefer  2026-03

async function seedExpenses(bursa, izmir) {
  console.log('\n🌱 Seeding expenses...');

  // Clear all existing expenses first (clean slate)
  const { error: delError } = await supabase
    .from('Expense')
    .delete()
    .in('description', [
      'Kamera',
      'Branda (İzmir)',
      'SuperBox',
      'Kapı Düzeltildi',
      'Söz Okuma Ekranı Yapıldı',
    ]);
  if (delError) {
    console.warn('⚠️  Could not delete matching expenses:', delError.message);
  }

  const expenses = [
    // 1. Kamera – tek sefer, Tümü, resmi, 2026-03
    {
      id: 'exp_kamera_2603',
      locationId: null,            // Tümü = global
      description: 'Kamera',
      type: 'ONE_TIME',
      amountWithoutVat: 2100,
      vatRate: 20,
      amountWithVat: 2520,
      isOfficial: true,
      month: '2026-03',
      paidBy: 'Ortak Hesap',
      categoryId: 'equipment',
    },

    // 2. Branda (İzmir) – tek sefer, Mavibahçe, resmi değil, KDV ödenmedi, 2026-03
    {
      id: 'exp_branda_izmir_2603',
      locationId: izmir.id,
      description: 'Branda (İzmir)',
      type: 'ONE_TIME',
      amountWithoutVat: 9000,
      vatRate: 20,
      amountWithVat: 9000,         // KDV ödenmedi (nakit faturasız)
      isOfficial: false,
      month: '2026-03',
      paidBy: 'Ortak Hesap',
      categoryId: 'maintenance',
    },

    // 3. SuperBox – aylık tekrarlayan, Tümü, resmi
    {
      id: 'exp_superbox_monthly',
      locationId: null,            // Tümü = global
      description: 'SuperBox',
      type: 'RECURRING',
      amountWithoutVat: 2000,
      vatRate: 20,
      amountWithVat: 2400,
      isOfficial: true,
      month: null,
      paidBy: 'Ortak Hesap',
      categoryId: 'operational',
    },

    // 4. Kapı Düzeltildi – tek sefer, Bursa ZP, resmi değil, 2026-03
    {
      id: 'exp_kapi_bursa_2603',
      locationId: bursa.id,
      description: 'Kapı Düzeltildi',
      type: 'ONE_TIME',
      amountWithoutVat: 2500,
      vatRate: 20,
      amountWithVat: 2500,         // KDV ödenmedi
      isOfficial: false,
      month: '2026-03',
      paidBy: 'Ortak Hesap',
      categoryId: 'maintenance',
    },

    // 5. Söz Okuma Ekranı Yapıldı – tek sefer, Mavibahçe, resmi değil, 2026-03
    {
      id: 'exp_soz_ekran_2603',
      locationId: izmir.id,
      description: 'Söz Okuma Ekranı Yapıldı',
      type: 'ONE_TIME',
      amountWithoutVat: 835,
      vatRate: 20,
      amountWithVat: 835,          // KDV ödenmedi
      isOfficial: false,
      month: '2026-03',
      paidBy: 'Ortak Hesap',
      categoryId: 'equipment',
    },
  ];

  const { error } = await supabase.from('Expense').upsert(expenses, { onConflict: 'id' });
  if (error) throw error;

  console.log('✅ Seeded expenses:');
  for (const e of expenses) {
    console.log(`   • ${e.description}: ₺${e.amountWithVat.toLocaleString('tr-TR')} (${e.type})`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting financial data seed...\n');

  try {
    const { bursa, izmir } = await getLocations();
    await seedInvestments(bursa, izmir);
    await seedExpenses(bursa, izmir);

    console.log('\n🎉 All done! Refresh the dashboard.');
    console.log('\nBeklenen Yatırım Özeti:');
    console.log('  Bursa Zafer Plaza: ₺349,125 (KDV Dahil)');
    console.log('  İzmir Mavibahçe:   ₺491,375 (KDV Dahil)');
    console.log('  GENEL TOPLAM:      ₺840,500 (KDV Dahil)');
  } catch (err) {
    console.error('\n❌ HATA:', err.message);
    process.exit(1);
  }
}

main();
