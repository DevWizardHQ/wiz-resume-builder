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
import { InvolvementItem } from '@/types/resume';

export const InvolvementSection: React.FC = () => {
  const involvements = useResumeStore((state) => state.data.involvement || []);
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
      reorderItems('involvement', active.id.toString(), over.id.toString());
    }
  };

  const handleAddInvolvement = () => {
    const newItem: InvolvementItem = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organization: '',
      role: '',
      startDate: '',
      endDate: '',
      bullets: [''],
      visible: true,
      order: involvements.length,
    };
    addItem('involvement', newItem);
  };

  return (
    <div className="space-y-3">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
        <span className="text-xs text-muted-foreground">
          {involvements.length} {involvements.length === 1 ? 'activity' : 'activities'} listed
        </span>
        <div className="flex items-center gap-1.5">
          {involvements.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => sortSectionByDate('involvement')}
              className="h-7 text-xs gap-1"
              title="Sort involvement in reverse-chronological order"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort by Date
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAddInvolvement}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Involvement
          </Button>
        </div>
      </div>

      {involvements.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            No leadership or community involvement added yet.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddInvolvement}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Leadership / Volunteering
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={involvements.map((inv) => inv.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2.5">
              {involvements.map((inv) => (
                <SortableItem
                  key={inv.id}
                  id={inv.id}
                  title={inv.role ? `${inv.role} - ${inv.organization}` : inv.organization || 'Untitled Involvement'}
                  subtitle={`${inv.startDate || ''}${inv.endDate ? ` - ${inv.endDate}` : ''}`}
                  visible={inv.visible}
                  defaultOpen={!inv.organization}
                  onToggleVisibility={() => toggleVisibility('involvement', inv.id)}
                  onDelete={() => removeItem('involvement', inv.id)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Organization */}
                    <div className="space-y-1">
                      <Label className="text-xs">Organization / Club / Event</Label>
                      <Input
                        placeholder="e.g. Open Source Initiative / Hackathon"
                        value={inv.organization}
                        onChange={(e) =>
                          updateItem('involvement', inv.id, {
                            organization: e.target.value,
                          })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Role */}
                    <div className="space-y-1">
                      <Label className="text-xs">Role / Title</Label>
                      <Input
                        placeholder="e.g. Vice President / Volunteer Mentor"
                        value={inv.role}
                        onChange={(e) =>
                          updateItem('involvement', inv.id, { role: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Start Date */}
                    <div className="space-y-1">
                      <Label className="text-xs">Start Date (YYYY-MM or YYYY)</Label>
                      <Input
                        placeholder="2022-01"
                        value={inv.startDate}
                        onChange={(e) =>
                          updateItem('involvement', inv.id, {
                            startDate: e.target.value,
                          })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* End Date */}
                    <div className="space-y-1">
                      <Label className="text-xs">End Date</Label>
                      <Input
                        placeholder="2023-12 or Present"
                        value={inv.endDate || ''}
                        onChange={(e) =>
                          updateItem('involvement', inv.id, {
                            endDate: e.target.value,
                          })
                        }
                        className="text-xs h-8"
                      />
                    </div>
                  </div>

                  {/* Bullets */}
                  <BulletListEditor
                    bullets={inv.bullets || []}
                    onChange={(bullets) =>
                      updateItem('involvement', inv.id, { bullets })
                    }
                    placeholder="Organized monthly workshops for 200+ participants..."
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
