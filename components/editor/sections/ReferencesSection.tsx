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
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SortableItem } from '@/components/editor/SortableItem';
import { useResumeStore } from '@/store/useResumeStore';
import { ReferenceItem } from '@/types/resume';

export const ReferencesSection: React.FC = () => {
  const references = useResumeStore((state) => state.data.references || []);
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
      reorderItems('references', active.id.toString(), over.id.toString());
    }
  };

  const handleAddReference = () => {
    const newItem: ReferenceItem = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: '',
      company: '',
      contact: '',
      relationship: '',
      visible: true,
      order: references.length,
    };
    addItem('references', newItem);
  };

  return (
    <div className="space-y-3">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
        <span className="text-xs text-muted-foreground">
          {references.length} {references.length === 1 ? 'reference' : 'references'} listed
        </span>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={handleAddReference}
          className="h-7 text-xs gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Reference
        </Button>
      </div>

      {references.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            No professional references added yet.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddReference}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Reference
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={references.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2.5">
              {references.map((ref) => (
                <SortableItem
                  key={ref.id}
                  id={ref.id}
                  title={ref.name || 'Untitled Reference'}
                  subtitle={`${ref.relationship ? `${ref.relationship} - ` : ''}${ref.company || ''}`}
                  visible={ref.visible}
                  defaultOpen={!ref.name}
                  onToggleVisibility={() => toggleVisibility('references', ref.id)}
                  onDelete={() => removeItem('references', ref.id)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <Label className="text-xs">Full Name</Label>
                      <Input
                        placeholder="e.g. Dr. Sarah Connor"
                        value={ref.name}
                        onChange={(e) =>
                          updateItem('references', ref.id, { name: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Company / Institution */}
                    <div className="space-y-1">
                      <Label className="text-xs">Company / Institution</Label>
                      <Input
                        placeholder="e.g. Acme Corporation"
                        value={ref.company}
                        onChange={(e) =>
                          updateItem('references', ref.id, {
                            company: e.target.value,
                          })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Relationship */}
                    <div className="space-y-1">
                      <Label className="text-xs">Professional Relationship</Label>
                      <Input
                        placeholder="e.g. Former Direct Engineering Manager"
                        value={ref.relationship}
                        onChange={(e) =>
                          updateItem('references', ref.id, {
                            relationship: e.target.value,
                          })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1">
                      <Label className="text-xs">Contact Info (Email or Phone)</Label>
                      <Input
                        placeholder="e.g. sarah.connor@example.com / +1 (555) 019-2834"
                        value={ref.contact}
                        onChange={(e) =>
                          updateItem('references', ref.id, {
                            contact: e.target.value,
                          })
                        }
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
