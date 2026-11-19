import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Database,
  FileCode2,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import type { ProcessLifecycleStatus } from '../../types/process';
import type { AuditEntry } from '../../types/runtime';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui';
import type { AppView } from '../layout/CommandPalette';

interface ControlTowerViewProps {
  onNavigate: (view: AppView, processId?: string) => void;
}

const STATUS_BADGE_MAP: Record<
  ProcessLifecycleStatus,
  'success' | 'default' | 'warning' | 'destructive' | 'secondary'
> = {
  Published: 'success',
  'Ready for Testing': 'default',
  'Pending Approval': 'warning',
  'Needs Revision': 'destructive',
  Draft: 'secondary',
};

const AUDIT_CATEGORY_LABELS: Record<AuditEntry['category'], string> = {
  AI_GENERATION: 'AI Generation',
  EDIT: 'Edit',
  APPROVAL: 'Approval',
  TEST: 'QA Test',
  RUNTIME_SKILL: 'Runtime Skill',
  SYSTEM: 'System',
};

export function ControlTowerView({ onNavigate }: ControlTowerViewProps) {
  const { processes, runtimeRecords, auditTrail, policies } = useAppStore();
  const [auditFilter, setAuditFilter] = useState<'ALL' | AuditEntry['category']>('ALL');

  const stats = useMemo(() => {
    const published = processes.filter((p) => p.status === 'Published').length;
    const pending = processes.filter((p) => p.status === 'Pending Approval').length;
    const testing = processes.filter((p) => p.status === 'Ready for Testing').length;
    const compliant = processes.filter((p) => p.complianceStatus === 'Compliant').length;
    const complianceRate =
      processes.length > 0 ? Math.round((compliant / processes.length) * 100) : 100;

    return {
      total: processes.length,
      published,
      pending,
      testing,
      complianceRate,
      runtimeCount: runtimeRecords.length,
    };
  }, [processes, runtimeRecords]);

  const filteredAudit = useMemo(() => {
    if (auditFilter === 'ALL') return auditTrail;
    return auditTrail.filter((a) => a.category === auditFilter);
  }, [auditTrail, auditFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Platform Control Tower
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enterprise-wide visibility across generated ERP processes, policy compliance, and explainability audit logs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onNavigate('processes_hub')}>
            Open Processes Hub
          </Button>
          <Button size="sm" onClick={() => onNavigate('process_studio')}>
            <Sparkles className="h-4 w-4" />
            Launch Process Studio
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total ERP Processes</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-xs text-slate-500">
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            <span>
              {stats.published} Published · {stats.testing} QA · {stats.pending} Pending
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Policy Compliance Rate</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-emerald-700">
              {stats.complianceRate}%
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>{policies.length} active enterprise policies enforced</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Live Runtime Records</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums">{stats.runtimeCount}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-xs text-slate-500">
            <Database className="h-3.5 w-3.5 text-blue-600" />
            <span>Governed by Skill File runtime checks</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Audit Ledger Events</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums">{auditTrail.length}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-xs text-slate-500">
            <Activity className="h-3.5 w-3.5 text-violet-600" />
            <span>Full AI &amp; human decision traceability</span>
          </CardContent>
        </Card>
      </div>

      {/* Process Directory */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Process Lifecycle Directory</CardTitle>
              <CardDescription>
                Jump directly into any process across Studio, Approvals, Test Bench, or Runtime.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Process</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Artifacts</TableHead>
                <TableHead className="text-right">Quick Jump</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processes.map((proc) => {
                const targetView: AppView =
                  proc.status === 'Pending Approval'
                    ? 'approvals_queue'
                    : proc.status === 'Ready for Testing'
                    ? 'test_bench'
                    : proc.status === 'Published'
                    ? 'runtime_apps'
                    : 'process_studio';

                return (
                  <TableRow key={proc.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{proc.name}</div>
                      <div className="text-xs text-slate-500">
                        v{proc.version} · Owner: {proc.createdBy}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{proc.domain}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_MAP[proc.status]}>{proc.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          proc.complianceStatus === 'Compliant'
                            ? 'success'
                            : proc.complianceStatus === 'Warning'
                            ? 'warning'
                            : 'destructive'
                        }
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {proc.complianceStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 tabular-nums">
                      {proc.tables.length} tables · {proc.skillFile.rules.length} skills
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onNavigate('process_studio', proc.id)}
                        >
                          <FileCode2 className="h-3.5 w-3.5" />
                          Studio
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onNavigate(targetView, proc.id)}
                        >
                          Open
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bottom Split: Active Enterprise Policies + Audit Ledger */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Active Enterprise Policies
            </CardTitle>
            <CardDescription>
              Auto-injected into generated Skill Files.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {policies.map((pol) => (
              <div
                key={pol.id}
                className="rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-900/5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">{pol.name}</span>
                  <Badge variant="default">{pol.domainScope}</Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{pol.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Audit Trail &amp; Explainability Ledger</CardTitle>
                <CardDescription>
                  Chronological record of AI generations, edits, approvals, tests, and Skill evaluations.
                </CardDescription>
              </div>
              <select
                aria-label="Filter Audit Ledger"
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value as 'ALL' | AuditEntry['category'])}
                className="h-8 rounded-lg bg-white px-2.5 text-xs font-medium text-slate-700 shadow-card ring-1 ring-slate-900/10 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">All Events</option>
                <option value="AI_GENERATION">AI Generation</option>
                <option value="EDIT">Edits</option>
                <option value="APPROVAL">Approvals</option>
                <option value="TEST">QA Tests</option>
                <option value="RUNTIME_SKILL">Runtime Skills</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {filteredAudit.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-3 rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-900/5"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{AUDIT_CATEGORY_LABELS[entry.category]}</Badge>
                      <span className="text-sm font-medium text-slate-900">{entry.summary}</span>
                    </div>
                    {entry.detail && <p className="text-xs text-slate-600">{entry.detail}</p>}
                    <div className="text-[11px] text-slate-400">
                      {entry.actorName} ({entry.actorRole})
                      {entry.processName ? ` · ${entry.processName}` : ''}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
