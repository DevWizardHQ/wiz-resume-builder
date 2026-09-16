import { describe, it, expect, beforeEach } from 'vitest';
import { useResumeStore } from '@/store/useResumeStore';
import { DEFAULT_SECTION_ORDER, INITIAL_RESUME_DATA, SectionKey, TemplateId } from '@/types/resume';

describe('Dual-Pane Live Editor Component Logic & State', () => {
  beforeEach(() => {
    useResumeStore.getState().resetResume();
  });

  describe('Resume Store Section & Item Integration', () => {
    it('initializes with default section order containing all 11 sections', () => {
      const state = useResumeStore.getState();
      expect(state.sectionOrder).toEqual(DEFAULT_SECTION_ORDER);
      expect(state.sectionOrder.length).toBe(11);
      expect(state.sectionOrder).toContain('contact');
      expect(state.sectionOrder).toContain('summary');
      expect(state.sectionOrder).toContain('experience');
      expect(state.sectionOrder).toContain('projects');
      expect(state.sectionOrder).toContain('education');
      expect(state.sectionOrder).toContain('skills');
      expect(state.sectionOrder).toContain('certifications');
      expect(state.sectionOrder).toContain('involvement');
      expect(state.sectionOrder).toContain('awards');
      expect(state.sectionOrder).toContain('publications');
      expect(state.sectionOrder).toContain('references');
    });

    it('reorders top-level sections via moveSection', () => {
      const store = useResumeStore.getState();
      const initialOrder = [...store.sectionOrder];

      // Move experience before summary
      store.moveSection('experience', 'summary');

      const updatedOrder = useResumeStore.getState().sectionOrder;
      expect(updatedOrder.indexOf('experience')).toBeLessThan(updatedOrder.indexOf('summary'));
      expect(updatedOrder.length).toBe(initialOrder.length);
    });

    it('adds and updates publications in store', () => {
      const store = useResumeStore.getState();
      const pubId = 'pub-test-1';

      store.addItem('publications', {
        id: pubId,
        title: 'Distributed Consensus with Raft',
        publisher: 'ACM Queue',
        date: '2023-08',
        url: 'https://doi.org/10.1145/test',
        authors: ['Alice Doe', 'Bob Smith'],
        visible: true,
        order: 0,
      });

      let pubs = useResumeStore.getState().data.publications;
      expect(pubs.length).toBe(1);
      expect(pubs[0].title).toBe('Distributed Consensus with Raft');

      // Update publication
      store.updateItem('publications', pubId, {
        title: 'Distributed Consensus with Raft (2nd Edition)',
      });

      pubs = useResumeStore.getState().data.publications;
      expect(pubs[0].title).toBe('Distributed Consensus with Raft (2nd Edition)');

      // Toggle visibility
      store.toggleItemVisibility('publications', pubId);
      pubs = useResumeStore.getState().data.publications;
      expect(pubs[0].visible).toBe(false);

      // Remove publication
      store.removeItem('publications', pubId);
      pubs = useResumeStore.getState().data.publications;
      expect(pubs.length).toBe(0);
    });

    it('adds and updates references in store', () => {
      const store = useResumeStore.getState();
      const refId = 'ref-test-1';

      store.addItem('references', {
        id: refId,
        name: 'Dr. Sarah Connor',
        company: 'Cyberdyne Systems',
        relationship: 'Former Director of Engineering',
        contact: 'sarah.connor@example.com',
        visible: true,
        order: 0,
      });

      let refs = useResumeStore.getState().data.references;
      expect(refs.length).toBe(1);
      expect(refs[0].name).toBe('Dr. Sarah Connor');

      // Update reference
      store.updateItem('references', refId, {
        contact: '+1 555-0199',
      });

      refs = useResumeStore.getState().data.references;
      expect(refs[0].contact).toBe('+1 555-0199');

      // Delete reference
      store.removeItem('references', refId);
      refs = useResumeStore.getState().data.references;
      expect(refs.length).toBe(0);
    });

    it('switches templates seamlessly between classic-ats, modern-minimal, and executive', () => {
      const store = useResumeStore.getState();
      expect(store.templateId).toBe('classic-ats');

      store.setTemplateId('modern-minimal');
      expect(useResumeStore.getState().templateId).toBe('modern-minimal');

      store.setTemplateId('executive');
      expect(useResumeStore.getState().templateId).toBe('executive');

      store.setTemplateId('classic-ats');
      expect(useResumeStore.getState().templateId).toBe('classic-ats');
    });

    it('supports undo and redo on title and section changes', () => {
      const store = useResumeStore.getState();
      expect(store.title).toBe('Untitled Resume');

      store.setTitle('Senior Backend Architect');
      expect(useResumeStore.getState().title).toBe('Senior Backend Architect');

      store.undo();
      expect(useResumeStore.getState().title).toBe('Untitled Resume');

      store.redo();
      expect(useResumeStore.getState().title).toBe('Senior Backend Architect');
    });
  });
});
