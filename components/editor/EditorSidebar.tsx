'use client';

import React from 'react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Award,
  BookOpen,
  Briefcase,
  Code2,
  FileText,
  GraduationCap,
  Sparkles,
  Trophy,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import { SectionContainer } from '@/components/editor/SectionContainer';
import { ImportResumeModal } from '@/components/editor/ImportResumeModal';
import { AwardsSection } from '@/components/editor/sections/AwardsSection';
import { CertificationsSection } from '@/components/editor/sections/CertificationsSection';
import { ContactSection } from '@/components/editor/sections/ContactSection';
import { EducationSection } from '@/components/editor/sections/EducationSection';
import { ExperienceSection } from '@/components/editor/sections/ExperienceSection';
import { InvolvementSection } from '@/components/editor/sections/InvolvementSection';
import { ProjectsSection } from '@/components/editor/sections/ProjectsSection';
import { PublicationsSection } from '@/components/editor/sections/PublicationsSection';
import { ReferencesSection } from '@/components/editor/sections/ReferencesSection';
import { SkillsSection } from '@/components/editor/sections/SkillsSection';
import { SummarySection } from '@/components/editor/sections/SummarySection';
import { useResumeStore } from '@/store/useResumeStore';
import { SectionKey } from '@/types/resume';

interface SectionConfig {
  key: SectionKey;
  title: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  getItemCount?: (data: ReturnType<typeof useResumeStore.getState>['data']) => number | undefined;
}

export const EditorSidebar: React.FC = () => {
  const sectionOrder = useResumeStore((state) => state.sectionOrder);
  const moveSection = useResumeStore((state) => state.moveSection);
  const data = useResumeStore((state) => state.data);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      moveSection(active.id as SectionKey, over.id as SectionKey);
    }
  };

  const sectionConfigs: Record<SectionKey, SectionConfig> = {
    contact: {
      key: 'contact',
      title: 'Contact Information',
      icon: <User className="h-4 w-4" />,
      component: <ContactSection />,
    },
    summary: {
      key: 'summary',
      title: 'Professional Summary',
      icon: <FileText className="h-4 w-4" />,
      component: <SummarySection />,
    },
    experience: {
      key: 'experience',
      title: 'Work Experience',
      icon: <Briefcase className="h-4 w-4" />,
      component: <ExperienceSection />,
      getItemCount: (d) => d.experience?.length,
    },
    projects: {
      key: 'projects',
      title: 'Projects',
      icon: <Code2 className="h-4 w-4" />,
      component: <ProjectsSection />,
      getItemCount: (d) => d.projects?.length,
    },
    education: {
      key: 'education',
      title: 'Education',
      icon: <GraduationCap className="h-4 w-4" />,
      component: <EducationSection />,
      getItemCount: (d) => d.education?.length,
    },
    skills: {
      key: 'skills',
      title: 'Skills & Competencies',
      icon: <Sparkles className="h-4 w-4" />,
      component: <SkillsSection />,
      getItemCount: (d) => d.skills?.length,
    },
    certifications: {
      key: 'certifications',
      title: 'Certifications & Licenses',
      icon: <Award className="h-4 w-4" />,
      component: <CertificationsSection />,
      getItemCount: (d) => d.certifications?.length,
    },
    involvement: {
      key: 'involvement',
      title: 'Leadership & Involvement',
      icon: <Users className="h-4 w-4" />,
      component: <InvolvementSection />,
      getItemCount: (d) => d.involvement?.length,
    },
    awards: {
      key: 'awards',
      title: 'Honors & Awards',
      icon: <Trophy className="h-4 w-4" />,
      component: <AwardsSection />,
      getItemCount: (d) => d.awards?.length,
    },
    publications: {
      key: 'publications',
      title: 'Publications & Research',
      icon: <BookOpen className="h-4 w-4" />,
      component: <PublicationsSection />,
      getItemCount: (d) => d.publications?.length,
    },
    references: {
      key: 'references',
      title: 'References',
      icon: <UserCheck className="h-4 w-4" />,
      component: <ReferencesSection />,
      getItemCount: (d) => d.references?.length,
    },
  };

  return (
    <aside className="w-full h-full overflow-y-auto pr-1 pb-16 space-y-3 custom-scrollbar">
      <div className="flex items-center justify-between px-1 pb-1 gap-2">
        <p className="text-xs text-muted-foreground">
          Drag sections by their handles <span className="font-mono">⠿</span> to reorder in live preview and exports.
        </p>
        <ImportResumeModal />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sectionOrder}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {sectionOrder.map((sectionKey) => {
              const config = sectionConfigs[sectionKey];
              if (!config) return null;

              const itemCount = config.getItemCount ? config.getItemCount(data) : undefined;

              return (
                <SectionContainer
                  key={config.key}
                  id={config.key}
                  title={config.title}
                  icon={config.icon}
                  itemCount={itemCount}
                  defaultOpen={config.key === 'contact' || config.key === 'summary' || config.key === 'experience'}
                >
                  {config.component}
                </SectionContainer>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </aside>
  );
};
