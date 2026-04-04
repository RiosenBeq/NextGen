import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { kabinRapor } from '@/lib/kabinRapor'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 1. Fetch live data & current locations
    const [cabins, todayTotals, thisMonthTotals, allTimeTotals, { data: locations }] = await Promise.all([
      kabinRapor.getCabins(),
      kabinRapor.getDashboardTotals('Bugün'),
      kabinRapor.getDashboardTotals('Bu Ay'),
      kabinRapor.getDashboardTotals('Tüm Zamanlar'),
      supabase.from('Location').select('id, name').eq('isActive', true)
    ])

    const today = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01T00:00:00.000Z'
    
    // Helper to map cabin location string to DB location ID
    const mapToLocationId = (cabinLoc: string) => {
      const loc = (locations || []).find(l => 
        cabinLoc.toLowerCase().includes(l.name.toLowerCase()) || 
        l.name.toLowerCase().includes(cabinLoc.toLowerCase()) ||
        (cabinLoc.toLowerCase().includes('zafer') && l.name.toLowerCase().includes('zafer')) ||
        (cabinLoc.toLowerCase().includes('mavi') && l.name.toLowerCase().includes('mavi'))
      )
      return loc?.id || null
    }

    // 2. Loop through cabins and upsert with location mapping
    for (const cabin of (cabins || [])) {
      const locationId = mapToLocationId(cabin.cabin_location)

      const { data: dbCabin, error: cabinError } = await supabase
        .from('Cabin')
        .upsert({
          cabinId: cabin.id,
          firmId: cabin.firm_id,
          cabinName: cabin.cabin_name,
          cabinLocation: cabin.cabin_location,
          locationId: locationId, // New Linked Field
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
          updatedAt: new Date().toISOString(),
        }, { onConflict: 'cabinId,date' });

      if (statError) {
        console.error(`Error upserting stats for cabin ${cabin.id}:`, statError);
      }
    }

    // 3. Update MonthlyPerformance for each location automatically
    // We fetch per-cabin stats for the whole month to be precise
    const monthStats = await kabinRapor.getCabinStatsByRange('Bu Ay')
    
    if (monthStats && monthStats.length > 0) {
      const locationSessionSum: Record<string, number> = {}
      
      for (const stat of monthStats) {
        const cabin = cabins?.find(c => c.id === stat.cabin_id || c.cabin_name === stat.cabin_name)
        if (!cabin) continue
        
        const locId = mapToLocationId(cabin.cabin_location)
        if (locId) {
          locationSessionSum[locId] = (locationSessionSum[locId] || 0) + stat.sessions
        }
      }

      // Upsert into MonthlyPerformance
      for (const [locId, sessions] of Object.entries(locationSessionSum)) {
        await supabase
          .from('MonthlyPerformance')
          .upsert({
            locationId: locId,
            month: currentMonth,
            sessionCount: sessions,
            lastSyncAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, { onConflict: 'locationId,month' }) 
          // Note: ensure there is a unique constraint on locationId, month in DB if using upsert this way
          // If not, we might need to find then update/insert
      }
    }

    // 4. Return aggregate summary
    const aggregatePayload = {
      date: today,
      todayRevenue: todayTotals?.total_revenue || 0,
      todaySessions: todayTotals?.total_paid_sessions || 0,
      monthRevenue: thisMonthTotals?.total_revenue || 0,
      monthSessions: thisMonthTotals?.total_paid_sessions || 0,
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Kabin data successfully synced and linked to locations.',
      syncedCount: cabins?.length || 0,
      aggregates: aggregatePayload,
    })
    
  } catch (error: any) {
    console.error('[SYNC_KABIN] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
