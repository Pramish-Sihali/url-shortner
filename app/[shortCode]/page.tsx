// app/[shortCode]/page.tsx - Redirect handler
import { redirect } from 'next/navigation'
import { UrlService } from '@/lib/url-service'
import { AnalyticsService } from '@/lib/analytics-service'
import { headers } from 'next/headers'

interface RedirectPageProps {
  params: {
    shortCode: string
  }
}

export default async function RedirectPage({ params }: RedirectPageProps) {
  const { shortCode } = params
  
  try {
    // Get original URL
    const originalUrl = await UrlService.getOriginalUrl(shortCode)
    
    if (!originalUrl) {
      // URL not found - redirect to 404 or main page
      redirect('/?error=not-found')
    }

    // Record click analytics asynchronously
    const headersList = await headers() // Fixed: Added await
    const request = {
      headers: {
        get: (name: string) => headersList.get(name)
      }
    } as Request

    // This runs in background
    AnalyticsService.recordClick(shortCode, request).catch(console.error)

    // Redirect to original URL
    redirect(originalUrl)
  } catch (error) {
    console.error('Redirect error:', error)
    redirect('/?error=server-error')
  }
}

// Generate metadata for the redirect page
export async function generateMetadata({ params }: RedirectPageProps) {
  const { shortCode } = params
  
  try {
    const urlStats = await UrlService.getUrlStats(shortCode)
    
    return {
      title: urlStats?.title || 'URL Shortener',
      description: 'Redirecting to your destination...',
    }
  } catch {
    return {
      title: 'URL Shortener',
      description: 'Redirecting...',
    }
  }
}