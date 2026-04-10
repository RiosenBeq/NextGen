require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_HESAPSUPABASE_URL, process.env.NEXT_PUBLIC_HESAPSUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('MonthlyPerformance').select('*, location:Location(name)');
  console.log(JSON.stringify(data, null, 2));
}
main();
