import { NextRequest, NextResponse } from 'next/server'
import { UrlService } from '@/lib/url-service'

interface RouteParams {
  params: Promise<{
    shortCode: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Await params in Next.js 15+
    const { shortCode } = await params
    
    // Get URL stats/data
    const urlStats = await UrlService.getUrlStats(shortCode)
    
    if (!urlStats) {
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(urlStats)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}