import { NextRequest, NextResponse } from 'next/server';
import { parseResumeWithAi } from '@/lib/ai/resume-parser-ai';
import { parseJsonResumeContent } from '@/lib/import/resume-parser';
import { ParseResumeRequest } from '@/types/import';

export async function POST(request: NextRequest) {
  try {
    const body: ParseResumeRequest = await request.json().catch(() => ({}));
    const content = String(body.rawText || body.content || '').trim();

    if (!content) {
      return NextResponse.json(
        { error: 'No resume content provided. Paste text or upload a document.' },
        { status: 400 }
      );
    }

    const sourceType = body.sourceType || detectSourceType(content, body.fileName);

    // JSON Resume short-circuits (no LLM needed for well-formed standard data).
    if (sourceType === 'json') {
      const jsonData = parseJsonResumeContent(content);
      if (jsonData) {
        return NextResponse.json({
          data: jsonData,
          source: 'json',
          sections: describeSections(jsonData),
          warnings: [],
        });
      }
    }

    // Text / extracted-document path with AI enrichment + heuristic fallback.
    const result = await parseResumeWithAi(content);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/ai/parse-resume:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to parse resume content' },
      { status: 500 }
    );
  }
}

function detectSourceType(content: string, fileName?: string): 'json' | 'text' {
  const lower = (fileName || '').toLowerCase();
  if (lower.endsWith('.json')) return 'json';
  return 'text';
}

function describeSections(data: any): Array<{ key: string; count: number }> {
  const keys = [
    'experience',
    'projects',
    'education',
    'skills',
    'certifications',
    'involvement',
    'awards',
    'publications',
    'references',
  ];
  return keys.map((key) => ({
    key,
    count: Array.isArray(data?.[key]) ? data[key].length : 0,
  }));
}
