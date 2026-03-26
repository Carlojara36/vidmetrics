export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  engagementRate: number;
  duration: string;
  isTrending: boolean;
  trendScore: number;
}

export interface Channel {
  id: string;
  title: string;
  thumbnail: string;
  subscriberCount: number;
  videoCount: number;
}

export function parseYouTubeUrl(url: string): string | null {
  const patterns = [
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function getChannelId(identifier: string): Promise<string> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YouTube API key not configured');

  if (identifier.includes('UC')) {
    return identifier;
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${identifier}&key=${apiKey}`
  );
  const data = await response.json();
  
  if (data.items?.[0]?.id) {
    return data.items[0].id;
  }
  
  throw new Error('Channel not found');
}

export async function getChannel(channelId: string): Promise<Channel> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YouTube API key not configured');

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`
  );
  const data = await response.json();
  
  if (!data.items?.[0]) {
    throw new Error('Channel not found');
  }

  const channel = data.items[0];
  return {
    id: channel.id,
    title: channel.snippet.title,
    thumbnail: channel.snippet.thumbnails.default.url,
    subscriberCount: parseInt(channel.statistics.subscriberCount),
    videoCount: parseInt(channel.statistics.videoCount),
  };
}

export async function getVideos(channelId: string): Promise<Video[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YouTube API key not configured');

  const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
  
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`
  );
  const data = await response.json();
  
  if (!data.items) {
    return [];
  }

  const videoIds = data.items.map((item: any) => item.contentDetails.videoId).join(',');
  const videoDetails = await getVideoDetails(videoIds);

  const videos: Video[] = data.items.map((item: any, index: number) => {
    const details = videoDetails.find((v: any) => v.id === item.contentDetails.videoId);
    const viewCount = details ? parseInt(details.statistics.viewCount || '0') : 0;
    const likeCount = details ? parseInt(details.statistics.likeCount || '0') : 0;
    const commentCount = details ? parseInt(details.statistics.commentCount || '0') : 0;
    const engagementRate = viewCount > 0 ? ((likeCount + commentCount) / viewCount) * 100 : 0;

    return {
      id: item.contentDetails.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      publishedAt: item.snippet.publishedAt,
      viewCount,
      likeCount,
      commentCount,
      engagementRate,
      duration: details?.contentDetails?.duration || 'PT0S',
      isTrending: false,
      trendScore: 0,
    };
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  videos.forEach((video, index) => {
    const publishDate = new Date(video.publishedAt);
    const daysAgo = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (publishDate >= thirtyDaysAgo) {
      const viewsPerDay = video.viewCount / Math.max(daysAgo, 1);
      const engagementScore = video.engagementRate * (video.viewCount / 1000000);
      video.trendScore = viewsPerDay + engagementScore;
      video.isTrending = video.trendScore > 50;
    }
  });

  videos.sort((a, b) => b.trendScore - a.trendScore);

  return videos;
}

async function getUploadsPlaylistId(channelId: string): Promise<string> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
  );
  const data = await response.json();
  return data.items[0].contentDetails.relatedPlaylists.uploads;
}

async function getVideoDetails(videoIds: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`
  );
  const data = await response.json();
  return data.items || [];
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function exportToCSV(videos: Video[], channelName: string): void {
  const headers = ['Title', 'Published', 'Views', 'Likes', 'Comments', 'Engagement Rate', 'Duration'];
  const rows = videos.map(v => [
    `"${v.title}"`,
    new Date(v.publishedAt).toLocaleDateString(),
    v.viewCount,
    v.likeCount,
    v.commentCount,
    v.engagementRate.toFixed(2) + '%',
    formatDuration(v.duration),
  ]);
  
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${channelName.replace(/\s+/g, '_')}_videos.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
