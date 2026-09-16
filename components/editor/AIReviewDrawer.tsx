'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  FileCheck,
  FileText,
  HelpCircle,
  Layers,
  Loader2,
  Percent,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  Wand2,
  XCircle,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { analyzeAtsScore, AtsAnalysisResult } from '@/lib/utils/ats-analyzer';
import { useResumeStore } from '@/store/useResumeStore';

export interface AIReviewDrawerProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AIReviewDrawer: React.FC<AIReviewDrawerProps> = ({
  trigger,
  isOpen: controlledOpen,
  onOpenChange: setControlledOpen,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (newOpen: boolean) => {
    if (isControlled) {
      setControlledOpen?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const resumeData = useResumeStore((state) => state.data);
  const currentAtsScore = useResumeStore((state) => state.atsScore);
  const setAtsScore = useResumeStore((state) => state.setAtsScore);

  const [jobDescription, setJobDescription] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AtsAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobMatch' | 'checklist'>('overview');

  // Compute immediate local format analysis whenever resume data changes
  const localAnalysis = useMemo(() => {
    return analyzeAtsScore(resumeData, jobDescription.trim() || undefined);
  }, [resumeData, jobDescription]);

  // Active analysis is server result if audited, otherwise local real-time analysis
  const currentAnalysis = analysisResult || localAnalysis;

  // Keep store atsScore synchronized with the latest overallScore
  useEffect(() => {
    if (currentAnalysis?.overallScore !== undefined && currentAnalysis.overallScore !== currentAtsScore) {
      setAtsScore(currentAnalysis.overallScore);
    }
  }, [currentAnalysis?.overallScore, currentAtsScore, setAtsScore]);

  const handleAuditJobDescription = async () => {
    if (!jobDescription.trim()) {
      setAuditError('Please paste a job description or list of required skills.');
      return;
    }

    setIsAuditing(true);
    setAuditError(null);

    try {
      const response = await fetch('/api/ai/ats-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: resumeData,
          jobDescription: jobDescription.trim(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data: AtsAnalysisResult = await response.json();
      setAnalysisResult(data);
      if (data.overallScore !== undefined) {
        setAtsScore(data.overallScore);
      }
      setActiveTab('jobMatch');
    } catch (err: any) {
      console.warn('API audit failed, using client-side fallback analysis:', err);
      // Seamlessly fall back to client-side analyzer
      const fallback = analyzeAtsScore(resumeData, jobDescription.trim());
      setAnalysisResult(fallback);
      if (fallback.overallScore !== undefined) {
        setAtsScore(fallback.overallScore);
      }
      setActiveTab('jobMatch');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleResetAudit = () => {
    setJobDescription('');
    setAnalysisResult(null);
    setAuditError(null);
    const refreshed = analyzeAtsScore(resumeData);
    setAtsScore(refreshed.overallScore);
  };

  // Color coding helper based on 0-100 scale
  const getScoreTheme = (score: number) => {
    if (score >= 80) {
      return {
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        border: 'border-emerald-500/30',
        ring: 'stroke-emerald-500',
        bar: 'bg-emerald-500',
        badge: 'success' as const,
        label: 'Excellent ATS Match',
        description: 'Strong structure, quantifiable metrics, and solid keyword density.',
      };
    }
    if (score >= 60) {
      return {
        text: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        border: 'border-amber-500/30',
        ring: 'stroke-amber-500',
        bar: 'bg-amber-500',
        badge: 'warning' as const,
        label: 'Moderate ATS Match',
        description: 'Good foundation. Add more quantified impact metrics and targeted keywords.',
      };
    }
    return {
      text: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10 dark:bg-red-500/20',
      border: 'border-red-500/30',
      ring: 'stroke-red-500',
      bar: 'bg-red-500',
      badge: 'destructive' as const,
      label: 'Needs ATS Improvement',
      description: 'Missing key contact elements, action verbs, or core domain skills.',
    };
  };

  const theme = getScoreTheme(currentAnalysis.overallScore);

  // Format checklist items computed from resumeData
  const checklistItems = useMemo(() => {
    const contact = resumeData.contact || {};
    const hasName = Boolean(contact.fullName && contact.fullName.trim());
    const hasEmail = Boolean(contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim()));
    const hasPhone = Boolean(contact.phone && contact.phone.trim().length >= 7);
    const hasLocation = Boolean(contact.location && contact.location.trim());

    const summary = resumeData.summary;
    const hasSummary = Boolean(summary?.visible && summary?.text && summary.text.trim().length >= 30);

    const experiences = (resumeData.experience || []).filter((e) => e.visible !== false);
    const hasExperience = experiences.length > 0;
    const hasExperienceDetails = experiences.some((e) => e.company?.trim() && e.role?.trim());

    const skills = (resumeData.skills || []).filter((s) => s.visible !== false);
    const skillCount = skills.reduce((acc, cat) => acc + (cat.skills?.length || 0), 0);
    const hasSkills = skillCount >= 5;

    const education = (resumeData.education || []).filter((e) => e.visible !== false);
    const hasEducation = education.length > 0 && education.some((e) => e.institution?.trim());

    const metricsCount = currentAnalysis.metricsCount;
    const actionVerbCount = currentAnalysis.actionVerbCount;

    return [
      {
        id: 'name',
        title: 'Full Name & Contact Header',
        passed: hasName && (hasEmail || hasPhone),
        detail: hasName
          ? hasEmail
            ? `Verified: ${contact.fullName} (${contact.email})`
            : 'Add contact email'
          : 'Missing full name',
      },
      {
        id: 'location',
        title: 'Target Location / Remote Preference',
        passed: hasLocation,
        detail: hasLocation ? `Specified: ${contact.location}` : 'Recommended for ATS geographic filters',
      },
      {
        id: 'summary',
        title: 'Professional Summary',
        passed: hasSummary,
        detail: hasSummary
          ? `${summary?.text?.trim().length || 0} characters`
          : 'Add a 2-3 sentence career summary',
      },
      {
        id: 'experience',
        title: 'Work Experience Entries',
        passed: hasExperience && hasExperienceDetails,
        detail: hasExperience
          ? `${experiences.length} positions listed with valid titles & companies`
          : 'Add at least 1 work experience or internship',
      },
      {
        id: 'actionVerbs',
        title: 'Strong Action Verbs',
        passed: actionVerbCount >= 4,
        detail: `${actionVerbCount} action verbs found (recommended: 4+)`,
      },
      {
        id: 'metrics',
        title: 'Quantified Metrics (Google X-Y-Z Formula)',
        passed: metricsCount >= 3,
        detail: `${metricsCount} metric-driven achievements found (recommended: 3+)`,
      },
      {
        id: 'skills',
        title: 'Technical & Professional Skills',
        passed: hasSkills,
        detail: `${skillCount} skills organized in ${skills.length} categories`,
      },
      {
        id: 'education',
        title: 'Education / Degree Records',
        passed: hasEducation,
        detail: hasEducation
          ? `${education.length} degree(s) / institution(s) listed`
          : 'Add institution and degree',
      },
    ];
  }, [resumeData, currentAnalysis]);

  const passedChecklistCount = checklistItems.filter((item) => item.passed).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 font-medium border-border/70 hover:bg-muted/80 shadow-xs"
            title="Open ATS Audit & Keyword Match Drawer"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>AI Review & ATS Audit</span>
            <Badge variant={theme.badge} className="ml-1 text-[10px] px-1.5 py-0 h-4">
              {currentAnalysis.overallScore}/100
            </Badge>
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl flex flex-col p-0 gap-0 overflow-hidden bg-background"
      >
        {/* Header */}
        <SheetHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <SheetTitle className="text-base font-bold flex items-center gap-2">
                <span>ATS Resume Review & Audit</span>
                <Badge variant={theme.badge} className="text-xs px-2 py-0.5">
                  {currentAnalysis.overallScore} / 100
                </Badge>
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Real-time applicant tracking system compliance check, keyword gap analyzer, and impact scoring.
              </SheetDescription>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 pt-3 mt-1 border-t border-border/40">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'overview'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>Score & Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('jobMatch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'jobMatch'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Target className="h-3.5 w-3.5" />
              <span>Job Match Audit</span>
              {currentAnalysis.missingKeywords.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                  {currentAnalysis.missingKeywords.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'checklist'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Format Checklist</span>
              <span className="text-[10px] opacity-80">
                ({passedChecklistCount}/{checklistItems.length})
              </span>
            </button>
          </div>
        </SheetHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
          {/* TAB 1: OVERVIEW & GAUGES */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Main Score Hero Card */}
              <div
                className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border ${theme.border} ${theme.bg}`}
              >
                <div className="flex items-center gap-4">
                  {/* Circular SVG Gauge */}
                  <div className="relative flex items-center justify-center h-20 w-20 shrink-0">
                    <svg className="h-20 w-20 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-muted/40 stroke-current"
                        strokeWidth="3.5"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={`${theme.ring} transition-all duration-700 ease-out`}
                        strokeDasharray={`${currentAnalysis.overallScore}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-xl font-black ${theme.text}`}>
                        {currentAnalysis.overallScore}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wider">
                        Score
                      </span>
                    </div>
                  </div>

                  {/* Score Feedback */}
                  <div className="space-y-1">
                    <h3 className={`text-sm font-bold ${theme.text}`}>{theme.label}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {theme.description}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('jobMatch')}
                  className="h-8 text-xs gap-1.5 shrink-0 bg-background/80"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Audit Target Job</span>
                </Button>
              </div>

              {/* Sub-Score Breakdown Meters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Format Completeness Meter */}
                <div className="p-3.5 rounded-lg border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Format Completeness
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {currentAnalysis.formatScore}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        currentAnalysis.formatScore >= 80
                          ? 'bg-emerald-500'
                          : currentAnalysis.formatScore >= 60
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${currentAnalysis.formatScore}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Evaluates contact info, sections, date consistency, and structure.
                  </p>
                </div>

                {/* Keyword Match Meter */}
                <div className="p-3.5 rounded-lg border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-primary" />
                      Keyword Match Rate
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {currentAnalysis.keywordScore}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        currentAnalysis.keywordScore >= 80
                          ? 'bg-emerald-500'
                          : currentAnalysis.keywordScore >= 60
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${currentAnalysis.keywordScore}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {jobDescription.trim()
                      ? `Matched against target job description.`
                      : `General tech keyword density.`}
                  </p>
                </div>
              </div>

              {/* Key Quantitative Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-lg border bg-muted/20 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black text-foreground">
                    {currentAnalysis.actionVerbCount}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground mt-0.5">
                    Action Verbs
                  </span>
                  <span className="text-[10px] text-muted-foreground/80">
                    {currentAnalysis.actionVerbCount >= 4 ? 'Good (4+)' : 'Needs more'}
                  </span>
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black text-foreground">
                    {currentAnalysis.metricsCount}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground mt-0.5">
                    Quantified Metrics
                  </span>
                  <span className="text-[10px] text-muted-foreground/80">
                    {currentAnalysis.metricsCount >= 3 ? 'Good (3+)' : 'Target: 3+'}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1 p-3 rounded-lg border bg-muted/20 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black text-foreground">
                    {passedChecklistCount}/{checklistItems.length}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground mt-0.5">
                    Checklist Items
                  </span>
                  <span className="text-[10px] text-muted-foreground/80">
                    {passedChecklistCount === checklistItems.length ? '100% complete' : 'Incomplete'}
                  </span>
                </div>
              </div>

              {/* Suggestions & Action Items */}
              {currentAnalysis.suggestions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>Actionable Recommendations</span>
                  </h4>
                  <div className="space-y-2">
                    {currentAnalysis.suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-amber-500/5 border-amber-500/20 text-xs text-foreground"
                      >
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Critical Warnings */}
              {currentAnalysis.warnings.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Critical ATS Warnings</span>
                  </h4>
                  <div className="space-y-2">
                    {currentAnalysis.warnings.map((warning, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-destructive/5 border-destructive/20 text-xs text-destructive"
                      >
                        <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TARGET JOB DESCRIPTION AUDIT */}
          {activeTab === 'jobMatch' && (
            <div className="space-y-4">
              {/* Job Input Card */}
              <div className="space-y-2 p-3.5 rounded-xl border bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-primary" />
                    <span>Target Job Description / Qualifications</span>
                  </Label>
                  {jobDescription && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetAudit}
                      className="h-6 px-2 text-[11px] text-muted-foreground"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job posting description, required skills, qualifications, or tech stack here to run ATS keyword gap analysis..."
                  rows={4}
                  className="text-xs resize-y bg-background"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-muted-foreground">
                    Matches keywords against your resume full text.
                  </span>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleAuditJobDescription}
                    disabled={isAuditing || !jobDescription.trim()}
                    className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isAuditing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Auditing Match...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5" />
                        <span>Audit Match</span>
                      </>
                    )}
                  </Button>
                </div>

                {auditError && (
                  <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{auditError}</span>
                  </div>
                )}
              </div>

              {/* Matched Keywords Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Matched Keywords in Resume</span>
                  </h4>
                  <Badge variant="success" className="text-[10px] px-2 py-0">
                    {currentAnalysis.matchedKeywords.length} found
                  </Badge>
                </div>

                {currentAnalysis.matchedKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border bg-background">
                    {currentAnalysis.matchedKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                      >
                        <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                        {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
                    No keywords matched yet. Paste a job description and click &quot;Audit Match&quot;.
                  </div>
                )}
              </div>

              {/* Missing Critical Keywords Section */}
              {currentAnalysis.missingKeywords.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      <span>Missing Target Job Keywords</span>
                    </h4>
                    <Badge variant="warning" className="text-[10px] px-2 py-0">
                      {currentAnalysis.missingKeywords.length} missing
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border bg-background">
                    {currentAnalysis.missingKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                      >
                        <PlusIcon className="h-3 w-3 text-amber-600 shrink-0" />
                        {kw}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tip: Add these missing keywords to your Skills, Experience bullet points, or Professional Summary to boost ATS relevance.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FORMAT CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    ATS Compliance & Formatting Checklist
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Verifies all structural pillars required by enterprise applicant tracking systems.
                  </p>
                </div>
                <Badge
                  variant={passedChecklistCount === checklistItems.length ? 'success' : 'secondary'}
                  className="text-xs"
                >
                  {passedChecklistCount} of {checklistItems.length} passed
                </Badge>
              </div>

              <div className="space-y-2">
                {checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-colors ${
                      item.passed
                        ? 'bg-muted/10 border-border/60'
                        : 'bg-destructive/5 border-destructive/20'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {item.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-xs font-medium text-foreground">{item.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{item.detail}</p>
                      </div>
                    </div>

                    <Badge
                      variant={item.passed ? 'success' : 'secondary'}
                      className="text-[10px] shrink-0"
                    >
                      {item.passed ? 'Passed' : 'Action Required'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Internal mini-icon helper for missing keywords
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
