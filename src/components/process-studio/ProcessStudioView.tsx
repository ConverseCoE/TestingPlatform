import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Code2,
  Columns2,
  Database,
  Download,
  Eye,
  FileText,
  GitBranch,
  GripVertical,
  History,
  Maximize2,
  Play,
  Send,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import type { ProcessDefinition } from '../../types/process';
import { Badge, Button } from '../ui';
import { BlueprintPane } from './BlueprintPane';
import { ChatBuilderPane } from './ChatBuilderPane';
import { DataTablesPane } from './DataTablesPane';
import { ScreenAnnotationPane } from './ScreenAnnotationPane';
import {
  ImportPackageDialog,
  VersionDiffDialog,
  WhatIfSimulatorDialog,
} from './StudioGovernanceModals';
import { RawJsonPane, SkillFilePane } from './TechnicalEditors';

export type StudioPaneView =
  | 'chat'
  | 'preview'
  | 'blueprint'
  | 'tables'
  | 'json'
  | 'skill';

const PANE_OPTIONS: { id: StudioPaneView; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: 'AI Chat', icon: <Bot className="h-3.5 w-3.5" /> },
  { id: 'preview', label: 'Screen Preview', icon: <Eye className="h-3.5 w-3.5" /> },
  { id: 'blueprint', label: 'Process Blueprint', icon: <GitBranch className="h-3.5 w-3.5" /> },
  { id: 'tables', label: 'Data & Tables', icon: <Database className="h-3.5 w-3.5" /> },
  { id: 'json', label: 'Raw Screen JSON', icon: <Code2 className="h-3.5 w-3.5" /> },
  { id: 'skill', label: 'Skill File', icon: <FileText className="h-3.5 w-3.5" /> },
];

interface ProcessStudioViewProps {
  processId?: string;
  onBackToHub: () => void;
}

function createBlankDraftProcess(): ProcessDefinition {
  const now = new Date().toISOString();
  return {
    id: `proc-draft-${Date.now()}`,
    name: 'Untitled ERP Process',
    domain: 'Operations',
    description: 'Describe your business process in AI Chat or edit directly in Blueprint.',
    version: 1,
    status: 'Draft',
    complianceStatus: 'Compliant',
    createdBy: 'Priya Nair',
    updatedAt: now,
    requirements: [],
    tables: [],
    workflow: [],
    roleMatrix: [],
    screenJson: {
      screenId: `scr-draft-${Date.now()}`,
      title: 'Untitled ERP Process',
      subtitle: 'Generated screen will appear here.',
      kpis: [],
      formTitle: 'New Request',
      fields: [],
      primaryActions: [],
      tableTitle: 'Records',
      tableColumns: [],
      rowActions: [],
    },
    skillFile: {
      skillName: 'untitled-process-skill',
      version: '1.0.0',
      markdown: '# Skill File\n\nNo rules generated yet.',
      rules: [],
    },
    testCases: [],
    reviews: [],
    history: [],
  };
}

export function ProcessStudioView({ processId, onBackToHub }: ProcessStudioViewProps) {
  const { processes, addOrUpdateProcess, appendAuditEntry, currentUser } = useAppStore();

  const [activeProcess, setActiveProcess] = useState<ProcessDefinition>(() => {
    if (processId && processId !== 'new') {
      const found = processes.find((p) => p.id === processId);
      if (found) return found;
    }
    if (processId === 'new') {
      return createBlankDraftProcess();
    }
    return processes[0] ?? createBlankDraftProcess();
  });

  const lastPropProcessIdRef = useRef<string | undefined>(processId);

  useEffect(() => {
    if (processId === lastPropProcessIdRef.current) return;
    lastPropProcessIdRef.current = processId;

    if (processId === 'new') {
      setActiveProcess(createBlankDraftProcess());
      setChatOnlyMode(true);
    } else if (processId) {
      const found = processes.find((p) => p.id === processId);
      if (found) {
        setActiveProcess(found);
        setChatOnlyMode(found.screenJson.fields.length === 0);
      }
    }
  }, [processId, processes]);

  // Split-pane state: New processes start in centered Chat-Only mode until AI auto-shows or user clicks Details
  const [chatOnlyMode, setChatOnlyMode] = useState<boolean>(() => processId === 'new');
  const [splitMode, setSplitMode] = useState(true);
  const [leftPane, setLeftPane] = useState<StudioPaneView>('preview');
  const [leftWidthPct, setLeftWidthPct] = useState(75);
  const [simOpen, setSimOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const rawPct = ((e.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.min(75, Math.max(25, rawPct));
    setLeftWidthPct(Math.round(clamped * 10) / 10);
  }, []);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const startResize = () => {
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleExportPackage = () => {
    const bundle = {
      exportedAt: new Date().toISOString(),
      process: activeProcess,
      skillMarkdown: activeProcess.skillFile.markdown,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProcess.id}-package.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRollback = (version: number) => {
    const snap = activeProcess.history.find((h) => h.version === version);
    if (!snap) return;
    const next: ProcessDefinition = {
      ...activeProcess,
      version: activeProcess.version + 1,
      screenJson: snap.screenJson,
      skillFile: snap.skillFile,
      workflow: snap.workflow,
      updatedAt: new Date().toISOString(),
    };
    handleManualProcessUpdate(next, `Rolled back to v${version} snapshot`);
    setDiffOpen(false);
    setStatusBanner(`Rolled back to v${version} (saved as v${next.version}).`);
    setTimeout(() => setStatusBanner(null), 3000);
  };

  const handleSubmitForApproval = () => {
    const snapshot = {
      version: activeProcess.version,
      timestamp: new Date().toISOString(),
      summary: 'Submitted for Solution Manager approval',
      author: currentUser?.displayName ?? 'Solution Specialist',
      screenJson: activeProcess.screenJson,
      skillFile: activeProcess.skillFile,
      workflow: activeProcess.workflow,
    };
    const next: ProcessDefinition = {
      ...activeProcess,
      status: 'Pending Approval',
      updatedAt: new Date().toISOString(),
      history: [snapshot, ...activeProcess.history],
    };
    setActiveProcess(next);
    addOrUpdateProcess(next);
    if (currentUser) {
      appendAuditEntry({
        actorName: currentUser.displayName,
        actorRole: currentUser.username,
        category: 'AI_GENERATION',
        processId: next.id,
        processName: next.name,
        summary: `Submitted ${next.name} (v${next.version}) for Manager Approval`,
      });
    }
    setStatusBanner(`"${next.name}" submitted for Solution Manager approval!`);
    setTimeout(() => setStatusBanner(null), 4000);
  };

  const renderPaneSelector = (
    selected: StudioPaneView,
    onChange: (v: StudioPaneView) => void,
    sideLabel: string
  ) => (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-3 py-2">
      <div className="flex flex-wrap items-center gap-1">
        {PANE_OPTIONS.filter((opt) => (splitMode ? opt.id !== 'chat' : true)).map((opt) => {
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                active
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
      <span className="text-[11px] font-medium text-slate-400">{sideLabel}</span>
    </div>
  );

  const handleChatProcessUpdate = (updated: ProcessDefinition, autoShowPreview: boolean) => {
    setActiveProcess(updated);
    addOrUpdateProcess(updated);
    if (currentUser) {
      appendAuditEntry({
        actorName: currentUser.displayName,
        actorRole: currentUser.username,
        category: 'AI_GENERATION',
        processId: updated.id,
        processName: updated.name,
        summary: `Synthesized updates for ${updated.name}`,
      });
    }
    if (autoShowPreview) {
      setChatOnlyMode(false);
      setLeftPane('preview');
    }
  };

  const handleManualProcessUpdate = (updated: ProcessDefinition, summary: string) => {
    setActiveProcess(updated);
    addOrUpdateProcess(updated);
    if (currentUser) {
      appendAuditEntry({
        actorName: currentUser.displayName,
        actorRole: currentUser.username,
        category: 'EDIT',
        processId: updated.id,
        processName: updated.name,
        summary,
      });
    }
  };

  const renderPaneBody = (view: StudioPaneView) => {
    switch (view) {
      case 'chat':
        return (
          <ChatBuilderPane
            key={activeProcess.id}
            process={activeProcess}
            onProcessUpdated={handleChatProcessUpdate}
            onJumpToView={(target) => {
              setChatOnlyMode(false);
              setLeftPane(target);
            }}
          />
        );
      case 'preview':
        return (
          <ScreenAnnotationPane
            process={activeProcess}
            onProcessUpdated={(updated) =>
              handleManualProcessUpdate(updated, `Applied visual UI annotation on ${updated.name}`)
            }
          />
        );
      case 'blueprint':
        return (
          <BlueprintPane
            process={activeProcess}
            onProcessUpdated={handleManualProcessUpdate}
          />
        );
      case 'tables':
        return (
          <DataTablesPane
            process={activeProcess}
            onProcessUpdated={handleManualProcessUpdate}
          />
        );
      case 'json':
        return (
          <RawJsonPane
            process={activeProcess}
            onProcessUpdated={handleManualProcessUpdate}
          />
        );
      case 'skill':
        return (
          <SkillFilePane
            process={activeProcess}
            onProcessUpdated={handleManualProcessUpdate}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Studio Top Bar (Sticky with solid #e8edf2 mask so scrolled content never peeks above/behind) */}
      <div className="sticky top-0 z-20 -mt-4 pt-4 pb-1 bg-[#e8edf2]">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3.5 shadow-card ring-1 ring-slate-900/5">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBackToHub}>
            <ArrowLeft className="h-4 w-4" />
            Processes Hub
          </Button>
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">{activeProcess.name}</h1>
              <Badge variant="secondary">{activeProcess.domain}</Badge>
              <Badge variant="default">v{activeProcess.version}</Badge>
              <Badge variant="success">
                <ShieldCheck className="h-3 w-3" />
                {activeProcess.complianceStatus}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">{activeProcess.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Switch Active Process"
            value={activeProcess.id}
            onChange={(e) => {
              const found = processes.find((p) => p.id === e.target.value);
              if (found) setActiveProcess(found);
            }}
            className="h-8 rounded-lg bg-white px-2.5 text-xs font-medium text-slate-700 shadow-card ring-1 ring-slate-900/10 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {!processes.some((p) => p.id === activeProcess.id) && (
              <option value={activeProcess.id}>{activeProcess.name} (Draft)</option>
            )}
            {processes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>

          {chatOnlyMode ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChatOnlyMode(false)}
              title="Open split-pane details (Preview, Blueprint, Data, JSON, Skill)"
            >
              <Columns2 className="h-3.5 w-3.5" />
              Open Details
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSplitMode((prev) => !prev)}
              title="Toggle between Split-Pane and Single-Pane mode"
            >
              {splitMode ? (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  Single Pane
                </>
              ) : (
                <>
                  <Columns2 className="h-3.5 w-3.5" />
                  Split Pane
                </>
              )}
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setSimOpen(true)}
            title="Test Skill rules with sample inputs"
          >
            <Play className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden xl:inline">What-If</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setDiffOpen(true)}
            title="View Version History & Rollback"
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Diff</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportPackage}
            title="Export JSON + SKILL.md Package"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setImportOpen(true)}
            title="Import Process Package"
          >
            <Upload className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => addOrUpdateProcess(activeProcess)}
          >
            Save Draft
          </Button>

          <Button
            size="sm"
            disabled={activeProcess.screenJson.fields.length === 0}
            onClick={handleSubmitForApproval}
          >
            <Send className="h-3.5 w-3.5" />
            Submit for Approval
          </Button>
        </div>
        </div>
      </div>

      {statusBanner && (
        <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-600/15">
          {statusBanner}
        </div>
      )}

      {chatOnlyMode ? (
        /* Centered Chat-Only Mode for New Process Creation */
        <div className="mx-auto max-w-3xl h-[calc(100vh-140px)] min-h-[520px] flex flex-col rounded-2xl bg-white shadow-card ring-1 ring-slate-900/5 overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Bot className="h-4 w-4 text-blue-600" />
              <span>AI Process Builder — Start by describing your process</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setChatOnlyMode(false)}>
              View Details →
            </Button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">{renderPaneBody('chat')}</div>
        </div>
      ) : (
        /* Resizable Split-Pane Container (Sticky Chat Option B) */
        <div
          ref={containerRef}
          className="flex flex-col lg:flex-row lg:items-start min-h-[520px] rounded-2xl bg-white shadow-card ring-1 ring-slate-900/5"
        >
          {/* Left / Primary Pane (scrolls naturally with page) */}
          <div
            style={splitMode ? { flexBasis: `${leftWidthPct}%` } : undefined}
            className={`flex flex-col min-w-0 ${splitMode ? 'lg:shrink-0' : 'w-full'}`}
          >
            {renderPaneSelector(
              leftPane,
              setLeftPane,
              splitMode ? `Left · ${Math.round(leftWidthPct)}%` : 'Single View'
            )}
            <div className="flex-1">{renderPaneBody(leftPane)}</div>
          </div>

          {/* Draggable Divider */}
          {splitMode && (
            <div
              role="separator"
              aria-orientation="vertical"
              onMouseDown={startResize}
              title="Drag to resize panes"
              className="hidden lg:flex lg:self-stretch w-2.5 shrink-0 cursor-col-resize items-center justify-center bg-slate-100/80 hover:bg-blue-100 transition-colors group"
            >
              <GripVertical className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
            </div>
          )}

          {/* Right Pane: Sticky AI Chat (default 25%, min 25%) */}
          {splitMode && (
            <div className="flex-1 flex flex-col min-w-0 lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] border-t lg:border-t-0 border-slate-100">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-3 py-2 rounded-tr-2xl">
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-blue-700 shadow-sm ring-1 ring-slate-900/5">
                  <Bot className="h-3.5 w-3.5" />
                  <span>AI Chat</span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  Right · {Math.round(100 - leftWidthPct)}%
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">{renderPaneBody('chat')}</div>
            </div>
          )}
        </div>
      )}
      <WhatIfSimulatorDialog
        open={simOpen}
        onClose={() => setSimOpen(false)}
        process={activeProcess}
      />
      <VersionDiffDialog
        open={diffOpen}
        onClose={() => setDiffOpen(false)}
        process={activeProcess}
        onRollback={handleRollback}
      />
      <ImportPackageDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(imported) => {
          setActiveProcess(imported);
          addOrUpdateProcess(imported);
          setStatusBanner(`Imported "${imported.name}" as Draft.`);
          setTimeout(() => setStatusBanner(null), 3000);
        }}
      />
    </div>
  );
}
