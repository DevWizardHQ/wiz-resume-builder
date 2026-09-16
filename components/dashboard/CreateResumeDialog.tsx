'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CheckCircle2, FileText, Layout, Loader2, Plus, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TemplateId } from '@/types/resume';

interface CreateResumeDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const TEMPLATES: Array<{
  id: TemplateId;
  name: string;
  description: string;
  badge: string;
  previewClass: string;
}> = [
  {
    id: 'classic-ats',
    name: 'Classic ATS',
    description: 'Single-column timeless layout engineered for 100% parser compatibility across all ATS algorithms.',
    badge: 'Max ATS Match',
    previewClass: 'border-l-4 border-l-primary',
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean typography, refined margins, and subtle metadata hierarchy for tech & design roles.',
    badge: 'High Readability',
    previewClass: 'border-l-4 border-l-blue-500',
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Distinguished top accent banner and bold section branding tailored for senior leaders and managers.',
    badge: 'Leadership Focus',
    previewClass: 'border-l-4 border-l-amber-500',
  },
];

export function CreateResumeDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: CreateResumeDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('classic-ats');
  const [useSampleData, setUseSampleData] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;

    setIsCreating(true);
    setError(null);

    const resumeTitle = title.trim() || 'Untitled Resume';

    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: resumeTitle,
          template_id: selectedTemplate,
          use_sample_data: useSampleData,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create resume');
      }

      const data = await res.json();
      setIsOpen(false);
      // Reset form
      setTitle('');
      setSelectedTemplate('classic-ats');
      setUseSampleData(true);

      // Navigate directly into the editor for the newly created resume
      if (data.resume?.id) {
        router.push(`/editor/${data.resume.id}`);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      console.error('Error creating resume:', err);
      setError(err?.message || 'Failed to create resume. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="gap-2 shadow-sm font-medium">
            <Plus className="h-4 w-4" />
            Create Resume
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-primary" />
              Create New Resume
            </DialogTitle>
            <DialogDescription>
              Select an ATS-optimized template and set a name for your new resume.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Resume Title Input */}
            <div className="space-y-2">
              <Label htmlFor="resume-title" className="text-sm font-medium">
                Resume Title
              </Label>
              <Input
                id="resume-title"
                placeholder="e.g. Senior Software Engineer - 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Give your resume a descriptive name to organize different role targets.
              </p>
            </div>

            {/* Template Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Choose Template</Label>
                <span className="text-xs text-muted-foreground">
                  You can switch templates at any time in the editor
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplate === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      className={`relative cursor-pointer rounded-lg border p-3 flex flex-col justify-between gap-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                          : 'border-border/70 hover:border-border hover:bg-muted/40'
                      } ${tmpl.previewClass}`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="font-semibold text-sm text-foreground">
                          {tmpl.name}
                        </div>
                        {isSelected && (
                          <div className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {tmpl.description}
                      </p>

                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 mt-1 self-start font-normal"
                      >
                        {tmpl.badge}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sample Data Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border/70 p-3.5 bg-muted/20">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="sample-toggle" className="text-sm font-medium cursor-pointer">
                  Pre-fill with ATS Sample Data
                </Label>
                <p className="text-xs text-muted-foreground">
                  Populate sections with proven Google X-Y-Z action bullets, metrics, and skills.
                </p>
              </div>
              <Switch
                id="sample-toggle"
                checked={useSampleData}
                onCheckedChange={setUseSampleData}
              />
            </div>

            {/* Error banner if any */}
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating} className="gap-2">
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Create Resume
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
