// app/api/analytics/route.ts - FIXED VERSION
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Fetching analytics data...')

    // Get overall statistics - FIXED: Use count property, not data.length
    const { count: totalUrlsCount, error: urlsError } = await supabaseServer
      .from('urls')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (urlsError) {
      console.error('Error getting URLs count:', urlsError)
    }

    const { count: totalClicksCount, error: clicksError } = await supabaseServer
      .from('clicks')
      .select('*', { count: 'exact', head: true })

    if (clicksError) {
      console.error('Error getting clicks count:', clicksError)
    }

    console.log('Counts - URLs:', totalUrlsCount, 'Clicks:', totalClicksCount)

    // Get popular URLs
    const { data: popularUrls, error: popularError } = await supabaseServer
      .rpc('get_popular_urls', { limit_param: 5 })

    if (popularError) {
      console.error('Error getting popular URLs:', popularError)
    }

    // Get recent activity (clicks in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentClicks, error: recentError } = await supabaseServer
      .from('clicks')
      .select('clicked_at, country, device_type')
      .gte('clicked_at', sevenDaysAgo.toISOString())
      .order('clicked_at', { ascending: false })

    if (recentError) {
      console.error('Error getting recent clicks:', recentError)
    }

    console.log('Recent clicks data:', recentClicks?.length || 0)

    // Process analytics
    const clicksByDay = (recentClicks || []).reduce((acc: Record<string, number>, click) => {
      const date = new Date(click.clicked_at).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    const clicksByCountry = (recentClicks || []).reduce((acc: Record<string, number>, click) => {
      if (click.country) {
        acc[click.country] = (acc[click.country] || 0) + 1
      }
      return acc
    }, {})

    const clicksByDevice = (recentClicks || []).reduce((acc: Record<string, number>, click) => {
      if (click.device_type) {
        acc[click.device_type] = (acc[click.device_type] || 0) + 1
      }
      return acc
    }, {})

    const analyticsData = {
      overview: {
        totalUrls: totalUrlsCount || 0,  // FIXED: Use count directly
        totalClicks: totalClicksCount || 0,  // FIXED: Use count directly
        recentClicks: recentClicks?.length || 0,
      },
      popularUrls: popularUrls || [],
      analytics: {
        clicksByDay,
        clicksByCountry,
        clicksByDevice,
      }
    }

    // console.log('Final analytics data:', analyticsData)

    return NextResponse.json({
      success: true,
      data: analyticsData
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics'
    }, { status: 500 })
  }
}