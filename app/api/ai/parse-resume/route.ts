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
    console.log(`[DEV LOG] [API /api/ai/parse-resume] Received request. SourceType: ${sourceType}, File: ${body.fileName || 'N/A'}, Content length: ${content.length}`);

    // JSON Resume short-circuits (no LLM needed for well-formed standard data).
    if (sourceType === 'json') {
      const jsonData = parseJsonResumeContent(content);
      if (jsonData) {
        console.log('[DEV LOG] [API /api/ai/parse-resume] Valid JSON Resume detected. Extracted Data Schema:');
        console.log(JSON.stringify(jsonData, null, 2));
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
    console.log(`[DEV LOG] [API /api/ai/parse-resume] Parse completed successfully. Source: ${result.source}, Model: ${result.modelUsed}`);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[DEV LOG] [API /api/ai/parse-resume] Parsing error:', error);
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
