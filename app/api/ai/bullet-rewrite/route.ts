import { NextRequest, NextResponse } from 'next/server';
import { rewriteBulletPoints } from '@/lib/ai/local-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, context, tone } = body || {};

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid "text" parameter in request body' },
        { status: 400 }
      );
    }

    const result = await rewriteBulletPoints(
      text,
      typeof context === 'string' ? context : undefined,
      typeof tone === 'string' ? tone : undefined
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/ai/bullet-rewrite route:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error processing bullet rewrite' },
      { status: 500 }
    );
  }
}
