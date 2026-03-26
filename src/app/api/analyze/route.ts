import { NextRequest, NextResponse } from 'next/server';
import { getChannelId, getChannel, getVideos, parseYouTubeUrl, Video, Channel } from '@/lib/youtube';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url?.trim()) {
      return NextResponse.json({ error: 'Please enter a YouTube channel URL' }, { status: 400 });
    }

    const channelId = parseYouTubeUrl(url);
    if (!channelId) {
      return NextResponse.json({ 
        error: 'Invalid YouTube URL. Try formats like youtube.com/@channel or youtube.com/channel/UC...' 
      }, { status: 400 });
    }

    const id = await getChannelId(channelId);
    const [channelData, videoData] = await Promise.all([
      getChannel(id),
      getVideos(id)
    ]);

    return NextResponse.json({ channel: channelData, videos: videoData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch channel data' }, { status: 500 });
  }
}
