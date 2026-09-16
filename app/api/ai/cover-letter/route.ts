import { NextRequest, NextResponse } from 'next/server';
import { generateCoverLetter } from '@/lib/ai/local-client';
import { ResumeData } from '@/types/resume';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resume, jobTitle, company, jobDescription } = body || {};

    if (!resume || typeof resume !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid "resume" object in request body' },
        { status: 400 }
      );
    }

    if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid "jobTitle" in request body' },
        { status: 400 }
      );
    }

    if (!company || typeof company !== 'string' || company.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid "company" in request body' },
        { status: 400 }
      );
    }

    const result = await generateCoverLetter(
      resume as ResumeData,
      jobTitle.trim(),
      company.trim(),
      typeof jobDescription === 'string' ? jobDescription : undefined
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/ai/cover-letter route:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error generating cover letter' },
      { status: 500 }
    );
  }
}
