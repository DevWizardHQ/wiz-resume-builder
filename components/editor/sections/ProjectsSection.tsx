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
import { BulletListEditor } from './BulletListEditor';
import { useResumeStore } from '@/store/useResumeStore';
import { ProjectItem } from '@/types/resume';

export const ProjectsSection: React.FC = () => {
  const projects = useResumeStore((state) => state.data.projects || []);
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
      reorderItems('projects', active.id.toString(), over.id.toString());
    }
  };

  const handleAddProject = () => {
    const newItem: ProjectItem = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: '',
      role: '',
      link: '',
      startDate: '',
      endDate: '',
      technologies: [],
      bullets: [''],
      visible: true,
      order: projects.length,
    };
    addItem('projects', newItem);
  };

  return (
    <div className="space-y-3">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
        <span className="text-xs text-muted-foreground">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'} listed
        </span>
        <div className="flex items-center gap-1.5">
          {projects.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => sortSectionByDate('projects')}
              className="h-7 text-xs gap-1"
              title="Sort projects in reverse-chronological order"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort by Date
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAddProject}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Project
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            No projects added yet.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddProject}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Project
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={projects.map((proj) => proj.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2.5">
              {projects.map((proj) => (
                <SortableItem
                  key={proj.id}
                  id={proj.id}
                  title={proj.name || 'Untitled Project'}
                  subtitle={
                    proj.technologies && proj.technologies.length > 0
                      ? proj.technologies.join(', ')
                      : proj.role || ''
                  }
                  visible={proj.visible}
                  defaultOpen={!proj.name}
                  onToggleVisibility={() => toggleVisibility('projects', proj.id)}
                  onDelete={() => removeItem('projects', proj.id)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Project Name */}
                    <div className="space-y-1">
                      <Label className="text-xs">Project Name</Label>
                      <Input
                        placeholder="e.g. AI Resume Builder"
                        value={proj.name}
                        onChange={(e) =>
                          updateItem('projects', proj.id, { name: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Role / Context */}
                    <div className="space-y-1">
                      <Label className="text-xs">Role / Context (Optional)</Label>
                      <Input
                        placeholder="e.g. Lead Developer / Creator"
                        value={proj.role || ''}
                        onChange={(e) =>
                          updateItem('projects', proj.id, { role: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Link / URL */}
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Project URL / Repository Link</Label>
                      <Input
                        placeholder="e.g. github.com/user/project or app.example.com"
                        value={proj.link || ''}
                        onChange={(e) =>
                          updateItem('projects', proj.id, { link: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Technologies */}
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">
                        Technologies Used (Comma-separated)
                      </Label>
                      <Input
                        placeholder="e.g. Next.js, TypeScript, PostgreSQL, Tailwind CSS"
                        value={proj.technologies ? proj.technologies.join(', ') : ''}
                        onChange={(e) => {
                          const techArray = e.target.value
                            .split(',')
                            .map((t) => t.trim())
                            .filter(Boolean);
                          updateItem('projects', proj.id, { technologies: techArray });
                        }}
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Start Date */}
                    <div className="space-y-1">
                      <Label className="text-xs">Start Date (Optional)</Label>
                      <Input
                        placeholder="2023-01"
                        value={proj.startDate || ''}
                        onChange={(e) =>
                          updateItem('projects', proj.id, { startDate: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* End Date */}
                    <div className="space-y-1">
                      <Label className="text-xs">End Date (Optional)</Label>
                      <Input
                        placeholder="2023-06 or Present"
                        value={proj.endDate || ''}
                        onChange={(e) =>
                          updateItem('projects', proj.id, { endDate: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>
                  </div>

                  {/* Bullet Points */}
                  <BulletListEditor
                    bullets={proj.bullets || []}
                    context={
                      [
                        proj.name,
                        proj.role ? `(${proj.role})` : '',
                        proj.technologies && proj.technologies.length > 0
                          ? `built with ${proj.technologies.join(', ')}`
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ') || undefined
                    }
                    onChange={(bullets) =>
                      updateItem('projects', proj.id, { bullets })
                    }
                    placeholder="Built full-stack application supporting 10,000+ monthly active users..."
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
