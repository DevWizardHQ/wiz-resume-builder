import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeAtsScore } from '@/lib/utils/ats-analyzer';
import { DEMO_RESUMES, SAMPLE_ENGINEER_RESUME } from '@/lib/sample-data';
import {
  DEFAULT_SECTION_ORDER,
  INITIAL_RESUME_DATA,
  ResumeRecord,
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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (id === 'demo' || id === 'sample' || id === 'default') {
      return NextResponse.json({ resume: DEMO_RESUMES[0] }, { status: 200 });
    }

    if (id === 'new') {
      const newBlank: ResumeRecord = {
        id: 'new',
        user_id: 'demo-user-1',
        title: 'Untitled Resume',
        slug: 'untitled-resume',
        template_id: 'classic-ats',
        section_order: DEFAULT_SECTION_ORDER,
        content: INITIAL_RESUME_DATA,
        ats_score: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return NextResponse.json({ resume: newBlank }, { status: 200 });
    }

    try {
      const supabase = await createClient();
      const { data: record, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && record) {
        return NextResponse.json({ resume: record }, { status: 200 });
      }
    } catch (dbErr) {
      console.warn('Database error fetching resume, falling back to mock data:', dbErr);
    }

    // Look up in fallback demo records
    const demoFound = DEMO_RESUMES.find((r) => r.id === id);
    if (demoFound) {
      return NextResponse.json({ resume: demoFound }, { status: 200 });
    }

    return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Error in /api/resumes/[id] GET:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const {
      title,
      template_id,
      section_order,
      content,
      ats_score,
    } = body || {};

    const updates: Partial<ResumeRecord> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) {
      updates.title = title;
      updates.slug = generateSlug(title);
    }
    if (template_id !== undefined) {
      updates.template_id = template_id as TemplateId;
    }
    if (section_order !== undefined) {
      updates.section_order = section_order;
    }
    if (content !== undefined) {
      updates.content = content;
      if (ats_score === undefined) {
        updates.ats_score = analyzeAtsScore(content).overallScore;
      }
    }
    if (ats_score !== undefined) {
      updates.ats_score = ats_score;
    }

    try {
      const supabase = await createClient();
      const { data: updated, error } = await supabase
        .from('resumes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && updated) {
        return NextResponse.json(
          { success: true, resume: updated },
          { status: 200 }
        );
      }
    } catch (dbErr) {
      console.warn('Database error updating resume, falling back to mock result:', dbErr);
    }

    // Return successful mock update
    const base = DEMO_RESUMES.find((r) => r.id === id) || {
      id,
      user_id: 'demo-user-1',
      title: 'Untitled Resume',
      slug: 'untitled-resume',
      template_id: 'classic-ats' as TemplateId,
      section_order: DEFAULT_SECTION_ORDER,
      content: INITIAL_RESUME_DATA,
      ats_score: 75,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockUpdated: ResumeRecord = {
      ...base,
      ...updates,
      id,
    };

    return NextResponse.json(
      { success: true, resume: mockUpdated },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in /api/resumes/[id] PATCH:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update resume' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    try {
      const supabase = await createClient();
      const { error } = await supabase.from('resumes').delete().eq('id', id);

      if (error) {
        console.warn('Supabase delete error:', error);
      }
    } catch (dbErr) {
      console.warn('Database error deleting resume, proceeding in mock mode:', dbErr);
    }

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/resumes/[id] DELETE:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete resume' },
      { status: 500 }
    );
  }
}
