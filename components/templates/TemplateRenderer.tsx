import React from 'react';
import { DEFAULT_SECTION_ORDER, ResumeData, SectionKey, TemplateId } from '@/types/resume';
import { ClassicAts } from './ClassicAts';
import { ModernMinimal } from './ModernMinimal';
import { Executive } from './Executive';

export interface TemplateRendererProps {
  data: ResumeData;
  templateId: TemplateId | string;
  sectionOrder?: SectionKey[];
  className?: string;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  data,
  templateId,
  sectionOrder = DEFAULT_SECTION_ORDER,
  className,
}) => {
  const normalizedId = (templateId || 'classic-ats').toLowerCase().trim();

  switch (normalizedId) {
    case 'modern-minimal':
    case 'modern-clean':
    case 'technical-split':
      return (
        <ModernMinimal
          data={data}
          sectionOrder={sectionOrder}
          className={className}
        />
      );

    case 'executive':
    case 'executive-accent':
      return (
        <Executive
          data={data}
          sectionOrder={sectionOrder}
          className={className}
        />
      );

    case 'classic-ats':
    default:
      return (
        <ClassicAts
          data={data}
          sectionOrder={sectionOrder}
          className={className}
        />
      );
  }
};

export { ClassicAts } from './ClassicAts';
export { ModernMinimal } from './ModernMinimal';
export { Executive } from './Executive';
export * from './template-helpers';
