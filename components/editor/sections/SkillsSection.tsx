'use client';

import React, { useState } from 'react';
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
import { Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SortableItem } from '@/components/editor/SortableItem';
import { useResumeStore } from '@/store/useResumeStore';
import { SkillCategory } from '@/types/resume';

interface SkillTagInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

const SkillTagInput: React.FC<SkillTagInputProps> = ({ skills = [], onChange }) => {
  const [inputValue, setInputValue] = useState('');

  const addSkill = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      onChange(skills.slice(0, -1));
    }
  };

  const removeSkill = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 p-2 rounded-md border bg-background min-h-[42px] items-center">
        {skills.map((skill, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="flex items-center gap-1 text-xs py-0.5 pl-2 pr-1 h-6"
          >
            <span>{skill}</span>
            <button
              type="button"
              onClick={() => removeSkill(index)}
              className="h-3.5 w-3.5 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addSkill(inputValue)}
          placeholder={skills.length === 0 ? 'Type a skill and press Enter...' : 'Add more...'}
          className="flex-1 min-w-[120px] bg-transparent text-xs outline-none placeholder:text-muted-foreground h-6 px-1"
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Tip: Press <kbd className="px-1 py-0.5 text-[10px] bg-muted border rounded">Enter</kbd> or comma <kbd className="px-1 py-0.5 text-[10px] bg-muted border rounded">,</kbd> to add each skill tag.
      </p>
    </div>
  );
};

export const SkillsSection: React.FC = () => {
  const skillCategories = useResumeStore((state) => state.data.skills || []);
  const addItem = useResumeStore((state) => state.addItem);
  const updateItem = useResumeStore((state) => state.updateItem);
  const removeItem = useResumeStore((state) => state.removeItem);
  const toggleVisibility = useResumeStore((state) => state.toggleItemVisibility);
  const reorderItems = useResumeStore((state) => state.reorderItems);

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
      reorderItems('skills', active.id.toString(), over.id.toString());
    }
  };

  const handleAddCategory = () => {
    const newItem: SkillCategory = {
      id: `skill-cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      categoryName: '',
      skills: [],
      visible: true,
      order: skillCategories.length,
    };
    addItem('skills', newItem);
  };

  return (
    <div className="space-y-3">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
        <span className="text-xs text-muted-foreground">
          {skillCategories.length} {skillCategories.length === 1 ? 'category' : 'categories'}
        </span>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={handleAddCategory}
          className="h-7 text-xs gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Skill Category
        </Button>
      </div>

      {skillCategories.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            No skill categories added yet.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddCategory}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Category (e.g., Languages, Frameworks)
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={skillCategories.map((cat) => cat.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2.5">
              {skillCategories.map((cat) => (
                <SortableItem
                  key={cat.id}
                  id={cat.id}
                  title={cat.categoryName || 'Untitled Category'}
                  subtitle={cat.skills && cat.skills.length > 0 ? `${cat.skills.length} skills: ${cat.skills.slice(0, 4).join(', ')}${cat.skills.length > 4 ? '...' : ''}` : 'No skills added'}
                  visible={cat.visible}
                  defaultOpen={!cat.categoryName}
                  onToggleVisibility={() => toggleVisibility('skills', cat.id)}
                  onDelete={() => removeItem('skills', cat.id)}
                >
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Category Name</Label>
                      <Input
                        placeholder="e.g. Languages, Frameworks & Libraries, Cloud & DevOps, Databases"
                        value={cat.categoryName}
                        onChange={(e) =>
                          updateItem('skills', cat.id, {
                            categoryName: e.target.value,
                          })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Skills in this Category</Label>
                      <SkillTagInput
                        skills={cat.skills || []}
                        onChange={(skills) =>
                          updateItem('skills', cat.id, { skills })
                        }
                      />
                    </div>
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
