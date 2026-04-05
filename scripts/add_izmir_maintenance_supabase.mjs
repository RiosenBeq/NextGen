import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: locs } = await supabase.from('Location').select('id, name');
  const izmirLoc = locs?.find(l => l.name.includes('Mavibahçe'));

  if (!izmirLoc) {
    throw new Error("İzmir (Mavibahçe) location not found in Supabase");
  }

  const currentMonth = new Date().toISOString(); 

  const expensesToInsert = [
    { description: 'Eren Usta (İzmir) - Bakım İşçiliği 1', amount: 500 },
    { description: 'Eren Usta (İzmir) - Bakım İşçiliği 2', amount: 500 },
    { description: 'Eren Usta (İzmir) - Bakım İşçiliği 3', amount: 500 },
    { description: 'Eren Usta (İzmir) - Bakım İşçiliği 4', amount: 500 },
    { description: 'Eren Usta (İzmir) - Bakım İşçiliği 5 (Ekstra)', amount: 600 },
    { description: 'Murat Usta (İzmir) - Bakım İşçiliği', amount: 500 }
  ];

  for (const exp of expensesToInsert) {
    const { data: inserted, error } = await supabase.from('Expense').insert([{
      id: crypto.randomUUID(),
      locationId: izmirLoc.id,
      description: exp.description,
      type: 'ONE_TIME',
      amountWithoutVat: exp.amount,
      amountWithVat: exp.amount, 
      vatRate: 0,
      isOfficial: false,
      categoryId: 'maintenance',
      paidBy: 'Ortak Hesap',
      month: currentMonth
    }]);

    if (error) {
       console.error(`Error inserting ${exp.description}:`, error.message);
    } else {
       console.log(`Eklendi: ${exp.description} - ${exp.amount} TL`);
    }
  }

  console.log("✅ Başarıyla 6 adet bakım gideri eklendi (Ortak Hesap, KDV %0).");
}

main().catch(console.error);
