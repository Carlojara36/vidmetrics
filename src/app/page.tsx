'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, TrendingUp, Eye, Heart, Clock, Download, Filter, ChevronDown, BarChart3, Flame, Users, Play, Sun, Moon, Zap, TrendingDown, ChevronRight } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { parseYouTubeUrl, exportToCSV, Video, Channel, formatNumber, formatDuration } from '@/lib/youtube';

type SortField = 'viewCount' | 'likeCount' | 'engagementRate' | 'publishedAt' | 'trendScore';
type SortOrder = 'asc' | 'desc';
type TimeFilter = 'all' | 'week' | 'month' | 'quarter';
type Theme = 'light' | 'dark';

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode, delay?: number, className?: string }) {
  return (
    <div 
      className={`animate-fade-in ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  );
}

function SlideUp({ children, delay = 0, className = '' }: { children: React.ReactNode, delay?: number, className?: string }) {
  return (
    <div 
      className={`animate-slide-up ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  );
}

function SkeletonPulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse-skeleton bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded-lg ${className}`} />;
}

function MetricCard({ icon: Icon, label, value, trend, trendUp, delay = 0 }: { 
  icon: React.ElementType, 
  label: string, 
  value: string, 
  trend?: string, 
  trendUp?: boolean,
  delay?: number 
}) {
  return (
    <SlideUp delay={delay}>
      <div className="group relative overflow-hidden bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
              <Icon className="w-6 h-6 text-white" />
            </div>
            {trend && (
              <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend}
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">{value}</p>
        </div>
      </div>
    </SlideUp>
  );
}

function VideoCard({ video, rank, onClick, delay = 0 }: { video: Video, rank: number, onClick: () => void, delay?: number }) {
  return (
    <SlideUp delay={delay}>
      <div 
        onClick={onClick}
        className="group relative bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        
        <div className="relative flex gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:from-indigo-500 group-hover:to-purple-600 group-hover:text-white transition-all duration-300">
            {rank}
          </div>
          
          <div className="relative flex-shrink-0 group/thumbnail">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-44 h-28 rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-shadow duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors duration-300 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/90 dark:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
                <Play className="w-6 h-6 text-slate-900 ml-1" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-xs font-medium text-white">
              {formatDuration(video.duration)}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              <h4 className="font-semibold text-slate-900 dark:text-white line-clamp-2 flex-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{video.title}</h4>
              {video.isTrending && (
                <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/20 dark:to-orange-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold shadow-sm">
                  <Flame className="w-3 h-3" />
                  Trending
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mb-4">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })}
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Views', value: formatNumber(video.viewCount), highlight: false },
                { label: 'Likes', value: formatNumber(video.likeCount), highlight: false },
                { label: 'Comments', value: formatNumber(video.commentCount), highlight: false },
                { label: 'Engagement', value: `${video.engagementRate.toFixed(1)}%`, highlight: video.engagementRate > 5 },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">{stat.label}</p>
                  <p className={`font-semibold text-sm transition-colors ${stat.highlight ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-300'}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SlideUp>
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
  const inputRef = useRef<HTMLInputElement>(null);

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
      setError('Enter a YouTube channel URL');
      return;
    }

    const channelId = parseYouTubeUrl(url);
    if (!channelId) {
      setError('Invalid URL. Try @channel or youtube.com/channel/UC...');
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
        throw new Error(data.error || 'Failed to fetch');
      }
      
      setChannel(data.channel);
      setVideos(data.videos);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data';
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
    };
  }, [videos, filteredVideos, timeFilter]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze();
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 transition-colors">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-800/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <FadeIn>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse-slow">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 -z-10 blur opacity-30 animate-pulse" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">VidMetrics</span>
              </div>
            </FadeIn>
            
            <FadeIn delay={100}>
              <nav className="hidden md:flex items-center gap-2">
                {['Dashboard', 'Channels', 'Reports'].map((item, i) => (
                  <a 
                    key={item} 
                    href="#" 
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${i === 0 ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </FadeIn>
            
            <FadeIn delay={200}>
              <button
                onClick={toggleTheme}
                className="group relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-105"
                aria-label="Toggle theme"
              >
                <div className="relative w-5 h-5">
                  <Sun className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${theme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
                  <Moon className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${theme === 'light' ? 'opacity-0 -rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
                </div>
              </button>
            </FadeIn>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FadeIn delay={300}>
          <div className="mb-10">
            <h1 className="text-4xl font-bold mb-3">
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                Competitor Analysis
              </span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              Discover trending content and performance insights from any YouTube channel.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={400}>
          <div className="relative mb-10">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 -z-10 blur opacity-20" />
            <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50 transition-colors">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                  <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10" />
                  <div className="relative flex items-center">
                    <Search className="absolute left-4 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Paste YouTube channel URL (e.g., @MrBeast)"
                      className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-8 py-4 font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  {loading ? (
                    <>
                      <div className="relative w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="relative">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="relative w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="relative">Analyze Channel</span>
                    </>
                  )}
                </button>
              </div>
              {error && (
                <p className="mt-3 text-sm text-rose-500 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {error}
                </p>
              )}
            </div>
          </div>
        </FadeIn>

        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                  <SkeletonPulse className="w-12 h-12 rounded-xl mb-4" />
                  <SkeletonPulse className="w-20 h-4 mb-2" />
                  <SkeletonPulse className="w-32 h-8" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <SkeletonPulse className="w-40 h-6 mb-6" />
                <SkeletonPulse className="w-full h-56" />
              </div>
              <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <SkeletonPulse className="w-40 h-6 mb-6" />
                <SkeletonPulse className="w-full h-56" />
              </div>
            </div>
          </div>
        )}

        {channel && stats && !loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <MetricCard icon={Eye} label="Total Views" value={formatNumber(stats.totalViews)} delay={0} />
              <MetricCard icon={Heart} label="Total Likes" value={formatNumber(stats.totalLikes)} delay={100} />
              <MetricCard icon={Users} label="Avg. Engagement" value={`${stats.avgEngagement.toFixed(1)}%`} delay={200} />
              <MetricCard icon={Flame} label="Trending Now" value={stats.trendingCount.toString()} trend="This month" trendUp={true} delay={300} />
            </div>

            <SlideUp delay={400}>
              <div className="relative mb-8">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-xl" />
                <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 transition-colors">
                  <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-slate-200/50 dark:border-slate-700/50">
                    <img src={channel.thumbnail} alt={channel.title} className="w-16 h-16 rounded-2xl shadow-lg" />
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{channel.title}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>{formatNumber(channel.subscriberCount)} subscribers</span>
                        <span className="w-1 h-1 rounded-full bg-slate-400" />
                        <span>{channel.videoCount} videos</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Views Performance</h3>
                      </div>
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="viewsGradientNew" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
                            <Tooltip
                              contentStyle={{ 
                                backgroundColor: 'rgba(255,255,255,0.95)', 
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(0,0,0,0.1)', 
                                borderRadius: '12px', 
                                fontSize: '12px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                              }}
                              formatter={(value) => [formatNumber(Number(value)), 'Views']}
                            />
                            <Area type="monotone" dataKey="views" stroke="#6366f1" fill="url(#viewsGradientNew)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-72 flex items-center justify-center text-slate-400">No data available</div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Engagement Rate</h3>
                      </div>
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={chartData}>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                            <Tooltip
                              contentStyle={{ 
                                backgroundColor: 'rgba(255,255,255,0.95)', 
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(0,0,0,0.1)', 
                                borderRadius: '12px', 
                                fontSize: '12px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                              }}
                              formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Engagement']}
                            />
                            <Bar dataKey="engagement" fill="#10b981" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-72 flex items-center justify-center text-slate-400">No data available</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SlideUp>

            <SlideUp delay={500}>
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 blur-xl" />
                <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Video Performance</h3>
                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/20 dark:to-purple-500/20 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {filteredVideos.length} videos
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        <option value="all">All Time</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="quarter">Last 90 Days</option>
                      </select>
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      >
                        <Filter className="w-4 h-4" />
                        Sort
                        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                      </button>
                      <button
                        onClick={() => exportToCSV(filteredVideos, channel.title)}
                        className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all"
                      >
                        <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                        Export
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-2 transition-all" />
                      </button>
                    </div>
                  </div>

                  {showFilters && (
                    <div className="flex flex-wrap gap-4 p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-xl mb-6 backdrop-blur-sm animate-slide-down">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Sort By</label>
                        <select
                          value={sortField}
                          onChange={(e) => setSortField(e.target.value as SortField)}
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        delay={index * 50}
                        onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </SlideUp>
          </>
        )}

        {!channel && !loading && (
          <FadeIn delay={500}>
            <div className="text-center py-24">
              <div className="relative inline-block mb-8">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-float">
                  <BarChart3 className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 -z-10 blur-2xl opacity-30 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Ready to analyze?</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Enter any YouTube channel URL above to discover trending content and performance insights.
              </p>
            </div>
          </FadeIn>
        )}
      </main>

      <footer className="border-t border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              VidMetrics — YouTube Analytics for Enterprise Creators
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <Zap className="w-3 h-3" />
              Powered by YouTube Data API
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
