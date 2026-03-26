'use client';

import { useState, useMemo } from 'react';
import { Search, TrendingUp, Eye, Heart, MessageCircle, Clock, Download, Filter, ChevronDown, BarChart3, Flame, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { parseYouTubeUrl, getChannelId, getChannel, getVideos, exportToCSV, Video, Channel, formatNumber, formatDuration } from '@/lib/youtube';

type SortField = 'viewCount' | 'likeCount' | 'engagementRate' | 'publishedAt' | 'trendScore';
type SortOrder = 'asc' | 'desc';
type TimeFilter = 'all' | 'week' | 'month' | 'quarter';

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
      const id = await getChannelId(channelId);
      const [channelData, videoData] = await Promise.all([
        getChannel(id),
        getVideos(id)
      ]);
      setChannel(channelData);
      setVideos(videoData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch channel data. Check your API key or URL.');
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
    return filteredVideos.slice(0, 10).reverse().map(v => ({
      name: v.title.length > 20 ? v.title.substring(0, 20) + '...' : v.title,
      views: v.viewCount,
      engagement: v.engagementRate,
    }));
  }, [filteredVideos]);

  const stats = useMemo(() => {
    if (videos.length === 0) return null;
    return {
      totalViews: videos.reduce((sum, v) => sum + v.viewCount, 0),
      totalLikes: videos.reduce((sum, v) => sum + v.likeCount, 0),
      avgEngagement: videos.reduce((sum, v) => sum + v.engagementRate, 0) / videos.length,
      trendingCount: videos.filter(v => v.isTrending).length,
    };
  }, [videos]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">VidMetrics</h1>
          </div>
          <p className="mx-auto max-w-xl text-lg text-slate-400">
            Analyze competitor performance. Discover trending content. Ship smarter videos.
          </p>
        </header>

        <div className="mx-auto mb-12 max-w-3xl">
          <div className="relative">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Paste YouTube channel URL (e.g., @MrBeast or youtube.com/channel/UC...)"
                  className="w-full rounded-xl border-0 bg-slate-800/50 py-4 pl-12 pr-4 text-white placeholder-slate-400 ring-1 ring-slate-700 transition-all focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-8 py-4 font-semibold text-white transition-all hover:from-red-600 hover:to-orange-600 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-5 w-5" />
                    Analyze Channel
                  </>
                )}
              </button>
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-400">{error}</p>
            )}
          </div>
        </div>

        {channel && stats && (
          <>
            <div className="mb-8 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-4">
                  <img src={channel.thumbnail} alt={channel.title} className="h-16 w-16 rounded-full" />
                  <div>
                    <h2 className="text-xl font-semibold text-white">{channel.title}</h2>
                    <p className="text-slate-400">{formatNumber(channel.subscriberCount)} subscribers</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 sm:gap-8">
                  <div>
                    <p className="text-sm text-slate-400">Total Views</p>
                    <p className="text-2xl font-bold text-white">{formatNumber(stats.totalViews)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total Likes</p>
                    <p className="text-2xl font-bold text-white">{formatNumber(stats.totalLikes)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Avg. Engagement</p>
                    <p className="text-2xl font-bold text-white">{stats.avgEngagement.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Trending Now</p>
                    <p className="text-2xl font-bold text-orange-400 flex items-center gap-1">
                      <Flame className="h-5 w-5" />
                      {stats.trendingCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-slate-800/50 p-6 backdrop-blur-sm">
                <h3 className="mb-4 text-lg font-semibold text-white">Views Performance</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                        formatter={(value) => [formatNumber(Number(value)), 'Views']}
                      />
                      <Bar dataKey="views" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-800/50 p-6 backdrop-blur-sm">
                <h3 className="mb-4 text-lg font-semibold text-white">Engagement Rate</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                        formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Engagement']}
                      />
                      <Line type="monotone" dataKey="engagement" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-800/50 p-6 backdrop-blur-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">Video Performance</h3>
                  <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">
                    {filteredVideos.length} videos
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                    className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-red-500"
                  >
                    <option value="all">All Time</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 90 Days</option>
                  </select>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
                  >
                    <Filter className="h-4 w-4" />
                    Sort
                    <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => exportToCSV(filteredVideos, channel.title)}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="mb-6 flex flex-wrap gap-4 rounded-lg bg-slate-700/50 p-4">
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Sort By</label>
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as SortField)}
                      className="rounded-lg bg-slate-600 px-3 py-2 text-sm text-white"
                    >
                      <option value="trendScore">Trending Score</option>
                      <option value="viewCount">Views</option>
                      <option value="likeCount">Likes</option>
                      <option value="engagementRate">Engagement Rate</option>
                      <option value="publishedAt">Publish Date</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Order</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                      className="rounded-lg bg-slate-600 px-3 py-2 text-sm text-white"
                    >
                      <option value="desc">Highest First</option>
                      <option value="asc">Lowest First</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {filteredVideos.map((video, index) => (
                  <div
                    key={video.id}
                    className="group flex flex-col gap-4 rounded-xl bg-slate-700/30 p-4 transition-all hover:bg-slate-700/50 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-600 text-sm font-medium text-slate-300">
                        {index + 1}
                      </span>
                      <div className="relative flex-shrink-0">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="h-20 w-36 rounded-lg object-cover"
                        />
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                          {formatDuration(video.duration)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h4 className="font-medium text-white line-clamp-2">{video.title}</h4>
                        {video.isTrending && (
                          <span className="flex-shrink-0 rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-400">
                            <Flame className="inline h-3 w-3 mr-1" />
                            Trending
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })}
                        </span>
                        <a
                          href={`https://youtube.com/watch?v=${video.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-slate-400 hover:text-red-400"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Watch
                        </a>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Eye className="h-3.5 w-3.5" />
                          Views
                        </div>
                        <p className="font-semibold text-white">{formatNumber(video.viewCount)}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Heart className="h-3.5 w-3.5" />
                          Likes
                        </div>
                        <p className="font-semibold text-white">{formatNumber(video.likeCount)}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <MessageCircle className="h-3.5 w-3.5" />
                          Comments
                        </div>
                        <p className="font-semibold text-white">{formatNumber(video.commentCount)}</p>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">Engagement</div>
                        <p className={`font-semibold ${video.engagementRate > 5 ? 'text-green-400' : 'text-white'}`}>
                          {video.engagementRate.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!channel && !loading && (
          <div className="mt-20 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800">
              <BarChart3 className="h-10 w-10 text-slate-600" />
            </div>
            <h3 className="mb-2 text-xl font-medium text-slate-300">Enter a channel URL to get started</h3>
            <p className="text-slate-500">
              Paste any YouTube channel link above to analyze video performance
            </p>
          </div>
        )}

        <footer className="mt-16 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
          <p>VidMetrics - YouTube Analytics for Enterprise Creators</p>
          <p className="mt-1">Powered by YouTube Data API</p>
        </footer>
      </div>
    </div>
  );
}
