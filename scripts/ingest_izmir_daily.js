const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://crbxcvmwmutrjydjdtla.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyYnhjdm13bXV0cmp5ZGpkdGxhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI0MTg5OCwiZXhwIjoyMDkwODE3ODk4fQ.H57Q3EOz6cBKIBRszwENVwroWgFzD3d0g4NylKsh-x4';

const supabase = createClient(supabaseUrl, supabaseKey);

const locationId = 'loc_mavibahçe';

const marchData = [
  { date: '2026-03-31T00:00:00Z', sessions: 3, tests: 0 },
  { date: '2026-03-30T00:00:00Z', sessions: 11, tests: 0 },
  { date: '2026-03-29T00:00:00Z', sessions: 18, tests: 2 },
  { date: '2026-03-28T00:00:00Z', sessions: 39, tests: 2 },
  { date: '2026-03-27T00:00:00Z', sessions: 15, tests: 8 },
  { date: '2026-03-26T00:00:00Z', sessions: 4, tests: 0 },
  { date: '2026-03-25T00:00:00Z', sessions: 8, tests: 0 },
  { date: '2026-03-24T00:00:00Z', sessions: 9, tests: 1 },
  { date: '2026-03-23T00:00:00Z', sessions: 9, tests: 0 },
  { date: '2026-03-22T00:00:00Z', sessions: 17, tests: 0 },
  { date: '2026-03-21T00:00:00Z', sessions: 24, tests: 1 },
  { date: '2026-03-20T00:00:00Z', sessions: 19, tests: 1 },
  { date: '2026-03-19T00:00:00Z', sessions: 24, tests: 0 },
  { date: '2026-03-18T00:00:00Z', sessions: 17, tests: 6 },
  { date: '2026-03-17T00:00:00Z', sessions: 15, tests: 0 },
  { date: '2026-03-16T00:00:00Z', sessions: 19, tests: 1 },
  { date: '2026-03-15T00:00:00Z', sessions: 12, tests: 3 }
];

const aprilData = [
  { date: '2026-04-05T00:00:00Z', sessions: 20, tests: 0 },
  { date: '2026-04-04T00:00:00Z', sessions: 20, tests: 0 },
  { date: '2026-04-03T00:00:00Z', sessions: 16, tests: 0 },
  { date: '2026-04-02T00:00:00Z', sessions: 6, tests: 0 },
  { date: '2026-04-01T00:00:00Z', sessions: 5, tests: 0 }
];

async function main() {
  console.log('Ingesting İzmir daily data...');
  const combined = [...marchData, ...aprilData];
  for (const row of combined) {
    const { error } = await supabase
      .from('DailyPerformance')
      .upsert({
        id: `daily_${locationId}_${row.date.slice(0, 10)}`,
        locationId,
        date: row.date,
        sessionCount: row.sessions,
        testCount: row.tests,
        updatedAt: new Date().toISOString()
      });
    if (error) console.error(`Error for ${row.date}:`, error.message);
    else console.log(`Injected İzmir ${row.date}: ${row.sessions} sessions, ${row.tests} tests.`);
  }
  console.log('Ingestion complete.');
}

main();
