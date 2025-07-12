"use client" ; 

import React, { useState, useEffect } from 'react';
import { Copy, ExternalLink, BarChart3, Link2, Zap, Shield, Globe, Plus, Calendar, MousePointer } from 'lucide-react';

// TypeScript interfaces
interface UrlItem {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  customAlias?: string;
  title?: string;
  clickCount: number;
  lastClicked?: string;
  createdAt: string;
}

interface AnalyticsOverview {
  totalUrls: number;
  totalClicks: number;
  recentClicks: number;
}

interface PopularUrl {
  short_code: string;
  original_url: string;
  click_count: number;
  created_at: string;
}

interface AnalyticsData {
  overview: AnalyticsOverview;
  popularUrls: PopularUrl[];
  analytics: {
    clicksByDay: Record<string, number>;
    clicksByCountry: Record<string, number>;
    clicksByDevice: Record<string, number>;
  };
}

// Main URL Shortener Component
export default function UrlShortener() {
  const [url, setUrl] = useState<string>('');
  const [customAlias, setCustomAlias] = useState<string>('');
  const [shortUrl, setShortUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Load URLs and analytics on mount
  useEffect(() => {
    loadUrls();
    loadAnalytics();
  }, []);

  const loadUrls = async () => {
    try {
      const response = await fetch('/api/urls');
      const data = await response.json();
      if (data.success) {
        setUrls(data.data);
      }
    } catch (error) {
      console.error('Failed to load URLs:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleSubmit = async () => {
    if (!url) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          customAlias: customAlias || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShortUrl(data.data.shortUrl);
        setUrl('');
        setCustomAlias('');
        loadUrls(); // Refresh the list
        loadAnalytics(); // Refresh analytics
      } else {
        setError(data.error || 'Failed to create short URL');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && url) {
      handleSubmit();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatUrl = (url: string, maxLength = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Link2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">URL Shortener</h1>
                <p className="text-sm text-gray-600">Fast, reliable, and analytics-powered</p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span>Lightning Fast</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Secure</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span>Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section with URL Shortener Form */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Shorten URLs with <span className="text-blue-600">Advanced Analytics</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create short, memorable links and track their performance with detailed analytics
          </p>

          {/* URL Shortener Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Original URL *
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="https://example.com/very/long/url"
                    className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Custom Alias (Optional)
                  </label>
                  <input
                    type="text"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="my-link"
                    pattern="[a-zA-Z0-9_-]+"
                    className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !url}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span>Shorten URL</span>
                  </>
                )}
              </button>
            </div>

            {/* Success Result */}
            {shortUrl && (
              <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Short URL Created!</h3>
                <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border">
                  <input
                    type="text"
                    value={shortUrl}
                    readOnly
                    className="flex-1 bg-transparent border-none focus:outline-none text-blue-600 font-medium"
                  />
                  <button
                    onClick={() => copyToClipboard(shortUrl)}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                  <a
                    href={shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Open link"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Dashboard */}
        {analytics && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Analytics Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total URLs</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.overview.totalUrls}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Link2 className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.overview.totalClicks}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <MousePointer className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recent Clicks (7d)</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.overview.recentClicks}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* URL List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Your URLs</h3>
            <p className="text-gray-600">{urls.length} URLs created</p>
          </div>

          {urls.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border">
              <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">No URLs yet</h4>
              <p className="text-gray-600">Create your first short URL to get started!</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        URL
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Short Link
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clicks
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {urls.map((urlItem: UrlItem) => (
                      <tr key={urlItem.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {urlItem.title || 'Untitled'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatUrl(urlItem.originalUrl)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-blue-600">
                              {urlItem.shortCode}
                            </code>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-gray-900">{urlItem.clickCount}</span>
                            <BarChart3 className="h-4 w-4 text-gray-400" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(urlItem.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => copyToClipboard(urlItem.shortUrl)}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Copy link"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <a
                              href={urlItem.shortUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Open link"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>Built with Next.js, TypeScript, and Supabase</p>
            <p className="text-sm mt-2">Demonstrating backend engineering excellence</p>
          </div>
        </div>
      </footer>
    </div>
  );
}