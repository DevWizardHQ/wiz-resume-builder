import { create } from 'zustand';
import {
  ContactInfo,
  DEFAULT_SECTION_ORDER,
  INITIAL_RESUME_DATA,
  ResumeData,
  ResumeRecord,
  SectionKey,
  TemplateId,
} from '@/types/resume';
import {
  sortAwardsByDate,
  sortCertificationsByDate,
  sortEducationByDate,
  sortExperiencesByDate,
  sortInvolvementsByDate,
  sortProjectsByDate,
} from '@/lib/utils/date-sorter';

const MAX_HISTORY_STEPS = 30;
const AUTO_SAVE_DEBOUNCE_MS = 1500;

interface ResumeHistoryState {
  data: ResumeData;
  sectionOrder: SectionKey[];
  templateId: TemplateId;
  title: string;
}

interface ResumeStoreState {
  // Resume Metadata & Content
  resumeId: string | null;
  title: string;
  slug: string;
  templateId: TemplateId;
  sectionOrder: SectionKey[];
  data: ResumeData;
  atsScore: number;

  // Sync / Auto-save Status
  isSaving: boolean;
  isDirty: boolean;
  lastSaved: string | null;
  saveError: string | null;

  // History for Undo/Redo
  past: ResumeHistoryState[];
  future: ResumeHistoryState[];

  // Internal timer reference
  saveTimeoutId: NodeJS.Timeout | null;

  // Actions: Initialization & Metadata
  loadResume: (resume: Partial<ResumeRecord>) => void;
  resetResume: () => void;
  setTitle: (title: string) => void;
  setTemplateId: (templateId: TemplateId) => void;
  setAtsScore: (score: number) => void;

  // Actions: Section Level DND & Visibility
  setSectionOrder: (newOrder: SectionKey[]) => void;
  moveSection: (activeKey: SectionKey, overKey: SectionKey) => void;

  // Actions: Section Content Mutations
  updateContact: (contact: Partial<ContactInfo>) => void;
  updateSummary: (text: string, visible?: boolean) => void;

  // Actions: Generic Array Items (Experience, Projects, Education, etc.)
  addItem: <K extends keyof ResumeData>(
    section: K,
    item: ResumeData[K] extends (infer U)[] ? U : never
  ) => void;
  updateItem: <K extends keyof ResumeData>(
    section: K,
    id: string,
    updates: Partial<ResumeData[K] extends (infer U)[] ? U : never>
  ) => void;
  removeItem: <K extends keyof ResumeData>(section: K, id: string) => void;
  toggleItemVisibility: <K extends keyof ResumeData>(section: K, id: string) => void;
  reorderItems: <K extends keyof ResumeData>(
    section: K,
    activeId: string,
    overId: string
  ) => void;
  sortSectionByDate: (section: keyof ResumeData) => void;

  // Actions: Undo / Redo
  undo: () => void;
  redo: () => void;

  // Actions: Auto-save & Manual Save
  triggerAutoSave: () => void;
  forceSave: () => Promise<void>;
  setSaveError: (error: string | null) => void;
}

export const useResumeStore = create<ResumeStoreState>((set, get) => {
  /**
   * Helper: Push current state to past history stack before mutating
   */
  const snapshot = (state: ResumeStoreState): Partial<ResumeStoreState> => {
    const current: ResumeHistoryState = {
      data: JSON.parse(JSON.stringify(state.data)),
      sectionOrder: [...state.sectionOrder],
      templateId: state.templateId,
      title: state.title,
    };

    const newPast = [...state.past, current].slice(-MAX_HISTORY_STEPS);
    return {
      past: newPast,
      future: [],
      isDirty: true,
    };
  };

  /**
   * Schedules a debounced auto-save execution
   */
  const scheduleSave = () => {
    const state = get();
    if (state.saveTimeoutId) {
      clearTimeout(state.saveTimeoutId);
    }

    const timeoutId = setTimeout(async () => {
      await get().forceSave();
    }, AUTO_SAVE_DEBOUNCE_MS);

    set({ saveTimeoutId: timeoutId });
  };

  return {
    // Initial State
    resumeId: null,
    title: 'Untitled Resume',
    slug: 'untitled-resume',
    templateId: 'classic-ats',
    sectionOrder: DEFAULT_SECTION_ORDER,
    data: INITIAL_RESUME_DATA,
    atsScore: 0,

    isSaving: false,
    isDirty: false,
    lastSaved: null,
    saveError: null,

    past: [],
    future: [],
    saveTimeoutId: null,

    loadResume: (resume) => {
      set({
        resumeId: resume.id || null,
        title: resume.title || 'Untitled Resume',
        slug: resume.slug || 'untitled-resume',
        templateId: (resume.template_id as TemplateId) || 'classic-ats',
        sectionOrder: resume.section_order?.length
          ? resume.section_order
          : DEFAULT_SECTION_ORDER,
        data: resume.content ? { ...INITIAL_RESUME_DATA, ...resume.content } : INITIAL_RESUME_DATA,
        atsScore: resume.ats_score ?? 0,
        isDirty: false,
        isSaving: false,
        saveError: null,
        lastSaved: resume.updated_at || new Date().toISOString(),
        past: [],
        future: [],
      });
    },

    resetResume: () => {
      set({
        resumeId: null,
        title: 'Untitled Resume',
        slug: 'untitled-resume',
        templateId: 'classic-ats',
        sectionOrder: DEFAULT_SECTION_ORDER,
        data: INITIAL_RESUME_DATA,
        atsScore: 0,
        isDirty: false,
        isSaving: false,
        saveError: null,
        lastSaved: null,
        past: [],
        future: [],
      });
    },

    setTitle: (title) => {
      set((state) => ({
        ...snapshot(state),
        title,
      }));
      scheduleSave();
    },

    setTemplateId: (templateId) => {
      set((state) => ({
        ...snapshot(state),
        templateId,
      }));
      scheduleSave();
    },

    setAtsScore: (atsScore) => {
      set({ atsScore });
      scheduleSave();
    },

    setSectionOrder: (sectionOrder) => {
      set((state) => ({
        ...snapshot(state),
        sectionOrder,
      }));
      scheduleSave();
    },

    moveSection: (activeKey, overKey) => {
      set((state) => {
        const order = [...state.sectionOrder];
        const oldIndex = order.indexOf(activeKey);
        const newIndex = order.indexOf(overKey);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          return state;
        }

        const [removed] = order.splice(oldIndex, 1);
        order.splice(newIndex, 0, removed);

        return {
          ...snapshot(state),
          sectionOrder: order,
        };
      });
      scheduleSave();
    },

    updateContact: (contactUpdates) => {
      set((state) => ({
        ...snapshot(state),
        data: {
          ...state.data,
          contact: {
            ...state.data.contact,
            ...contactUpdates,
          },
        },
      }));
      scheduleSave();
    },

    updateSummary: (text, visible) => {
      set((state) => ({
        ...snapshot(state),
        data: {
          ...state.data,
          summary: {
            text,
            visible: visible !== undefined ? visible : state.data.summary.visible,
          },
        },
      }));
      scheduleSave();
    },

    addItem: (section, item) => {
      set((state) => {
        const currentList = state.data[section] as unknown as any[];
        if (!Array.isArray(currentList)) return state;

        const itemObj = item as Record<string, any>;
        const newItem = {
          ...itemObj,
          order: currentList.length,
          visible: itemObj.visible ?? true,
        };

        return {
          ...snapshot(state),
          data: {
            ...state.data,
            [section]: [...currentList, newItem],
          },
        };
      });
      scheduleSave();
    },

    updateItem: (section, id, updates) => {
      set((state) => {
        const currentList = state.data[section] as unknown as any[];
        if (!Array.isArray(currentList)) return state;

        const updatedList = currentList.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        );

        return {
          ...snapshot(state),
          data: {
            ...state.data,
            [section]: updatedList,
          },
        };
      });
      scheduleSave();
    },

    removeItem: (section, id) => {
      set((state) => {
        const currentList = state.data[section] as unknown as any[];
        if (!Array.isArray(currentList)) return state;

        const filtered = currentList
          .filter((item) => item.id !== id)
          .map((item, idx) => ({ ...item, order: idx }));

        return {
          ...snapshot(state),
          data: {
            ...state.data,
            [section]: filtered,
          },
        };
      });
      scheduleSave();
    },

    toggleItemVisibility: (section, id) => {
      set((state) => {
        const currentList = state.data[section] as unknown as any[];
        if (!Array.isArray(currentList)) return state;

        const updatedList = currentList.map((item) =>
          item.id === id ? { ...item, visible: !item.visible } : item
        );

        return {
          ...snapshot(state),
          data: {
            ...state.data,
            [section]: updatedList,
          },
        };
      });
      scheduleSave();
    },

    reorderItems: (section, activeId, overId) => {
      set((state) => {
        const currentList = state.data[section] as unknown as any[];
        if (!Array.isArray(currentList)) return state;

        const oldIndex = currentList.findIndex((item) => item.id === activeId);
        const newIndex = currentList.findIndex((item) => item.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          return state;
        }

        const items = [...currentList];
        const [moved] = items.splice(oldIndex, 1);
        items.splice(newIndex, 0, moved);

        const reindexed = items.map((item, idx) => ({ ...item, order: idx }));

        return {
          ...snapshot(state),
          data: {
            ...state.data,
            [section]: reindexed,
          },
        };
      });
      scheduleSave();
    },

    sortSectionByDate: (section) => {
      set((state) => {
        let sorted: any[] = [];
        switch (section) {
          case 'experience':
            sorted = sortExperiencesByDate(state.data.experience);
            break;
          case 'projects':
            sorted = sortProjectsByDate(state.data.projects);
            break;
          case 'education':
            sorted = sortEducationByDate(state.data.education);
            break;
          case 'involvement':
            sorted = sortInvolvementsByDate(state.data.involvement);
            break;
          case 'certifications':
            sorted = sortCertificationsByDate(state.data.certifications);
            break;
          case 'awards':
            sorted = sortAwardsByDate(state.data.awards);
            break;
          default:
            return state;
        }

        return {
          ...snapshot(state),
          data: {
            ...state.data,
            [section]: sorted,
          },
        };
      });
      scheduleSave();
    },

    undo: () => {
      set((state) => {
        if (state.past.length === 0) return state;

        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, state.past.length - 1);

        const current: ResumeHistoryState = {
          data: JSON.parse(JSON.stringify(state.data)),
          sectionOrder: [...state.sectionOrder],
          templateId: state.templateId,
          title: state.title,
        };

        return {
          past: newPast,
          future: [current, ...state.future].slice(0, MAX_HISTORY_STEPS),
          data: previous.data,
          sectionOrder: previous.sectionOrder,
          templateId: previous.templateId,
          title: previous.title,
          isDirty: true,
        };
      });
      scheduleSave();
    },

    redo: () => {
      set((state) => {
        if (state.future.length === 0) return state;

        const next = state.future[0];
        const newFuture = state.future.slice(1);

        const current: ResumeHistoryState = {
          data: JSON.parse(JSON.stringify(state.data)),
          sectionOrder: [...state.sectionOrder],
          templateId: state.templateId,
          title: state.title,
        };

        return {
          past: [...state.past, current].slice(-MAX_HISTORY_STEPS),
          future: newFuture,
          data: next.data,
          sectionOrder: next.sectionOrder,
          templateId: next.templateId,
          title: next.title,
          isDirty: true,
        };
      });
      scheduleSave();
    },

    triggerAutoSave: () => {
      scheduleSave();
    },

    forceSave: async () => {
      const state = get();
      if (!state.resumeId || !state.isDirty) return;

      set({ isSaving: true, saveError: null });

      try {
        const response = await fetch(`/api/resumes/${state.resumeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: state.title,
            template_id: state.templateId,
            section_order: state.sectionOrder,
            content: state.data,
            ats_score: state.atsScore,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save resume (status ${response.status})`);
        }

        set({
          isSaving: false,
          isDirty: false,
          lastSaved: new Date().toISOString(),
          saveError: null,
        });
      } catch (err: any) {
        set({
          isSaving: false,
          saveError: err?.message || 'Failed to auto-save resume',
        });
      }
    },

    setSaveError: (error) => {
      set({ saveError: error });
    },
  };
});
