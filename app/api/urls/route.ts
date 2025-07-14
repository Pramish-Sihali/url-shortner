// app/api/urls/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { UrlService } from '@/lib/url-service'
import { getBaseUrl } from '@/lib/url-helper'

export async function GET(request: NextRequest) {
  try {
    const urls = await UrlService.getAllUrls()
    
    const baseUrl = getBaseUrl(request)
    
    const formattedUrls = urls.map(url => ({
      id: url.id,
      originalUrl: url.original_url,
      shortCode: url.short_code,
      shortUrl: `${baseUrl}/${url.short_code}`,
      customAlias: url.custom_alias,
      title: url.title,
      clickCount: url.click_count,
      lastClicked: url.last_clicked,
      createdAt: url.created_at,
    }))

    return NextResponse.json({
      success: true,
      data: formattedUrls
    })
  } catch (error) {
    console.error('Error fetching URLs:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch URLs'
    }, { status: 500 })
  }
}