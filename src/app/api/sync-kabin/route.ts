import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { kabinRapor } from '@/lib/kabinRapor'

// Option to use Edge runtime or Node. Using Node due to Prisma requirements.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Fetch live data from original API
    const cabins = await kabinRapor.getCabins()
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    
    // 2. Loop through cabins and update/insert into our Database
    for (const cabin of cabins) {
      // Upsert Cabin Information
      const dbCabin = await prisma.cabin.upsert({
        where: { cabinId: cabin.id },
        update: {
          cabinName: cabin.cabin_name,
          cabinLocation: cabin.cabin_location,
          cabinPrice: cabin.cabin_price,
          macAddresses: cabin.mac_addresses,
          // updatedAt will auto-update
        },
        create: {
          cabinId: cabin.id,
          firmId: cabin.firm_id,
          cabinName: cabin.cabin_name,
          cabinLocation: cabin.cabin_location,
          cabinPrice: cabin.cabin_price,
          startDate: cabin.start_date ? new Date(cabin.start_date) : null,
          macAddresses: cabin.mac_addresses,
        }
      })

      // Upsert Today's Statistics for this Cabin
      await prisma.cabinDailyStat.upsert({
        where: {
          cabinId_date: {
            cabinId: dbCabin.id,
            date: today
          }
        },
        update: {
          todayRevenue: cabin.today_revenue,
          paidSessions: cabin.paid_sessions,
          incomingCustomer: cabin.incoming_customer_count
        },
        create: {
          cabinId: dbCabin.id,
          date: today,
          todayRevenue: cabin.today_revenue,
          paidSessions: cabin.paid_sessions,
          incomingCustomer: cabin.incoming_customer_count
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Kabin data successfully synced.',
      syncedCount: cabins.length 
    })
    
  } catch (error: any) {
    console.error('[SYNC_KABIN] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
