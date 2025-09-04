import { NextRequest, NextResponse } from 'next/server';
import { incrementCounter, getTodaysCount } from '@/utils/counter';

export async function POST(request: NextRequest) {
  try {
    const count = incrementCounter();
    return NextResponse.json({ count, success: true });
  } catch (error) {
    // console.error('Error incrementing counter:', error);
    return NextResponse.json(
      { error: 'Failed to increment counter' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const count = getTodaysCount();
    return NextResponse.json({ count, success: true });
  } catch (error) {
    // console.error('Error getting counter:', error);
    return NextResponse.json(
      { error: 'Failed to get counter' },
      { status: 500 }
    );
  }
}