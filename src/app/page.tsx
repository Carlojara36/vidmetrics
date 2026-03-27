'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, TrendingUp, Eye, Heart, Clock, Download, Filter, ChevronDown, BarChart3, Flame, Users, Play, TrendingDown, Sun, Moon } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { parseYouTubeUrl, exportToCSV, Video, Channel, formatNumber, formatDuration } from '@/lib/youtube';

type SortField = 'viewCount' | 'likeCount' | 'engagementRate' | 'publishedAt' | 'trendScore';
type SortOrder = 'asc' | 'desc';
type TimeFilter = 'all' | 'week' | 'month' | 'quarter';
type Theme = 'light' | 'dark';

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`} />;
}

function MetricCard({ icon: Icon, label, value, trend, trendUp }: { icon: React.ElementType, label: string, value: string, trend?: string, trendUp?: boolean }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function VideoCard({ video, rank, onClick }: { video: Video, rank: number, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="group bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all duration-200 cursor-pointer"
    >
      <div className="flex gap-4">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-sm font-semibold text-slate-500 dark:text-slate-400">
          {rank}
        </span>
        <div className="relative flex-shrink-0">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-40 h-24 rounded-xl object-cover"
          />
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-xs font-medium text-white">
            {formatDuration(video.duration)}
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors flex items-center justify-center">
            <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <h4 className="font-semibold text-slate-900 dark:text-white line-clamp-2 flex-1">{video.title}</h4>
            {video.isTrending && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
                <Flame className="w-3 h-3" />
                Trending
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Views</p>
              <p className="font-semibold text-slate-900 dark:text-white">{formatNumber(video.viewCount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Likes</p>
              <p className="font-semibold text-slate-900 dark:text-white">{formatNumber(video.likeCount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Comments</p>
              <p className="font-semibold text-slate-900 dark:text-white">{formatNumber(video.commentCount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Engagement</p>
              <p className={`font-semibold ${video.engagementRate > 5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                {video.engagementRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [sortField, setSortField] = useState<SortField>('viewCount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [showFilters, setShowFilters] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('vidmetrics-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('vidmetrics-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube channel URL');
      return;
    }

    const channelId = parseYouTubeUrl(url);
    if (!channelId) {
      setError('Invalid YouTube URL. Try formats like youtube.com/@channel or youtube.com/channel/UC...');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch channel data');
      }
      
      setChannel(data.channel);
      setVideos(data.videos);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch channel data. Check your API key or URL.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = useMemo(() => {
    const now = new Date();
    let filtered = [...videos];

    if (timeFilter !== 'all') {
      const days = timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 90;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(v => new Date(v.publishedAt) >= cutoff);
    }

    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const order = sortOrder === 'asc' ? 1 : -1;
      
      if (sortField === 'publishedAt') {
        return order * (new Date(aVal as string).getTime() - new Date(bVal as string).getTime());
      }
      return order * ((aVal as number) - (bVal as number));
    });

    return filtered;
  }, [videos, sortField, sortOrder, timeFilter]);

  const chartData = useMemo(() => {
    return filteredVideos.slice(0, 8).reverse().map(v => ({
      name: v.title.length > 15 ? v.title.substring(0, 15) + '...' : v.title,
      views: v.viewCount,
      engagement: v.engagementRate,
      likes: v.likeCount,
    }));
  }, [filteredVideos]);

  const stats = useMemo(() => {
    if (videos.length === 0) return null;
    const filteredForStats = timeFilter !== 'all' ? filteredVideos : videos;
    return {
      totalViews: filteredForStats.reduce((sum, v) => sum + v.viewCount, 0),
      totalLikes: filteredForStats.reduce((sum, v) => sum + v.likeCount, 0),
      avgEngagement: filteredForStats.reduce((sum, v) => sum + v.engagementRate, 0) / filteredForStats.length,
      trendingCount: filteredForStats.filter(v => v.isTrending).length,
      avgViews: filteredForStats.length > 0 ? filteredForStats.reduce((sum, v) => sum + v.viewCount, 0) / filteredForStats.length : 0,
    };
  }, [videos, filteredVideos, timeFilter]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">VidMetrics</span>
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6">
                <a href="#" className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Dashboard</a>
                <a href="#" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Channels</a>
                <a href="#" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Reports</a>
                <a href="#" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Settings</a>
              </nav>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Competitor Analysis</h1>
          <p className="text-slate-500 dark:text-slate-400">Analyze any YouTube channel to discover trending content and performance insights.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8 transition-colors">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste YouTube channel URL (e.g., @MrBeast or youtube.com/channel/UC...)"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 py-3.5 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Analyze Channel
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>
          )}
        </div>

        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                  <Skeleton className="w-10 h-10 rounded-xl mb-4" />
                  <Skeleton className="w-20 h-4 mb-2" />
                  <Skeleton className="w-32 h-8" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 h-80">
                <Skeleton className="w-40 h-6 mb-4" />
                <Skeleton className="w-full h-56" />
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 h-80">
                <Skeleton className="w-40 h-6 mb-4" />
                <Skeleton className="w-full h-56" />
              </div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex gap-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-40 h-24 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="w-3/4 h-5" />
                      <Skeleton className="w-1/4 h-4" />
                      <div className="grid grid-cols-4 gap-4 mt-2">
                        {[1, 2, 3, 4].map((j) => (
                          <Skeleton key={j} className="h-8" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {channel && stats && !loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <MetricCard
                icon={Eye}
                label="Total Views"
                value={formatNumber(stats.totalViews)}
              />
              <MetricCard
                icon={Heart}
                label="Total Likes"
                value={formatNumber(stats.totalLikes)}
              />
              <MetricCard
                icon={Users}
                label="Avg. Engagement"
                value={`${stats.avgEngagement.toFixed(1)}%`}
              />
              <MetricCard
                icon={Flame}
                label="Trending Now"
                value={stats.trendingCount.toString()}
                trend="This month"
                trendUp={true}
              />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6 transition-colors">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <img src={channel.thumbnail} alt={channel.title} className="w-14 h-14 rounded-full" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{channel.title}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{formatNumber(channel.subscriberCount)} subscribers · {channel.videoCount} videos</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Views Performance</h3>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                          formatter={(value) => [formatNumber(Number(value)), 'Views']}
                        />
                        <Area type="monotone" dataKey="views" stroke="#6366f1" fill="url(#viewsGradient)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-60 flex items-center justify-center text-slate-400 dark:text-slate-500">No data available</div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Engagement Rate</h3>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                          formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Engagement']}
                        />
                        <Bar dataKey="engagement" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-60 flex items-center justify-center text-slate-400 dark:text-slate-500">No data available</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Video Performance</h3>
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300">
                    {filteredVideos.length} videos
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Time</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 90 Days</option>
                  </select>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <Filter className="w-4 h-4" />
                    Sort
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => exportToCSV(filteredVideos, channel.title)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="flex flex-wrap gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl mb-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Sort By</label>
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as SortField)}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="trendScore">Trending Score</option>
                      <option value="viewCount">Views</option>
                      <option value="likeCount">Likes</option>
                      <option value="engagementRate">Engagement Rate</option>
                      <option value="publishedAt">Publish Date</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Order</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="desc">Highest First</option>
                      <option value="asc">Lowest First</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {filteredVideos.map((video, index) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    rank={index + 1}
                    onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, '_blank')}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {!channel && !loading && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-10 h-10 text-indigo-400 dark:text-indigo-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Enter a channel URL to get started</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Paste any YouTube channel link above to analyze video performance and discover trending content.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            VidMetrics — YouTube Analytics for Enterprise Creators
          </p>
        </div>
      </footer>
    </div>
  );
}
