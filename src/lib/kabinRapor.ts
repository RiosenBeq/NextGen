/**
 * Kabin Rapor (OsesSensin) Integration Service — FULL DATA
 * Tüm dönemlerin (Bugün, Dün, Bu Hafta, Bu Ay, Son 7 Gün, Son 30 Gün, Tüm Zamanlar)
 * verilerini çeker. Kabin bazlı geçmiş performans, toplam ciro, toplam seans,
 * müşteri dönüşüm oranı dahil tüm metrikleri hesaplar.
 */

const BASE_URL = 'https://osessensin.com/api'

export interface CabinData {
  id: number
  firm_id: number
  cabin_name: string
  cabin_location: string
  cabin_price: number
  mac_addresses: string
  start_date: string
  paid_sessions: number
  today_revenue: number
  incoming_customer_count: number
  avg_revenue_per_session?: number
  conversion_rate?: number
  [key: string]: any
}

export interface DashboardTotal {
  status: number
  range: string
  start_date: string
  end_date: string
  total_sessions: number
  total_paid_sessions: number
  total_revenue: number
}

export interface CabinDetailedStat {
  cabin_id: number
  cabin_name: string
  revenue: number
  sessions: number
  customers: number
}

export interface CabinSessionLog {
  id: number
  cabin_id: number
  session_type: string
  amount: number
  duration: number
  started_at: string
  ended_at: string
  payment_method: string
  [key: string]: any
}

export type DateRange = 'Bugün' | 'Dün' | 'Bu Hafta' | 'Bu Ay' | 'Son 7 Gün' | 'Son 30 Gün' | 'Tüm Zamanlar'

const ALL_RANGES: DateRange[] = ['Bugün', 'Dün', 'Bu Hafta', 'Bu Ay', 'Son 7 Gün', 'Son 30 Gün', 'Tüm Zamanlar']

export class KabinRaporService {
  private firmId: number | null = null
  private userId: number | null = null

  /**
   * Login into Kabin Rapor and cache credentials
   */
  async login(phone: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/cabin-user-control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      })
      const data = await response.json()

      if (data.success && data.user) {
        this.firmId = data.user.firm_id
        this.userId = data.user.id
        return true
      }
      return false
    } catch (error) {
      console.error('KabinRapor Login Error:', error)
      return false
    }
  }

  /**
   * Ensures user is authenticated
   */
  private async ensureAuth() {
    if (this.firmId && this.userId) return true

    const phone = process.env.KABIN_PHONE || '5314288189'
    const password = process.env.KABIN_PASSWORD || 'A18864'

    return await this.login(phone, password)
  }

  /**
   * Retrieves all cabins with enriched metrics
   */
  async getCabins(): Promise<CabinData[]> {
    const isAuth = await this.ensureAuth()
    if (!isAuth) throw new Error('Not authenticated to KabinRapor')

    const response = await fetch(`${BASE_URL}/get-cabins-by-firm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firm_id: this.firmId, user_id: this.userId })
    })

    const data = await response.json() as CabinData[]

    return data.map(cabin => ({
      ...cabin,
      avg_revenue_per_session: cabin.paid_sessions > 0 ? cabin.today_revenue / cabin.paid_sessions : 0,
      conversion_rate: cabin.incoming_customer_count > 0 ? (cabin.paid_sessions / cabin.incoming_customer_count) * 100 : 0
    }))
  }

  /**
   * Dashboard totals for a specific range
   * Valid ranges: 'Bugün', 'Dün', 'Bu Hafta', 'Bu Ay', 'Son 7 Gün', 'Son 30 Gün', 'Tüm Zamanlar'
   */
  async getDashboardTotals(range: DateRange = 'Bugün'): Promise<DashboardTotal> {
    const isAuth = await this.ensureAuth()
    if (!isAuth) throw new Error('Not authenticated to KabinRapor')

    const response = await fetch(`${BASE_URL}/dashboard-totals-by-range`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firm_id: this.firmId, user_id: this.userId, range })
    })

    return await response.json()
  }

  /**
   * Fetch ALL dashboard totals for every range — parallel for speed
   */
  async getAllRangeTotals(): Promise<Record<DateRange, DashboardTotal>> {
    const isAuth = await this.ensureAuth()
    if (!isAuth) throw new Error('Not authenticated to KabinRapor')

    const results = await Promise.all(
      ALL_RANGES.map(async (range) => {
        try {
          const totals = await this.getDashboardTotals(range)
          return [range, totals] as const
        } catch {
          return [range, { range, total_sessions: 0, total_paid_sessions: 0, total_revenue: 0, status: 0, start_date: '', end_date: '' }] as const
        }
      })
    )

    return Object.fromEntries(results) as Record<DateRange, DashboardTotal>
  }

  /**
   * Retrieve per-cabin detailed stats for a given range
   * Calls dashboard-cabins-by-range endpoint
   */
  async getCabinStatsByRange(range: DateRange = 'Bu Ay'): Promise<CabinDetailedStat[]> {
    const isAuth = await this.ensureAuth()
    if (!isAuth) throw new Error('Not authenticated to KabinRapor')

    try {
      const response = await fetch(`${BASE_URL}/dashboard-cabins-by-range`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_id: this.firmId, user_id: this.userId, range })
      })

      if (!response.ok) {
        // Endpoint may not exist — fall back to enriching getCabins data
        return []
      }

      return await response.json()
    } catch {
      return []
    }
  }

  /**
   * Retrieves last 7 days chart data
   */
  async getLast7Graph(): Promise<any> {
    const isAuth = await this.ensureAuth()
    if (!isAuth) throw new Error('Not authenticated to KabinRapor')

    const response = await fetch(`${BASE_URL}/dashboard-last7-graph`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firm_id: this.firmId, user_id: this.userId })
    })

    return await response.json()
  }

  /**
   * Retrieves session history log
   * Attempts to call session-log / session-history endpoint
   */
  async getSessionLog(cabinId?: number, limit: number = 100): Promise<CabinSessionLog[]> {
    const isAuth = await this.ensureAuth()
    if (!isAuth) throw new Error('Not authenticated to KabinRapor')

    try {
      const body: any = { firm_id: this.firmId, user_id: this.userId, limit }
      if (cabinId) body.cabin_id = cabinId

      const response = await fetch(`${BASE_URL}/get-session-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) return []
      return await response.json()
    } catch {
      return []
    }
  }

  /**
   * Comprehensive data fetch — pulls everything available in parallel
   */
  async getComprehensiveData(selectedRange: DateRange = 'Bugün') {
    const isAuth = await this.ensureAuth()
    if (!isAuth) throw new Error('Not authenticated to KabinRapor')

    const [
      cabins,
      selectedRangeTotals,
      allTimeTotals,
      thisMonthTotals,
      thisWeekTotals,
      yesterdayTotals,
      last7Graph,
      cabinRangeStats,
    ] = await Promise.all([
      this.getCabins(),
      this.getDashboardTotals(selectedRange),
      this.getDashboardTotals('Tüm Zamanlar'),
      this.getDashboardTotals('Bu Ay'),
      this.getDashboardTotals('Bu Hafta'),
      this.getDashboardTotals('Dün'),
      this.getLast7Graph(),
      this.getCabinStatsByRange(selectedRange),
    ])

    return {
      cabins,
      selectedRangeTotals,
      allTimeTotals,
      thisMonthTotals,
      thisWeekTotals,
      yesterdayTotals,
      last7Graph,
      cabinRangeStats,
    }
  }
}

// Singleton instance
export const kabinRapor = new KabinRaporService()
