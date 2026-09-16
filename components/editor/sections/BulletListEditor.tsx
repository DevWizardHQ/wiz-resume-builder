'use client';

import React from 'react';
import { ArrowDown, ArrowUp, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export interface BulletListEditorProps {
  bullets: string[];
  onChange: (bullets: string[]) => void;
  label?: string;
  placeholder?: string;
}

export const BulletListEditor: React.FC<BulletListEditorProps> = ({
  bullets = [],
  onChange,
  label = 'Key Achievements & Responsibilities',
  placeholder = 'Accomplished [X], as measured by [Y], by doing [Z]...',
}) => {
  const handleAddBullet = () => {
    onChange([...bullets, '']);
  };

  const handleUpdateBullet = (index: number, value: string) => {
    const updated = [...bullets];
    updated[index] = value;
    onChange(updated);
  };

  const handleRemoveBullet = (index: number) => {
    const updated = bullets.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMoveBullet = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= bullets.length) return;

    const updated = [...bullets];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onChange(updated);
  };

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <span>{label}</span>
          <span className="text-[10px] font-normal text-muted-foreground/80">
            ({bullets.length} {bullets.length === 1 ? 'bullet' : 'bullets'})
          </span>
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddBullet}
          className="h-6 px-2 text-[11px] gap-1"
        >
          <Plus className="h-3 w-3" />
          Add Bullet
        </Button>
      </div>

      {bullets.length === 0 ? (
        <div className="rounded-md border border-dashed p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1.5">
            No bullet points added yet.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddBullet}
            className="h-7 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add First Bullet Point
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {bullets.map((bullet, index) => (
            <div
              key={index}
              className="flex items-start gap-1.5 group/bullet rounded-md bg-background border p-1.5"
            >
              <span className="text-xs text-muted-foreground font-mono mt-1.5 px-1 select-none">
                {index + 1}.
              </span>
              <Textarea
                value={bullet}
                onChange={(e) => handleUpdateBullet(index, e.target.value)}
                placeholder={placeholder}
                rows={2}
                className="min-h-[44px] text-xs resize-y border-0 focus-visible:ring-0 p-1 bg-transparent"
              />
              <div className="flex flex-col gap-0.5 shrink-0 pt-0.5 opacity-80 group-hover/bullet:opacity-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === 0}
                  onClick={() => handleMoveBullet(index, 'up')}
                  className="h-5 w-5 text-muted-foreground disabled:opacity-30"
                  title="Move bullet up"
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === bullets.length - 1}
                  onClick={() => handleMoveBullet(index, 'down')}
                  className="h-5 w-5 text-muted-foreground disabled:opacity-30"
                  title="Move bullet down"
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveBullet(index)}
                  className="h-5 w-5 text-muted-foreground hover:text-destructive"
                  title="Delete bullet"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
