// app/api/analytics/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET() {
  try {
    // Get overall statistics
    const { data: totalUrls } = await supabaseServer
      .from('urls')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    const { data: totalClicks } = await supabaseServer
      .from('clicks')
      .select('id', { count: 'exact', head: true })

    // Get popular URLs
    const { data: popularUrls } = await supabaseServer
      .rpc('get_popular_urls', { limit_param: 5 })

    // Get recent activity (clicks in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentClicks } = await supabaseServer
      .from('clicks')
      .select('clicked_at, country, device_type')
      .gte('clicked_at', sevenDaysAgo.toISOString())
      .order('clicked_at', { ascending: false })

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

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUrls: totalUrls?.length || 0,
          totalClicks: totalClicks?.length || 0,
          recentClicks: recentClicks?.length || 0,
        },
        popularUrls: popularUrls || [],
        analytics: {
          clicksByDay,
          clicksByCountry,
          clicksByDevice,
        }
      }
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics'
    }, { status: 500 })
  }
}