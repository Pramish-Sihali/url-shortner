import { supabaseServer } from './supabase'
import { JobQueue } from './job-queue'
import crypto from 'crypto'

export class AnalyticsService {
  static async recordClick(shortCode: string, request: Request) {
    // Get URL ID
    const { data: url } = await supabaseServer
      .from('urls')
      .select('id')
      .eq('short_code', shortCode)
      .single()

    if (!url) return

    // Extract analytics data
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIP || '127.0.0.1'

    const analyticsData = {
      url_id: url.id,
      ip_address: this.hashIP(ip),
      user_agent: userAgent,
      referer,
      device_type: this.getDeviceType(userAgent),
      browser: this.getBrowser(userAgent),
      os: this.getOS(userAgent),
    }

    // Add to job queue
    await JobQueue.addJob('recordClick', {
      ...analyticsData,
      shortCode,
      originalIP: ip,
    })
  }

  private static hashIP(ip: string): string {
    // Create a proper hash for privacy compliance
    try {
      return crypto
        .createHash('sha256')
        .update(ip + 'url-shortener-salt')
        .digest('hex')
        .substring(0, 32) // Limit length
    } catch {
      // Fallback to simple encoding if crypto fails
      return Buffer.from(ip + 'fallback').toString('base64').substring(0, 32)
    }
  }

  private static getDeviceType(userAgent: string): string {
    const ua = userAgent.toLowerCase()
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile'
    if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet'
    return 'desktop'
  }

  private static getBrowser(userAgent: string): string {
    const ua = userAgent.toLowerCase()
    if (ua.includes('chrome') && !ua.includes('edge')) return 'Chrome'
    if (ua.includes('firefox')) return 'Firefox'
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari'
    if (ua.includes('edge')) return 'Edge'
    if (ua.includes('opera')) return 'Opera'
    return 'Other'
  }

  private static getOS(userAgent: string): string {
    const ua = userAgent.toLowerCase()
    if (ua.includes('windows')) return 'Windows'
    if (ua.includes('mac os') || ua.includes('macos')) return 'macOS'
    if (ua.includes('linux')) return 'Linux'
    if (ua.includes('android')) return 'Android'
    if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS'
    return 'Other'
  }
}