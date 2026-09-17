'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Filter,
  Flame,
  LayoutGrid,
  Loader2,
  LogOut,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  User,
  Wand2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CreateResumeDialog } from '@/components/dashboard/CreateResumeDialog';
import { ImportResumeDialog } from '@/components/dashboard/ImportResumeDialog';
import { ResumeCard } from '@/components/dashboard/ResumeCard';
import { CoverLetterGeneratorModal } from '@/components/dashboard/CoverLetterGeneratorModal';
import { ResumeRecord, TemplateId } from '@/types/resume';
import { DEMO_RESUMES } from '@/lib/sample-data';

export default function DashboardPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Load resumes from /api/resumes
  const fetchResumes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/resumes');
      if (res.ok) {
        const data = await res.json();
        setResumes(data.resumes || []);
      } else {
        setResumes(DEMO_RESUMES);
      }
    } catch (err) {
      console.warn('Failed to load resumes from API, falling back to demo records:', err);
      setResumes(DEMO_RESUMES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clone_from_id: id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.resume) {
          setResumes((prev) => [data.resume, ...prev]);
        } else {
          fetchResumes();
        }
      }
    } catch (err) {
      console.error('Error duplicating resume:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setResumes((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error('Error deleting resume:', err);
    }
  };

  // Filtered resumes
  const filteredResumes = resumes.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.content?.contact?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTemplate =
      selectedTemplateFilter === 'all' || r.template_id === selectedTemplateFilter;
    return matchesSearch && matchesTemplate;
  });

  // Analytics & Stats
  const totalResumes = resumes.length;
  const averageAtsScore =
    totalResumes > 0
      ? Math.round(
          resumes.reduce((acc, curr) => acc + (curr.ats_score ?? 0), 0) / totalResumes
        )
      : 0;
  const highestAtsScore =
    totalResumes > 0
      ? Math.max(...resumes.map((r) => r.ats_score ?? 0))
      : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Application Navigation */}
      <header className="h-16 border-b border-border/70 bg-background/95 backdrop-blur px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-xs">
              W
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground hidden sm:inline-block">
              Wiz Resume
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="font-semibold text-primary bg-primary/10">
                Dashboard
              </Button>
            </Link>
            <Link href="/cover-letters">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                AI Cover Letters
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <CoverLetterGeneratorModal resumes={resumes} />
          <ImportResumeDialog />
          <CreateResumeDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            trigger={
              <Button className="gap-1.5 shadow-sm font-medium">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Resume</span>
                <span className="sm:hidden">New</span>
              </Button>
            }
          />
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Welcome Banner & Quick Summary */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Resume Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your ATS-compliant resume variations, monitor scores, and export in 100% vector parity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CreateResumeDialog
              open={isCreateOpen}
              onOpenChange={setIsCreateOpen}
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5 font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Quick ATS Resume
                </Button>
              }
            />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Resumes */}
          <Card className="p-4 border border-border/70 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Total Resumes</span>
              <div className="text-2xl font-bold text-foreground">{totalResumes}</div>
              <span className="text-[11px] text-muted-foreground">Active variations & targets</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
          </Card>

          {/* Card 2: Average ATS Score */}
          <Card className="p-4 border border-border/70 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Average ATS Score</span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {averageAtsScore}%
              </div>
              <span className="text-[11px] text-muted-foreground">Parser readiness score</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </Card>

          {/* Card 3: Top ATS Score */}
          <Card className="p-4 border border-border/70 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Highest Scoring Target</span>
              <div className="text-2xl font-bold text-foreground">{highestAtsScore}%</div>
              <span className="text-[11px] text-muted-foreground">Google X-Y-Z optimized</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Flame className="h-5 w-5" />
            </div>
          </Card>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resumes by title or candidate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border/50 text-xs">
              <button
                type="button"
                onClick={() => setSelectedTemplateFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  selectedTemplateFilter === 'all'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Templates
              </button>
              <button
                type="button"
                onClick={() => setSelectedTemplateFilter('classic-ats')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  selectedTemplateFilter === 'classic-ats'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Classic ATS
              </button>
              <button
                type="button"
                onClick={() => setSelectedTemplateFilter('modern-minimal')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  selectedTemplateFilter === 'modern-minimal'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Minimal
              </button>
              <button
                type="button"
                onClick={() => setSelectedTemplateFilter('executive')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  selectedTemplateFilter === 'executive'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Executive
              </button>
            </div>
          </div>
        </div>

        {/* Resumes Grid */}
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading your resumes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Resume Action Card */}
            <div
              onClick={() => setIsCreateOpen(true)}
              className="group relative cursor-pointer border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 bg-muted/10 hover:bg-muted/30 transition-all duration-200 min-h-[340px]"
            >
              <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-xs">
                <Plus className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                  Create New Resume
                </h3>
                <p className="text-xs text-muted-foreground max-w-[220px]">
                  Start from scratch or pick an ATS-optimized template with sample data.
                </p>
              </div>
            </div>

            {/* Existing Resume Cards */}
            {filteredResumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Empty state when no search matches */}
        {!isLoading && filteredResumes.length === 0 && searchQuery && (
          <div className="text-center py-16 space-y-3">
            <p className="text-sm text-muted-foreground">
              No resumes found matching &quot;{searchQuery}&quot;.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedTemplateFilter('all');
              }}
            >
              Clear Search Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
