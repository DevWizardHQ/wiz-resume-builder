'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Briefcase,
  Check,
  Copy,
  Cpu,
  Loader2,
  Plus,
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

export type BulletTone = 'executive' | 'technical' | 'action';

export interface AIBulletHelperProps {
  initialText?: string;
  context?: string;
  onApplyBullet?: (bullet: string) => void;
  onApplyAllBullets?: (bullets: string[]) => void;
  trigger?: React.ReactNode;
  buttonLabel?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'secondary';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm';
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  dialogTitle?: string;
  dialogDescription?: string;
  className?: string;
}

const TONE_OPTIONS: { id: BulletTone; label: string; description: string }[] = [
  {
    id: 'executive',
    label: 'Executive / High Impact',
    description: 'Focuses on strategic leadership, ROI, and high-level business impact',
  },
  {
    id: 'technical',
    label: 'Technical / Detailed',
    description: 'Highlights architectural depth, engineering rigor, and technology stack',
  },
  {
    id: 'action',
    label: 'Action-Oriented',
    description: 'Emphasizes decisive action verbs, execution velocity, and delivery',
  },
];

export const AIBulletHelper: React.FC<AIBulletHelperProps> = ({
  initialText = '',
  context = '',
  onApplyBullet,
  onApplyAllBullets,
  trigger,
  buttonLabel = 'AI Optimize',
  buttonVariant = 'outline',
  buttonSize = 'sm',
  isOpen: controlledOpen,
  onOpenChange: setControlledOpen,
  dialogTitle = 'AI Bullet Point Optimizer',
  dialogDescription = 'Transform raw achievements into high-impact, ATS-optimized Google X-Y-Z bullet points.',
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

  const [rawText, setRawText] = useState(initialText);
  const [roleContext, setRoleContext] = useState(context);
  const [selectedTone, setSelectedTone] = useState<BulletTone>('executive');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [resultSource, setResultSource] = useState<'ollama' | 'fallback' | null>(null);
  const [modelUsed, setModelUsed] = useState<string | undefined>(undefined);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);

  // Sync initialText and context when dialog opens
  useEffect(() => {
    if (open) {
      if (initialText && !rawText) {
        setRawText(initialText);
      }
      if (context && !roleContext) {
        setRoleContext(context);
      }
    }
  }, [open, initialText, context]);

  const handleOptimize = async () => {
    if (!rawText || rawText.trim().length === 0) {
      setError('Please provide a draft or description of your achievement.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setResultSource(null);
    setAppliedIndex(null);

    try {
      const toneLabelMap: Record<BulletTone, string> = {
        executive: 'Executive and High-Impact',
        technical: 'Technical and Detailed',
        action: 'Action-Oriented and Dynamic',
      };

      const response = await fetch('/api/ai/bullet-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText.trim(),
          context: roleContext.trim() || undefined,
          tone: toneLabelMap[selectedTone],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed with status ${response.status}`);
      }

      const data = await response.json();
      const generatedBullets: string[] = Array.isArray(data.bullets) ? data.bullets : [];

      if (generatedBullets.length === 0) {
        throw new Error('No bullet points could be generated. Please try rewording your input.');
      }

      setResults(generatedBullets);
      setResultSource(data.source === 'ollama' ? 'ollama' : 'fallback');
      setModelUsed(data.modelUsed);
    } catch (err: any) {
      setError(err?.message || 'Error communicating with AI optimizer service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyBullet = (bullet: string, index: number) => {
    navigator.clipboard.writeText(bullet);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleApplySingle = (bullet: string, index: number) => {
    if (onApplyBullet) {
      onApplyBullet(bullet);
      setAppliedIndex(index);
      setTimeout(() => {
        setOpen(false);
        setAppliedIndex(null);
      }, 350);
    }
  };

  const handleApplyAll = () => {
    if (onApplyAllBullets && results.length > 0) {
      onApplyAllBullets(results);
      setOpen(false);
    }
  };

  const handleReset = () => {
    setRawText(initialText || '');
    setRoleContext(context || '');
    setResults([]);
    setError(null);
    setResultSource(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            type="button"
            variant={buttonVariant}
            size={buttonSize}
            className={`gap-1.5 ${className}`}
            title="Rewrite bullet with AI using Google X-Y-Z formula"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {buttonLabel && <span>{buttonLabel}</span>}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wand2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">{dialogTitle}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {dialogDescription}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tone Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Optimization Tone & Style</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Google X-Y-Z Formula
              </span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TONE_OPTIONS.map((tone) => (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() => setSelectedTone(tone.id)}
                  className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                    selectedTone === tone.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary text-foreground'
                      : 'border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="text-xs font-medium">{tone.label}</span>
                  <span className="text-[10px] text-muted-foreground/90 mt-1 line-clamp-2">
                    {tone.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Role / Context (Optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Role / Project Context (Optional)</span>
            </Label>
            <Input
              value={roleContext}
              onChange={(e) => setRoleContext(e.target.value)}
              placeholder="e.g. Senior Full-Stack Engineer at SaaS scaleup, Payment Processing Service"
              className="h-8 text-xs"
            />
          </div>

          {/* Raw Achievement Draft */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Raw Achievement Draft / Rough Notes
            </Label>
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g., I redesigned the database query layer and added redis caching which reduced API response times and helped our system handle 10x traffic during peak sales..."
              rows={3}
              className="text-xs resize-y"
            />
            <p className="text-[11px] text-muted-foreground">
              Tip: Include raw numbers or actions. The AI will structure it into: Accomplished [X], measured by [Y], by doing [Z].
            </p>
          </div>

          {/* Action Trigger Button */}
          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isLoading || (!rawText && results.length === 0)}
              className="h-8 text-xs text-muted-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleOptimize}
              disabled={isLoading || !rawText.trim()}
              className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Optimizing with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Optimize with AI</span>
                </>
              )}
            </Button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Generated Results Section */}
          {results.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-foreground">
                    Generated Google X-Y-Z Bullets
                  </h4>
                  {resultSource === 'ollama' ? (
                    <Badge variant="success" className="text-[10px] py-0 px-2 gap-1 font-normal">
                      <Cpu className="h-2.5 w-2.5" />
                      Local Ollama ({modelUsed || 'llama3.2'})
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="text-[10px] py-0 px-2 gap-1 font-normal">
                      <Sparkles className="h-2.5 w-2.5" />
                      Rule-based Fallback
                    </Badge>
                  )}
                </div>

                {onApplyAllBullets && results.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleApplyAll}
                    className="h-6 px-2 text-[11px] gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Insert All ({results.length})
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {results.map((bullet, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-primary font-bold text-xs mt-0.5 select-none">
                        •
                      </span>
                      <p className="text-xs text-foreground leading-relaxed">
                        {bullet}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleCopyBullet(bullet, idx)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Copy bullet to clipboard"
                      >
                        {copiedIndex === idx ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>

                      {onApplyBullet && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleApplySingle(bullet, idx)}
                          className="h-7 text-xs px-2.5 gap-1"
                        >
                          {appliedIndex === idx ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span className="text-emerald-600">Applied</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Use this bullet</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/40 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-xs h-8"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
