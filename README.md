# VidMetrics - YouTube Competitor Analysis Tool

Analyze competitor video performance, discover trending content, and ship smarter videos.

## Features

- **Channel Analysis**: Paste any YouTube channel URL and instantly see performance data
- **Video Metrics**: View count, likes, comments, engagement rate for each video
- **Trending Detection**: Automatic identification of videos gaining traction
- **Sorting & Filtering**: Sort by views, engagement, publish date, or trending score
- **Time Filters**: Focus on last 7 days, 30 days, 90 days, or all time
- **Performance Charts**: Visualize views and engagement across top videos
- **CSV Export**: Download data for further analysis in spreadsheets
- **Responsive Design**: Works great on desktop and mobile

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **API**: YouTube Data API v3
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- A YouTube Data API key

### Setup

1. **Get a YouTube API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or select existing)
   - Enable "YouTube Data API v3"
   - Go to Credentials → Create Credentials → API Key

2. **Clone and Install**
   ```bash
   cd vidmetrics
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your YouTube API key
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000)

### Deployment

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variable `YOUTUBE_API_KEY`
4. Deploy!

## Project Structure

```
vidmetrics/
├── src/
│   ├── app/
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main app page
│   └── lib/
│       └── youtube.ts        # YouTube API utilities
├── public/
├── .env.example             # Environment template
├── README.md
└── package.json
```

## How It Works

1. **URL Parsing**: Extracts channel ID from various YouTube URL formats
2. **Channel Fetch**: Gets channel metadata (name, subscribers, etc.)
3. **Video Fetch**: Retrieves recent uploads with engagement stats
4. **Trending Algorithm**: Calculates trend score based on views/day and engagement
5. **Visualization**: Renders charts and sorted video list

## Supported URL Formats

- `https://youtube.com/@channelname`
- `https://youtube.com/channel/UCxxxxxxx`
- `https://youtube.com/c/channelname`
- `@channelname`

## Build Notes

**Build Time**: ~2 hours
**AI Assistance**: Used for boilerplate generation, styling patterns, and code review

### What I'd Add with More Time

1. **Historical Comparison**: Compare video performance over different time periods
2. **Competitor Benchmarking**: Side-by-side comparison of multiple channels
3. **AI Insights**: GPT-powered analysis of why videos are trending
4. **Alerts**: Notifications when competitor channels upload
5. **Topic Tagging**: AI categorization of video themes
6. **Custom Dashboards**: Save favorite channels and metrics

## License

MIT
