'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  FileText,
  Layers,
  Loader2,
  Replace,
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
import { useResumeStore } from '@/store/useResumeStore';
import { ResumeData } from '@/types/resume';
import { ImportMode } from '@/types/import';
import {
  extractTextFromFile,
  parseJsonResumeContent,
  parseTextResumeContent,
} from '@/lib/import/resume-parser';

export interface ImportResumeModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ImportResumeModal: React.FC<ImportResumeModalProps> = ({
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const importResumeData = useResumeStore((state) => state.importResumeData);
  const activeTitle = useResumeStore((state) => state.title);

  const [pastedText, setPastedText] = useState('');
  const [mode, setMode] = useState<ImportMode>('merge');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ResumeData | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const handleFile = async (file: File | null) => {
    setError(null);
    setParsed(null);
    setSource(null);
    if (!file) return;
    setIsParsing(true);
    setFileName(file.name);
    try {
      const extracted = await extractTextFromFile(file);
      setPastedText('');
      console.log('[DEV LOG] [Client: ImportResumeModal] File text extracted by JS:', {
        fileName: file.name,
        sourceType: extracted.sourceType,
        textLength: extracted.text.length,
        preview: extracted.text.slice(0, 200),
      });

      if (extracted.sourceType === 'json') {
        const jsonData = parseJsonResumeContent(extracted.text);
        if (jsonData) {
          console.log('[DEV LOG] [Client: ImportResumeModal] Parsed JSON Resume directly:', jsonData);
          setParsed(jsonData);
          setSource('json');
          return;
        }
      }

      // Stage 2: AI schema fitting with heuristic fallback
      try {
        console.log('[DEV LOG] [Client: ImportResumeModal] Requesting AI Resume Parse from API...');
        const res = await fetch('/api/ai/parse-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: extracted.text,
            rawText: extracted.text,
            sourceType: extracted.sourceType,
            fileName: file.name,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          console.log('[DEV LOG] [Client: ImportResumeModal] Received parsed resume data schema from API:', result);
          setParsed(result.data);
          setSource(result.source || 'heuristic');
        } else {
          console.warn('[DEV LOG] [Client: ImportResumeModal] API parse failed, using client-side heuristic fallback');
          const fallbackData = parseTextResumeContent(extracted.text);
          console.log('[DEV LOG] [Client: ImportResumeModal] Client-side heuristic parsed data schema:', fallbackData);
          setParsed(fallbackData);
          setSource('heuristic');
        }
      } catch (apiErr) {
        console.warn('[DEV LOG] [Client: ImportResumeModal] API fetch error, using client-side heuristic fallback:', apiErr);
        const fallbackData = parseTextResumeContent(extracted.text);
        console.log('[DEV LOG] [Client: ImportResumeModal] Client-side heuristic parsed data schema:', fallbackData);
        setParsed(fallbackData);
        setSource('heuristic');
      }
    } catch (err: any) {
      console.error('[DEV LOG] [Client: ImportResumeModal] Error extracting file:', err);
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
    console.log('[DEV LOG] [Client: ImportResumeModal] Parsing pasted text. Length:', trimmed.length);
    try {
      const jsonData = parseJsonResumeContent(trimmed);
      if (jsonData) {
        console.log('[DEV LOG] [Client: ImportResumeModal] Parsed JSON Resume directly from paste:', jsonData);
        setParsed(jsonData);
        setSource('json');
        return;
      }
      // Try AI-assisted parse for richer extraction, falling back to heuristics.
      console.log('[DEV LOG] [Client: ImportResumeModal] Requesting AI Resume Parse for pasted text...');
      const res = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, sourceType: 'text' }),
      });
      if (res.ok) {
        const result = await res.json();
        console.log('[DEV LOG] [Client: ImportResumeModal] Received parsed resume data schema from API:', result);
        setParsed(result.data);
        setSource(result.source || 'heuristic');
      } else {
        console.warn('[DEV LOG] [Client: ImportResumeModal] API parse failed, using client-side heuristic fallback');
        const fallbackData = parseTextResumeContent(trimmed);
        console.log('[DEV LOG] [Client: ImportResumeModal] Client-side heuristic parsed data schema:', fallbackData);
        setParsed(fallbackData);
        setSource('heuristic');
      }
    } catch (apiErr) {
      console.warn('[DEV LOG] [Client: ImportResumeModal] API fetch error, using client-side heuristic fallback:', apiErr);
      const fallbackData = parseTextResumeContent(trimmed);
      console.log('[DEV LOG] [Client: ImportResumeModal] Client-side heuristic parsed data schema:', fallbackData);
      setParsed(fallbackData);
      setSource('heuristic');
    } finally {
      setIsParsing(false);
    }
  };

  const handleApply = () => {
    if (!parsed) return;
    setIsApplying(true);
    try {
      importResumeData(parsed, mode);
      setTimeout(() => {
        setIsApplying(false);
        setOpen(false);
        setParsed(null);
        setPastedText('');
      }, 300);
    } catch (err: any) {
      setError(err?.message || 'Failed to apply imported data.');
      setIsApplying(false);
    }
  };

  const stats = parsed
    ? [
        { label: 'Experience', count: parsed.experience?.length ?? 0 },
        { label: 'Projects', count: parsed.projects?.length ?? 0 },
        { label: 'Education', count: parsed.education?.length ?? 0 },
        { label: 'Skills', count: (parsed.skills || []).reduce((n, s) => n + s.skills.length, 0) },
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5">
            <Upload className="h-3.5 w-3.5" />
            <span>Import / Auto-Fill</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Import / Auto-Fill Resume</DialogTitle>
              <DialogDescription className="text-xs">
                Upload a JSON / PDF / DOCX / TXT resume or paste text. Data is auto-fillable into “{activeTitle}”.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File Upload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Upload File</Label>
            <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-border/70 hover:border-primary/50 cursor-pointer bg-muted/20 transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {fileName ? `Selected: ${fileName}` : 'Click to choose or upload JSON, PDF, DOCX, TXT, or Markdown'}
              </span>
              <span className="text-[10px] text-muted-foreground/70">
                PDFs and Word files are parsed on your device — nothing is uploaded.
              </span>
              <input
                type="file"
                accept=".json,.pdf,.docx,.txt,.md,application/json,application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {/* Divider */}
          <div className="relative py-1 text-center">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground bg-background px-2 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
              or paste
            </span>
            <div className="border-t border-border/50" />
          </div>

          {/* Paste Area */}
          <div className="space-y-1.5">
            <Label htmlFor="import-paste" className="text-xs font-medium">
              Paste Resume Text
            </Label>
            <Textarea
              id="import-paste"
              placeholder="Paste your resume text or JSON Resume here…"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={6}
              className="text-xs font-mono resize-y"
            />
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] text-muted-foreground">
                Supports plain text, markdown, or JSON Resume format.
              </span>
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
                    <Layers className="h-3 w-3" />
                    Parse & Review
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Preview */}
          {parsed && (
            <div className="space-y-3 rounded-lg border border-border/80 bg-card p-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Parsed Data
                </h4>
                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                  Source: {source}
                </Badge>
              </div>
              <p className="text-xs text-foreground/80">
                Name: <span className="font-mono">{parsed.contact.fullName || '—'}</span> · Email:{' '}
                <span className="font-mono">{parsed.contact.email || '—'}</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-md bg-muted/40 border border-border/40 p-2 text-center">
                    <div className="text-lg font-bold text-foreground">{s.count}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Mode Toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Import Mode</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('merge')}
                className={`flex flex-col items-start gap-0.5 p-3 rounded-md border text-left transition-all ${
                  mode === 'merge'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30 text-primary'
                    : 'border-border/60 bg-background text-muted-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  <Layers className="h-3.5 w-3.5" />
                  Merge (Recommended)
                </span>
                <span className="text-[10px]">Append imported items without losing existing content.</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('replace')}
                className={`flex flex-col items-start gap-0.5 p-3 rounded-md border text-left transition-all ${
                  mode === 'replace'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30 text-primary'
                    : 'border-border/60 bg-background text-muted-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  <Replace className="h-3.5 w-3.5" />
                  Replace
                </span>
                <span className="text-[10px]">Overwrite this resume entirely with imported data.</span>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between border-t border-border/40 pt-3">
          <span className="text-[11px] text-muted-foreground">
            Creates an undo-history snapshot (Cmd+Z) once applied.
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} className="h-7 text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              disabled={!parsed || isApplying}
              className="h-7 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Applying…
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Apply to Resume
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
