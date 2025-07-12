import { nanoid } from 'nanoid'
import { supabaseServer } from './supabase'
import { cache } from './cache'

interface Job {
  id: string
  type: string
  data: any
  createdAt: Date
  attempts: number
}

class JobQueueManager {
  private queue: Job[] = []
  private processing = false
  private readonly MAX_ATTEMPTS = 3
  private readonly RETRY_DELAY = 1000

  async addJob(type: string, data: any): Promise<void> {
    const job: Job = {
      id: nanoid(),
      type,
      data,
      createdAt: new Date(),
      attempts: 0,
    }

    this.queue.push(job)
    this.processQueue()
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    while (this.queue.length > 0) {
      const job = this.queue.shift()!
      await this.processJob(job)
    }

    this.processing = false
  }

  private async processJob(job: Job): Promise<void> {
    try {
      job.attempts++

      switch (job.type) {
        case 'recordClick':
          await this.handleRecordClick(job.data)
          break
        default:
          console.error(`Unknown job type: ${job.type}`)
      }
    } catch (error) {
      console.error(`Job failed (attempt ${job.attempts}):`, error)

      if (job.attempts < this.MAX_ATTEMPTS) {
        // Retry with delay
        setTimeout(() => {
          this.queue.unshift(job)
          this.processQueue()
        }, this.RETRY_DELAY * job.attempts)
      } else {
        console.error(`Job ${job.id} failed permanently after ${this.MAX_ATTEMPTS} attempts`)
      }
    }
  }

  private async handleRecordClick(data: any): Promise<void> {
    try {
      // Get geolocation data if IP info token is available
      let country, city
      if (data.originalIP && process.env.IPINFO_TOKEN && data.originalIP !== '127.0.0.1') {
        try {
          const geoResponse = await fetch(
            `https://ipinfo.io/${data.originalIP}?token=${process.env.IPINFO_TOKEN}`,
            { signal: AbortSignal.timeout(5000) }
          )
          
          if (geoResponse.ok) {
            const geoData = await geoResponse.json()
            country = geoData.country
            city = geoData.city
          }
        } catch (geoError) {
          // Ignore geolocation errors - not critical
          console.warn('Geolocation lookup failed:', geoError)
        }
      }

      // Record click in database
      const { error: clickError } = await supabaseServer
        .from('clicks')
        .insert({
          url_id: data.url_id,
          ip_address: data.ip_address, // This is now properly hashed
          user_agent: data.user_agent,
          referer: data.referer,
          country,
          city,
          device_type: data.device_type,
          browser: data.browser,
          os: data.os,
        })

      if (clickError) {
        console.error('Database click insert error:', clickError)
        throw clickError
      }

      // Increment click count
      const { error: countError } = await supabaseServer
        .rpc('increment_click_count', { short_code_param: data.shortCode })

      if (countError) {
        console.error('Click count increment error:', countError)
        throw countError
      }

      // Clear cache for this URL
      cache.delete(`url:${data.shortCode}`)

      console.log(`Successfully recorded click for ${data.shortCode}`)
    } catch (error) {
      console.error('Failed to record click:', error)
      throw error
    }
  }
}

export const JobQueue = new JobQueueManager()