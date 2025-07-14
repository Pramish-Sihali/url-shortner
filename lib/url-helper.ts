// lib/url-helper.ts
import { NextRequest } from 'next/server'

export function getBaseUrl(request?: NextRequest): string {
  // First try environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // If no request provided, fall back to localhost
  if (!request) {
    return 'http://localhost:3000'
  }

  // Get host from request headers
  const host = request.headers.get('host')
  if (!host) {
    return 'http://localhost:3000'
  }

  // Determine protocol
  const protocol = request.headers.get('x-forwarded-proto') || 
                  (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https')

  return `${protocol}://${host}`
}