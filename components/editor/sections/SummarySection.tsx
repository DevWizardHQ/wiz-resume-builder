'use client';

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useResumeStore } from '@/store/useResumeStore';

export const SummarySection: React.FC = () => {
  const summary = useResumeStore((state) => state.data.summary);
  const updateSummary = useResumeStore((state) => state.updateSummary);

  const text = summary?.text || '';
  const visible = summary?.visible ?? true;

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="space-y-3">
      {/* Visibility and Stats Bar */}
      <div className="flex items-center justify-between pb-1 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Switch
            id="summary-visible-toggle"
            checked={visible}
            onCheckedChange={(checked) => updateSummary(text, checked)}
          />
          <Label
            htmlFor="summary-visible-toggle"
            className="text-xs cursor-pointer flex items-center gap-1.5"
          >
            {visible ? (
              <>
                <Eye className="h-3.5 w-3.5 text-primary" />
                <span>Visible on Resume</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Hidden from Resume</span>
              </>
            )}
          </Label>
        </div>

        <div className="text-[11px] text-muted-foreground font-mono">
          {wordCount} words | {charCount} chars
        </div>
      </div>

      {/* Textarea */}
      <div className="space-y-1.5">
        <Textarea
          placeholder="Results-driven software engineer with 5+ years of experience designing scalable distributed systems..."
          value={text}
          onChange={(e) => updateSummary(e.target.value, visible)}
          rows={4}
          className="text-xs resize-y"
        />
        <p className="text-[11px] text-muted-foreground">
          Tip: Keep your summary between 2-4 impactful sentences highlighting your core value proposition, key achievements, and primary domain expertise.
        </p>
      </div>
    </div>
  );
};
