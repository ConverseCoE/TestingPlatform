import { useState } from 'react';
import {
  ArrowRight,
  Clock,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type {
  FieldAccessMode,
  ProcessDefinition,
  ScreenFieldSchema,
  WorkflowStage,
} from '../../types/process';
import type { RoleId } from '../../types/rbac';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
} from '../ui';

interface BlueprintPaneProps {
  process: ProcessDefinition;
  onProcessUpdated: (updated: ProcessDefinition, summary: string) => void;
}

const ROLES: { id: RoleId; short: string }[] = [
  { id: 'principal_admin', short: 'Admin' },
  { id: 'solution_specialist', short: 'Specialist' },
  { id: 'solution_manager', short: 'Manager' },
  { id: 'tester', short: 'Tester' },
  { id: 'end_user', short: 'End User' },
];

export function BlueprintPane({ process, onProcessUpdated }: BlueprintPaneProps) {
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<ScreenFieldSchema['type']>('text');
  const [newStageName, setNewStageName] = useState('');
  const [streamlinedNote, setStreamlinedNote] = useState<string | null>(null);

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newFieldLabel.trim();
    if (!label) return;
    const name = label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const next = structuredClone(process);
    if (!next.screenJson.fields.some((f) => f.name === name)) {
      next.screenJson.fields.push({
        name,
        label,
        type: newFieldType,
        required: false,
      });
      next.roleMatrix.push({
        fieldName: name,
        permissions: {
          principal_admin: 'Edit',
          solution_specialist: 'Edit',
          solution_manager: 'View',
          tester: 'Edit',
          end_user: 'Edit',
        },
      });
    }
    setNewFieldLabel('');
    onProcessUpdated(next, `Added field "${label}" via Process Blueprint`);
  };

  const handleToggleRequired = (fieldName: string) => {
    const next = structuredClone(process);
    next.screenJson.fields = next.screenJson.fields.map((f) =>
      f.name === fieldName ? { ...f, required: !f.required } : f
    );
    onProcessUpdated(next, `Toggled required flag for "${fieldName}"`);
  };

  const handleRemoveField = (fieldName: string) => {
    const next = structuredClone(process);
    next.screenJson.fields = next.screenJson.fields.filter((f) => f.name !== fieldName);
    next.roleMatrix = next.roleMatrix.filter((r) => r.fieldName !== fieldName);
    onProcessUpdated(next, `Removed field "${fieldName}" via Blueprint`);
  };

  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newStageName.trim();
    if (!name) return;
    const next = structuredClone(process);
    const stage: WorkflowStage = {
      id: `stage-${Date.now()}`,
      name,
      actorRole: 'solution_manager',
      slaHours: 24,
      escalateToRole: 'principal_admin',
      description: `Review & action stage: ${name}`,
      transitions: [],
    };
    next.workflow.push(stage);
    setNewStageName('');
    onProcessUpdated(next, `Added workflow stage "${name}"`);
  };

  const handleUpdateSla = (stageId: string, hours: number) => {
    const next = structuredClone(process);
    next.workflow = next.workflow.map((s) =>
      s.id === stageId ? { ...s, slaHours: Number.isNaN(hours) ? undefined : hours } : s
    );
    onProcessUpdated(next, `Updated SLA on workflow stage`);
  };

  const handleMatrixChange = (fieldName: string, role: RoleId, mode: FieldAccessMode) => {
    const next = structuredClone(process);
    const existing = next.roleMatrix.find((r) => r.fieldName === fieldName);
    if (existing) {
      existing.permissions[role] = mode;
    } else {
      next.roleMatrix.push({
        fieldName,
        permissions: {
          principal_admin: 'Edit',
          solution_specialist: 'Edit',
          solution_manager: 'View',
          tester: 'Edit',
          end_user: 'Edit',
          [role]: mode,
        },
      });
    }
    onProcessUpdated(next, `Updated RBAC matrix for "${fieldName}"`);
  };

  const handleStreamline = () => {
    const next = structuredClone(process);
    // Deduplicate requirements & enforce standard SLAs
    const seen = new Set<string>();
    next.requirements = next.requirements.filter((r) => {
      const k = r.title.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    next.workflow = next.workflow.map((s) => ({
      ...s,
      slaHours: s.slaHours ?? 24,
      escalateToRole: s.escalateToRole ?? 'principal_admin',
    }));
    onProcessUpdated(next, 'Streamlined process requirements & workflow SLAs');
    setStreamlinedNote('Streamlined: deduplicated requirements and normalized stage SLAs.');
    setTimeout(() => setStreamlinedNote(null), 3000);
  };

  return (
    <div className="p-4 sm:p-5 space-y-5">
      {/* Header + Streamline */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Process Blueprint</h3>
          <p className="text-xs text-slate-500">
            Business-friendly view of Fields, Workflow Movement Graph, SLA Escalations, and Role Matrix.
          </p>
        </div>
        <Button size="sm" onClick={handleStreamline}>
          <Sparkles className="h-3.5 w-3.5" />
          Streamline Process
        </Button>
      </div>

      {streamlinedNote && (
        <div className="rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-800 ring-1 ring-emerald-600/15">
          {streamlinedNote}
        </div>
      )}

      {/* 1. Workflow Movement Graph */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Workflow Movement Graph &amp; SLAs</CardTitle>
          <CardDescription>
            Visual stage flow with responsible actors and escalation timers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.workflow.length === 0 ? (
            <div className="text-xs text-slate-500">No workflow stages yet.</div>
          ) : (
            <div className="flex flex-wrap items-stretch gap-2.5">
              {process.workflow.map((stage, idx) => (
                <div key={stage.id} className="flex items-center gap-2">
                  <div className="w-48 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-900/5 space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {idx + 1}. {stage.name}
                      </span>
                      <Badge variant="default" className="text-[10px]">
                        {stage.actorRole.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{stage.description}</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span className="text-[11px] text-slate-600">SLA (h):</span>
                      <input
                        type="number"
                        value={stage.slaHours ?? ''}
                        onChange={(e) => handleUpdateSla(stage.id, Number(e.target.value))}
                        className="w-14 rounded bg-white px-1.5 py-0.5 text-[11px] ring-1 ring-slate-900/10"
                      />
                    </div>
                  </div>
                  {idx < process.workflow.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-blue-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddStage} className="flex items-center gap-2 pt-1">
            <Input
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="Add workflow stage (e.g., Finance Audit)..."
              className="max-w-xs h-8 text-xs"
            />
            <Button type="submit" size="sm" variant="outline">
              <Plus className="h-3.5 w-3.5" />
              Add Stage
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2. Fields & Validations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Fields &amp; Validations</CardTitle>
          <CardDescription>
            Add, toggle required flags, or remove fields—Screen JSON updates live.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-900/5">
            {process.screenJson.fields.map((f) => (
              <div
                key={f.name}
                className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{f.label}</span>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                    {f.name}
                  </code>
                  <Badge variant="secondary">{f.type}</Badge>
                  {f.lookupTable && (
                    <Badge variant="violet">Lookup: {f.lookupTable}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleRequired(f.name)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      f.required
                        ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/15'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {f.required ? 'Required' : 'Optional'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveField(f.name)}
                    className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Remove ${f.label}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddField} className="flex flex-wrap items-center gap-2 pt-1">
            <Input
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              placeholder="New field label (e.g., Cost Center)..."
              className="w-52 h-8 text-xs"
            />
            <Select
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value as ScreenFieldSchema['type'])}
              className="w-32 h-8 text-xs"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="currency">Currency</option>
              <option value="date">Date</option>
              <option value="textarea">Textarea</option>
              <option value="checkbox">Checkbox</option>
            </Select>
            <Button type="submit" size="sm" variant="outline">
              <Plus className="h-3.5 w-3.5" />
              Add Field
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 3. Role-Based Field & Action Matrix */}
      {process.screenJson.fields.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Role-Based Field Matrix (RBAC)</CardTitle>
            <CardDescription>Control Edit / View / Hide access per enterprise role.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-3 font-medium">Field</th>
                  {ROLES.map((r) => (
                    <th key={r.id} className="py-2 px-2 font-medium">
                      {r.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {process.screenJson.fields.map((f) => {
                  const row = process.roleMatrix.find((m) => m.fieldName === f.name);
                  return (
                    <tr key={f.name}>
                      <td className="py-2 pr-3 font-medium text-slate-800">{f.label}</td>
                      {ROLES.map((r) => {
                        const mode = row?.permissions[r.id] ?? 'Edit';
                        return (
                          <td key={r.id} className="py-1.5 px-2">
                            <select
                              value={mode}
                              onChange={(e) =>
                                handleMatrixChange(f.name, r.id, e.target.value as FieldAccessMode)
                              }
                              className="rounded bg-slate-50 px-1.5 py-1 text-[11px] ring-1 ring-slate-900/10"
                            >
                              <option value="Edit">Edit</option>
                              <option value="View">View</option>
                              <option value="Hide">Hide</option>
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 4. Plain-English Skill Rules Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-blue-600" />
            Business &amp; Policy Rules Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {process.skillFile.rules.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs ring-1 ring-slate-900/5"
            >
              <div>
                <span className="font-semibold text-slate-900">{r.name}</span>
                <p className="text-slate-500">{r.message}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant={r.source === 'policy_injected' ? 'violet' : 'secondary'}>
                  {r.source === 'policy_injected' ? 'Policy' : 'Process'}
                </Badge>
                <Badge
                  variant={
                    r.outcomeOnMatch === 'BLOCK'
                      ? 'destructive'
                      : r.outcomeOnMatch === 'WARN'
                      ? 'warning'
                      : 'success'
                  }
                >
                  {r.outcomeOnMatch}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
