'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Download,
  Eye,
  FileCheck,
  FileDown,
  FileText,
  FileType,
  GripVertical,
  Layers,
  Layout,
  Lock,
  MoveUpRight,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Wand2,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'classic-ats' | 'modern-minimal' | 'executive'>('classic-ats');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
                W
              </div>
              <span className="font-extrabold text-xl tracking-tight text-foreground">
                Wiz<span className="text-primary">Resume</span>
              </span>
            </Link>
            <Badge variant="secondary" className="hidden sm:inline-flex text-[11px] font-medium border-primary/20 bg-primary/5 text-primary">
              ATS Engine v2.0
            </Badge>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#templates" className="hover:text-foreground transition-colors">
              Templates
            </a>
            <a href="#ats-audit" className="hover:text-foreground transition-colors">
              ATS Scoring
            </a>
            <Link href="/cover-letters" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Cover Letters
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline-block">
              <Button variant="ghost" size="sm" className="font-medium text-sm">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="gap-1.5 font-medium shadow-sm">
                <span>Go to Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-border/50 bg-gradient-to-b from-primary/5 via-background to-background">
          {/* Subtle Glow Accents */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center space-y-8">
            {/* Top Announcement Chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold shadow-xs animate-fade-in">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Local Ollama LLM + 100% Vector PDF/DOCX Parity</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl text-foreground">
              Build <span className="text-primary underline decoration-primary/30 decoration-wavy underline-offset-8">ATS-Beating</span> Resumes with Local AI.
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Synthesize Google X-Y-Z formula bullets, pass automated ATS parsers with real-time scoring, and export in 100% synchronized PDF & DOCX formats.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-2">
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-md gap-2">
                  <Sparkles className="h-4 w-4" />
                  Create ATS Resume Free
                </Button>
              </Link>
              <Link href="/cover-letters">
                <Button size="lg" variant="outline" className="h-12 px-6 text-base font-medium gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  AI Cover Letter Studio
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>100% Parser Compatible</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Zero Canvas/Image Traps</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-primary" />
                <span>Private Local Ollama AI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-blue-500" />
                <span>3-Way Synchronized Export</span>
              </div>
            </div>

            {/* Interactive Product Preview Mockup */}
            <div className="w-full max-w-5xl mt-10 rounded-2xl border border-border/80 bg-card/50 shadow-2xl p-2 sm:p-4 backdrop-blur-xs">
              <div className="rounded-xl border border-border/70 overflow-hidden bg-background">
                {/* Mockup Browser/App Window Chrome */}
                <div className="h-9 bg-muted/60 border-b border-border/60 px-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-400/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-amber-400/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400/80 inline-block" />
                  </div>
                  <div className="font-mono text-[11px] bg-background/80 px-4 py-0.5 rounded border border-border/50 text-foreground">
                    wiz-resume.app/editor/demo-resume-1
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="text-[10px] px-1.5 py-0 gap-1 font-medium">
                      ATS 94%
                    </Badge>
                  </div>
                </div>

                {/* Mockup Body: Split View representation */}
                <div className="grid grid-cols-1 md:grid-cols-12 h-[340px] sm:h-[420px] divide-y md:divide-y-0 md:divide-x divide-border/60 overflow-hidden">
                  {/* Left Mock Form */}
                  <div className="md:col-span-5 p-4 bg-muted/20 flex flex-col gap-3 overflow-hidden text-left">
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                        Experience (3 items)
                      </span>
                      <Badge variant="outline" className="text-[10px]">Active</Badge>
                    </div>

                    {/* Form Item Mock */}
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-foreground">Staff Software Engineer</span>
                        <span className="text-[10px] text-muted-foreground">2022 - Present</span>
                      </div>
                      <div className="space-y-1 text-[11px] text-muted-foreground">
                        <div className="p-1.5 bg-background rounded border border-border/60 flex items-start gap-1.5">
                          <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                          <span>Architected high-throughput event streaming platform handling 2.5B daily events...</span>
                        </div>
                      </div>
                    </div>

                    {/* Form Item 2 */}
                    <div className="rounded-lg border border-border/60 bg-background p-3 space-y-1 opacity-70">
                      <div className="flex justify-between items-center text-xs font-medium">
                        <span>Senior Backend Engineer</span>
                        <span className="text-[10px] text-muted-foreground">2019 - 2022</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Mock A4 Live Preview */}
                  <div className="md:col-span-7 p-6 bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center overflow-hidden">
                    <div className="w-full max-w-[380px] h-[360px] bg-white dark:bg-zinc-900 rounded-md shadow-md p-5 border border-border/80 flex flex-col gap-2 text-left pointer-events-none transform scale-95 sm:scale-100 transition-transform">
                      <div className="border-b border-border/80 pb-2">
                        <h4 className="text-sm font-bold text-foreground">Alex Rivera</h4>
                        <p className="text-[9px] text-muted-foreground">San Francisco, CA • alex.rivera@example.com • +1 (555) 234-5678</p>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-border/50 pb-0.5">
                          Work Experience
                        </div>
                        <div className="text-[9px]">
                          <div className="flex justify-between font-semibold">
                            <span>Apex Cloud Systems — Staff Software Engineer</span>
                            <span>2022 – Present</span>
                          </div>
                          <ul className="list-disc list-inside text-muted-foreground text-[8.5px] mt-0.5 space-y-0.5">
                            <li>Architected event streaming platform handling 2.5B daily events, reducing p99 latency to 85ms.</li>
                            <li>Spearheaded Kubernetes migration across 45 microservices, cutting cloud costs by $320K.</li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-1 mt-1">
                        <div className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-border/50 pb-0.5">
                          Technical Skills
                        </div>
                        <div className="text-[8.5px] text-muted-foreground">
                          <span className="font-semibold text-foreground">Languages:</span> TypeScript, Go, Python, SQL, Node.js
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section id="features" className="py-20 bg-muted/20 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <Badge variant="outline" className="text-xs px-2.5 py-0.5 text-primary border-primary/30">
                Engineered for High-Velocity Job Seekers
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Everything You Need to Beat Automated Screening
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Unlike generic document editors, Wiz Resume is built from the ground up to satisfy modern ATS parsing algorithms while maintaining executive polish.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <Card className="p-6 border border-border/70 hover:border-primary/50 transition-all duration-200 shadow-xs bg-card space-y-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg text-foreground">Google X-Y-Z Formula AI</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Transform passive task descriptions into quantified achievements using local Ollama LLMs: &quot;Accomplished [X] as measured by [Y], by doing [Z]&quot;.
                </p>
              </Card>

              {/* Feature 2 */}
              <Card className="p-6 border border-border/70 hover:border-primary/50 transition-all duration-200 shadow-xs bg-card space-y-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg text-foreground">Live 100-Point ATS Audit</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Instant scoring analyzing strong action verbs, quantifiable metrics, section hierarchy, and optional target job description keyword matching.
                </p>
              </Card>

              {/* Feature 3 */}
              <Card className="p-6 border border-border/70 hover:border-primary/50 transition-all duration-200 shadow-xs bg-card space-y-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <FileType className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg text-foreground">3-Way Synchronized Parity</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  What you see on the live HTML preview renders with 100% identical styling in vector PDF (<code className="text-xs">@react-pdf/renderer</code>) and native DOCX.
                </p>
              </Card>

              {/* Feature 4 */}
              <Card className="p-6 border border-border/70 hover:border-primary/50 transition-all duration-200 shadow-xs bg-card space-y-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <GripVertical className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg text-foreground">Drag & Drop Architecture</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Easily reorder experience items and entire sections using accessible DnD primitives. Toggle individual item visibility without deleting your data.
                </p>
              </Card>

              {/* Feature 5 */}
              <Card className="p-6 border border-border/70 hover:border-primary/50 transition-all duration-200 shadow-xs bg-card space-y-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Layout className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg text-foreground">Multi-Resume Variations</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Clone and customize distinct resume targets for Software Engineering, Product Management, and Executive leadership roles with 1-click duplication.
                </p>
              </Card>

              {/* Feature 6 */}
              <Card className="p-6 border border-border/70 hover:border-primary/50 transition-all duration-200 shadow-xs bg-card space-y-3">
                <div className="h-10 w-10 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
                  <Wand2 className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg text-foreground">AI Cover Letter Studio</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Synthesize your resume experiences with target job postings into tailored, professional cover letters with instant DOCX and TXT downloads.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Template Gallery Section */}
        <section id="templates" className="py-20 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Engineered ATS Templates
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Clean, single-column layouts designed for flawless extraction by Workday, Greenhouse, Lever, and Taleo.
              </p>
            </div>

            {/* Template Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Template 1: Classic ATS */}
              <Card className="border border-border/70 overflow-hidden flex flex-col justify-between hover:border-primary/50 transition-all duration-200">
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Classic ATS</h3>
                    <Badge variant="success" className="text-xs">
                      100% ATS Safe
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Timeless single-column layout optimized for standard engineering, finance, and corporate applications.
                  </p>
                  <div className="h-44 w-full bg-muted/40 rounded border border-border/60 p-3 space-y-2 text-[8px] text-muted-foreground font-mono">
                    <div className="font-bold text-[10px] text-foreground border-b pb-1">CANDIDATE NAME</div>
                    <div className="space-y-1">
                      <div className="h-1.5 w-1/3 bg-primary/40 rounded" />
                      <div className="h-1 w-full bg-muted-foreground/20 rounded" />
                      <div className="h-1 w-4/5 bg-muted-foreground/20 rounded" />
                    </div>
                    <div className="space-y-1 pt-1">
                      <div className="h-1.5 w-1/4 bg-primary/40 rounded" />
                      <div className="h-1 w-full bg-muted-foreground/20 rounded" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted/20 border-t border-border/50">
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full text-xs font-medium">
                      Use Classic ATS Template
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Template 2: Modern Minimal */}
              <Card className="border border-border/70 overflow-hidden flex flex-col justify-between hover:border-primary/50 transition-all duration-200">
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Modern Minimal</h3>
                    <Badge variant="outline" className="text-xs">
                      Tech & Product
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Refined sans typography and subtle metadata spacing tailored for modern technology and design roles.
                  </p>
                  <div className="h-44 w-full bg-muted/40 rounded border border-border/60 p-3 space-y-2 text-[8px] text-muted-foreground font-sans">
                    <div className="font-bold text-[10px] text-foreground">Candidate Name</div>
                    <div className="h-0.5 w-full bg-border" />
                    <div className="space-y-1">
                      <div className="h-1.5 w-1/4 bg-blue-500/40 rounded" />
                      <div className="h-1 w-full bg-muted-foreground/20 rounded" />
                      <div className="h-1 w-5/6 bg-muted-foreground/20 rounded" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted/20 border-t border-border/50">
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full text-xs font-medium">
                      Use Modern Minimal Template
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Template 3: Executive */}
              <Card className="border border-border/70 overflow-hidden flex flex-col justify-between hover:border-primary/50 transition-all duration-200">
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Executive</h3>
                    <Badge variant="warning" className="text-xs">
                      Leadership
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Distinguished top accent banner and bold section branding tailored for senior leaders and managers.
                  </p>
                  <div className="h-44 w-full bg-muted/40 rounded border border-border/60 p-3 space-y-2 text-[8px] text-muted-foreground font-serif">
                    <div className="h-1.5 w-full bg-amber-500/70 rounded-full" />
                    <div className="font-bold text-[10px] text-foreground text-center">CANDIDATE NAME</div>
                    <div className="space-y-1">
                      <div className="h-1.5 w-1/3 bg-amber-500/40 rounded" />
                      <div className="h-1 w-full bg-muted-foreground/20 rounded" />
                      <div className="h-1 w-11/12 bg-muted-foreground/20 rounded" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted/20 border-t border-border/50">
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full text-xs font-medium">
                      Use Executive Template
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to land your dream role?
            </h2>
            <p className="text-primary-foreground/90 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Start building ATS-verified resumes and tailored cover letters in seconds with local AI assistance.
            </p>
            <div className="pt-2">
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="h-12 px-8 font-bold text-foreground shadow-lg gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Launch Resume Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-muted/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">Wiz Resume Builder</span>
            <span>•</span>
            <span>ATS-Compliant Multi-Resume Engine</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/cover-letters" className="hover:text-foreground transition-colors">
              Cover Letters
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
