import { kabinRapor } from '../src/lib/kabinRapor.ts';

async function testRanges() {
  const ranges = ['Bugün', 'Dün', 'Bu Hafta', 'Bu Ay', 'Son 7 Gün', 'Son 30 Gün', 'Tüm Zamanlar'];
  
  console.log('Testing KabinRapor API Ranges...');
  
  for (const range of ranges) {
    try {
      const totals = await kabinRapor.getDashboardTotals(range);
      console.log(`Range: [${range}] -> Revenue: ${totals.total_revenue}, Sessions: ${totals.total_paid_sessions}`);
    } catch (e) {
      console.error(`Error fetching range [${range}]:`, e);
    }
  }
}

testRanges();
