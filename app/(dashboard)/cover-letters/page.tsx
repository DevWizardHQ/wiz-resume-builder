'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  Briefcase,
  Building2,
  Check,
  ChevronRight,
  Copy,
  Download,
  FileDown,
  FileText,
  FileType,
  LayoutDashboard,
  Loader2,
  Printer,
  RefreshCw,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ResumeData, ResumeRecord } from '@/types/resume';
import { DEMO_RESUMES, SAMPLE_ENGINEER_RESUME } from '@/lib/sample-data';

export default function CoverLettersPage() {
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string>('');
  const [generationSource, setGenerationSource] = useState<'omniroute' | 'openai' | 'ollama' | 'fallback' | null>(null);
  const [modelUsed, setModelUsed] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available resumes
  useEffect(() => {
    async function loadResumes() {
      setIsLoadingResumes(true);
      try {
        const res = await fetch('/api/resumes');
        if (res.ok) {
          const data = await res.json();
          const list = data.resumes || [];
          setResumes(list);
          if (list.length > 0) {
            setSelectedResumeId(list[0].id);
          }
        } else {
          setResumes(DEMO_RESUMES);
          setSelectedResumeId(DEMO_RESUMES[0].id);
        }
      } catch {
        setResumes(DEMO_RESUMES);
        setSelectedResumeId(DEMO_RESUMES[0].id);
      } finally {
        setIsLoadingResumes(false);
      }
    }
    loadResumes();
  }, []);

  const getSelectedResumeData = (): ResumeData => {
    const found = resumes.find((r) => r.id === selectedResumeId);
    return found?.content || SAMPLE_ENGINEER_RESUME;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;

    if (!company.trim() || !jobTitle.trim()) {
      setError('Please provide both Company Name and Target Job Title.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const activeResumeData = getSelectedResumeData();
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: activeResumeData,
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!generatedLetter) return;
    const element = document.createElement('a');
    const file = new Blob([generatedLetter], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Cover_Letter_${company.replace(/\s+/g, '_') || 'Job'}_${jobTitle.replace(/\s+/g, '_') || 'Application'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadDocx = async () => {
    if (!generatedLetter) return;
    try {
      const { Document, Packer, Paragraph, TextRun } = await import('docx');
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
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
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
      a.download = `Cover_Letter_${company.replace(/\s+/g, '_') || 'Job'}_${jobTitle.replace(/\s+/g, '_') || 'Application'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export DOCX:', err);
      handleDownloadTxt();
    }
  };

  const wordCount = generatedLetter.trim()
    ? generatedLetter.trim().split(/\s+/).length
    : 0;
  const charCount = generatedLetter.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top App Bar */}
      <header className="h-14 border-b border-border/70 bg-background/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI Cover Letter Studio
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <LayoutDashboard className="h-3.5 w-3.5" />
              My Resumes
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Studio Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Page Hero Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Wand2 className="h-7 w-7 text-primary" />
            AI-Tailored Cover Letter Generator
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
            Synthesize your resume achievements with target job requirements using OmniRoute, OpenAI, or Ollama AI intelligence. Generate tailored, ATS-aligned cover letters ready for instant export.
          </p>
        </div>

        {/* Dual-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border border-border/70 shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Target Role Details
                </CardTitle>
                <CardDescription className="text-xs">
                  Select your source profile and target opportunity.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleGenerate} className="space-y-4">
                  {/* Resume Selector */}
                  <div className="space-y-1.5">
                    <Label htmlFor="source-resume" className="text-xs font-semibold text-foreground">
                      Source Resume
                    </Label>
                    <select
                      id="source-resume"
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      disabled={isLoadingResumes || resumes.length === 0}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                    >
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({r.content?.contact?.fullName || 'Candidate'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Company */}
                  <div className="space-y-1.5">
                    <Label htmlFor="company-name" className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      Target Company <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="company-name"
                      placeholder="e.g. Anthropic, Google, Stripe"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      required
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* Target Job Title */}
                  <div className="space-y-1.5">
                    <Label htmlFor="job-title" className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Briefcase className="h-3 w-3 text-muted-foreground" />
                      Target Job Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="job-title"
                      placeholder="e.g. Staff Software Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      required
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* Job Description (Optional) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="jd-textarea" className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>Job Description / Key Requirements</span>
                      <span className="text-[11px] font-normal text-muted-foreground">Optional</span>
                    </Label>
                    <Textarea
                      id="jd-textarea"
                      placeholder="Paste job posting text or key bullet points to optimize keyword matching..."
                      rows={5}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="text-xs resize-none"
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
                    className="w-full gap-2 font-medium shadow-sm h-10"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating Tailored Letter...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {generatedLetter ? 'Regenerate Cover Letter' : 'Generate Cover Letter'}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Quick Tips Banner */}
            <Card className="border border-border/60 bg-muted/20">
              <CardContent className="p-4 space-y-2 text-xs text-muted-foreground">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Pro-Tips for ATS Cover Letters:
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Directly address the specific job title and company goals in paragraph 1.</li>
                  <li>Include 2-3 quantifiable metrics from your actual experience.</li>
                  <li>Keep length between 250 and 400 words for optimal recruiter engagement.</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Output / Live Editor */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="border border-border/70 shadow-xs flex flex-col min-h-[560px]">
              <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between flex-wrap gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">
                      Cover Letter Document
                    </CardTitle>
                    {generationSource === 'omniroute' && (
                      <Badge variant="default" className="text-[10px] px-2 py-0 gap-1 font-normal bg-indigo-600 text-white">
                        <Sparkles className="h-2.5 w-2.5" />
                        OmniRoute AI ({modelUsed || 'gpt-4o-mini'})
                      </Badge>
                    )}
                    {generationSource === 'openai' && (
                      <Badge variant="success" className="text-[10px] px-2 py-0 gap-1 font-normal bg-emerald-600 text-white">
                        <Sparkles className="h-2.5 w-2.5" />
                        OpenAI ({modelUsed || 'gpt-4o-mini'})
                      </Badge>
                    )}
                    {generationSource === 'ollama' && (
                      <Badge variant="success" className="text-[10px] px-1.5 py-0 gap-1 font-normal">
                        <Bot className="h-2.5 w-2.5" />
                        Ollama LLM ({modelUsed || 'local'})
                      </Badge>
                    )}
                    {generationSource === 'fallback' && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 font-normal">
                        <Sparkles className="h-2.5 w-2.5" />
                        Structured Template
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {wordCount > 0 ? `${wordCount} words • ${charCount} characters` : 'Ready to draft'}
                  </CardDescription>
                </div>

                {/* Document Actions */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={!generatedLetter}
                    className="h-8 gap-1.5 text-xs"
                    title="Copy to Clipboard"
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
                    disabled={!generatedLetter}
                    className="h-8 gap-1.5 text-xs"
                    title="Download DOCX file"
                  >
                    <FileType className="h-3.5 w-3.5 text-blue-500" />
                    DOCX
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTxt}
                    disabled={!generatedLetter}
                    className="h-8 gap-1.5 text-xs"
                    title="Download Plain Text file"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    TXT
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-4 sm:p-6 flex flex-col">
                {generatedLetter ? (
                  <Textarea
                    value={generatedLetter}
                    onChange={(e) => setGeneratedLetter(e.target.value)}
                    className="flex-1 w-full min-h-[440px] font-serif text-sm leading-relaxed p-4 bg-background border-border/80 focus:border-primary rounded-md resize-y"
                    placeholder="Your cover letter text will appear here..."
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border/60 rounded-lg bg-muted/10 space-y-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm text-foreground">
                        No Cover Letter Generated Yet
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Fill in your target company and job title on the left and click &quot;Generate Cover Letter&quot; to create an instant tailored application letter.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
