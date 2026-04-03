/**
 * Kabin Rapor (OsesSensin) Integration Service
 * Müşterinin verdiği kullanıcı adı ve şifre ile giriş yaparak session bilgisini alır,
 * sonrasında kabin güncel verilerini çeker.
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

export class KabinRaporService {
  private firmId: number | null = null
  private userId: number | null = null

  /**
   * Login into Kabin Rapor and cache credentials
   */
  async login(phone: string, password: string):Promise<boolean> {
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
   * Ensures user is authenticated. If credentials are provided and we're not logged in, it logs in.
   */
  private async ensureAuth() {
    if (this.firmId && this.userId) return true
    
    // Fallback to environment variables if available
    const phone = process.env.KABIN_PHONE || '5314288189'
    const password = process.env.KABIN_PASSWORD || 'A18864'
    
    return await this.login(phone, password)
  }

  /**
   * Retrieves all cabins for the firm
   */
  async getCabins(): Promise<CabinData[]> {
    const isAuth = await this.ensureAuth()
    if (!isAuth) throw new Error('Not authenticated to KabinRapor')

    const response = await fetch(`${BASE_URL}/get-cabins-by-firm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firm_id: this.firmId, user_id: this.userId })
    })
    
    return await response.json()
  }

  /**
   * Retrieves dashboard totals (for Today, default)
   */
  async getDashboardTotals(range: string = 'Bugün'): Promise<DashboardTotal> {
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
   * Retrieves last 7 days chart data
   */
  async getLast7Graph() {
    const isAuth = await this.ensureAuth()
    if (!isAuth) throw new Error('Not authenticated to KabinRapor')

    const response = await fetch(`${BASE_URL}/dashboard-last7-graph`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firm_id: this.firmId, user_id: this.userId })
    })
    
    return await response.json()
  }
}

// Ensure single instance across API calls
export const kabinRapor = new KabinRaporService()
