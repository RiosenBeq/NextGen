require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_HESAPSUPABASE_URL, process.env.NEXT_PUBLIC_HESAPSUPABASE_ANON_KEY);

async function main() {
  await supabase.from('MonthlyPerformance').update({ extraExpenseAmount: 0 }).eq('id', 'perf_2026-04_loc_mavibahçe');
  await supabase.from('MonthlyPerformance').update({ extraExpenseAmount: 0 }).eq('id', 'perf_2026-04_loc_bursa_zafer_plaza');
  console.log("Zeroed out extraExpenseAmount for April performances.");
}
main();
