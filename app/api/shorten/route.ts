// app/api/shorten/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { UrlService } from '@/lib/url-service'
import { getBaseUrl } from '@/lib/url-helper'
import { z } from 'zod'

const createUrlSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  customAlias: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Custom alias can only contain letters, numbers, hyphens, and underscores').optional(),
  expiresAt: z.string().datetime().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, customAlias, expiresAt } = createUrlSchema.parse(body)

    const shortUrl = await UrlService.createShortUrl({
      originalUrl: url,
      customAlias,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    })

    const baseUrl = getBaseUrl(request)
    const shortLink = `${baseUrl}/${shortUrl.short_code}`

    return NextResponse.json({
      success: true,
      data: {
        id: shortUrl.id,
        originalUrl: shortUrl.original_url,
        shortCode: shortUrl.short_code,
        shortUrl: shortLink,
        customAlias: shortUrl.custom_alias,
        title: shortUrl.title,
        createdAt: shortUrl.created_at,
      }
    })
  } catch (error) {
    console.error('Error creating short URL:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create short URL'
    }, { status: 500 })
  }
}