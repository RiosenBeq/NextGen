import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { kabinRapor } from '@/lib/kabinRapor'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 1. Fetch live data — all ranges in parallel
    const [cabins, todayTotals, thisMonthTotals, allTimeTotals] = await Promise.all([
      kabinRapor.getCabins(),
      kabinRapor.getDashboardTotals('Bugün'),
      kabinRapor.getDashboardTotals('Bu Ay'),
      kabinRapor.getDashboardTotals('Tüm Zamanlar'),
    ])

    const today = new Date().toISOString().split('T')[0]
    
    // 2. Loop through cabins and upsert
    for (const cabin of (cabins || [])) {
      const { data: dbCabin, error: cabinError } = await supabase
        .from('Cabin')
        .upsert({
          cabinId: cabin.id,
          firmId: cabin.firm_id,
          cabinName: cabin.cabin_name,
          cabinLocation: cabin.cabin_location,
          cabinPrice: cabin.cabin_price,
          macAddresses: cabin.mac_addresses,
          startDate: cabin.start_date ? new Date(cabin.start_date).toISOString() : null,
          updatedAt: new Date().toISOString(),
        }, { onConflict: 'cabinId' })
        .select()
        .single();

      if (cabinError) {
        console.error(`Error upserting cabin ${cabin.id}:`, cabinError);
        continue;
      }

      // Daily stats upsert
      const { error: statError } = await supabase
        .from('CabinDailyStat')
        .upsert({
          cabinId: dbCabin.id,
          date: today,
          todayRevenue: cabin.today_revenue,
          paidSessions: cabin.paid_sessions,
          incomingCustomer: cabin.incoming_customer_count,
          avgRevenuePerSession: cabin.avg_revenue_per_session || 0,
          conversionRate: cabin.conversion_rate || 0,
          updatedAt: new Date().toISOString(),
        }, { onConflict: 'cabinId,date' });

      if (statError) {
        console.error(`Error upserting stats for cabin ${cabin.id}:`, statError);
      }
    }

    // 3. Store aggregate totals
    const aggregatePayload = {
      date: today,
      todayRevenue: todayTotals?.total_revenue || 0,
      todaySessions: todayTotals?.total_paid_sessions || 0,
      monthRevenue: thisMonthTotals?.total_revenue || 0,
      monthSessions: thisMonthTotals?.total_paid_sessions || 0,
      allTimeRevenue: allTimeTotals?.total_revenue || 0,
      allTimeSessions: allTimeTotals?.total_paid_sessions || 0,
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Kabin data successfully synced.',
      syncedCount: cabins?.length || 0,
      aggregates: aggregatePayload,
    })
    
  } catch (error: any) {
    console.error('[SYNC_KABIN] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
