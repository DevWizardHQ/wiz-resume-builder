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
import { CertificationItem } from '@/types/resume';

export const CertificationsSection: React.FC = () => {
  const certifications = useResumeStore((state) => state.data.certifications || []);
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
      reorderItems('certifications', active.id.toString(), over.id.toString());
    }
  };

  const handleAddCertification = () => {
    const newItem: CertificationItem = {
      id: `cert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: '',
      issuer: '',
      issueDate: '',
      expirationDate: '',
      credentialUrl: '',
      visible: true,
      order: certifications.length,
    };
    addItem('certifications', newItem);
  };

  return (
    <div className="space-y-3">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
        <span className="text-xs text-muted-foreground">
          {certifications.length} {certifications.length === 1 ? 'certificate' : 'certificates'}
        </span>
        <div className="flex items-center gap-1.5">
          {certifications.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => sortSectionByDate('certifications')}
              className="h-7 text-xs gap-1"
              title="Sort certifications in reverse-chronological order"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort by Date
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAddCertification}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Certification
          </Button>
        </div>
      </div>

      {certifications.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            No certifications added yet.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddCertification}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Certification
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={certifications.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2.5">
              {certifications.map((cert) => (
                <SortableItem
                  key={cert.id}
                  id={cert.id}
                  title={cert.name || 'Untitled Certification'}
                  subtitle={`${cert.issuer || ''}${cert.issueDate ? ` (${cert.issueDate})` : ''}`}
                  visible={cert.visible}
                  defaultOpen={!cert.name}
                  onToggleVisibility={() => toggleVisibility('certifications', cert.id)}
                  onDelete={() => removeItem('certifications', cert.id)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Certification Name */}
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Certification Name</Label>
                      <Input
                        placeholder="e.g. AWS Certified Solutions Architect - Associate"
                        value={cert.name}
                        onChange={(e) =>
                          updateItem('certifications', cert.id, { name: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Issuer */}
                    <div className="space-y-1">
                      <Label className="text-xs">Issuing Organization</Label>
                      <Input
                        placeholder="e.g. Amazon Web Services"
                        value={cert.issuer}
                        onChange={(e) =>
                          updateItem('certifications', cert.id, { issuer: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Issue Date */}
                    <div className="space-y-1">
                      <Label className="text-xs">Issue Date (YYYY-MM or YYYY)</Label>
                      <Input
                        placeholder="2022-08"
                        value={cert.issueDate}
                        onChange={(e) =>
                          updateItem('certifications', cert.id, { issueDate: e.target.value })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Expiration Date */}
                    <div className="space-y-1">
                      <Label className="text-xs">Expiration Date (Optional)</Label>
                      <Input
                        placeholder="2025-08 or No Expiration"
                        value={cert.expirationDate || ''}
                        onChange={(e) =>
                          updateItem('certifications', cert.id, {
                            expirationDate: e.target.value,
                          })
                        }
                        className="text-xs h-8"
                      />
                    </div>

                    {/* Credential URL */}
                    <div className="space-y-1">
                      <Label className="text-xs">Credential URL / ID (Optional)</Label>
                      <Input
                        placeholder="https://credly.com/badges/..."
                        value={cert.credentialUrl || ''}
                        onChange={(e) =>
                          updateItem('certifications', cert.id, {
                            credentialUrl: e.target.value,
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
