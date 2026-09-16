'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SortableItemProps {
  id: string;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  visible?: boolean;
  defaultOpen?: boolean;
  onToggleVisibility?: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const SortableItem: React.FC<SortableItemProps> = ({
  id,
  title,
  subtitle,
  visible = true,
  defaultOpen = false,
  onToggleVisibility,
  onDelete,
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
        'mb-3 rounded-lg border bg-background/80 transition-all',
        !visible && 'opacity-65 border-dashed bg-muted/30',
        isDragging && 'opacity-50 ring-2 ring-primary shadow-md',
        className
      )}
    >
      {/* Item Header */}
      <div className="flex items-center justify-between gap-2 p-2.5 sm:px-3 border-b border-border/40 select-none">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Item Drag Handle */}
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground cursor-grab active:cursor-grabbing touch-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Drag to reorder item"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>

          {/* Item Title & Subtitle */}
          <div
            className="flex flex-col min-w-0 flex-1 cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span
              className={cn(
                'text-xs font-semibold truncate',
                !visible && 'text-muted-foreground line-through'
              )}
            >
              {title || '(Untitled Item)'}
            </span>
            {subtitle && (
              <span className="text-[11px] text-muted-foreground truncate">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Visibility Toggle */}
          {onToggleVisibility && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility();
              }}
              title={visible ? 'Hide from resume' : 'Show in resume'}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              {visible ? (
                <Eye className="h-3.5 w-3.5 text-primary" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>
          )}

          {/* Delete Item */}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete item"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Expand/Collapse Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Item Body Form */}
      {isOpen && (
        <div className="p-3 bg-muted/10 border-t border-border/20 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
};
