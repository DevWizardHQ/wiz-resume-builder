'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SectionKey } from '@/types/resume';

export interface SectionContainerProps {
  id: SectionKey;
  title: string;
  icon?: React.ReactNode;
  itemCount?: number;
  defaultOpen?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  id,
  title,
  icon,
  itemCount,
  defaultOpen = true,
  actions,
  children,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group mb-4 rounded-xl border bg-card text-card-foreground shadow-sm transition-all',
        isDragging && 'opacity-60 ring-2 ring-primary shadow-lg',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/40 bg-muted/20 rounded-t-xl select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Drag Handle */}
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-grab active:cursor-grabbing touch-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label={`Drag to reorder ${title} section`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Section Icon & Title */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            {icon && <span className="text-primary shrink-0">{icon}</span>}
            <h3 className="font-semibold text-sm tracking-tight truncate">
              {title}
            </h3>
            {typeof itemCount === 'number' && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal h-4">
                {itemCount}
              </Badge>
            )}
          </div>
        </div>

        {/* Action Controls & Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {actions && <div className="flex items-center gap-1">{actions}</div>}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label={isOpen ? `Collapse ${title}` : `Expand ${title}`}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            ) : (
              <ChevronRight className="h-4 w-4 transition-transform duration-200" />
            )}
          </Button>
        </div>
      </div>

      {/* Expandable Body */}
      {isOpen && (
        <div className="p-4 pt-3.5 animate-in fade-in-50 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};
