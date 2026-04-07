require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_HESAPSUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log("Fetching expenses...");
  const { data: allExpenses, error: expError } = await supabase.from('Expense').select('id, description');
  if (expError) throw expError;

  const toDelete = allExpenses.filter(e => {
    const desc = e.description.toLowerCase();
    return !desc.includes('eren') && !desc.includes('murat');
  }).map(e => e.id);

  console.log(`Deleting ${toDelete.length} expenses...`);
  
  if (toDelete.length > 0) {
    for (let i = 0; i < toDelete.length; i += 50) {
      const chunk = toDelete.slice(i, i + 50);
      const { error: delError } = await supabase.from('Expense').delete().in('id', chunk);
      if (delError) throw delError;
    }
  }

  console.log("Fetching locations...");
  const { data: locations, error: locError } = await supabase.from('Location').select('id, name');
  if (locError) throw locError;

  const getLocId = (namePart) => {
    const l = locations.find(loc => loc.name.toLowerCase().includes(namePart.toLowerCase()));
    return l ? l.id : null;
  };

  const maviLoc = getLocId('mavibahçe') || getLocId('mavi');
  const bursaLoc = getLocId('bursa') || getLocId('zafer');

  const newExpenses = [
    {
      description: "Nakit alındı — 2.000 TL toplam",
      amountWithoutVat: 2100,
      vatRate: 20,
      amountWithVat: 2520,
      isOfficial: true,
      type: "ONE_TIME",
      month: "2026-03-01T00:00:00.000Z",
      locationId: null,
      paidBy: "Ortak Hesap",
      categoryId: null
    },
    {
      description: "Branda (İzmir) - Nakit — 9.000 TL",
      amountWithoutVat: 9000,
      vatRate: 0,
      amountWithVat: 9000,
      isOfficial: false,
      type: "ONE_TIME",
      month: "2026-03-01T00:00:00.000Z",
      locationId: maviLoc,
      paidBy: "Ortak Hesap"
    },
    {
      description: "Turkcell SuperBox abonelik",
      amountWithoutVat: 2000,
      vatRate: 20,
      amountWithVat: 2400,
      isOfficial: true,
      type: "RECURRING",
      month: null, 
      locationId: null,
      paidBy: "Ortak Hesap"
    },
    {
      description: "Kapı Düzeltildi",
      amountWithoutVat: 2500,
      vatRate: 0,
      amountWithVat: 2500,
      isOfficial: false,
      type: "ONE_TIME",
      month: "2026-03-01T00:00:00.000Z",
      locationId: bursaLoc,
      paidBy: "Ortak Hesap"
    },
    {
      description: "Söz Okuma Ekranı Yapıldı",
      amountWithoutVat: 835,
      vatRate: 0,
      amountWithVat: 835,
      isOfficial: false,
      type: "ONE_TIME",
      month: "2026-03-01T00:00:00.000Z",
      locationId: maviLoc,
      paidBy: "Ortak Hesap"
    }
  ].map(exp => ({ ...exp, id: `exp_${crypto.randomUUID()}` }));

  console.log("Inserting new expenses...");
  const { error: insError } = await supabase.from('Expense').insert(newExpenses);
  if (insError) throw insError;

  console.log("Done!");
}

main().catch(console.error);
