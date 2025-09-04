import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST(request: Request) {
  try {
    const { event, platform, standalone } = await request.json();
    
    // Track different PWA events
    const key = `pwa:${event}`;
    const dateKey = `pwa:${event}:${new Date().toISOString().split('T')[0]}`;
    
    // Increment total counter
    await kv.incr(key);
    
    // Increment daily counter
    await kv.incr(dateKey);
    
    // Track platform-specific installs
    if (platform) {
      await kv.incr(`pwa:platform:${platform}`);
    }
    
    // Track standalone mode usage
    if (standalone !== undefined) {
      await kv.incr(`pwa:standalone:${standalone}`);
    }
    
    // Log installation details
    const installData = {
      event,
      platform,
      standalone,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
    };
    
    // Store recent installations (keep last 100)
    await kv.lpush('pwa:recent_installs', JSON.stringify(installData));
    await kv.ltrim('pwa:recent_installs', 0, 99);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // console.error('PWA analytics error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get analytics data
    const [
      totalInstalls,
      totalPrompts,
      totalDismissals,
      iosInstalls,
      androidInstalls,
      desktopInstalls,
      standaloneUsers,
      browserUsers,
      recentInstalls
    ] = await Promise.all([
      kv.get('pwa:install'),
      kv.get('pwa:prompt'),
      kv.get('pwa:dismiss'),
      kv.get('pwa:platform:ios'),
      kv.get('pwa:platform:android'),
      kv.get('pwa:platform:desktop'),
      kv.get('pwa:standalone:true'),
      kv.get('pwa:standalone:false'),
      kv.lrange('pwa:recent_installs', 0, 9)
    ]);
    
    // Get today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayInstalls = await kv.get(`pwa:install:${today}`);
    
    return NextResponse.json({
      total: {
        installs: totalInstalls || 0,
        prompts: totalPrompts || 0,
        dismissals: totalDismissals || 0,
        conversionRate: totalPrompts ? (((totalInstalls as number) || 0) / ((totalPrompts as number) || 1) * 100).toFixed(2) : 0
      },
      platforms: {
        ios: iosInstalls || 0,
        android: androidInstalls || 0,
        desktop: desktopInstalls || 0
      },
      usage: {
        standalone: standaloneUsers || 0,
        browser: browserUsers || 0
      },
      today: {
        installs: todayInstalls || 0
      },
      recent: recentInstalls?.map(item => JSON.parse(item as string)) || []
    });
  } catch (error) {
    // console.error('Error fetching PWA analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}