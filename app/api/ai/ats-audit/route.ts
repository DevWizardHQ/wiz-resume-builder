import { NextRequest, NextResponse } from 'next/server';
import { analyzeAtsScore } from '@/lib/utils/ats-analyzer';
import { ResumeData } from '@/types/resume';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resume, jobDescription } = body || {};

    if (!resume || typeof resume !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid "resume" object in request body' },
        { status: 400 }
      );
    }

    const result = analyzeAtsScore(
      resume as ResumeData,
      typeof jobDescription === 'string' ? jobDescription : undefined
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/ai/ats-audit route:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error processing ATS audit' },
      { status: 500 }
    );
  }
}
