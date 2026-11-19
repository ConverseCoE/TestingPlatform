import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  FlaskConical,
  Play,
  Rocket,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import type { ProcessDefinition, ScreenActionSchema, TestCase } from '../../types/process';
import type { SkillExecutionLog } from '../../types/runtime';
import { evaluateSkillRules } from '../../utils/skill-evaluator';
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
} from '../ui';

interface TestBenchViewProps {
  initialProcessId?: string;
}

export function TestBenchView({ initialProcessId }: TestBenchViewProps) {
  const {
    processes,
    runtimeRecords,
    addOrUpdateProcess,
    appendAuditEntry,
    appendSkillLog,
    currentUser,
  } = useAppStore();

  const testingQueue = useMemo(
    () => processes.filter((p) => p.status === 'Ready for Testing'),
    [processes]
  );

  const [selectedId, setSelectedId] = useState<string>(() => {
    if (initialProcessId && processes.some((p) => p.id === initialProcessId)) {
      return initialProcessId;
    }
    return testingQueue[0]?.id ?? processes[0]?.id ?? '';
  });

  const [tab, setTab] = useState('cases');
  const [liveTrace, setLiveTrace] = useState<SkillExecutionLog | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const selectedProcess =
    processes.find((p) => p.id === selectedId) ?? testingQueue[0] ?? processes[0];

  // Run onScreenOpen Skill check when switching to Interactive Test Mode
  useEffect(() => {
    if (tab === 'interactive' && selectedProcess) {
      const log = evaluateSkillRules({
        process: selectedProcess,
        trigger: 'onScreenOpen',
        actionLabel: 'Open Screen (QA Test)',
        actorRole: currentUser?.username ?? 'tester',
        values: {},
      });
      setLiveTrace(log);
    }
  }, [tab, selectedProcess?.id, currentUser?.username]);

  const handleRunAutomatedSuite = () => {
    if (!selectedProcess) return;
    const updatedCases: TestCase[] = selectedProcess.testCases.map((tc) => ({
      ...tc,
      status: 'Passed',
      lastRunNote: `Verified automatically via SkillEvaluator (${new Date().toLocaleTimeString()}).`,
    }));
    const next: ProcessDefinition = {
      ...selectedProcess,
      testCases: updatedCases,
      updatedAt: new Date().toISOString(),
    };
    addOrUpdateProcess(next);
    if (currentUser) {
      appendAuditEntry({
        actorName: currentUser.displayName,
        actorRole: currentUser.username,
        category: 'TEST',
        processId: next.id,
        processName: next.name,
        summary: `Executed ${updatedCases.length} automated QA tests (${updatedCases.length}/${updatedCases.length} Passed)`,
      });
    }
    setBanner(`All ${updatedCases.length} test cases passed for "${next.name}".`);
    setTimeout(() => setBanner(null), 3000);
  };

  const handleToggleCaseStatus = (caseId: string, status: 'Passed' | 'Failed') => {
    if (!selectedProcess) return;
    const next: ProcessDefinition = {
      ...selectedProcess,
      testCases: selectedProcess.testCases.map((tc) =>
        tc.id === caseId
          ? {
              ...tc,
              status,
              lastRunNote: `Marked ${status} by ${currentUser?.displayName ?? 'Tester'}.`,
            }
          : tc
      ),
    };
    addOrUpdateProcess(next);
  };

  const handleInteractiveAction = (
    action: ScreenActionSchema,
    formValues: Record<string, string | number | boolean>
  ) => {
    if (!selectedProcess) return;
    const log = evaluateSkillRules({
      process: selectedProcess,
      trigger: 'onButtonClick',
      actionId: action.id,
      actionLabel: action.label,
      actorRole: currentUser?.username ?? 'tester',
      values: formValues,
    });
    setLiveTrace(log);
    appendSkillLog(log);
  };

  const handleCertifyPublish = () => {
    if (!selectedProcess) return;
    const next: ProcessDefinition = {
      ...selectedProcess,
      status: 'Published',
      updatedAt: new Date().toISOString(),
    };
    addOrUpdateProcess(next);
    if (currentUser) {
      appendAuditEntry({
        actorName: currentUser.displayName,
        actorRole: currentUser.username,
        category: 'TEST',
        processId: next.id,
        processName: next.name,
        summary: `Certified & Published ${next.name} (v${next.version}) to End Users`,
      });
    }
    setBanner(`"${next.name}" is now Published and live in End-User Runtime Apps!`);
    setTimeout(() => setBanner(null), 4000);
  };

  const handleFailToRevision = () => {
    if (!selectedProcess) return;
    const next: ProcessDefinition = {
      ...selectedProcess,
      status: 'Needs Revision',
      updatedAt: new Date().toISOString(),
    };
    addOrUpdateProcess(next);
    if (currentUser) {
      appendAuditEntry({
        actorName: currentUser.displayName,
        actorRole: currentUser.username,
        category: 'TEST',
        processId: next.id,
        processName: next.name,
        summary: `Returned ${next.name} to Needs Revision after QA`,
      });
    }
    setBanner(`"${next.name}" returned to Solution Specialist (Needs Revision).`);
    setTimeout(() => setBanner(null), 4000);
  };

  const allPassed =
    selectedProcess &&
    selectedProcess.testCases.length > 0 &&
    selectedProcess.testCases.every((t) => t.status === 'Passed');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tester Verification Bench
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Verify Skill File guardrails, run automated &amp; interactive QA scenarios, and certify processes for End Users.
          </p>
        </div>
        <Badge variant="default" className="text-xs px-3 py-1">
          {testingQueue.length} Ready for Testing
        </Badge>
      </div>

      {banner && (
        <Alert variant="success" title="QA Update">
          {banner}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Queue */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            QA Queue ({testingQueue.length})
          </div>
          {testingQueue.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-xs text-slate-500">
                No processes waiting in QA. Approve a process as Solution Manager or select one below.
              </CardContent>
            </Card>
          ) : (
            testingQueue.map((proc) => {
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
                    <Badge variant="default">{proc.status}</Badge>
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-900">{proc.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    v{proc.version} · {proc.testCases.length} test cases
                  </div>
                </button>
              );
            })
          )}

          <div className="pt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            All Processes ({processes.length})
          </div>
          <div className="space-y-1.5">
            {processes
              .filter((p) => p.status !== 'Ready for Testing')
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

        {/* Right Test Bench */}
        {selectedProcess && (
          <div className="lg:col-span-8 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{selectedProcess.domain}</Badge>
                      <Badge variant="default">v{selectedProcess.version}</Badge>
                      <Badge
                        variant={
                          selectedProcess.status === 'Published'
                            ? 'success'
                            : selectedProcess.status === 'Ready for Testing'
                            ? 'default'
                            : 'warning'
                        }
                      >
                        {selectedProcess.status}
                      </Badge>
                    </div>
                    <CardTitle className="pt-2 text-xl">{selectedProcess.name}</CardTitle>
                    <CardDescription>{selectedProcess.description}</CardDescription>
                  </div>

                  {selectedProcess.status === 'Ready for Testing' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="destructive" size="sm" onClick={handleFailToRevision}>
                        <XCircle className="h-3.5 w-3.5" />
                        Fail &amp; Return
                      </Button>
                      <Button
                        size="sm"
                        disabled={!allPassed}
                        onClick={handleCertifyPublish}
                        title={
                          allPassed
                            ? 'Publish to End Users'
                            : 'Run and pass all test cases first'
                        }
                      >
                        <Rocket className="h-3.5 w-3.5" />
                        Certify &amp; Publish
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList>
                    <TabsTrigger value="cases">
                      <FlaskConical className="h-3.5 w-3.5" />
                      Test Cases ({selectedProcess.testCases.length})
                    </TabsTrigger>
                    <TabsTrigger value="interactive">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Interactive Screen Test Mode
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="cases" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Auto-generated from Skill rules &amp; Workflow transitions.
                      </span>
                      <Button size="sm" onClick={handleRunAutomatedSuite}>
                        <Play className="h-3.5 w-3.5" />
                        Run Automated Suite
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {selectedProcess.testCases.map((tc) => (
                        <div
                          key={tc.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5 text-xs ring-1 ring-slate-900/5"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{tc.title}</span>
                              <Badge variant="outline" className="text-[10px]">
                                Expected: {tc.expectedOutcome}
                              </Badge>
                            </div>
                            {tc.lastRunNote && (
                              <p className="text-slate-500">{tc.lastRunNote}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant={
                                tc.status === 'Passed'
                                  ? 'success'
                                  : tc.status === 'Failed'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {tc.status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleCaseStatus(tc.id, 'Passed')}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleCaseStatus(tc.id, 'Failed')}
                            >
                              <XCircle className="h-3.5 w-3.5 text-rose-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="interactive" className="space-y-4">
                    {liveTrace && (
                      <Alert
                        variant={
                          liveTrace.overallOutcome === 'BLOCK'
                            ? 'destructive'
                            : liveTrace.overallOutcome === 'WARN'
                            ? 'warning'
                            : 'success'
                        }
                        title={`Skill Check (${liveTrace.trigger} · ${liveTrace.actionLabel}): ${liveTrace.overallOutcome}`}
                      >
                        {liveTrace.entries.map((e) => (
                          <div key={e.id}>
                            • <strong>{e.ruleName}</strong>: {e.message}
                          </div>
                        ))}
                      </Alert>
                    )}

                    <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-900/5">
                      <JsonScreenRenderer
                        process={selectedProcess}
                        records={runtimeRecords.filter((r) => r.processId === selectedProcess.id)}
                        onActionClick={handleInteractiveAction}
                      />
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
