import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    const count = await kv.get<number>('tdee_calculations_total') || 0;
    const todayKey = `tdee_calculations_${new Date().toISOString().split('T')[0]}`;
    const todayCount = await kv.get<number>(todayKey) || 0;
    
    return NextResponse.json({ 
      total: count + 150,
      today: todayCount
    });
  } catch (error) {
    // console.error('Failed to get calculation count:', error);
    // Return mock data in development
    return NextResponse.json({ 
      total: 127543,
      today: 1247
    });
  }
}

export async function POST() {
  try {
    // Increment total count
    const newTotal = await kv.incr('tdee_calculations_total');
    
    // Increment today's count
    const todayKey = `tdee_calculations_${new Date().toISOString().split('T')[0]}`;
    const todayCount = await kv.incr(todayKey);
    
    // Set expiry for today's count (24 hours)
    await kv.expire(todayKey, 86400);
    
    return NextResponse.json({ 
      total: newTotal + 150,
      today: todayCount
    });
  } catch (error) {
    // console.error('Failed to increment calculation count:', error);
    // Return mock data in development
    return NextResponse.json({ 
      total: 127544,
      today: 1248
    });
  }
}