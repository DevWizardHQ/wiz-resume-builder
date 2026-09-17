import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildSummaryPrompt,
  generateFallbackSummaries,
  parseSummaryResponse,
  generateProfessionalSummaries,
  SummaryGenerationRequest,
} from '@/lib/ai/summary-generator';
import { useResumeStore } from '@/store/useResumeStore';
import { INITIAL_RESUME_DATA } from '@/types/resume';

describe('AI Summary Generator - Prompt Engineering', () => {
  it('constructs a detailed ATS prompt with candidate background and rules', () => {
    const request: SummaryGenerationRequest = {
      targetRole: 'Principal Cloud Architect',
      seniorityLevel: 'lead',
      yearsOfExperience: 10,
      topSkills: ['Kubernetes', 'Terraform', 'Go', 'AWS'],
      keyAchievements: ['Reduced cloud costs by 35%', 'Scaled systems to 10M DAU'],
      currentSummary: 'Experienced engineer with cloud background.',
      tone: 'impactful',
    };

    const prompt = buildSummaryPrompt(request);

    expect(prompt).toContain('Principal Cloud Architect');
    expect(prompt).toContain('lead');
    expect(prompt).toContain('10+ years');
    expect(prompt).toContain('Kubernetes, Terraform, Go, AWS');
    expect(prompt).toContain('Reduced cloud costs by 35%; Scaled systems to 10M DAU');
    expect(prompt).toContain('Current Draft: Experienced engineer with cloud background.');
    expect(prompt).toContain('NEVER use "I", "me", "my", "our", or "we"');
    expect(prompt).toContain('exactly 2 to 4 sentences');
    expect(prompt).toContain('Output ONLY the valid JSON array');
  });

  it('handles sparse/empty request gracefully in prompt generation', () => {
    const prompt = buildSummaryPrompt({});
    expect(prompt).toContain('Software Professional');
    expect(prompt).toContain('senior');
    expect(prompt).toContain('JSON');
  });
});

describe('AI Summary Generator - Deterministic Fallback Engine', () => {
  it('generates 3 distinct variations with required ATS fields', () => {
    const req: SummaryGenerationRequest = {
      jobTitle: 'Senior Full Stack Engineer',
      seniorityLevel: 'senior',
      yearsOfExperience: 6,
      topSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
    };

    const variations = generateFallbackSummaries(req);

    expect(variations).toHaveLength(3);

    const [impactful, technical, leadership] = variations;

    expect(impactful.tone).toBe('impactful');
    expect(impactful.label).toBe('Results & Impact Driven');
    expect(impactful.text).toContain('Senior Full Stack Engineer');
    expect(impactful.text).toContain('6+ years');
    expect(impactful.text).toContain('TypeScript');
    expect(impactful.wordCount).toBeGreaterThan(20);
    expect(impactful.characterCount).toBeGreaterThan(150);
    expect(impactful.keyStrengths.length).toBeGreaterThan(0);

    expect(technical.tone).toBe('technical');
    expect(technical.label).toBe('Technical & Architecture Focused');
    expect(technical.text).toContain('Senior Full Stack Engineer');

    expect(leadership.tone).toBe('leadership');
    expect(leadership.label).toBe('Leadership & Strategic Growth');
    expect(leadership.text).toContain('Senior Full Stack Engineer');
  });

  it('adapts vocabulary according to seniority levels (entry vs executive)', () => {
    const entryVars = generateFallbackSummaries({
      targetRole: 'Frontend Developer',
      seniorityLevel: 'entry',
      yearsOfExperience: 1,
      topSkills: ['JavaScript', 'HTML', 'CSS', 'React'],
    });

    const execVars = generateFallbackSummaries({
      targetRole: 'Engineering Director',
      seniorityLevel: 'executive',
      yearsOfExperience: 15,
      topSkills: ['Strategic Roadmapping', 'Executive Leadership', 'System Architecture'],
    });

    expect(entryVars[0].text).toContain('Driven Frontend Developer');
    expect(execVars[0].text).toContain('Visionary executive');
    expect(execVars[0].text).toContain('Engineering Director');
    expect(execVars[0].text).toContain('15+ years');
  });

  it('strictly adheres to ATS third-person voice (no I, me, my, we)', () => {
    const variations = generateFallbackSummaries({
      targetRole: 'Staff Software Engineer',
      seniorityLevel: 'lead',
      yearsOfExperience: '9',
      topSkills: ['Distributed Systems', 'Go', 'Kafka'],
    });

    variations.forEach((v) => {
      // Check for first person pronouns as whole words
      expect(v.text).not.toMatch(/\b(I|me|my|mine|we|us|our)\b/i);
    });
  });
});

describe('AI Summary Generator - Response Parsing', () => {
  it('parses valid JSON array correctly', () => {
    const jsonText = JSON.stringify([
      {
        id: 'results-1',
        label: 'Results & Impact Driven',
        tone: 'impactful',
        text: 'Results-driven Senior Engineer with 7+ years of experience delivering high-scale microservices. Optimized PostgreSQL query execution by 40% while reducing cloud expenditure. Adept at TypeScript and Kubernetes.',
        keyStrengths: ['Query Optimization', 'Cloud Efficiency'],
      },
      {
        id: 'tech-1',
        label: 'Technical & Architecture Focused',
        tone: 'technical',
        text: 'Architectural specialist with deep expertise in distributed systems and cloud native infrastructure. Spearheaded migration of monolith to Kubernetes with 99.99% reliability.',
        keyStrengths: ['Kubernetes', 'High Reliability'],
      },
    ]);

    const result = parseSummaryResponse(jsonText, {});
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('results-1');
    expect(result[0].tone).toBe('impactful');
    expect(result[0].wordCount).toBeGreaterThan(15);
    expect(result[0].keyStrengths).toContain('Query Optimization');
  });

  it('parses JSON enclosed in markdown code fences', () => {
    const fencedText = `\`\`\`json
[
  {
    "id": "var-1",
    "tone": "impactful",
    "label": "High Impact",
    "text": "Accomplished software engineer with proven track record of accelerating digital product delivery. Leveraged Next.js to increase user engagement by 30%.",
    "keyStrengths": ["Product Velocity"]
  }
]
\`\`\``;

    const result = parseSummaryResponse(fencedText, {});
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('var-1');
    expect(result[0].text).toContain('Accomplished software engineer');
  });

  it('falls back to rule-based generation when response is invalid or empty', () => {
    const result = parseSummaryResponse('Unexpected server error without JSON', {
      targetRole: 'QA Automation Engineer',
      seniorityLevel: 'mid',
    });

    expect(result).toHaveLength(3);
    expect(result[0].text).toContain('QA Automation Engineer');
  });
});

describe('AI Summary Generator - Full Provider Pipeline', () => {
  it('returns deterministic fallback variations when no external API is configured', async () => {
    const result = await generateProfessionalSummaries({
      targetRole: 'Data Platform Engineer',
      seniorityLevel: 'senior',
      yearsOfExperience: 5,
      topSkills: ['Python', 'Apache Spark', 'Snowflake', 'SQL'],
    });

    expect(result.variations).toHaveLength(3);
    expect(result.source).toBe('fallback');
    expect(result.modelUsed).toBe('heuristic-engine');
    expect(result.variations[0].text).toContain('Data Platform Engineer');
  });
});

describe('AI Summary Generator - Zustand Store Integration', () => {
  beforeEach(() => {
    useResumeStore.setState({
      data: {
        ...INITIAL_RESUME_DATA,
        summary: { text: 'Old draft summary', visible: true },
      },
      past: [],
      future: [],
      isDirty: false,
    });
  });

  it('updates summary text and visibility while recording history snapshot', () => {
    const store = useResumeStore.getState();
    const newSummary =
      'High-performing Senior Full Stack Engineer with 7+ years of experience architecting cloud-native solutions.';

    store.updateSummary(newSummary, true);

    const updatedState = useResumeStore.getState();
    expect(updatedState.data.summary.text).toBe(newSummary);
    expect(updatedState.data.summary.visible).toBe(true);
    expect(updatedState.isDirty).toBe(true);

    // History stack should have recorded the previous state
    expect(updatedState.past.length).toBe(1);
    expect(updatedState.past[0].data.summary.text).toBe('Old draft summary');

    // Undo should restore previous state
    updatedState.undo();
    const restoredState = useResumeStore.getState();
    expect(restoredState.data.summary.text).toBe('Old draft summary');
  });
});
