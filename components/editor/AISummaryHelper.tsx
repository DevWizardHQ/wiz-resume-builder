'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  Briefcase,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  HelpCircle,
  Layers,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Wand2,
  Zap,
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
import { useResumeStore } from '@/store/useResumeStore';
import {
  SummarySeniorityLevel,
  SummaryTone,
  SummaryVariation,
} from '@/lib/ai/summary-generator';

export interface AISummaryHelperProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  buttonLabel?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'secondary';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm';
  className?: string;
}

const SENIORITY_OPTIONS: { id: SummarySeniorityLevel; label: string; exp: string }[] = [
  { id: 'entry', label: 'Entry-Level', exp: '0–2 yrs' },
  { id: 'mid', label: 'Mid-Level', exp: '3–5 yrs' },
  { id: 'senior', label: 'Senior', exp: '5–8 yrs' },
  { id: 'lead', label: 'Lead / Staff', exp: '8–12 yrs' },
  { id: 'executive', label: 'Executive', exp: '12+ yrs' },
];

const TONE_OPTIONS: { id: SummaryTone; label: string; icon: any; description: string }[] = [
  {
    id: 'impactful',
    label: 'Results & Impact',
    icon: TrendingUp,
    description: 'Emphasizes business metrics, system throughput, and quantifiable ROI',
  },
  {
    id: 'technical',
    label: 'Technical Mastery',
    icon: Cpu,
    description: 'Highlights deep system architecture, modern tech stack, and engineering rigor',
  },
  {
    id: 'leadership',
    label: 'Leadership & Scale',
    icon: Users,
    description: 'Focuses on cross-functional alignment, mentorship, and scaling engineering orgs',
  },
  {
    id: 'concise',
    label: 'Concise & ATS',
    icon: Zap,
    description: 'Ultra-tight, high keyword-density summary optimized for ATS crawlers',
  },
];

export const AISummaryHelper: React.FC<AISummaryHelperProps> = ({
  isOpen: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  buttonLabel = 'AI Summary',
  buttonVariant = 'outline',
  buttonSize = 'sm',
  className = '',
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
  const updateSummary = useResumeStore((state) => state.updateSummary);

  // Form states
  const [targetRole, setTargetRole] = useState('');
  const [seniorityLevel, setSeniorityLevel] = useState<SummarySeniorityLevel>('senior');
  const [selectedTone, setSelectedTone] = useState<SummaryTone>('impactful');
  const [yearsOfExperience, setYearsOfExperience] = useState<string>('5+');
  const [customSkills, setCustomSkills] = useState<string>('');
  const [additionalFocus, setAdditionalFocus] = useState<string>('');

  // Execution states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variations, setVariations] = useState<SummaryVariation[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  // Extract initial context when dialog opens
  useEffect(() => {
    if (open) {
      // 1. Role heuristic
      const latestExp = resumeData.experience?.find((e) => e.visible !== false);
      const inferredRole = latestExp?.role || 'Software Engineer';
      if (!targetRole) {
        setTargetRole(inferredRole);
      }

      // 2. Experience years heuristic
      const expCount = resumeData.experience?.filter((e) => e.visible !== false).length || 0;
      if (expCount >= 5) {
        setSeniorityLevel('lead');
        setYearsOfExperience('8+');
      } else if (expCount >= 3) {
        setSeniorityLevel('senior');
        setYearsOfExperience('5+');
      } else if (expCount >= 1) {
        setSeniorityLevel('mid');
        setYearsOfExperience('3+');
      } else {
        setSeniorityLevel('entry');
        setYearsOfExperience('1+');
      }

      // 3. Top skills heuristic
      const allSkills: string[] = [];
      (resumeData.skills || []).forEach((cat) => {
        if (cat.visible !== false && Array.isArray(cat.skills)) {
          allSkills.push(...cat.skills);
        }
      });
      if (allSkills.length > 0 && !customSkills) {
        setCustomSkills(allSkills.slice(0, 8).join(', '));
      }
    }
  }, [open, resumeData]);

  // Extract achievements from experience bullets
  const extractedAchievements = useMemo(() => {
    const achievements: string[] = [];
    (resumeData.experience || []).forEach((exp) => {
      if (exp.visible !== false && Array.isArray(exp.bullets)) {
        exp.bullets.forEach((b) => {
          // Check for metrics or strong achievements
          if (/\d+[%kKmM+]|\$\d+|\d+x/i.test(b)) {
            achievements.push(b);
          }
        });
      }
    });
    return achievements.slice(0, 3);
  }, [resumeData.experience]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setAppliedId(null);

    const skillsArray = customSkills
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const response = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: targetRole.trim() || 'Software Professional',
          targetRole: targetRole.trim() || 'Software Professional',
          seniorityLevel,
          tone: selectedTone,
          yearsOfExperience,
          topSkills: skillsArray,
          keyAchievements: extractedAchievements,
          currentSummary: resumeData.summary?.text || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data.variations) && data.variations.length > 0) {
        setVariations(data.variations);
        setSource(data.source || 'fallback');
        setModelUsed(data.modelUsed || null);
      } else {
        throw new Error('No summary variations were generated.');
      }
    } catch (err: any) {
      console.error('Failed to generate summary:', err);
      setError(err?.message || 'Failed to generate summaries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (variation: SummaryVariation) => {
    updateSummary(variation.text, true);
    setAppliedId(variation.id);
    setTimeout(() => {
      setOpen(false);
    }, 400);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            type="button"
            variant={buttonVariant}
            size={buttonSize}
            className={`gap-1.5 text-primary border-primary/30 hover:bg-primary/5 ${className}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{buttonLabel}</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Wand2 className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                AI Professional Summary Generator
              </DialogTitle>
              <DialogDescription className="text-xs">
                Generate tailored, high-impact, ATS-optimized summaries engineered for your career trajectory.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border border-border/50 text-xs">
            {/* Target Role */}
            <div className="space-y-1.5">
              <Label htmlFor="summary-target-role" className="text-xs font-medium">
                Target Role / Job Title
              </Label>
              <Input
                id="summary-target-role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g., Senior Full Stack Engineer"
                className="h-8 text-xs bg-background"
              />
            </div>

            {/* Experience / Seniority Level */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Seniority Level</Label>
              <div className="flex flex-wrap gap-1">
                {SENIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSeniorityLevel(opt.id);
                      setYearsOfExperience(
                        opt.id === 'entry' ? '1+' : opt.id === 'mid' ? '3+' : opt.id === 'senior' ? '5+' : opt.id === 'lead' ? '8+' : '12+'
                      );
                    }}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                      seniorityLevel === opt.id
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-background hover:bg-muted text-muted-foreground border border-border/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Core Skills */}
            <div className="sm:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="summary-skills" className="text-xs font-medium">
                  Core Skills & Keywords (Auto-extracted from resume)
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Separated by commas
                </span>
              </div>
              <Input
                id="summary-skills"
                value={customSkills}
                onChange={(e) => setCustomSkills(e.target.value)}
                placeholder="e.g., React, TypeScript, Next.js, Node.js, PostgreSQL, AWS, Docker"
                className="h-8 text-xs bg-background"
              />
            </div>

            {/* Primary Tone Selector */}
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-medium">Preferred Focus & Tone</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {TONE_OPTIONS.map((t) => {
                  const Icon = t.icon;
                  const isSelected = selectedTone === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTone(t.id)}
                      className={`flex flex-col items-start p-2 rounded-md border text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary/30'
                          : 'border-border/60 bg-background hover:bg-muted/60 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-medium text-xs text-foreground mb-0.5">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        <span>{t.label}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground line-clamp-2">
                        {t.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Generates 3 ATS-compliant variations with quantified value</span>
            </div>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
              className="gap-2 h-8 px-4 text-xs font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5" />
                  <span>{variations.length > 0 ? 'Regenerate Summaries' : 'Generate Summaries'}</span>
                </>
              )}
            </Button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results List */}
          {variations.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Generated Options ({variations.length})
                </h4>
                {source && (
                  <Badge variant="outline" className="text-[10px] uppercase font-mono py-0 h-5">
                    Source: {source} {modelUsed ? `(${modelUsed})` : ''}
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                {variations.map((v, idx) => {
                  const isApplied = appliedId === v.id;
                  const isCopied = copiedId === v.id;
                  return (
                    <div
                      key={v.id || idx}
                      className="p-3.5 rounded-lg border border-border/80 bg-card hover:border-primary/40 transition-all space-y-2.5 shadow-xs"
                    >
                      {/* Variation Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground">
                            {v.label || `Option ${idx + 1}`}
                          </span>
                          <Badge
                            variant={
                              v.tone === 'impactful'
                                ? 'default'
                                : v.tone === 'technical'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="text-[10px] font-normal py-0 h-4"
                          >
                            {v.tone}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {v.wordCount} words · {v.characterCount} chars
                        </div>
                      </div>

                      {/* Summary Text */}
                      <p className="text-xs text-foreground/90 leading-relaxed bg-muted/20 p-2.5 rounded border border-border/40">
                        {v.text}
                      </p>

                      {/* Strengths & Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap gap-1">
                          {(v.keyStrengths || []).map((strength, sIdx) => (
                            <span
                              key={sIdx}
                              className="inline-flex items-center text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded border border-border/40 font-mono"
                            >
                              ✓ {strength}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(v.text, v.id)}
                            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-500" />
                                <span className="text-emerald-500">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleApply(v)}
                            className="h-7 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            {isApplied ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Applied!</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Apply to Resume</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between border-t border-border/40 pt-3">
          <span className="text-[11px] text-muted-foreground">
            Changes create an undo history snapshot (Cmd+Z)
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="h-7 text-xs"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
