const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://crbxcvmwmutrjydjdtla.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyYnhjdm13bXV0cmp5ZGpkdGxhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI0MTg5OCwiZXhwIjoyMDkwODE3ODk4fQ.H57Q3EOz6cBKIBRszwENVwroWgFzD3d0g4NylKsh-x4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Entering manual data for Bursa...');

  const data = [
    {
      id: 'perf_2026-03_loc_bursa_zafer_plaza',
      locationId: 'loc_bursa_zafer_plaza',
      month: '2026-03-01T00:00:00Z',
      sessionCount: 205,
      extraExpenseAmount: 0,
      extraExpenseNotes: 'Manual Entry from Screenshots'
    },
    {
      id: 'perf_2026-04_loc_bursa_zafer_plaza',
      locationId: 'loc_bursa_zafer_plaza',
      month: '2026-04-01T00:00:00Z',
      sessionCount: 28,
      extraExpenseAmount: 0,
      extraExpenseNotes: 'Manual Entry from Screenshots'
    }
  ];

  for (const entry of data) {
    const { data: result, error } = await supabase
      .from('MonthlyPerformance')
      .upsert(entry, { onConflict: 'id' });

    if (error) {
      console.error(`Error for ${entry.id}:`, error.message);
    } else {
      console.log(`Successfully updated ${entry.id} with ${entry.sessionCount} sessions.`);
    }
  }

  console.log('Finished.');
}

main();
