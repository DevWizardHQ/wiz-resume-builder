import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateResumeDocxBuffer } from '@/lib/export/docx-generator';
import {
  DEFAULT_SECTION_ORDER,
  INITIAL_RESUME_DATA,
  ResumeData,
  SectionKey,
} from '@/types/resume';

const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    let resumeData: ResumeData = INITIAL_RESUME_DATA;
    let sectionOrder: SectionKey[] = DEFAULT_SECTION_ORDER;
    let resumeTitle = 'Resume';

    if (id === 'demo' || id === 'mock' || id === 'default') {
      resumeData = INITIAL_RESUME_DATA;
      resumeTitle = 'Demo_Resume';
    } else {
      try {
        const supabase = await createClient();
        const { data: record, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !record) {
          if (id === 'initial' || id === 'sample') {
            resumeData = INITIAL_RESUME_DATA;
          } else {
            return NextResponse.json(
              { error: 'Resume not found' },
              { status: 404 }
            );
          }
        } else {
          resumeData = (record.content as ResumeData) || INITIAL_RESUME_DATA;
          sectionOrder = record.section_order || DEFAULT_SECTION_ORDER;
          resumeTitle = record.title || resumeData.contact?.fullName || 'Resume';
        }
      } catch (dbError) {
        console.warn('Supabase query error in DOCX export, using fallback:', dbError);
        resumeData = INITIAL_RESUME_DATA;
      }
    }

    const docxBuffer = await generateResumeDocxBuffer(resumeData, sectionOrder);

    const safeName = (resumeTitle || resumeData.contact?.fullName || 'Resume')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName || 'Resume'}.docx`;

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        'Content-Type': DOCX_MIME_TYPE,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': docxBuffer.length.toString(),
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Error in /api/export/docx/[id] route:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate DOCX export' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await context.params;
    const body = await request.json();
    const { resumeData, sectionOrder = DEFAULT_SECTION_ORDER, title } = body || {};

    if (!resumeData) {
      return NextResponse.json(
        { error: 'Missing resumeData in request body' },
        { status: 400 }
      );
    }

    const docxBuffer = await generateResumeDocxBuffer(resumeData, sectionOrder);

    const safeName = (title || resumeData.contact?.fullName || 'Resume')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName || 'Resume'}.docx`;

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        'Content-Type': DOCX_MIME_TYPE,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': docxBuffer.length.toString(),
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/export/docx/[id] route:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate DOCX export' },
      { status: 500 }
    );
  }
}
