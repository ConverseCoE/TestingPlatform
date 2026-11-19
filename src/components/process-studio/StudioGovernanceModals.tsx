import { useState } from 'react';
import { History, Play, RotateCcw, Upload } from 'lucide-react';
import { PERSONA_LIST } from '../../data/mock-users';
import type { ProcessDefinition, SkillTrigger } from '../../types/process';
import type { RoleId } from '../../types/rbac';
import type { SkillExecutionLog } from '../../types/runtime';
import { evaluateSkillRules } from '../../utils/skill-evaluator';
import { Alert, Badge, Button, Dialog, Input, Select, Textarea } from '../ui';

export function WhatIfSimulatorDialog({
  open,
  onClose,
  process,
}: {
  open: boolean;
  onClose: () => void;
  process: ProcessDefinition;
}) {
  const [simRole, setSimRole] = useState<RoleId>('end_user');
  const [trigger, setTrigger] = useState<SkillTrigger>('onButtonClick');
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SkillExecutionLog | null>(null);

  const handleRun = () => {
    const typedValues: Record<string, string | number | boolean> = {};
    for (const f of process.screenJson.fields) {
      const raw = sampleValues[f.name] ?? '';
      typedValues[f.name] =
        f.type === 'currency' || f.type === 'number'
          ? raw === ''
            ? ''
            : Number(raw)
          : raw;
    }

    const log = evaluateSkillRules({
      process,
      trigger,
      actionId: process.screenJson.primaryActions[0]?.id ?? 'submit_request',
      actionLabel: process.screenJson.primaryActions[0]?.label ?? 'Submit',
      actorRole: simRole,
      values: typedValues,
    });
    setResult(log);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Interactive What-If Skill Simulator"
      description="Test how Skill File & Policy rules evaluate before submitting for approval."
      className="max-w-xl"
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Simulated Role</label>
            <Select
              value={simRole}
              onChange={(e) => setSimRole(e.target.value as RoleId)}
              className="text-xs"
            >
              {PERSONA_LIST.map((p) => (
                <option key={p.id} value={p.username}>
                  {p.roleLabel}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Trigger Event</label>
            <Select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as SkillTrigger)}
              className="text-xs"
            >
              <option value="onButtonClick">onButtonClick (Primary Action)</option>
              <option value="onScreenOpen">onScreenOpen</option>
            </Select>
          </div>
        </div>

        {trigger === 'onButtonClick' && process.screenJson.fields.length > 0 && (
          <div className="grid gap-2.5 sm:grid-cols-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-900/5">
            {process.screenJson.fields.slice(0, 4).map((f) => (
              <div key={f.name} className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">{f.label}</label>
                <Input
                  type={f.type === 'currency' || f.type === 'number' ? 'number' : 'text'}
                  value={sampleValues[f.name] ?? ''}
                  onChange={(e) =>
                    setSampleValues((prev) => ({ ...prev, [f.name]: e.target.value }))
                  }
                  placeholder={f.type === 'currency' ? 'e.g. 6000' : `Sample ${f.label}`}
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button size="sm" onClick={handleRun}>
            <Play className="h-3.5 w-3.5" />
            Run Skill Simulation
          </Button>
        </div>

        {result && (
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Simulation Result</span>
              <Badge
                variant={
                  result.overallOutcome === 'BLOCK'
                    ? 'destructive'
                    : result.overallOutcome === 'WARN'
                    ? 'warning'
                    : 'success'
                }
              >
                {result.overallOutcome}
              </Badge>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {result.entries.map((e) => (
                <Alert
                  key={e.id}
                  variant={
                    e.outcome === 'BLOCK'
                      ? 'destructive'
                      : e.outcome === 'WARN'
                      ? 'warning'
                      : 'success'
                  }
                  title={`${e.ruleName} (${e.outcome})`}
                >
                  {e.message}
                </Alert>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

export function VersionDiffDialog({
  open,
  onClose,
  process,
  onRollback,
}: {
  open: boolean;
  onClose: () => void;
  process: ProcessDefinition;
  onRollback: (version: number) => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Process Version History & Diff"
      description="Compare saved snapshots and rollback if needed."
      className="max-w-xl"
    >
      <div className="space-y-3">
        <div className="rounded-xl bg-blue-50/70 p-3 text-xs ring-1 ring-blue-600/15">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-900">
              Current Working Version (v{process.version})
            </span>
            <Badge variant="default">{process.status}</Badge>
          </div>
          <div className="mt-1 text-blue-800">
            {process.screenJson.fields.length} fields · {process.workflow.length} stages ·{' '}
            {process.skillFile.rules.length} skill rules
          </div>
        </div>

        {process.history.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center gap-1.5">
            <History className="h-5 w-5 text-slate-300" />
            No prior snapshots yet. Snapshots are created automatically when you submit or save versions.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {process.history.map((snap) => (
              <div
                key={snap.version}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-xs ring-1 ring-slate-900/5"
              >
                <div>
                  <div className="font-semibold text-slate-900">
                    v{snap.version} — {snap.summary}
                  </div>
                  <div className="text-slate-500">
                    {snap.screenJson.fields.length} fields · {snap.workflow.length} stages ·{' '}
                    {snap.skillFile.rules.length} skills
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => onRollback(snap.version)}>
                  <RotateCcw className="h-3 w-3" />
                  Rollback
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}

export function ImportPackageDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (pkg: ProcessDefinition) => void;
}) {
  const [rawText, setRawText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    try {
      const parsed = JSON.parse(rawText) as { process?: ProcessDefinition } | ProcessDefinition;
      const proc = 'process' in parsed && parsed.process ? parsed.process : (parsed as ProcessDefinition);
      if (!proc.id || !proc.screenJson || !proc.skillFile) {
        setError('Invalid Process Package JSON.');
        return;
      }
      onImport({ ...proc, id: `proc-imp-${Date.now()}`, status: 'Draft' });
      setRawText('');
      setError(null);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Import Process Package"
      description="Paste an exported NutbaAI Process JSON + SKILL.md bundle."
    >
      <div className="space-y-3">
        {error && (
          <Alert variant="destructive" title="Import Error">
            {error}
          </Alert>
        )}
        <Textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder='Paste exported JSON package here...'
          className="min-h-[180px] font-mono text-xs"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleImport}>
            <Upload className="h-3.5 w-3.5" />
            Import as Draft
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
