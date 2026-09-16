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
import { Textarea } from '@/components/ui/textarea';
import { SortableItem } from '@/components/editor/SortableItem';
import { useResumeStore } from '@/store/useResumeStore';
import { AwardItem } from '@/types/resume';

export const AwardsSection: React.FC = () => {
  const awards = useResumeStore((state) => state.data.awards || []);
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
      reorderItems('awards', active.id.toString(), over.id.toString());
    }
  };

  const handleAddAward = () => {
    const newItem: AwardItem = {
      id: `award-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: '',
      issuer: '',
      date: '',
      description: '',
      visible: true,
      order: awards.length,
    };
    addItem('awards', newItem);
  };

  return (
    <div className="space-y-3">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
        <span className="text-xs text-muted-foreground">
          {awards.length} {awards.length === 1 ? 'honor' : 'honors'} listed
        </span>
        <div className="flex items-center gap-1.5">
          {awards.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => sortSectionByDate('awards')}
              className="h-7 text-xs gap-1"
              title="Sort awards in reverse-chronological order"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort by Date
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAddAward}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Award
          </Button>
        </div>
      </div>

      {awards.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            No honors or awards added yet.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddAward}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Honor / Award
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={awards.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2.5">
              {awards.map((award) => (
                <SortableItem
                  key={award.id}
                  id={award.id}
                  title={award.title || 'Untitled Award'}
                  subtitle={`${award.issuer || ''}${award.date ? ` (${award.date})` : ''}`}
                  visible={award.visible}
                  defaultOpen={!award.title}
                  onToggleVisibility={() => toggleVisibility('awards', award.id)}
                  onDelete={() => removeItem('awards', award.id)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Award Title */}
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Award Title</Label>
                      <Input
                        placeholder="e.g. 1st Place - National Hackathon"
                        value={award.title}
                        onChange={(e) =>
                          updateItem('awards', award.id, { title: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Issuer */}
                    <div className="space-y-1">
                      <Label className="text-xs">Issuing Organization</Label>
                      <Input
                        placeholder="e.g. Google / IEEE"
                        value={award.issuer}
                        onChange={(e) =>
                          updateItem('awards', award.id, { issuer: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Date */}
                    <div className="space-y-1">
                      <Label className="text-xs">Date Received (YYYY-MM or YYYY)</Label>
                      <Input
                        placeholder="2023-05"
                        value={award.date}
                        onChange={(e) =>
                          updateItem('awards', award.id, { date: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Description (Optional)</Label>
                      <Textarea
                        placeholder="Selected among 500+ participants for building the most innovative AI solution..."
                        value={award.description || ''}
                        onChange={(e) =>
                          updateItem('awards', award.id, {
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        className="text-xs resize-y"
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
