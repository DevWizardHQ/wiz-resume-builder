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
import { Switch } from '@/components/ui/switch';
import { SortableItem } from '@/components/editor/SortableItem';
import { BulletListEditor } from './BulletListEditor';
import { useResumeStore } from '@/store/useResumeStore';
import { ExperienceItem } from '@/types/resume';

export const ExperienceSection: React.FC = () => {
  const experiences = useResumeStore((state) => state.data.experience || []);
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
      reorderItems('experience', active.id.toString(), over.id.toString());
    }
  };

  const handleAddExperience = () => {
    const newItem: ExperienceItem = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      company: '',
      role: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: [''],
      visible: true,
      order: experiences.length,
    };
    addItem('experience', newItem);
  };

  return (
    <div className="space-y-3">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
        <span className="text-xs text-muted-foreground">
          {experiences.length} {experiences.length === 1 ? 'position' : 'positions'} listed
        </span>
        <div className="flex items-center gap-1.5">
          {experiences.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => sortSectionByDate('experience')}
              className="h-7 text-xs gap-1"
              title="Sort positions in reverse-chronological order"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort by Date
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAddExperience}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Experience
          </Button>
        </div>
      </div>

      {experiences.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            No work experience added yet.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddExperience}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Work Experience
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={experiences.map((exp) => exp.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2.5">
              {experiences.map((exp) => (
                <SortableItem
                  key={exp.id}
                  id={exp.id}
                  title={exp.role ? `${exp.role} at ${exp.company || '...'}` : exp.company || 'Untitled Position'}
                  subtitle={`${exp.startDate || 'YYYY-MM'} - ${exp.current ? 'Present' : exp.endDate || 'YYYY-MM'}`}
                  visible={exp.visible}
                  defaultOpen={!exp.company && !exp.role}
                  onToggleVisibility={() => toggleVisibility('experience', exp.id)}
                  onDelete={() => removeItem('experience', exp.id)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Job Title / Role */}
                    <div className="space-y-1">
                      <Label className="text-xs">Job Title / Role</Label>
                      <Input
                        placeholder="e.g. Senior Software Engineer"
                        value={exp.role}
                        onChange={(e) =>
                          updateItem('experience', exp.id, { role: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Company Name */}
                    <div className="space-y-1">
                      <Label className="text-xs">Company Name</Label>
                      <Input
                        placeholder="e.g. Acme Corp"
                        value={exp.company}
                        onChange={(e) =>
                          updateItem('experience', exp.id, { company: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Location (Optional)</Label>
                      <Input
                        placeholder="e.g. New York, NY (Hybrid)"
                        value={exp.location || ''}
                        onChange={(e) =>
                          updateItem('experience', exp.id, { location: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Start Date */}
                    <div className="space-y-1">
                      <Label className="text-xs">Start Date (YYYY-MM or YYYY)</Label>
                      <Input
                        placeholder="2021-03"
                        value={exp.startDate}
                        onChange={(e) =>
                          updateItem('experience', exp.id, { startDate: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* End Date / Currently Working */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">End Date</Label>
                        <div className="flex items-center gap-1.5">
                          <Switch
                            id={`current-job-${exp.id}`}
                            checked={exp.current}
                            onCheckedChange={(checked) =>
                              updateItem('experience', exp.id, {
                                current: checked,
                                endDate: checked ? 'Present' : exp.endDate === 'Present' ? '' : exp.endDate,
                              })
                            }
                          />
                          <Label
                            htmlFor={`current-job-${exp.id}`}
                            className="text-[11px] font-normal cursor-pointer"
                          >
                            Currently Work Here
                          </Label>
                        </div>
                      </div>
                      <Input
                        placeholder={exp.current ? 'Present' : '2023-11'}
                        disabled={exp.current}
                        value={exp.current ? 'Present' : exp.endDate || ''}
                        onChange={(e) =>
                          updateItem('experience', exp.id, { endDate: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>
                  </div>

                  {/* Bullet Points */}
                  <BulletListEditor
                    bullets={exp.bullets || []}
                    onChange={(bullets) =>
                      updateItem('experience', exp.id, { bullets })
                    }
                    placeholder="Led development of [feature], achieving [metric]% reduction in latency..."
                  />
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
