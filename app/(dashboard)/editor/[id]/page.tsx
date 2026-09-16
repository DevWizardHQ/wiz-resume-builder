'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  CloudUpload,
  Edit3,
  Eye,
  FileEdit,
  History,
  Loader2,
  Redo2,
  Sparkles,
  Undo2,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AIReviewDrawer } from '@/components/editor/AIReviewDrawer';
import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { LivePreviewPane } from '@/components/editor/LivePreviewPane';
import { createClient } from '@/lib/supabase/client';
import { useResumeStore } from '@/store/useResumeStore';
import { INITIAL_RESUME_DATA, ResumeRecord, TemplateId } from '@/types/resume';

interface EditorPageProps {
  params: Promise<{ id: string }>;
}

export default function EditorPage({ params }: EditorPageProps) {
  const resolvedParams = use(params);
  const resumeIdParam = resolvedParams.id;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [isLoading, setIsLoading] = useState(true);

  // Store Selectors
  const title = useResumeStore((state) => state.title);
  const setTitle = useResumeStore((state) => state.setTitle);
  const atsScore = useResumeStore((state) => state.atsScore);
  const isSaving = useResumeStore((state) => state.isSaving);
  const isDirty = useResumeStore((state) => state.isDirty);
  const lastSaved = useResumeStore((state) => state.lastSaved);
  const saveError = useResumeStore((state) => state.saveError);
  const past = useResumeStore((state) => state.past);
  const future = useResumeStore((state) => state.future);
  const undo = useResumeStore((state) => state.undo);
  const redo = useResumeStore((state) => state.redo);
  const loadResume = useResumeStore((state) => state.loadResume);

  // Load Resume Data
  useEffect(() => {
    let isMounted = true;

    async function fetchResume() {
      setIsLoading(true);
      try {
        if (
          resumeIdParam === 'new' ||
          resumeIdParam === 'demo' ||
          resumeIdParam === 'sample' ||
          resumeIdParam === 'mock'
        ) {
          loadResume({
            id: resumeIdParam === 'new' ? undefined : resumeIdParam,
            title: resumeIdParam === 'new' ? 'Untitled Resume' : 'Sample Software Engineer Resume',
            template_id: 'classic-ats',
            content: INITIAL_RESUME_DATA,
            ats_score: 82,
          });
        } else {
          try {
            const supabase = createClient();
            const { data: record, error } = await supabase
              .from('resumes')
              .select('*')
              .eq('id', resumeIdParam)
              .single();

            if (isMounted) {
              if (record && !error) {
                loadResume(record as Partial<ResumeRecord>);
              } else {
                // Fallback for offline/demo/uncreated records
                loadResume({
                  id: resumeIdParam,
                  title: 'My ATS Resume',
                  template_id: 'classic-ats',
                  content: INITIAL_RESUME_DATA,
                  ats_score: 75,
                });
              }
            }
          } catch (dbErr) {
            console.warn('Could not fetch resume from Supabase, using defaults:', dbErr);
            if (isMounted) {
              loadResume({
                id: resumeIdParam,
                title: 'My ATS Resume',
                template_id: 'classic-ats',
                content: INITIAL_RESUME_DATA,
                ats_score: 75,
              });
            }
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchResume();

    return () => {
      isMounted = false;
    };
  }, [resumeIdParam, loadResume]);

  // Global Keyboard Shortcuts for Undo / Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting inside input / textarea if native typing
      const target = e.target as HTMLElement | null;
      const isFormInput =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else if (!isFormInput) {
          e.preventDefault();
          undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y' && !isFormInput) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // ATS Score Color Variant
  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return (
        <Badge
          variant="success"
          className="text-xs px-2.5 py-0.5 gap-1.5 font-medium border-emerald-600/30"
        >
          <Sparkles className="h-3 w-3" />
          ATS Score: {score}/100
        </Badge>
      );
    }
    if (score >= 60) {
      return (
        <Badge
          variant="warning"
          className="text-xs px-2.5 py-0.5 gap-1.5 font-medium border-amber-500/30"
        >
          <Sparkles className="h-3 w-3" />
          ATS Score: {score}/100
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="text-xs px-2.5 py-0.5 gap-1.5 font-medium border-muted-foreground/30"
      >
        <Sparkles className="h-3 w-3" />
        ATS Score: {score || 0}/100
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading resume editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      {/* Top Application Header */}
      <header className="flex h-14 items-center justify-between gap-4 border-b border-border/70 px-4 bg-background/95 backdrop-blur shrink-0 z-30">
        {/* Left: Navigation & Editable Title */}
        <div className="flex items-center gap-3 min-w-0 max-w-md sm:max-w-lg">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {/* Editable Title */}
          <div className="flex items-center gap-1.5 min-w-0">
            {isEditingTitle ? (
              <Input
                value={title}
                autoFocus
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    setIsEditingTitle(false);
                  }
                }}
                className="h-8 text-sm font-semibold max-w-[240px] sm:max-w-[320px]"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md hover:bg-muted/80 text-left min-w-0 transition-colors"
                title="Click to rename resume"
              >
                <span className="font-semibold text-sm truncate max-w-[200px] sm:max-w-[280px]">
                  {title || 'Untitled Resume'}
                </span>
                <Edit3 className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Center: Save Status & History Controls */}
        <div className="hidden md:flex items-center gap-3">
          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 border border-border/50 rounded-lg p-0.5 bg-muted/20">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={past.length === 0}
              className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={future.length === 0}
              className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Auto-Save Status */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Saving...</span>
              </>
            ) : saveError ? (
              <>
                <XCircle className="h-3.5 w-3.5 text-destructive" />
                <span className="text-destructive font-medium">Save failed</span>
              </>
            ) : isDirty ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Unsaved changes</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Saved</span>
              </>
            )}
          </div>
        </div>

        {/* Right: ATS Score & Mobile View Toggle */}
        <div className="flex items-center gap-2">
          {/* ATS Review Drawer Trigger */}
          <AIReviewDrawer
            trigger={
              <button
                type="button"
                className="cursor-pointer transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-full"
                title="Click to open ATS Audit, Format Checklist, and Keyword Match Drawer"
              >
                {getScoreBadge(atsScore)}
              </button>
            }
          />

          {/* Mobile View Toggle (Tabs) */}
          <div className="flex lg:hidden items-center bg-muted p-0.5 rounded-lg border border-border/50">
            <button
              type="button"
              onClick={() => setMobileTab('editor')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                mobileTab === 'editor'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileEdit className="h-3 w-3" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                mobileTab === 'preview'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eye className="h-3 w-3" />
              <span>Preview</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dual-Pane Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Pane: Editor Sidebar (Accordion Sections & DND) */}
        <div
          className={`w-full lg:w-1/2 xl:w-[48%] h-full p-3 sm:p-4 lg:p-6 overflow-hidden ${
            mobileTab === 'editor' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
          }`}
        >
          <EditorSidebar />
        </div>

        {/* Right Pane: Live Preview Pane (A4 Canvas, Zoom, Export) */}
        <div
          className={`w-full lg:w-1/2 xl:w-[52%] h-full overflow-hidden ${
            mobileTab === 'preview' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
          }`}
        >
          <LivePreviewPane className="w-full h-full" />
        </div>
      </main>
    </div>
  );
}
