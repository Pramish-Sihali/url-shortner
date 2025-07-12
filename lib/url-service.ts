// lib/url-service.ts
import { nanoid } from 'nanoid'
import { supabaseServer } from './supabase'
import { cache } from './cache'

export class UrlService {
  private static readonly SHORT_CODE_LENGTH = 7
  private static readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  static async createShortUrl(data: {
    originalUrl: string
    customAlias?: string
    expiresAt?: Date
  }) {
    const { originalUrl, customAlias, expiresAt } = data

    // Validate URL
    try {
      new URL(originalUrl)
    } catch {
      throw new Error('Invalid URL format')
    }

    // Generate short code
    const shortCode = customAlias || this.generateShortCode()

    // Check if short code or alias already exists
    const { data: existing } = await supabaseServer
      .from('urls')
      .select('id')
      .or(`short_code.eq.${shortCode},custom_alias.eq.${shortCode}`)
      .single()

    if (existing) {
      throw new Error(customAlias ? 'Custom alias already exists' : 'Short code collision')
    }

    // Get page title
    const title = await this.fetchPageTitle(originalUrl)

    // Create URL record
    const { data: url, error } = await supabaseServer
      .from('urls')
      .insert({
        original_url: originalUrl,
        short_code: shortCode,
        custom_alias: customAlias,
        title,
        expires_at: expiresAt?.toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Cache the URL for fast lookups
    cache.set(`url:${shortCode}`, originalUrl, this.CACHE_TTL)

    return url
  }

  static async getOriginalUrl(shortCode: string): Promise<string | null> {
    // Try cache first
    const cached = cache.get<string>(`url:${shortCode}`)
    if (cached) return cached

    // Query database
    const { data: url } = await supabaseServer
      .from('urls')
      .select('original_url, expires_at')
      .eq('short_code', shortCode)
      .eq('is_active', true)
      .single()

    if (!url) return null

    // Check if expired
    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      return null
    }

    // Cache for future requests
    cache.set(`url:${shortCode}`, url.original_url, this.CACHE_TTL)

    return url.original_url
  }

  static async getUrlStats(shortCode: string) {
    const { data: url } = await supabaseServer
      .from('urls')
      .select(`
        id,
        original_url,
        short_code,
        custom_alias,
        title,
        click_count,
        last_clicked,
        created_at
      `)
      .eq('short_code', shortCode)
      .single()

    if (!url) return null

    // Get recent clicks for analytics
    const { data: recentClicks } = await supabaseServer
      .from('clicks')
      .select('country, device_type, clicked_at')
      .eq('url_id', url.id)
      .order('clicked_at', { ascending: false })
      .limit(100)

    return {
      ...url,
      recentClicks: recentClicks || []
    }
  }

  static async getAllUrls() {
    const { data: urls } = await supabaseServer
      .from('urls')
      .select(`
        id,
        original_url,
        short_code,
        custom_alias,
        title,
        click_count,
        last_clicked,
        created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50)

    return urls || []
  }

  private static generateShortCode(): string {
    return nanoid(this.SHORT_CODE_LENGTH)
  }

  private static async fetchPageTitle(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'URL Shortener Bot' },
        signal: AbortSignal.timeout(5000)
      })
      
      if (!response.ok) return null
      
      const html = await response.text()
      const titleMatch = html.match(/<title>(.*?)<\/title>/i)
      
      return titleMatch?.[1]?.trim() || null
    } catch {
      return null
    }
  }
}