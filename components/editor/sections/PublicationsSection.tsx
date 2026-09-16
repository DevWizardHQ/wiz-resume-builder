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
import { PublicationItem } from '@/types/resume';

export const PublicationsSection: React.FC = () => {
  const publications = useResumeStore((state) => state.data.publications || []);
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
      reorderItems('publications', active.id.toString(), over.id.toString());
    }
  };

  const handleAddPublication = () => {
    const newItem: PublicationItem = {
      id: `pub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: '',
      publisher: '',
      date: '',
      url: '',
      authors: [],
      visible: true,
      order: publications.length,
    };
    addItem('publications', newItem);
  };

  return (
    <div className="space-y-3">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
        <span className="text-xs text-muted-foreground">
          {publications.length} {publications.length === 1 ? 'publication' : 'publications'} listed
        </span>
        <div className="flex items-center gap-1.5">
          {publications.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => sortSectionByDate('publications')}
              className="h-7 text-xs gap-1"
              title="Sort publications in reverse-chronological order"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort by Date
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAddPublication}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Publication
          </Button>
        </div>
      </div>

      {publications.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            No publications or research papers added yet.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddPublication}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Publication
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={publications.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2.5">
              {publications.map((pub) => (
                <SortableItem
                  key={pub.id}
                  id={pub.id}
                  title={pub.title || 'Untitled Publication'}
                  subtitle={`${pub.publisher || ''}${pub.date ? ` (${pub.date})` : ''}`}
                  visible={pub.visible}
                  defaultOpen={!pub.title}
                  onToggleVisibility={() => toggleVisibility('publications', pub.id)}
                  onDelete={() => removeItem('publications', pub.id)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Publication Title */}
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Paper / Article Title</Label>
                      <Input
                        placeholder="e.g. Scalable Machine Learning Pipelines with Kubernetes"
                        value={pub.title}
                        onChange={(e) =>
                          updateItem('publications', pub.id, {
                            title: e.target.value,
                          })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Publisher / Conference / Journal */}
                    <div className="space-y-1">
                      <Label className="text-xs">Publisher / Conference / Journal</Label>
                      <Input
                        placeholder="e.g. IEEE Transactions on Cloud Computing"
                        value={pub.publisher}
                        onChange={(e) =>
                          updateItem('publications', pub.id, {
                            publisher: e.target.value,
                          })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Date */}
                    <div className="space-y-1">
                      <Label className="text-xs">Publication Date (YYYY-MM or YYYY)</Label>
                      <Input
                        placeholder="2023-04"
                        value={pub.date}
                        onChange={(e) =>
                          updateItem('publications', pub.id, {
                            date: e.target.value,
                          })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* URL / DOI */}
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">URL / DOI Link</Label>
                      <Input
                        placeholder="https://doi.org/10.1109/..."
                        value={pub.url || ''}
                        onChange={(e) =>
                          updateItem('publications', pub.id, {
                            url: e.target.value,
                          })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Authors */}
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Authors (Comma-separated)</Label>
                      <Input
                        placeholder="e.g. Alex Morgan, Jane Doe, John Smith"
                        value={pub.authors ? pub.authors.join(', ') : ''}
                        onChange={(e) => {
                          const authorsArr = e.target.value
                            .split(',')
                            .map((a) => a.trim())
                            .filter(Boolean);
                          updateItem('publications', pub.id, {
                            authors: authorsArr,
                          });
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
