require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_HESAPSUPABASE_URL, process.env.NEXT_PUBLIC_HESAPSUPABASE_ANON_KEY);

async function main() {
  // Izmir March
  console.log("Fixing Izmir March...");
  let res = await supabase.from('MonthlyPerformance').upsert({
    id: 'perf_2026-03_loc_mavibahçe',
    locationId: 'loc_mavibahçe',
    month: '2026-03-01T00:00:00',
    sessionCount: 263,
    extraExpenseAmount: 0,
    extraExpenseNotes: null,
    createdAt: '2026-04-05T20:25:15.755202',
    updatedAt: new Date().toISOString()
  });
  if (!res.error) await supabase.from('MonthlyPerformance').delete().eq('id', 'perf_izmir_2026_03');

  // Bursa March
  console.log("Fixing Bursa March...");
  res = await supabase.from('MonthlyPerformance').upsert({
    id: 'perf_2026-03_loc_bursa_zafer_plaza',
    locationId: 'loc_bursa_zafer_plaza',
    month: '2026-03-01T00:00:00',
    sessionCount: 205,
    extraExpenseAmount: 0,
    extraExpenseNotes: null,
    createdAt: '2026-04-05T20:25:15.755202',
    updatedAt: new Date().toISOString()
  });
  if (!res.error) await supabase.from('MonthlyPerformance').delete().eq('id', 'perf_bursa_2026_03');

  // Bursa April
  console.log("Fixing Bursa April...");
  res = await supabase.from('MonthlyPerformance').upsert({
    id: 'perf_2026-04_loc_bursa_zafer_plaza',
    locationId: 'loc_bursa_zafer_plaza',
    month: '2026-04-01T00:00:00',
    sessionCount: 32,
    extraExpenseAmount: 2400,
    extraExpenseNotes: null,
    updatedAt: new Date().toISOString()
  });
  if (!res.error) await supabase.from('MonthlyPerformance').delete().eq('id', 'perf_bursa_2026_04');

  // Izmir April (Delete duplicate)
  console.log("Fixing Izmir April...");
  await supabase.from('MonthlyPerformance').delete().eq('id', 'perf_izmir_2026_04');

  const { data } = await supabase.from('MonthlyPerformance').select('*');
  console.log("Done! Current DB records:", data.map(d => ({id: d.id, cnt: d.sessionCount, extra: d.extraExpenseAmount})));
}

main();
