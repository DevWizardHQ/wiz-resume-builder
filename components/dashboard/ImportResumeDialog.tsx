'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  FileUp,
  FileText,
  Loader2,
  Sparkles,
  Upload,
} from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ResumeData } from '@/types/resume';
import {
  parseImportedFile,
  parseJsonResumeContent,
  parseTextResumeContent,
} from '@/lib/import/resume-parser';

export interface ImportResumeDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ImportResumeDialog: React.FC<ImportResumeDialogProps> = ({
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}) => {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const [title, setTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ResumeData | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | null) => {
    setError(null);
    setParsed(null);
    setSource(null);
    if (!file) return;
    setIsParsing(true);
    setFileName(file.name);
    try {
      const result = await parseImportedFile(file);
      setParsed(result.data);
      setSource(result.sourceType);
      setTitle(result.title);
      setPastedText('');
    } catch (err: any) {
      setError(err?.message || 'Failed to read the uploaded file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleParsePaste = async () => {
    setError(null);
    setParsed(null);
    setSource(null);
    const trimmed = pastedText.trim();
    if (!trimmed) {
      setError('Paste a resume or upload a file to continue.');
      return;
    }
    setIsParsing(true);
    try {
      const jsonData = parseJsonResumeContent(trimmed);
      if (jsonData) {
        setParsed(jsonData);
        setSource('json');
        setTitle(jsonData.contact.fullName ? `${jsonData.contact.fullName} — Resume` : 'Imported Resume');
        return;
      }
      const res = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, sourceType: 'text' }),
      });
      if (res.ok) {
        const result = await res.json();
        setParsed(result.data);
        setSource(result.source || 'heuristic');
      } else {
        setParsed(parseTextResumeContent(trimmed));
        setSource('heuristic');
      }
    } catch {
      setParsed(parseTextResumeContent(trimmed));
      setSource('heuristic');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCreate = async () => {
    if (!parsed) return;
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Imported Resume',
          template_id: 'classic-ats',
          use_sample_data: false,
          content: parsed,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create resume');
      }
      const data = await res.json();
      const newId = data.resume?.id || data.id;
      setOpen(false);
      setParsed(null);
      setPastedText('');
      if (newId) {
        router.push(`/editor/${newId}`);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create resume from import.');
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 font-medium">
            <Upload className="h-3.5 w-3.5 text-primary" />
            <span>Import Resume</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileUp className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Import Resume</DialogTitle>
              <DialogDescription className="text-xs">
                Extract and auto-fill a brand-new resume from an existing JSON, PDF, DOCX, or TXT document.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File Upload */}
          <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-border/70 hover:border-primary/50 cursor-pointer bg-muted/20 transition-colors">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {fileName ? `Selected: ${fileName}` : 'Click to choose JSON, PDF, DOCX, TXT, or Markdown'}
            </span>
            <input
              type="file"
              accept=".json,.pdf,.docx,.txt,.md,application/json,application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
          </label>

          {/* Divider */}
          <div className="relative py-1 text-center">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground bg-background px-2 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
              or paste
            </span>
            <div className="border-t border-border/50" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dash-import-paste" className="text-xs font-medium">
              Paste Resume Text
            </Label>
            <Textarea
              id="dash-import-paste"
              placeholder="Paste your resume text or JSON Resume here…"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={6}
              className="text-xs font-mono resize-y"
            />
            <div className="flex items-center justify-end">
              <Button
                type="button"
                size="sm"
                onClick={handleParsePaste}
                disabled={isParsing || !pastedText.trim()}
                className="h-7 text-xs gap-1.5"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Parsing…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" />
                    Parse & Review
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {parsed && (
            <div className="space-y-3 rounded-lg border border-border/80 bg-card p-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Parsed Data</h4>
                <Badge variant="outline" className="text-[10px] uppercase font-mono">Source: {source}</Badge>
              </div>
              <p className="text-xs text-foreground/80">
                Name: <span className="font-mono">{parsed.contact.fullName || '—'}</span> · Experience:{' '}
                <span className="font-mono">{parsed.experience?.length ?? 0}</span> · Skills:{' '}
                <span className="font-mono">
                  {(parsed.skills || []).reduce((n, s) => n + (s.skills?.length || 0), 0)}
                </span>
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="dash-import-title" className="text-xs font-medium">Resume Title</Label>
                <Input
                  id="dash-import-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Imported Resume"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between border-t border-border/40 pt-3">
          <span className="text-[11px] text-muted-foreground">
            Creates a new resume document with the extracted data.
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} className="h-7 text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreate}
              disabled={!parsed || isCreating}
              className="h-7 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5" />
                  Create Resume
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
