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

export type DateRange = 'Bugün' | 'Dün' | 'Bu Hafta' | 'Bu Ay' | 'Son 7 Gün' | 'Son 30 Gün' | 'Bu Yıl' | 'Tüm Zamanlar'

const ALL_RANGES: DateRange[] = ['Bugün', 'Dün', 'Bu Hafta', 'Bu Ay', 'Son 7 Gün', 'Son 30 Gün', 'Bu Yıl', 'Tüm Zamanlar']

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 8000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

export class KabinRaporService {
  private firmId: number | null = null
  private userId: number | null = null

  /**
   * Login into Kabin Rapor and cache credentials
   */
  async login(phone: string, password: string): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/cabin-user-control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      }, 5000)
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

    try {
      const response = await fetchWithTimeout(`${BASE_URL}/get-cabins-by-firm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_id: this.firmId, user_id: this.userId })
      })
      
      if (!response.ok) return []

      const data = await response.json() as CabinData[]

      return data.map(cabin => ({
        ...cabin,
        avg_revenue_per_session: cabin.paid_sessions > 0 ? cabin.today_revenue / cabin.paid_sessions : 0,
        conversion_rate: cabin.incoming_customer_count > 0 ? (cabin.paid_sessions / cabin.incoming_customer_count) * 100 : 0
      }))
    } catch (e) {
      console.error('getCabins timeout/error:', e)
      return []
    }
  }

  /**
   * Dashboard totals for a specific range
   * Valid ranges: 'Bugün', 'Dün', 'Bu Hafta', 'Bu Ay', 'Son 7 Gün', 'Son 30 Gün', 'Tüm Zamanlar'
   */
  async getDashboardTotals(range: DateRange = 'Bugün'): Promise<DashboardTotal> {
    const isAuth = await this.ensureAuth()
    if (!isAuth) throw new Error('Not authenticated to KabinRapor')

    const fetchRange = async (r: string) => {
      try {
        const response = await fetchWithTimeout(`${BASE_URL}/dashboard-totals-by-range`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firm_id: this.firmId, user_id: this.userId, range: r })
        })
        if (!response.ok) return null
        return await response.json()
      } catch {
        return null
      }
    }

    let normalizedRange = range.trim();
    if (normalizedRange === 'Tüm Zamanlar') {
      normalizedRange = 'Bu Yıl';
    }

    let result = await fetchRange(normalizedRange)

    // CUSTOM RANGE HANDLING: If range is "YYYY-MM", attempt to fetch or map to "Bu Ay" synonyms
    const isMonthString = /^\d{4}-\d{2}$/.test(normalizedRange);
    if (isMonthString) {
      const currentMonthId = new Date().toISOString().slice(0, 7);
      if (normalizedRange === currentMonthId) {
        result = await fetchRange('Bu Ay');
      } else {
        // For past months, we try to pass the string directly as it might be supported by the API 
        // Or we fallback to the cached data if it were to exist (though here we fetch fresh)
        result = await fetchRange(normalizedRange);
      }
    }

    // FALLBACK LOGIC: If range fetch fails or is 0, try synonyms or larger ranges
    if (!result || result.total_revenue === 0) {
      if (normalizedRange === 'Bu Hafta') {
        result = await fetchRange('Son 7 Gün')
      } else if (normalizedRange === 'Tüm Zamanlar') {
        result = await fetchRange('Bu Yıl') || await fetchRange('Son 365 Gün')
      } else if (normalizedRange === 'Son 30 Gün') {
        result = await fetchRange('Bu Ay')
      } else if (normalizedRange === 'Bu Yıl') {
        result = await fetchRange('Son 365 Gün') || await fetchRange('2026') || await fetchRange('Bu Sene')
      }
    }

    return result || { range, total_sessions: 0, total_paid_sessions: 0, total_revenue: 0, status: 0, start_date: '', end_date: '' }
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
      const response = await fetchWithTimeout(`${BASE_URL}/dashboard-cabins-by-range`, {
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

    try {
      const response = await fetchWithTimeout(`${BASE_URL}/dashboard-last7-graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_id: this.firmId, user_id: this.userId })
      })
      if (!response.ok) return []
      return await response.json()
    } catch {
      return []
    }
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

      const response = await fetchWithTimeout(`${BASE_URL}/get-session-logs`, {
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
   * Retrieves dashboard totals with city-based separation (Bursa vs Izmir)
   * If range is 'Tüm Zamanlar', it defaults to 'Bu Yıl' as per request.
   */
  async getCitySplittedData(range: DateRange = 'Bugün') {
    const isAuth = await this.ensureAuth()
    if (!isAuth) throw new Error('Not authenticated to KabinRapor')

    // Override: "Tüm Zamanlar" means "Bu Yıl" as requested by user
    const effectiveRange = range === 'Tüm Zamanlar' ? 'Bu Yıl' : range;

    try {
      const cabins = await this.getCabins();
      const cabinStats = await this.getCabinStatsByRange(effectiveRange as DateRange);

      const split = {
        Bursa: { revenue: 0, sessions: 0, count: 0 },
        İzmir: { revenue: 0, sessions: 0, count: 0 },
        Diğer: { revenue: 0, sessions: 0, count: 0 }
      };

      // Helper to map location to city
      const mapCity = (loc: string) => {
        if (loc.toLowerCase().includes('zafer')) return 'Bursa';
        if (loc.toLowerCase().includes('mavi')) return 'İzmir';
        return 'Diğer';
      };

      // Enrich split with cabin stats
      cabinStats.forEach(stat => {
        const cabin = cabins.find(c => c.id === stat.cabin_id || c.cabin_name === stat.cabin_name);
        const city = cabin ? mapCity(cabin.cabin_location) : 'Diğer';
        
        split[city].revenue += stat.revenue;
        split[city].sessions += stat.sessions;
        split[city].count += 1;
      });

      // If cabinStats empty, try to at least group cabins by location
      if (cabinStats.length === 0) {
        cabins.forEach(c => {
          const city = mapCity(c.cabin_location);
          split[city].revenue += c.today_revenue;
          split[city].sessions += c.paid_sessions;
          split[city].count += 1;
        });
      }

      return {
        range: effectiveRange,
        cities: split,
        total_revenue: Object.values(split).reduce((acc, c) => acc + c.revenue, 0),
        total_sessions: Object.values(split).reduce((acc, c) => acc + c.sessions, 0)
      };
    } catch (e) {
      console.error('getCitySplittedData error:', e);
      return null;
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
      citySplit
    ] = await Promise.all([
      this.getCabins(),
      this.getDashboardTotals(selectedRange),
      this.getDashboardTotals('Tüm Zamanlar'),
      this.getDashboardTotals('Bu Ay'),
      this.getDashboardTotals('Bu Hafta'),
      this.getDashboardTotals('Dün'),
      this.getLast7Graph(),
      this.getCabinStatsByRange(selectedRange),
      this.getCitySplittedData(selectedRange)
    ])

    return {
      cabins,
      selectedRangeTotals,
      allTimeTotals, // Note: getDashboardTotals already has fallback/override logic
      thisMonthTotals,
      thisWeekTotals,
      yesterdayTotals,
      last7Graph,
      cabinRangeStats,
      citySplit
    }
  }
}

// Singleton instance
export const kabinRapor = new KabinRaporService()
