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
import { ArrowUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SortableItem } from '@/components/editor/SortableItem';
import { useResumeStore } from '@/store/useResumeStore';
import { EducationItem } from '@/types/resume';

export const EducationSection: React.FC = () => {
  const education = useResumeStore((state) => state.data.education || []);
  const addItem = useResumeStore((state) => state.addItem);
  const updateItem = useResumeStore((state) => state.updateItem);
  const removeItem = useResumeStore((state) => state.removeItem);
  const toggleVisibility = useResumeStore((state) => state.toggleItemVisibility);
  const reorderItems = useResumeStore((state) => state.reorderItems);
  const sortSectionByDate = useResumeStore((state) => state.sortSectionByDate);

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
      reorderItems('education', active.id.toString(), over.id.toString());
    }
  };

  const handleAddEducation = () => {
    const newItem: EducationItem = {
      id: `edu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      gpa: '',
      honors: [],
      visible: true,
      order: education.length,
    };
    addItem('education', newItem);
  };

  return (
    <div className="space-y-3">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
        <span className="text-xs text-muted-foreground">
          {education.length} {education.length === 1 ? 'entry' : 'entries'} listed
        </span>
        <div className="flex items-center gap-1.5">
          {education.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => sortSectionByDate('education')}
              className="h-7 text-xs gap-1"
              title="Sort education in reverse-chronological order"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort by Date
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAddEducation}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Education
          </Button>
        </div>
      </div>

      {education.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            No education history added yet.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddEducation}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Education
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={education.map((edu) => edu.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2.5">
              {education.map((edu) => (
                <SortableItem
                  key={edu.id}
                  id={edu.id}
                  title={
                    edu.degree
                      ? `${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}`
                      : edu.institution || 'Untitled Education'
                  }
                  subtitle={`${edu.institution || ''} (${edu.startDate || ''} - ${edu.endDate || ''})`}
                  visible={edu.visible}
                  defaultOpen={!edu.institution}
                  onToggleVisibility={() => toggleVisibility('education', edu.id)}
                  onDelete={() => removeItem('education', edu.id)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Institution */}
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">University / Institution</Label>
                      <Input
                        placeholder="e.g. Stanford University"
                        value={edu.institution}
                        onChange={(e) =>
                          updateItem('education', edu.id, { institution: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Degree */}
                    <div className="space-y-1">
                      <Label className="text-xs">Degree</Label>
                      <Input
                        placeholder="e.g. Bachelor of Science (B.S.)"
                        value={edu.degree}
                        onChange={(e) =>
                          updateItem('education', edu.id, { degree: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Field of Study */}
                    <div className="space-y-1">
                      <Label className="text-xs">Field of Study / Major</Label>
                      <Input
                        placeholder="e.g. Computer Science"
                        value={edu.fieldOfStudy}
                        onChange={(e) =>
                          updateItem('education', edu.id, { fieldOfStudy: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Start Date */}
                    <div className="space-y-1">
                      <Label className="text-xs">Start Date (YYYY-MM or YYYY)</Label>
                      <Input
                        placeholder="2016-09"
                        value={edu.startDate}
                        onChange={(e) =>
                          updateItem('education', edu.id, { startDate: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* End Date */}
                    <div className="space-y-1">
                      <Label className="text-xs">Graduation / End Date</Label>
                      <Input
                        placeholder="2020-06"
                        value={edu.endDate}
                        onChange={(e) =>
                          updateItem('education', edu.id, { endDate: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* GPA */}
                    <div className="space-y-1">
                      <Label className="text-xs">GPA (Optional)</Label>
                      <Input
                        placeholder="e.g. 3.85 / 4.0"
                        value={edu.gpa || ''}
                        onChange={(e) =>
                          updateItem('education', edu.id, { gpa: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Honors / Awards */}
                    <div className="space-y-1">
                      <Label className="text-xs">Honors / Distinctions (Comma-separated)</Label>
                      <Input
                        placeholder="e.g. Magna Cum Laude, Dean's List"
                        value={edu.honors ? edu.honors.join(', ') : ''}
                        onChange={(e) => {
                          const honorsArr = e.target.value
                            .split(',')
                            .map((h) => h.trim())
                            .filter(Boolean);
                          updateItem('education', edu.id, { honors: honorsArr });
                        }}
                        className="text-xs h-8"
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
