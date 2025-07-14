// app/[shortCode]/page.tsx - Fixed Redirect Handler
import { redirect } from 'next/navigation'
import { UrlService } from '@/lib/url-service'
import { AnalyticsService } from '@/lib/analytics-service'
import { headers } from 'next/headers'

interface RedirectPageProps {
  params: Promise<{
    shortCode: string
  }>
}

// Client-side redirect component
function ClientRedirect({ url }: { url: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting...</h2>
        <p className="text-gray-600 mb-4">Taking you to your destination</p>
        <a 
          href={url} 
          className="text-blue-600 hover:text-blue-800 underline"
          rel="noopener noreferrer"
        >
          Click here if you&lsquo;re not redirected automatically
        </a>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            setTimeout(function() {
              window.location.href = "${url.replace(/"/g, '\\"')}";
            }, 1000);
          `
        }}
      />
    </div>
  )
}

export default async function RedirectPage({ params }: RedirectPageProps) {
  const { shortCode } = await params
  
  try {
    console.log('Attempting to redirect short code:', shortCode)
    
    // Get original URL
    const originalUrl = await UrlService.getOriginalUrl(shortCode)
    
    console.log('Found original URL:', originalUrl)
    
    if (!originalUrl) {
      console.log('URL not found for short code:', shortCode)
      // URL not found - redirect to 404 or main page
      redirect('/?error=not-found')
    }

    // Record click analytics asynchronously
    try {
      const headersList = await headers()
      const request = {
        headers: {
          get: (name: string) => headersList.get(name)
        }
      } as Request

      // This runs in background
      AnalyticsService.recordClick(shortCode, request).catch(console.error)
    } catch (analyticsError) {
      console.error('Analytics error:', analyticsError)
      // Don't fail the redirect if analytics fails
    }

    // For external URLs, use client-side redirect
    if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
      return <ClientRedirect url={originalUrl} />
    } else {
      // For relative URLs, use Next.js redirect
      redirect(originalUrl)
    }
  } catch (error) {
    console.error('Redirect error:', error)
    redirect('/?error=server-error')
  }
}

// Generate metadata for the redirect page
export async function generateMetadata({ params }: RedirectPageProps) {
  const { shortCode } = await params
  
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