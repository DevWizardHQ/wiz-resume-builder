'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Copy,
  Download,
  Edit3,
  FileDown,
  FileText,
  FileType,
  Loader2,
  MoreVertical,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ResumeRecord, TemplateId } from '@/types/resume';

interface ResumeCardProps {
  resume: ResumeRecord;
  onDuplicate?: (id: string) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
}

const TEMPLATE_NAMES: Record<TemplateId, string> = {
  'classic-ats': 'Classic ATS',
  'modern-minimal': 'Modern Minimal',
  'executive': 'Executive',
};

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Recently';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'Recently';
  }
}

export function ResumeCard({ resume, onDuplicate, onDelete }: ResumeCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const score = resume.ats_score ?? 0;
  const templateName = TEMPLATE_NAMES[resume.template_id] || 'Classic ATS';
  const relativeTime = formatRelativeTime(resume.updated_at);
  const fullName = resume.content?.contact?.fullName || 'Candidate Name';

  const getScoreBadge = () => {
    if (score >= 80) {
      return (
        <Badge
          variant="success"
          className="text-xs px-2 py-0.5 font-medium border-emerald-600/30 gap-1"
        >
          <Sparkles className="h-3 w-3" />
          ATS {score}%
        </Badge>
      );
    }
    if (score >= 60) {
      return (
        <Badge
          variant="warning"
          className="text-xs px-2 py-0.5 font-medium border-amber-500/30 gap-1"
        >
          <Sparkles className="h-3 w-3" />
          ATS {score}%
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="text-xs px-2 py-0.5 font-medium border-muted-foreground/30 gap-1"
      >
        <Sparkles className="h-3 w-3" />
        ATS {score}%
      </Badge>
    );
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDuplicating) return;
    setIsDuplicating(true);
    try {
      if (onDuplicate) {
        await onDuplicate(resume.id);
      } else {
        const res = await fetch('/api/resumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clone_from_id: resume.id }),
        });
        if (res.ok) {
          router.refresh();
        }
      }
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(resume.id);
      } else {
        await fetch(`/api/resumes/${resume.id}`, { method: 'DELETE' });
        router.refresh();
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Card className="group relative flex flex-col overflow-hidden border border-border/70 hover:border-primary/50 hover:shadow-lg transition-all duration-200 bg-card">
        {/* Top Header Mockup / Mini Preview Area */}
        <div
          onClick={() => router.push(`/editor/${resume.id}`)}
          className="relative h-44 w-full bg-muted/40 cursor-pointer overflow-hidden p-4 border-b border-border/50 select-none flex flex-col justify-between group-hover:bg-muted/60 transition-colors"
        >
          {/* Mini Mock Document Skeleton */}
          <div className="w-full h-full bg-white dark:bg-zinc-900 rounded border border-border/60 shadow-sm p-3 flex flex-col gap-1.5 transform group-hover:scale-[1.02] transition-transform duration-200 pointer-events-none">
            {/* Header Accent for Executive / Minimal */}
            {resume.template_id === 'executive' && (
              <div className="h-1.5 w-full bg-primary/70 rounded-full mb-0.5" />
            )}

            {/* Candidate Name Mock */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground truncate max-w-[150px]">
                {fullName}
              </span>
              <span className="text-[8px] text-muted-foreground">
                {resume.content?.contact?.location || 'Location'}
              </span>
            </div>

            {/* Subheader Line */}
            <div className="h-1 w-3/4 bg-muted-foreground/20 rounded" />

            {/* Divider */}
            <div className="h-px w-full bg-border my-0.5" />

            {/* Section 1 Skeleton */}
            <div className="flex flex-col gap-1 mt-0.5">
              <div className="h-1.5 w-1/3 bg-primary/40 rounded" />
              <div className="h-1 w-full bg-muted-foreground/20 rounded" />
              <div className="h-1 w-5/6 bg-muted-foreground/20 rounded" />
            </div>

            {/* Section 2 Skeleton */}
            <div className="flex flex-col gap-1 mt-0.5">
              <div className="h-1.5 w-1/4 bg-primary/40 rounded" />
              <div className="h-1 w-11/12 bg-muted-foreground/20 rounded" />
              <div className="h-1 w-4/5 bg-muted-foreground/20 rounded" />
            </div>
          </div>

          {/* Overlay Quick "Open Editor" CTA on Hover */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="sm" className="shadow-md gap-1.5 font-medium">
              <Edit3 className="h-3.5 w-3.5" />
              Open in Editor
            </Button>
          </div>
        </div>

        {/* Card Body / Metadata */}
        <div className="flex flex-col p-4 flex-1 justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col min-w-0 flex-1">
              <Link
                href={`/editor/${resume.id}`}
                className="font-semibold text-base text-foreground hover:text-primary transition-colors truncate block"
                title={resume.title}
              >
                {resume.title || 'Untitled Resume'}
              </Link>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="outline" className="text-[11px] px-1.5 py-0">
                  {templateName}
                </Badge>
                {getScoreBadge()}
              </div>
            </div>

            {/* Action Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Resume actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/editor/${resume.id}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Open in Editor</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleDuplicate}
                  disabled={isDuplicating}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {isDuplicating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span>Duplicate</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <a
                    href={`/api/export/pdf/${resume.id}`}
                    download
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <FileDown className="h-4 w-4 text-red-500" />
                    <span>Download PDF</span>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <a
                    href={`/api/export/docx/${resume.id}`}
                    download
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <FileType className="h-4 w-4 text-blue-500" />
                    <span>Download DOCX</span>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Footer Metadata & Quick Actions */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
            <span>Updated {relativeTime}</span>
            <div className="flex items-center gap-1">
              <a
                href={`/api/export/pdf/${resume.id}`}
                download
                title="Download PDF"
                className="p-1 hover:text-foreground text-muted-foreground rounded transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <FileDown className="h-3.5 w-3.5" />
              </a>
              <a
                href={`/api/export/docx/${resume.id}`}
                download
                title="Download DOCX"
                className="p-1 hover:text-foreground text-muted-foreground rounded transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <FileType className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{resume.title}&quot;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-1.5"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Resume
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
