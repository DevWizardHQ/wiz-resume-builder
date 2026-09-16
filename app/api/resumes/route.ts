import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeAtsScore } from '@/lib/utils/ats-analyzer';
import { DEMO_RESUMES, SAMPLE_ENGINEER_RESUME } from '@/lib/sample-data';
import {
  DEFAULT_SECTION_ORDER,
  INITIAL_RESUME_DATA,
  ResumeData,
  ResumeRecord,
  SectionKey,
  TemplateId,
} from '@/types/resume';

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'resume'
  );
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (user && !userError) {
      const { data: records, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (!error && records && records.length > 0) {
        return NextResponse.json({ resumes: records }, { status: 200 });
      }
    }

    // Fallback in demo/mock mode or if user has no resumes yet
    return NextResponse.json({ resumes: DEMO_RESUMES }, { status: 200 });
  } catch (error: any) {
    console.warn('Database error in /api/resumes GET, falling back to demo data:', error);
    return NextResponse.json({ resumes: DEMO_RESUMES }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      title,
      template_id = 'classic-ats',
      content,
      section_order = DEFAULT_SECTION_ORDER,
      clone_from_id,
      use_sample_data = false,
    } = body || {};

    let targetContent: ResumeData = INITIAL_RESUME_DATA;
    let targetTemplateId: TemplateId = template_id as TemplateId;
    let targetSectionOrder: SectionKey[] = section_order as SectionKey[];
    let targetTitle = title?.trim() || 'Untitled Resume';

    // Handle Clone / Duplicate
    if (clone_from_id) {
      let sourceFound: Partial<ResumeRecord> | undefined;

      try {
        const supabase = await createClient();
        const { data: record } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', clone_from_id)
          .single();

        if (record) {
          sourceFound = record as Partial<ResumeRecord>;
        }
      } catch (_e) {
        // Fallback to local demo list
      }

      if (!sourceFound) {
        sourceFound = DEMO_RESUMES.find((r) => r.id === clone_from_id);
      }

      if (sourceFound) {
        targetContent = sourceFound.content
          ? JSON.parse(JSON.stringify(sourceFound.content))
          : INITIAL_RESUME_DATA;
        targetTemplateId = (sourceFound.template_id as TemplateId) || targetTemplateId;
        targetSectionOrder = sourceFound.section_order?.length
          ? [...sourceFound.section_order]
          : targetSectionOrder;
        if (!title) {
          targetTitle = `${sourceFound.title || 'Resume'} (Copy)`;
        }
      }
    } else if (content) {
      targetContent = JSON.parse(JSON.stringify(content));
    } else if (use_sample_data) {
      targetContent = JSON.parse(JSON.stringify(SAMPLE_ENGINEER_RESUME));
      if (!title) {
        targetTitle = 'Sample Software Engineer Resume';
      }
    }

    const atsScore = analyzeAtsScore(targetContent).overallScore;
    const slug = generateSlug(targetTitle);
    const now = new Date().toISOString();

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: inserted, error: insertError } = await supabase
          .from('resumes')
          .insert({
            user_id: user.id,
            title: targetTitle,
            slug,
            template_id: targetTemplateId,
            section_order: targetSectionOrder,
            content: targetContent,
            ats_score: atsScore,
          })
          .select()
          .single();

        if (!insertError && inserted) {
          return NextResponse.json({ resume: inserted }, { status: 201 });
        }
      }
    } catch (dbError) {
      console.warn('Could not insert to Supabase, returning mock record:', dbError);
    }

    // Mock record response when Supabase is offline / demo mode
    const mockResume: ResumeRecord = {
      id: crypto.randomUUID(),
      user_id: 'demo-user-1',
      title: targetTitle,
      slug,
      template_id: targetTemplateId,
      section_order: targetSectionOrder,
      content: targetContent,
      ats_score: atsScore,
      created_at: now,
      updated_at: now,
    };

    return NextResponse.json({ resume: mockResume }, { status: 201 });
  } catch (error: any) {
    console.error('Error in /api/resumes POST route:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create resume' },
      { status: 500 }
    );
  }
}
