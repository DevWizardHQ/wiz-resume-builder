import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateResumePdfBuffer } from '@/lib/export/pdf-generator';
import {
  DEFAULT_SECTION_ORDER,
  INITIAL_RESUME_DATA,
  ResumeData,
  SectionKey,
  TemplateId,
} from '@/types/resume';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const templateQuery = searchParams.get('template') as TemplateId | null;

    let resumeData: ResumeData = INITIAL_RESUME_DATA;
    let templateId: TemplateId = templateQuery || 'classic-ats';
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
          // If not found in database and not a UUID format or query error, handle gracefully
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
          templateId = templateQuery || record.template_id || 'classic-ats';
          sectionOrder = record.section_order || DEFAULT_SECTION_ORDER;
          resumeTitle = record.title || resumeData.contact?.fullName || 'Resume';
        }
      } catch (dbError) {
        console.warn('Supabase query error in PDF export, using fallback:', dbError);
        resumeData = INITIAL_RESUME_DATA;
      }
    }

    const pdfBuffer = await generateResumePdfBuffer(
      resumeData,
      templateId,
      sectionOrder
    );

    const safeName = (resumeTitle || resumeData.contact?.fullName || 'Resume')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName || 'Resume'}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Error in /api/export/pdf/[id] route:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate PDF export' },
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
    const { resumeData, templateId = 'classic-ats', sectionOrder = DEFAULT_SECTION_ORDER, title } =
      body || {};

    if (!resumeData) {
      return NextResponse.json(
        { error: 'Missing resumeData in request body' },
        { status: 400 }
      );
    }

    const pdfBuffer = await generateResumePdfBuffer(
      resumeData,
      templateId,
      sectionOrder
    );

    const safeName = (title || resumeData.contact?.fullName || 'Resume')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName || 'Resume'}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/export/pdf/[id] route:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate PDF export' },
      { status: 500 }
    );
  }
}
