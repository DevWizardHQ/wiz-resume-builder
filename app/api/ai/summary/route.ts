import { NextRequest, NextResponse } from 'next/server';
import {
  generateProfessionalSummaries,
  SummaryGenerationRequest,
} from '@/lib/ai/summary-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const payload: SummaryGenerationRequest = {
      jobTitle: typeof body?.jobTitle === 'string' ? body.jobTitle.trim() : undefined,
      targetRole: typeof body?.targetRole === 'string' ? body.targetRole.trim() : undefined,
      yearsOfExperience: body?.yearsOfExperience !== undefined ? body.yearsOfExperience : undefined,
      seniorityLevel:
        ['entry', 'mid', 'senior', 'lead', 'executive'].includes(body?.seniorityLevel)
          ? body.seniorityLevel
          : undefined,
      tone:
        ['impactful', 'technical', 'leadership', 'concise'].includes(body?.tone)
          ? body.tone
          : undefined,
      topSkills: Array.isArray(body?.topSkills)
        ? body.topSkills.map((s: any) => String(s).trim()).filter(Boolean)
        : undefined,
      keyAchievements: Array.isArray(body?.keyAchievements)
        ? body.keyAchievements.map((a: any) => String(a).trim()).filter(Boolean)
        : undefined,
      currentSummary: typeof body?.currentSummary === 'string' ? body.currentSummary.trim() : undefined,
    };

    const result = await generateProfessionalSummaries(payload);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/ai/summary route:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error processing summary generation' },
      { status: 500 }
    );
  }
}
