import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Connecting to Supabase...");
  
  // Note: RPC would be cleaner but we can try to just use the SQL if we had an endpoint.
  // Since we don't have a direct SQL executor via the JS client easily without an RPC,
  // I will check if the 'notes' table has the columns, if not I'll have to ask the user to run it in dashboard
  // OR try the prisma approach one more time with a very specific flag.
  
  console.log("Checking notes table...");
  const { data, error } = await supabase.from('notes').select('*').limit(1);
  
  if (error) {
    console.error("Error checking notes table (it might not exist):", error.message);
  } else {
    console.log("Notes table exists. Current columns:", Object.keys(data[0] || {}));
  }
}

run();
