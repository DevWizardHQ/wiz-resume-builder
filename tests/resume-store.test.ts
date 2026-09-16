import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useResumeStore, MAX_HISTORY_STEPS, AUTO_SAVE_DEBOUNCE_MS } from '@/store/useResumeStore';
import {
  DEFAULT_SECTION_ORDER,
  INITIAL_RESUME_DATA,
  ExperienceItem,
  ProjectItem,
  EducationItem,
  SkillCategory,
  CertificationItem,
  InvolvementItem,
  AwardItem,
  PublicationItem,
  ResumeRecord,
} from '@/types/resume';

describe('useResumeStore (Zustand Store)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useResumeStore.getState().resetResume();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Initialization & Metadata Actions', () => {
    it('initializes with default resume state', () => {
      const state = useResumeStore.getState();

      expect(state.resumeId).toBeNull();
      expect(state.title).toBe('Untitled Resume');
      expect(state.slug).toBe('untitled-resume');
      expect(state.templateId).toBe('classic-ats');
      expect(state.sectionOrder).toEqual(DEFAULT_SECTION_ORDER);
      expect(state.data).toEqual(INITIAL_RESUME_DATA);
      expect(state.atsScore).toBe(0);
      expect(state.isSaving).toBe(false);
      expect(state.isDirty).toBe(false);
      expect(state.lastSaved).toBeNull();
      expect(state.saveError).toBeNull();
      expect(state.past).toEqual([]);
      expect(state.future).toEqual([]);
    });

    it('resets state completely on resetResume', () => {
      const store = useResumeStore.getState();
      store.setTitle('Modified Title');
      store.setTemplateId('modern-minimal');
      store.updateContact({ fullName: 'Alice Doe' });

      expect(useResumeStore.getState().title).toBe('Modified Title');
      expect(useResumeStore.getState().isDirty).toBe(true);

      useResumeStore.getState().resetResume();
      const resetState = useResumeStore.getState();

      expect(resetState.title).toBe('Untitled Resume');
      expect(resetState.templateId).toBe('classic-ats');
      expect(resetState.data.contact.fullName).toBe('');
      expect(resetState.isDirty).toBe(false);
      expect(resetState.past).toEqual([]);
      expect(resetState.future).toEqual([]);
    });

    it('loads a full or partial resume via loadResume', () => {
      const mockRecord: Partial<ResumeRecord> = {
        id: 'res-123',
        title: 'Senior Software Engineer Resume',
        slug: 'senior-swe-resume',
        template_id: 'executive',
        section_order: ['contact', 'experience', 'education', 'skills'],
        ats_score: 88,
        updated_at: '2026-03-01T12:00:00.000Z',
        content: {
          ...INITIAL_RESUME_DATA,
          contact: {
            fullName: 'Jane Doe',
            email: 'jane@example.com',
            phone: '+1 555-0199',
            location: 'San Francisco, CA',
            linkedinUrl: 'https://linkedin.com/in/janedoe',
          },
          summary: {
            text: 'Seasoned Tech Lead with 10+ years experience.',
            visible: true,
          },
        },
      };

      useResumeStore.getState().loadResume(mockRecord);
      const state = useResumeStore.getState();

      expect(state.resumeId).toBe('res-123');
      expect(state.title).toBe('Senior Software Engineer Resume');
      expect(state.slug).toBe('senior-swe-resume');
      expect(state.templateId).toBe('executive');
      expect(state.sectionOrder).toEqual(['contact', 'experience', 'education', 'skills']);
      expect(state.atsScore).toBe(88);
      expect(state.lastSaved).toBe('2026-03-01T12:00:00.000Z');
      expect(state.data.contact.fullName).toBe('Jane Doe');
      expect(state.data.summary.text).toBe('Seasoned Tech Lead with 10+ years experience.');
      expect(state.isDirty).toBe(false);
      expect(state.past).toEqual([]);
      expect(state.future).toEqual([]);
    });

    it('updates title, templateId, and atsScore', () => {
      useResumeStore.getState().setTitle('New Title');
      expect(useResumeStore.getState().title).toBe('New Title');
      expect(useResumeStore.getState().isDirty).toBe(true);

      useResumeStore.getState().setTemplateId('modern-minimal');
      expect(useResumeStore.getState().templateId).toBe('modern-minimal');

      useResumeStore.getState().setAtsScore(95);
      expect(useResumeStore.getState().atsScore).toBe(95);
    });
  });

  describe('Section Order and Section Moving Actions', () => {
    it('sets a new section order array', () => {
      const customOrder = ['summary', 'skills', 'experience', 'education'] as const;
      useResumeStore.getState().setSectionOrder([...customOrder]);

      const state = useResumeStore.getState();
      expect(state.sectionOrder).toEqual(customOrder);
      expect(state.isDirty).toBe(true);
      expect(state.past.length).toBe(1);
    });

    it('moves a section from activeKey to overKey via moveSection', () => {
      const initialOrder = [...useResumeStore.getState().sectionOrder];
      // Move 'experience' to position of 'contact' (index 0)
      useResumeStore.getState().moveSection('experience', 'contact');

      const newOrder = useResumeStore.getState().sectionOrder;
      expect(newOrder[0]).toBe('experience');
      expect(newOrder[1]).toBe('contact');
      expect(newOrder.length).toBe(initialOrder.length);
      expect(useResumeStore.getState().past.length).toBe(1);
    });

    it('does nothing when moving a section to its current position or invalid section keys', () => {
      const initialOrder = [...useResumeStore.getState().sectionOrder];

      // Move same to same
      useResumeStore.getState().moveSection('experience', 'experience');
      expect(useResumeStore.getState().sectionOrder).toEqual(initialOrder);
      expect(useResumeStore.getState().past.length).toBe(0);

      // Move invalid key
      useResumeStore.getState().moveSection('invalid' as any, 'contact');
      expect(useResumeStore.getState().sectionOrder).toEqual(initialOrder);
      expect(useResumeStore.getState().past.length).toBe(0);
    });
  });

  describe('Contact and Summary Mutations', () => {
    it('updates contact information incrementally', () => {
      useResumeStore.getState().updateContact({
        fullName: 'Johnathan Doe',
        email: 'johnathan@example.com',
      });

      let state = useResumeStore.getState();
      expect(state.data.contact.fullName).toBe('Johnathan Doe');
      expect(state.data.contact.email).toBe('johnathan@example.com');
      expect(state.data.contact.phone).toBe(''); // Unchanged

      useResumeStore.getState().updateContact({
        phone: '+1-555-4321',
        githubUrl: 'https://github.com/johndoe',
      });

      state = useResumeStore.getState();
      expect(state.data.contact.fullName).toBe('Johnathan Doe');
      expect(state.data.contact.phone).toBe('+1-555-4321');
      expect(state.data.contact.githubUrl).toBe('https://github.com/johndoe');
      expect(state.isDirty).toBe(true);
    });

    it('updates summary text and visibility', () => {
      useResumeStore.getState().updateSummary('Full stack engineer with 5 years exp.', true);
      let state = useResumeStore.getState();
      expect(state.data.summary.text).toBe('Full stack engineer with 5 years exp.');
      expect(state.data.summary.visible).toBe(true);

      // Update text while keeping visibility
      useResumeStore.getState().updateSummary('Updated summary text');
      state = useResumeStore.getState();
      expect(state.data.summary.text).toBe('Updated summary text');
      expect(state.data.summary.visible).toBe(true);

      // Toggle visibility
      useResumeStore.getState().updateSummary('Updated summary text', false);
      state = useResumeStore.getState();
      expect(state.data.summary.visible).toBe(false);
    });
  });

  describe('Item Operations (CRUD, Reordering, Visibility)', () => {
    const sampleExp: ExperienceItem = {
      id: 'exp-1',
      visible: true,
      order: 0,
      company: 'Tech Innovators',
      role: 'Frontend Architect',
      startDate: '2022-01',
      endDate: 'Present',
      current: true,
      bullets: ['Built scalable micro-frontends in Next.js'],
    };

    it('adds items with automatic order indexing and default visibility', () => {
      useResumeStore.getState().addItem('experience', sampleExp);

      const state = useResumeStore.getState();
      expect(state.data.experience.length).toBe(1);
      expect(state.data.experience[0].id).toBe('exp-1');
      expect(state.data.experience[0].order).toBe(0);
      expect(state.data.experience[0].visible).toBe(true);

      const secondExp: ExperienceItem = {
        id: 'exp-2',
        visible: true,
        order: 0,
        company: 'Old Corp',
        role: 'Junior Dev',
        startDate: '2020-01',
        endDate: '2021-12',
        current: false,
        bullets: ['Maintained web portals'],
      };

      useResumeStore.getState().addItem('experience', secondExp);
      const updatedState = useResumeStore.getState();
      expect(updatedState.data.experience.length).toBe(2);
      expect(updatedState.data.experience[1].id).toBe('exp-2');
      expect(updatedState.data.experience[1].order).toBe(1);
    });

    it('updates existing item fields via updateItem', () => {
      useResumeStore.getState().addItem('experience', sampleExp);

      useResumeStore.getState().updateItem('experience', 'exp-1', {
        role: 'Principal Engineer',
        location: 'Remote, US',
      });

      const updated = useResumeStore.getState().data.experience[0];
      expect(updated.role).toBe('Principal Engineer');
      expect(updated.location).toBe('Remote, US');
      expect(updated.company).toBe('Tech Innovators'); // Kept intact
    });

    it('gracefully handles updateItem for non-existent item id', () => {
      useResumeStore.getState().addItem('experience', sampleExp);
      const pastLen = useResumeStore.getState().past.length;

      useResumeStore.getState().updateItem('experience', 'non-existent-id', {
        role: 'Ghost Role',
      });

      expect(useResumeStore.getState().past.length).toBe(pastLen);
    });

    it('removes an item and re-indexes the order of remaining items', () => {
      const exp1: ExperienceItem = { ...sampleExp, id: 'exp-1' };
      const exp2: ExperienceItem = { ...sampleExp, id: 'exp-2', company: 'Company 2' };
      const exp3: ExperienceItem = { ...sampleExp, id: 'exp-3', company: 'Company 3' };

      useResumeStore.getState().addItem('experience', exp1);
      useResumeStore.getState().addItem('experience', exp2);
      useResumeStore.getState().addItem('experience', exp3);

      expect(useResumeStore.getState().data.experience.map((e) => e.id)).toEqual([
        'exp-1',
        'exp-2',
        'exp-3',
      ]);

      // Remove middle item (exp-2)
      useResumeStore.getState().removeItem('experience', 'exp-2');

      const remaining = useResumeStore.getState().data.experience;
      expect(remaining.map((e) => e.id)).toEqual(['exp-1', 'exp-3']);
      expect(remaining.map((e) => e.order)).toEqual([0, 1]);
    });

    it('toggles item visibility state', () => {
      useResumeStore.getState().addItem('experience', sampleExp);

      expect(useResumeStore.getState().data.experience[0].visible).toBe(true);

      useResumeStore.getState().toggleItemVisibility('experience', 'exp-1');
      expect(useResumeStore.getState().data.experience[0].visible).toBe(false);

      useResumeStore.getState().toggleItemVisibility('experience', 'exp-1');
      expect(useResumeStore.getState().data.experience[0].visible).toBe(true);
    });

    it('reorders items within a section using activeId and overId', () => {
      const exp1: ExperienceItem = { ...sampleExp, id: 'exp-1' };
      const exp2: ExperienceItem = { ...sampleExp, id: 'exp-2', company: 'Company 2' };
      const exp3: ExperienceItem = { ...sampleExp, id: 'exp-3', company: 'Company 3' };

      useResumeStore.getState().addItem('experience', exp1);
      useResumeStore.getState().addItem('experience', exp2);
      useResumeStore.getState().addItem('experience', exp3);

      // Move exp-3 to index of exp-1 (top)
      useResumeStore.getState().reorderItems('experience', 'exp-3', 'exp-1');

      const reordered = useResumeStore.getState().data.experience;
      expect(reordered.map((e) => e.id)).toEqual(['exp-3', 'exp-1', 'exp-2']);
      expect(reordered.map((e) => e.order)).toEqual([0, 1, 2]);
    });

    it('does nothing when reordering with identical or non-existent ids', () => {
      useResumeStore.getState().addItem('experience', sampleExp);
      const pastLen = useResumeStore.getState().past.length;

      useResumeStore.getState().reorderItems('experience', 'exp-1', 'exp-1');
      expect(useResumeStore.getState().past.length).toBe(pastLen);

      useResumeStore.getState().reorderItems('experience', 'exp-1', 'unknown-id');
      expect(useResumeStore.getState().past.length).toBe(pastLen);
    });

    it('works across different array sections (projects, education, skills, certs, awards, publications)', () => {
      const project: ProjectItem = {
        id: 'proj-1',
        visible: true,
        order: 0,
        name: 'AI Resume Builder',
        technologies: ['Next.js', 'TypeScript'],
        bullets: ['Built full app'],
      };
      const education: EducationItem = {
        id: 'edu-1',
        visible: true,
        order: 0,
        institution: 'MIT',
        degree: 'B.S.',
        fieldOfStudy: 'CS',
        startDate: '2016-09',
        endDate: '2020-05',
      };
      const skill: SkillCategory = {
        id: 'skill-1',
        visible: true,
        order: 0,
        categoryName: 'Languages',
        skills: ['TypeScript', 'Python', 'Go'],
      };

      useResumeStore.getState().addItem('projects', project);
      useResumeStore.getState().addItem('education', education);
      useResumeStore.getState().addItem('skills', skill);

      const state = useResumeStore.getState();
      expect(state.data.projects.length).toBe(1);
      expect(state.data.education.length).toBe(1);
      expect(state.data.skills.length).toBe(1);
    });
  });

  describe('Reverse-Chronological Date Auto-Sorting', () => {
    it('sorts experience section reverse-chronologically with sortSectionByDate', () => {
      const expOld: ExperienceItem = {
        id: 'exp-old',
        visible: true,
        order: 0,
        company: 'Old Corp',
        role: 'Dev',
        startDate: '2018-01',
        endDate: '2019-12',
        current: false,
        bullets: [],
      };
      const expMid: ExperienceItem = {
        id: 'exp-mid',
        visible: true,
        order: 1,
        company: 'Mid Corp',
        role: 'Dev',
        startDate: '2020-01',
        endDate: '2022-01',
        current: false,
        bullets: [],
      };
      const expPresent: ExperienceItem = {
        id: 'exp-now',
        visible: true,
        order: 2,
        company: 'Now Corp',
        role: 'Lead',
        startDate: '2022-02',
        endDate: 'Present',
        current: true,
        bullets: [],
      };

      useResumeStore.getState().addItem('experience', expOld);
      useResumeStore.getState().addItem('experience', expMid);
      useResumeStore.getState().addItem('experience', expPresent);

      useResumeStore.getState().sortSectionByDate('experience');

      const sorted = useResumeStore.getState().data.experience;
      expect(sorted.map((e) => e.id)).toEqual(['exp-now', 'exp-mid', 'exp-old']);
      expect(sorted.map((e) => e.order)).toEqual([0, 1, 2]);
    });

    it('sorts projects section reverse-chronologically', () => {
      const proj1: ProjectItem = {
        id: 'proj-1',
        visible: true,
        order: 0,
        name: 'Early Project',
        startDate: '2020-01',
        endDate: '2020-06',
        technologies: [],
        bullets: [],
      };
      const proj2: ProjectItem = {
        id: 'proj-2',
        visible: true,
        order: 1,
        name: 'Recent Project',
        startDate: '2023-01',
        endDate: '2023-12',
        technologies: [],
        bullets: [],
      };

      useResumeStore.getState().addItem('projects', proj1);
      useResumeStore.getState().addItem('projects', proj2);

      useResumeStore.getState().sortSectionByDate('projects');

      const sorted = useResumeStore.getState().data.projects;
      expect(sorted.map((p) => p.id)).toEqual(['proj-2', 'proj-1']);
      expect(sorted.map((p) => p.order)).toEqual([0, 1]);
    });

    it('sorts education, involvement, certifications, awards, and publications', () => {
      const edu1: EducationItem = {
        id: 'edu-1',
        visible: true,
        order: 0,
        institution: 'BS College',
        degree: 'B.S.',
        fieldOfStudy: 'CS',
        startDate: '2016-08',
        endDate: '2020-05',
      };
      const edu2: EducationItem = {
        id: 'edu-2',
        visible: true,
        order: 1,
        institution: 'MS College',
        degree: 'M.S.',
        fieldOfStudy: 'AI',
        startDate: '2021-08',
        endDate: '2023-05',
      };
      useResumeStore.getState().addItem('education', edu1);
      useResumeStore.getState().addItem('education', edu2);
      useResumeStore.getState().sortSectionByDate('education');
      expect(useResumeStore.getState().data.education.map((e) => e.id)).toEqual(['edu-2', 'edu-1']);

      const cert1: CertificationItem = {
        id: 'cert-1',
        visible: true,
        order: 0,
        name: 'AWS CAA',
        issuer: 'AWS',
        issueDate: '2021-01',
      };
      const cert2: CertificationItem = {
        id: 'cert-2',
        visible: true,
        order: 1,
        name: 'CKA',
        issuer: 'CNCF',
        issueDate: '2023-05',
      };
      useResumeStore.getState().addItem('certifications', cert1);
      useResumeStore.getState().addItem('certifications', cert2);
      useResumeStore.getState().sortSectionByDate('certifications');
      expect(useResumeStore.getState().data.certifications.map((c) => c.id)).toEqual([
        'cert-2',
        'cert-1',
      ]);

      const award1: AwardItem = {
        id: 'award-1',
        visible: true,
        order: 0,
        title: 'Award 2020',
        issuer: 'Org',
        date: '2020-01',
      };
      const award2: AwardItem = {
        id: 'award-2',
        visible: true,
        order: 1,
        title: 'Award 2024',
        issuer: 'Org',
        date: '2024-01',
      };
      useResumeStore.getState().addItem('awards', award1);
      useResumeStore.getState().addItem('awards', award2);
      useResumeStore.getState().sortSectionByDate('awards');
      expect(useResumeStore.getState().data.awards.map((a) => a.id)).toEqual(['award-2', 'award-1']);

      const pub1: PublicationItem = {
        id: 'pub-1',
        visible: true,
        order: 0,
        title: 'Paper 1',
        publisher: 'IEEE',
        date: '2019-01',
        authors: ['Me'],
      };
      const pub2: PublicationItem = {
        id: 'pub-2',
        visible: true,
        order: 1,
        title: 'Paper 2',
        publisher: 'ACM',
        date: '2023-01',
        authors: ['Me'],
      };
      useResumeStore.getState().addItem('publications', pub1);
      useResumeStore.getState().addItem('publications', pub2);
      useResumeStore.getState().sortSectionByDate('publications');
      expect(useResumeStore.getState().data.publications.map((p) => p.id)).toEqual(['pub-2', 'pub-1']);
    });

    it('gracefully handles non-sortable sections like skills, contact, summary', () => {
      const pastLen = useResumeStore.getState().past.length;
      useResumeStore.getState().sortSectionByDate('skills');
      useResumeStore.getState().sortSectionByDate('contact');
      useResumeStore.getState().sortSectionByDate('summary');

      expect(useResumeStore.getState().past.length).toBe(pastLen);
    });
  });

  describe('Undo / Redo Time-Travel Mechanics', () => {
    it('correctly reverts changes on undo and re-applies on redo', () => {
      useResumeStore.getState().setTitle('Initial Title');
      useResumeStore.getState().updateContact({ fullName: 'Alice' });
      useResumeStore.getState().updateContact({ fullName: 'Alice Smith' });

      expect(useResumeStore.getState().data.contact.fullName).toBe('Alice Smith');
      expect(useResumeStore.getState().past.length).toBe(3);
      expect(useResumeStore.getState().future.length).toBe(0);

      // Undo 1: Back to 'Alice'
      useResumeStore.getState().undo();
      expect(useResumeStore.getState().data.contact.fullName).toBe('Alice');
      expect(useResumeStore.getState().past.length).toBe(2);
      expect(useResumeStore.getState().future.length).toBe(1);

      // Undo 2: Back to '' (Initial Title step)
      useResumeStore.getState().undo();
      expect(useResumeStore.getState().data.contact.fullName).toBe('');
      expect(useResumeStore.getState().title).toBe('Initial Title');

      // Undo 3: Back to 'Untitled Resume'
      useResumeStore.getState().undo();
      expect(useResumeStore.getState().title).toBe('Untitled Resume');
      expect(useResumeStore.getState().past.length).toBe(0);

      // Extra undo when past is empty is a no-op
      useResumeStore.getState().undo();
      expect(useResumeStore.getState().title).toBe('Untitled Resume');

      // Redo 1: Re-applies 'Initial Title'
      useResumeStore.getState().redo();
      expect(useResumeStore.getState().title).toBe('Initial Title');

      // Redo 2: Re-applies 'Alice'
      useResumeStore.getState().redo();
      expect(useResumeStore.getState().data.contact.fullName).toBe('Alice');

      // Redo 3: Re-applies 'Alice Smith'
      useResumeStore.getState().redo();
      expect(useResumeStore.getState().data.contact.fullName).toBe('Alice Smith');
      expect(useResumeStore.getState().future.length).toBe(0);

      // Extra redo when future is empty is a no-op
      useResumeStore.getState().redo();
      expect(useResumeStore.getState().data.contact.fullName).toBe('Alice Smith');
    });

    it('clears future stack when a new mutation happens after undo', () => {
      useResumeStore.getState().setTitle('Title 1');
      useResumeStore.getState().setTitle('Title 2');
      useResumeStore.getState().setTitle('Title 3');

      expect(useResumeStore.getState().past.length).toBe(3);

      useResumeStore.getState().undo(); // Back to Title 2
      expect(useResumeStore.getState().title).toBe('Title 2');
      expect(useResumeStore.getState().future.length).toBe(1);

      // New mutation branches history
      useResumeStore.getState().setTitle('Title 2-Branched');
      expect(useResumeStore.getState().title).toBe('Title 2-Branched');
      expect(useResumeStore.getState().future.length).toBe(0);

      // Redo should do nothing now
      useResumeStore.getState().redo();
      expect(useResumeStore.getState().title).toBe('Title 2-Branched');
    });

    it('caps history at MAX_HISTORY_STEPS (30 steps)', () => {
      expect(MAX_HISTORY_STEPS).toBe(30);

      // Perform 35 mutations
      for (let i = 1; i <= 35; i++) {
        useResumeStore.getState().setTitle(`Title Version ${i}`);
      }

      expect(useResumeStore.getState().title).toBe('Title Version 35');
      expect(useResumeStore.getState().past.length).toBe(30);

      // Undo 30 times
      for (let i = 0; i < 30; i++) {
        useResumeStore.getState().undo();
      }

      // We should be at Title Version 5 (35 - 30)
      expect(useResumeStore.getState().title).toBe('Title Version 5');
      expect(useResumeStore.getState().past.length).toBe(0);

      // Future should also be capped at 30
      expect(useResumeStore.getState().future.length).toBe(30);
    });

    it('ensures deep isolation between historical snapshots and current mutations', () => {
      const expItem: ExperienceItem = {
        id: 'exp-isolation',
        visible: true,
        order: 0,
        company: 'Original Company',
        role: 'Dev',
        startDate: '2020-01',
        bullets: ['Bullet 1'],
        current: false,
      };

      useResumeStore.getState().addItem('experience', expItem);
      useResumeStore.getState().updateItem('experience', 'exp-isolation', {
        company: 'Mutated Company',
      });

      expect(useResumeStore.getState().data.experience[0].company).toBe('Mutated Company');
      expect(useResumeStore.getState().past[1].data.experience[0].company).toBe('Original Company');

      useResumeStore.getState().undo();
      expect(useResumeStore.getState().data.experience[0].company).toBe('Original Company');
    });
  });

  describe('Auto-Save & Force Save Synchronization', () => {
    it('schedules debounced auto-save on state mutation and debounces multiple rapid mutations', () => {
      useResumeStore.getState().loadResume({ id: 'resume-debounce-test', title: 'Debounce Resume' });

      const forceSaveSpy = vi.spyOn(useResumeStore.getState(), 'forceSave').mockResolvedValue();

      useResumeStore.getState().setTitle('Debounce Title 1');
      useResumeStore.getState().setTitle('Debounce Title 2');
      useResumeStore.getState().setTitle('Debounce Title 3');

      expect(useResumeStore.getState().saveTimeoutId).not.toBeNull();

      // Fast forward less than debounce interval
      vi.advanceTimersByTime(AUTO_SAVE_DEBOUNCE_MS - 500);
      expect(forceSaveSpy).not.toHaveBeenCalled();

      // Fast forward past remaining debounce interval
      vi.advanceTimersByTime(600);
      expect(forceSaveSpy).toHaveBeenCalledTimes(1);
    });

    it('does not forceSave if resumeId is missing or store is not dirty', async () => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy as any;

      // Clean state, no resumeId
      await useResumeStore.getState().forceSave();
      expect(fetchSpy).not.toHaveBeenCalled();

      // Set resumeId without making dirty
      useResumeStore.getState().loadResume({ id: 'clean-res', title: 'Clean Resume' });
      await useResumeStore.getState().forceSave();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('executes PATCH request on forceSave when dirty and updates sync status on success', async () => {
      const mockSuccessResponse = {
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      };
      globalThis.fetch = vi.fn().mockResolvedValue(mockSuccessResponse);

      useResumeStore.getState().loadResume({ id: 'res-sync-1', title: 'Sync Resume' });
      useResumeStore.getState().setTitle('Updated Title for Save');

      expect(useResumeStore.getState().isDirty).toBe(true);

      await useResumeStore.getState().forceSave();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/resumes/res-sync-1',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const state = useResumeStore.getState();
      expect(state.isSaving).toBe(false);
      expect(state.isDirty).toBe(false);
      expect(state.saveError).toBeNull();
      expect(state.lastSaved).not.toBeNull();
    });

    it('captures saveError when network call or server returns an error', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      };
      globalThis.fetch = vi.fn().mockResolvedValue(mockErrorResponse);

      useResumeStore.getState().loadResume({ id: 'res-sync-fail', title: 'Fail Resume' });
      useResumeStore.getState().setTitle('Failed Save Title');

      await useResumeStore.getState().forceSave();

      const state = useResumeStore.getState();
      expect(state.isSaving).toBe(false);
      expect(state.isDirty).toBe(true); // Remains dirty if save failed
      expect(state.saveError).toBe('Failed to save resume (status 500)');
    });

    it('allows manually setting save error via setSaveError', () => {
      useResumeStore.getState().setSaveError('Custom Network Error');
      expect(useResumeStore.getState().saveError).toBe('Custom Network Error');

      useResumeStore.getState().setSaveError(null);
      expect(useResumeStore.getState().saveError).toBeNull();
    });
  });
});
