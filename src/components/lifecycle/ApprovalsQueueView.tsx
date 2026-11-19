import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Eye,
  FileCode2,
  GitBranch,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import type { ProcessDefinition } from '../../types/process';
import { JsonScreenRenderer } from '../json-renderer/JsonScreenRenderer';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '../ui';

interface ApprovalsQueueViewProps {
  initialProcessId?: string;
}

export function ApprovalsQueueView({ initialProcessId }: ApprovalsQueueViewProps) {
  const { processes, addOrUpdateProcess, appendAuditEntry, currentUser } = useAppStore();

  const pendingProcesses = useMemo(
    () => processes.filter((p) => p.status === 'Pending Approval'),
    [processes]
  );

  const [selectedId, setSelectedId] = useState<string>(() => {
    if (initialProcessId && processes.some((p) => p.id === initialProcessId)) {
      return initialProcessId;
    }
    return pendingProcesses[0]?.id ?? processes[0]?.id ?? '';
  });

  const [inspectTab, setInspectTab] = useState('preview');
  const [comment, setComment] = useState('');
  const [decisionBanner, setDecisionBanner] = useState<string | null>(null);

  const selectedProcess =
    processes.find((p) => p.id === selectedId) ?? pendingProcesses[0] ?? processes[0];

  const handleDecision = (decision: 'Approved' | 'Changes Requested') => {
    if (!selectedProcess) return;
    const nextStatus =
      decision === 'Approved' ? 'Ready for Testing' : 'Needs Revision';

    const next: ProcessDefinition = {
      ...selectedProcess,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      reviews: [
        {
          id: `rev-${Date.now()}`,
          author: currentUser?.displayName ?? 'David Chen',
          role: currentUser?.username ?? 'solution_manager',
          decision,
          comment:
            comment.trim() ||
            (decision === 'Approved'
              ? 'Approved for QA verification.'
              : 'Please refine requirements and resubmit.'),
          timestamp: new Date().toISOString(),
        },
        ...selectedProcess.reviews,
      ],
    };

    addOrUpdateProcess(next);
    if (currentUser) {
      appendAuditEntry({
        actorName: currentUser.displayName,
        actorRole: currentUser.username,
        category: 'APPROVAL',
        processId: next.id,
        processName: next.name,
        summary: `${decision}: ${next.name} → ${nextStatus}`,
        detail: next.reviews[0].comment,
      });
    }

    setComment('');
    setDecisionBanner(
      `${decision}: "${next.name}" moved to ${nextStatus}.`
    );
    setTimeout(() => setDecisionBanner(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Solution Manager Approvals Queue
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review submitted processes, inspect generated UI, data tables, and Skill compliance before promoting to QA.
          </p>
        </div>
        <Badge variant="warning" className="text-xs px-3 py-1">
          {pendingProcesses.length} Pending Approval
        </Badge>
      </div>

      {decisionBanner && (
        <Alert variant="success" title="Review Decision Recorded">
          {decisionBanner}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Queue List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Awaiting Review ({pendingProcesses.length})
          </div>
          {pendingProcesses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-xs text-slate-500">
                No processes currently pending approval. Switch to Solution Specialist to submit one, or inspect any process below.
              </CardContent>
            </Card>
          ) : (
            pendingProcesses.map((proc) => {
              const active = selectedProcess?.id === proc.id;
              return (
                <button
                  key={proc.id}
                  type="button"
                  onClick={() => setSelectedId(proc.id)}
                  className={`w-full text-left rounded-xl p-4 transition-all ${
                    active
                      ? 'bg-blue-50/80 ring-2 ring-blue-600 shadow-sm'
                      : 'bg-white shadow-card ring-1 ring-slate-900/5 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">{proc.domain}</Badge>
                    <Badge variant="warning">{proc.status}</Badge>
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-900">{proc.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    v{proc.version} · By {proc.createdBy} · {proc.tables.length} tables
                  </div>
                </button>
              );
            })
          )}

          {/* Other processes for reference */}
          <div className="pt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            All Processes ({processes.length})
          </div>
          <div className="space-y-1.5">
            {processes
              .filter((p) => p.status !== 'Pending Approval')
              .map((proc) => (
                <button
                  key={proc.id}
                  type="button"
                  onClick={() => setSelectedId(proc.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all ${
                    selectedProcess?.id === proc.id
                      ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-600/30'
                      : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-900/5 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-medium truncate">{proc.name}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {proc.status}
                  </Badge>
                </button>
              ))}
          </div>
        </div>

        {/* Right Inspection & Decision Panel */}
        {selectedProcess && (
          <div className="lg:col-span-8 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{selectedProcess.domain}</Badge>
                      <Badge variant="default">v{selectedProcess.version}</Badge>
                      <Badge variant="success">
                        <ShieldCheck className="h-3 w-3" />
                        {selectedProcess.complianceStatus}
                      </Badge>
                      <Badge
                        variant={
                          selectedProcess.status === 'Pending Approval'
                            ? 'warning'
                            : selectedProcess.status === 'Published'
                            ? 'success'
                            : 'secondary'
                        }
                      >
                        {selectedProcess.status}
                      </Badge>
                    </div>
                    <CardTitle className="pt-2 text-xl">{selectedProcess.name}</CardTitle>
                    <CardDescription>{selectedProcess.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Decision Box */}
                {selectedProcess.status === 'Pending Approval' && (
                  <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-900/5 space-y-3">
                    <div className="text-xs font-semibold text-slate-700">
                      Manager Review Decision
                    </div>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add approval notes or requested changes..."
                      className="min-h-[64px] text-xs"
                    />
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDecision('Changes Requested')}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Request Changes
                      </Button>
                      <Button size="sm" onClick={() => handleDecision('Approved')}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve for Testing
                      </Button>
                    </div>
                  </div>
                )}

                {/* Inspection Tabs */}
                <Tabs value={inspectTab} onValueChange={setInspectTab}>
                  <TabsList>
                    <TabsTrigger value="preview">
                      <Eye className="h-3.5 w-3.5" />
                      Screen Preview
                    </TabsTrigger>
                    <TabsTrigger value="workflow">
                      <GitBranch className="h-3.5 w-3.5" />
                      Workflow ({selectedProcess.workflow.length})
                    </TabsTrigger>
                    <TabsTrigger value="tables">
                      <Database className="h-3.5 w-3.5" />
                      Tables ({selectedProcess.tables.length})
                    </TabsTrigger>
                    <TabsTrigger value="skill">
                      <FileCode2 className="h-3.5 w-3.5" />
                      Skill Rules ({selectedProcess.skillFile.rules.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="preview">
                    <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-900/5">
                      <JsonScreenRenderer process={selectedProcess} isPreviewOnly />
                    </div>
                  </TabsContent>

                  <TabsContent value="workflow">
                    <div className="space-y-2.5">
                      {selectedProcess.workflow.map((st, idx) => (
                        <div
                          key={st.id}
                          className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs ring-1 ring-slate-900/5"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">
                              {idx + 1}. {st.name}
                            </div>
                            <div className="text-slate-500">{st.description}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default">{st.actorRole}</Badge>
                            {st.slaHours && (
                              <Badge variant="secondary">{st.slaHours}h SLA</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="tables">
                    <div className="space-y-2.5">
                      {selectedProcess.tables.map((t) => (
                        <div
                          key={t.id}
                          className="rounded-xl bg-slate-50 p-3 text-xs ring-1 ring-slate-900/5 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-900">{t.name}</span>
                            <Badge
                              variant={
                                t.kind === 'existing_leveraged' ? 'default' : 'success'
                              }
                            >
                              {t.kind === 'existing_leveraged'
                                ? 'Existing Leveraged'
                                : 'New Created'}
                            </Badge>
                          </div>
                          <p className="text-slate-500">{t.description}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="skill">
                    <div className="space-y-2">
                      {selectedProcess.skillFile.rules.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-xs ring-1 ring-slate-900/5"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{r.name}</div>
                            <div className="text-slate-500">{r.message}</div>
                          </div>
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
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
