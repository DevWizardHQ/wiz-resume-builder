'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Briefcase,
  Building2,
  Check,
  Copy,
  Download,
  FileDown,
  FileText,
  FileType,
  Loader2,
  RefreshCw,
  Sparkles,
  Wand2,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ResumeData, ResumeRecord } from '@/types/resume';
import { INITIAL_RESUME_DATA } from '@/types/resume';

interface CoverLetterGeneratorModalProps {
  resume?: ResumeRecord | ResumeData;
  resumes?: ResumeRecord[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultCompany?: string;
  defaultJobTitle?: string;
}

export function CoverLetterGeneratorModal({
  resume,
  resumes = [],
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  defaultCompany = '',
  defaultJobTitle = '',
}: CoverLetterGeneratorModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [company, setCompany] = useState(defaultCompany);
  const [jobTitle, setJobTitle] = useState(defaultJobTitle);
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string>('');
  const [generationSource, setGenerationSource] = useState<'ollama' | 'fallback' | null>(null);
  const [modelUsed, setModelUsed] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? setControlledOpen! : setInternalOpen;

  // Initialize selected resume ID
  useEffect(() => {
    if (resume && 'id' in resume && resume.id) {
      setSelectedResumeId(resume.id);
    } else if (resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumes[0].id);
    }
  }, [resume, resumes, selectedResumeId]);

  const getActiveResumeData = (): ResumeData => {
    if (resume) {
      if ('content' in resume && resume.content) {
        return resume.content;
      }
      return resume as ResumeData;
    }
    if (selectedResumeId && resumes.length > 0) {
      const match = resumes.find((r) => r.id === selectedResumeId);
      if (match?.content) return match.content;
    }
    return INITIAL_RESUME_DATA;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;

    if (!company.trim() || !jobTitle.trim()) {
      setError('Please provide both a Company Name and Job Title.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const activeResume = getActiveResumeData();
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: activeResume,
          company: company.trim(),
          jobTitle: jobTitle.trim(),
          jobDescription: jobDescription.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate cover letter');
      }

      const data = await res.json();
      setGeneratedLetter(data.coverLetter || '');
      setGenerationSource(data.source || 'fallback');
      setModelUsed(data.modelUsed);
    } catch (err: any) {
      console.error('Error generating cover letter:', err);
      setError(err?.message || 'Error communicating with AI service. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedLetter) return;
    try {
      await navigator.clipboard.writeText(generatedLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!generatedLetter) return;
    const element = document.createElement('a');
    const file = new Blob([generatedLetter], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Cover_Letter_${company.replace(/\s+/g, '_')}_${jobTitle.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadDocx = async () => {
    if (!generatedLetter) return;
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      const paragraphs = generatedLetter.split('\n\n').map((paraText) => {
        return new Paragraph({
          children: [
            new TextRun({
              text: paraText.replace(/\n/g, ' '),
              font: 'Calibri',
              size: 24, // 12pt
            }),
          ],
          spacing: { after: 200 },
        });
      });

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1 inch
              },
            },
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cover_Letter_${company.replace(/\s+/g, '_')}_${jobTitle.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export DOCX:', err);
      // Fallback to txt
      handleDownloadTxt();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2 font-medium">
            <Wand2 className="h-4 w-4 text-primary" />
            Generate Cover Letter
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/70 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Tailored Cover Letter Generator
            </DialogTitle>
          </div>
          <DialogDescription>
            Synthesize your resume achievements with a target role using local Ollama LLM intelligence.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Target Company & Role Details Form */}
          <form id="cover-letter-form" onSubmit={handleGenerate} className="space-y-4">
            {/* Resume Selector if list provided and no fixed resume */}
            {resumes.length > 1 && (!resume || !('id' in resume)) && (
              <div className="space-y-1.5">
                <Label htmlFor="resume-select" className="text-sm font-medium">
                  Source Resume
                </Label>
                <select
                  id="resume-select"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.content?.contact?.fullName || 'Candidate'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="company-name" className="text-sm font-medium flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Target Company <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="company-name"
                  placeholder="e.g. Stripe, OpenAI, Google"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="job-title" className="text-sm font-medium flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  Target Job Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="job-title"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="job-desc" className="text-sm font-medium flex items-center justify-between">
                <span>Job Description / Key Requirements (Optional)</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Paste JD to maximize keyword alignment
                </span>
              </Label>
              <Textarea
                id="job-desc"
                placeholder="Paste the job posting requirements or key responsibilities here..."
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="resize-none text-xs"
              />
            </div>

            {error && (
              <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isGenerating || !company.trim() || !jobTitle.trim()}
              className="w-full gap-2 font-medium shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Synthesizing Cover Letter with AI...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  {generatedLetter ? 'Regenerate Cover Letter' : 'Generate Tailored Cover Letter'}
                </>
              )}
            </Button>
          </form>

          {/* Generated Result Output */}
          {generatedLetter && (
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Generated Cover Letter Draft
                  </Label>
                  {generationSource === 'ollama' ? (
                    <Badge variant="success" className="text-[10px] px-1.5 py-0 gap-1">
                      <Bot className="h-2.5 w-2.5" />
                      Ollama LLM ({modelUsed || 'llama3'})
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      ATS Optimized Template
                    </Badge>
                  )}
                </div>

                {/* Quick actions for output */}
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8 gap-1.5 text-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadDocx}
                    className="h-8 gap-1.5 text-xs"
                    title="Download DOCX"
                  >
                    <FileType className="h-3.5 w-3.5 text-blue-500" />
                    DOCX
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTxt}
                    className="h-8 gap-1.5 text-xs"
                    title="Download Text"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    TXT
                  </Button>
                </div>
              </div>

              {/* Editable Text Area for generated letter */}
              <Textarea
                value={generatedLetter}
                onChange={(e) => setGeneratedLetter(e.target.value)}
                rows={10}
                className="font-serif text-sm leading-relaxed p-4 bg-muted/20 border-border focus:bg-background transition-colors"
              />
              <p className="text-[11px] text-muted-foreground">
                You can edit the text directly above before exporting.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border/70 shrink-0 bg-muted/10">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
