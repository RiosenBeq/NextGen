import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { kabinRapor } from '@/lib/kabinRapor'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 1. Fetch live data from original API
    const cabins = await kabinRapor.getCabins()
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    
    // 2. Loop through cabins and update/insert into our Database
    for (const cabin of (cabins || [])) {
      // Upsert Cabin Information
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

      // Upsert Today's Statistics for this Cabin
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

    return NextResponse.json({ 
      success: true, 
      message: 'Kabin data successfully synced.',
      syncedCount: cabins?.length || 0
    })
    
  } catch (error: any) {
    console.error('[SYNC_KABIN] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
