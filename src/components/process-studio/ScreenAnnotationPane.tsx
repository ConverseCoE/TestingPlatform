import React, { useRef, useState } from 'react';
import {
  Check,
  MousePointerClick,
  PenTool,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import type { ProcessDefinition } from '../../types/process';
import { synthesizeProcessFromPrompt } from '../../utils/process-synthesizer';
import { JsonScreenRenderer } from '../json-renderer/JsonScreenRenderer';
import { Badge, Button, Input } from '../ui';

interface AnnotationPin {
  id: string;
  mode: 'click' | 'polygon';
  targetLabel: string;
  xPct: number;
  yPct: number;
  points?: { x: number; y: number }[];
  comment: string;
}

interface ScreenAnnotationPaneProps {
  process: ProcessDefinition;
  onProcessUpdated: (updated: ProcessDefinition) => void;
}

export function ScreenAnnotationPane({
  process,
  onProcessUpdated,
}: ScreenAnnotationPaneProps) {
  const { runtimeRecords } = useAppStore();
  const [annotateMode, setAnnotateMode] = useState<'off' | 'click' | 'polygon'>('off');
  const [flowMode, setFlowMode] = useState<'immediate' | 'queue'>('immediate');
  const [pins, setPins] = useState<AnnotationPin[]>([]);
  const [draftPolygon, setDraftPolygon] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<Omit<AnnotationPin, 'comment'> | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const processRecords = runtimeRecords.filter((r) => r.processId === process.id);

  const applyFeedbackList = (feedbackPins: AnnotationPin[]) => {
    let nextProc = process;
    for (const pin of feedbackPins) {
      const prompt = `[UI Annotation on ${pin.targetLabel}]: ${pin.comment}`;
      const res = synthesizeProcessFromPrompt(prompt, nextProc, 2);
      nextProc = res.updatedProcess;
    }
    onProcessUpdated(nextProc);
    setAppliedBanner(
      `Applied ${feedbackPins.length} visual annotation${feedbackPins.length > 1 ? 's' : ''} to Screen & Skill File.`
    );
    setTimeout(() => setAppliedBanner(null), 3000);
  };

  const getRelativePct = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return { xPct: 50, yPct: 50 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      xPct: Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)),
      yPct: Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (annotateMode !== 'click' || !containerRef.current) return;
    const { xPct, yPct } = getRelativePct(e);

    // Find underlying block label via elementFromPoint
    const overlayEl = e.currentTarget;
    overlayEl.style.pointerEvents = 'none';
    const underlying = document.elementFromPoint(e.clientX, e.clientY);
    overlayEl.style.pointerEvents = 'auto';

    const blockEl = underlying?.closest('[data-block-id]');
    const targetLabel = blockEl?.getAttribute('data-block-id') ?? 'Screen Region';

    setPendingDraft({
      id: `pin-${Date.now()}`,
      mode: 'click',
      targetLabel,
      xPct,
      yPct,
    });
    setCommentInput('');
  };

  const handlePolygonMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (annotateMode !== 'polygon' || e.button !== 0) return;
    const { xPct, yPct } = getRelativePct(e);
    setIsDrawing(true);
    setDraftPolygon((prev) => [...prev, { x: xPct, y: yPct }]);
  };

  const handlePolygonMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (annotateMode !== 'polygon' || !isDrawing) return;
    const { xPct, yPct } = getRelativePct(e);
    setDraftPolygon((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return [{ x: xPct, y: yPct }];
      const dist = Math.hypot(xPct - last.x, yPct - last.y);
      if (dist < 1.2) return prev;
      return [...prev, { x: xPct, y: yPct }];
    });
  };

  const handlePolygonMouseUp = () => {
    if (isDrawing) setIsDrawing(false);
  };

  const finishPolygon = (anchor?: { xPct: number; yPct: number }) => {
    if (draftPolygon.length < 3) return;
    const avgX = draftPolygon.reduce((s, p) => s + p.x, 0) / draftPolygon.length;
    const avgY = draftPolygon.reduce((s, p) => s + p.y, 0) / draftPolygon.length;
    setPendingDraft({
      id: `poly-${Date.now()}`,
      mode: 'polygon',
      targetLabel: `Drawn Region (${draftPolygon.length} pts)`,
      xPct: anchor?.xPct ?? avgX,
      yPct: anchor?.yPct ?? avgY,
      points: draftPolygon,
    });
    setDraftPolygon([]);
    setIsDrawing(false);
    setCommentInput('');
  };

  const handleOverlayContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if (annotateMode !== 'polygon') return;
    e.preventDefault();
    if (draftPolygon.length >= 3) {
      finishPolygon(getRelativePct(e));
    }
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingDraft || !commentInput.trim()) return;
    const fullPin: AnnotationPin = { ...pendingDraft, comment: commentInput.trim() };
    setPendingDraft(null);
    setCommentInput('');

    if (flowMode === 'immediate') {
      applyFeedbackList([fullPin]);
    } else {
      setPins((prev) => [...prev, fullPin]);
    }
  };

  const handleApplyAllPins = () => {
    if (pins.length === 0) return;
    applyFeedbackList(pins);
    setPins([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Annotation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-white px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-600 mr-1">Annotate:</span>
          <Button
            size="sm"
            variant={annotateMode === 'off' ? 'secondary' : 'ghost'}
            onClick={() => {
              setAnnotateMode('off');
              setDraftPolygon([]);
              setPendingDraft(null);
            }}
          >
            Off (Interactive)
          </Button>
          <Button
            size="sm"
            variant={annotateMode === 'click' ? 'default' : 'outline'}
            onClick={() => {
              setAnnotateMode('click');
              setDraftPolygon([]);
            }}
          >
            <MousePointerClick className="h-3.5 w-3.5" />
            Click Element
          </Button>
          <Button
            size="sm"
            variant={annotateMode === 'polygon' ? 'default' : 'outline'}
            onClick={() => setAnnotateMode('polygon')}
          >
            <PenTool className="h-3.5 w-3.5" />
            Draw Polygon
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Annotation Apply Mode"
            value={flowMode}
            onChange={(e) => setFlowMode(e.target.value as 'immediate' | 'queue')}
            className="h-8 rounded-lg bg-slate-50 px-2.5 text-xs font-medium text-slate-700 ring-1 ring-slate-900/10 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="immediate">Flow: Apply Immediately</option>
            <option value="queue">Flow: Multi-Pin Queue</option>
          </select>

          {pins.length > 0 && (
            <>
              <Button size="sm" onClick={handleApplyAllPins}>
                <Sparkles className="h-3.5 w-3.5" />
                Apply All ({pins.length})
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPins([])}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Polygon Helper Bar */}
      {annotateMode === 'polygon' && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-blue-50 px-4 py-1.5 text-xs text-blue-800">
          <span>
            Drag with your mouse (or click points) to select a region, then <strong>Right-click</strong> or click <strong>Finish Shape</strong> to add a comment ({draftPolygon.length} pts).
          </span>
          <div className="flex items-center gap-2">
            {draftPolygon.length >= 3 && (
              <Button size="sm" onClick={() => finishPolygon()}>
                <Check className="h-3 w-3" />
                Finish Shape
              </Button>
            )}
            {draftPolygon.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraftPolygon([]);
                  setIsDrawing(false);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {appliedBanner && (
        <div className="bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-800 border-b border-emerald-100">
          {appliedBanner}
        </div>
      )}

      {/* Preview Canvas + SVG Overlay */}
      <div className="relative flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/70">
        <div ref={containerRef} className="relative">
          <JsonScreenRenderer process={process} records={processRecords} isPreviewOnly />

          {/* Interactive SVG + Click Overlay when Annotating */}
          {annotateMode !== 'off' && (
            <div
              onClick={handleOverlayClick}
              onMouseDown={handlePolygonMouseDown}
              onMouseMove={handlePolygonMouseMove}
              onMouseUp={handlePolygonMouseUp}
              onMouseLeave={handlePolygonMouseUp}
              onContextMenu={handleOverlayContextMenu}
              className="absolute inset-0 z-10 cursor-crosshair select-none rounded-xl ring-2 ring-blue-500/40 bg-blue-500/[0.02]"
            >
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="h-full w-full pointer-events-none"
              >
                {/* Queued Polygons */}
                {pins
                  .filter((p) => p.mode === 'polygon' && p.points)
                  .map((p) => (
                    <polygon
                      key={p.id}
                      points={p.points!.map((pt) => `${pt.x},${pt.y}`).join(' ')}
                      fill="rgba(37, 99, 235, 0.12)"
                      stroke="#2563EB"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}

                {/* In-progress Polygon */}
                {draftPolygon.length >= 3 ? (
                  <polygon
                    points={draftPolygon.map((pt) => `${pt.x},${pt.y}`).join(' ')}
                    fill="rgba(37, 99, 235, 0.10)"
                    stroke="#2563EB"
                    strokeDasharray="4 3"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : (
                  draftPolygon.length > 0 && (
                    <polyline
                      points={draftPolygon.map((pt) => `${pt.x},${pt.y}`).join(' ')}
                      fill="none"
                      stroke="#2563EB"
                      strokeDasharray="4 3"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  )
                )}
              </svg>

              {/* Queued Pin Markers */}
              {pins.map((pin, idx) => (
                <div
                  key={pin.id}
                  style={{ left: `${pin.xPct}%`, top: `${pin.yPct}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white shadow-md ring-2 ring-white"
                  title={`${pin.targetLabel}: ${pin.comment}`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          )}

          {/* Feedback Input Popover */}
          {pendingDraft && (
            <div
              style={{
                left: `${Math.min(68, Math.max(4, pendingDraft.xPct))}%`,
                top: `${Math.min(75, Math.max(4, pendingDraft.yPct))}%`,
              }}
              className="absolute z-20 w-72 rounded-xl bg-white p-3.5 shadow-elevated ring-1 ring-slate-900/10 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="default" className="truncate max-w-[200px]">
                  {pendingDraft.targetLabel}
                </Badge>
                <button
                  type="button"
                  onClick={() => setPendingDraft(null)}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <form onSubmit={handleConfirmPin} className="space-y-2">
                <Input
                  autoFocus
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="e.g., Add field Priority or block > $2000"
                  className="text-xs"
                />
                <div className="flex justify-end gap-1.5">
                  <Button type="submit" size="sm">
                    <Send className="h-3 w-3" />
                    {flowMode === 'immediate' ? 'Apply Now' : 'Queue Pin'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
