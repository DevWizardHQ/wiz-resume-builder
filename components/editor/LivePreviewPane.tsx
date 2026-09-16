'use client';

import React, { useState } from 'react';
import {
  Download,
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemplateRenderer } from '@/components/templates/TemplateRenderer';
import { useResumeStore } from '@/store/useResumeStore';
import { TemplateId } from '@/types/resume';

export interface LivePreviewPaneProps {
  className?: string;
}

export const LivePreviewPane: React.FC<LivePreviewPaneProps> = ({ className }) => {
  const resumeId = useResumeStore((state) => state.resumeId);
  const title = useResumeStore((state) => state.title);
  const data = useResumeStore((state) => state.data);
  const templateId = useResumeStore((state) => state.templateId);
  const sectionOrder = useResumeStore((state) => state.sectionOrder);
  const setTemplateId = useResumeStore((state) => state.setTemplateId);

  const [zoom, setZoom] = useState<number>(100);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const handleZoomChange = (value: number[]) => {
    if (value && value.length > 0) {
      setZoom(value[0]);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(150, prev + 10));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(50, prev - 10));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const handleFitZoom = () => {
    setZoom(80);
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    try {
      if (format === 'pdf') setIsExportingPdf(true);
      else setIsExportingDocx(true);

      const targetId = resumeId || 'live';
      const response = await fetch(`/api/export/${format}/${targetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: data,
          templateId,
          sectionOrder,
          title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to export ${format.toUpperCase()}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (title || data.contact?.fullName || 'Resume')
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${safeTitle || 'Resume'}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Export ${format} error:`, error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (format === 'pdf') setIsExportingPdf(false);
      else setIsExportingDocx(false);
    }
  };

  return (
    <section
      aria-label="Live Resume Preview"
      className={`flex flex-col h-full bg-muted/10 border-l border-border/60 ${className || ''}`}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-background border-b border-border/50 select-none shrink-0">
        {/* Template Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
            Template:
          </span>
          <Tabs
            value={templateId}
            onValueChange={(val) => setTemplateId(val as TemplateId)}
            className="h-8"
          >
            <TabsList className="h-8 p-0.5 bg-muted/60">
              <TabsTrigger
                value="classic-ats"
                className="text-xs h-7 px-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Classic ATS
              </TabsTrigger>
              <TabsTrigger
                value="modern-minimal"
                className="text-xs h-7 px-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Modern Minimal
              </TabsTrigger>
              <TabsTrigger
                value="executive"
                className="text-xs h-7 px-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Executive
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Zoom Controls & Export Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Zoom Slider Controls */}
          <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-1 rounded-lg border border-border/40">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Zoom out"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <div className="w-16 sm:w-20 px-1">
              <Slider
                value={[zoom]}
                min={50}
                max={150}
                step={5}
                onValueChange={handleZoomChange}
                aria-label="Preview zoom level"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 150}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Zoom in"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <span className="text-[11px] font-mono text-muted-foreground w-8 text-right">
              {zoom}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleResetZoom}
              className="h-6 w-6 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
              title="Reset zoom to 100%"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleFitZoom}
              className="h-6 w-6 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
              title="Fit to screen"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleExport('docx')}
              disabled={isExportingDocx || isExportingPdf}
              className="h-8 text-xs gap-1.5 font-medium"
            >
              {isExportingDocx ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-blue-600" />
              )}
              <span>Word DOCX</span>
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={isExportingDocx || isExportingPdf}
              className="h-8 text-xs gap-1.5 font-medium shadow-sm"
            >
              {isExportingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>Export PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Live A4 Canvas Scroll Viewport */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 flex justify-center items-start bg-slate-100/80 dark:bg-slate-950/60 custom-scrollbar">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 120ms ease-out',
          }}
          className="shrink-0 mb-12"
        >
          {/* A4 Container (210mm x 297mm) */}
          <div
            className="w-[210mm] min-h-[297mm] bg-white text-neutral-900 shadow-2xl rounded-sm p-8 sm:p-10 border border-neutral-200/80 print:p-0 print:border-0 print:shadow-none"
            style={{
              boxSizing: 'border-box',
            }}
          >
            <TemplateRenderer
              data={data}
              templateId={templateId}
              sectionOrder={sectionOrder}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
