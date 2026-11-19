import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AppWindow,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import type { ProcessDefinition, ScreenActionSchema } from '../../types/process';
import type { RuntimeRecord, SkillExecutionLog } from '../../types/runtime';
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
} from '../ui';

interface RuntimeAppsViewProps {
  initialProcessId?: string;
}

export function RuntimeAppsView({ initialProcessId }: RuntimeAppsViewProps) {
  const {
    processes,
    runtimeRecords,
    skillLogs,
    currentUser,
    addRuntimeRecord,
    updateRuntimeRecordStage,
    appendSkillLog,
    appendAuditEntry,
  } = useAppStore();

  const publishedApps = useMemo(
    () => processes.filter((p) => p.status === 'Published'),
    [processes]
  );

  const [activeAppId, setActiveAppId] = useState<string | null>(() => {
    if (initialProcessId && publishedApps.some((p) => p.id === initialProcessId)) {
      return initialProcessId;
    }
    return null;
  });

  const [traceDrawerOpen, setTraceDrawerOpen] = useState(false);
  const [pulseTrace, setPulseTrace] = useState(false);
  const [latestAlert, setLatestAlert] = useState<SkillExecutionLog | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeApp: ProcessDefinition | undefined = publishedApps.find(
    (p) => p.id === activeAppId
  );

  // Trigger onScreenOpen Skill evaluation whenever an End User opens an app
  useEffect(() => {
    if (!activeApp) return;
    const log = evaluateSkillRules({
      process: activeApp,
      trigger: 'onScreenOpen',
      actionLabel: `Open ${activeApp.name}`,
      actorRole: currentUser?.username ?? 'end_user',
      values: {},
    });
    setLatestAlert(log);
    appendSkillLog(log);
    if (currentUser) {
      appendAuditEntry({
        actorName: currentUser.displayName,
        actorRole: currentUser.username,
        category: 'RUNTIME_SKILL',
        processId: activeApp.id,
        processName: activeApp.name,
        summary: `onScreenOpen Skill Check: ${log.overallOutcome}`,
      });
    }
  }, [activeApp?.id]);

  const handleActionClick = (
    action: ScreenActionSchema,
    formValues: Record<string, string | number | boolean>,
    targetRecord?: RuntimeRecord
  ) => {
    if (!activeApp) return;

    const log = evaluateSkillRules({
      process: activeApp,
      trigger: 'onButtonClick',
      actionId: action.id,
      actionLabel: action.label,
      actorRole: currentUser?.username ?? 'end_user',
      values: formValues,
    });

    setLatestAlert(log);
    appendSkillLog(log);

    if (log.overallOutcome === 'BLOCK' || log.overallOutcome === 'WARN') {
      setPulseTrace(true);
      setTimeout(() => setPulseTrace(false), 2500);
    }

    if (currentUser) {
      appendAuditEntry({
        actorName: currentUser.displayName,
        actorRole: currentUser.username,
        category: 'RUNTIME_SKILL',
        processId: activeApp.id,
        processName: activeApp.name,
        summary: `onButtonClick (${action.label}): ${log.overallOutcome}`,
        detail: log.entries.map((e) => e.message).join(' | '),
      });
    }

    if (log.overallOutcome === 'BLOCK') {
      setSuccessMsg(null);
      return;
    }

    // Commit state change on PASS or WARN
    if (action.triggerType === 'create_record') {
      const nextStage = activeApp.workflow[1] ?? activeApp.workflow[0];
      const newRec: RuntimeRecord = {
        id: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
        processId: activeApp.id,
        stageId: nextStage?.id ?? 'stage-submitted',
        stageName: nextStage?.name ?? 'Submitted',
        createdBy: currentUser?.displayName ?? 'End User',
        createdAt: new Date().toISOString(),
        data: formValues,
      };
      addRuntimeRecord(newRec);
      setSuccessMsg(`Created ${newRec.id} (${newRec.stageName}).`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } else if (action.triggerType === 'transition' && targetRecord) {
      const stage = activeApp.workflow.find((s) => s.id === targetRecord.stageId);
      const transition = stage?.transitions.find((t) => t.actionId === action.id);
      const nextStage = transition
        ? activeApp.workflow.find((s) => s.id === transition.toStageId)
        : undefined;
      if (nextStage) {
        updateRuntimeRecordStage(targetRecord.id, nextStage.id, nextStage.name);
        setSuccessMsg(`${targetRecord.id} transitioned to "${nextStage.name}".`);
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    }
  };

  // Launcher View (Mobile-Friendly Grid)
  if (!activeApp) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Runtime Apps Launcher
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Launch published ERP applications governed by real-time Skill File &amp; Policy checks.
            </p>
          </div>
          <Badge variant="success" className="px-3 py-1">
            {publishedApps.length} Published Apps
          </Badge>
        </div>

        {publishedApps.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-2">
              <AppWindow className="mx-auto h-8 w-8 text-slate-300" />
              <div className="text-sm font-semibold text-slate-800">No Published Apps Yet</div>
              <p className="text-xs text-slate-500">
                Certify &amp; Publish a process from the Tester Verification Bench to run it here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {publishedApps.map((app) => {
              const count = runtimeRecords.filter((r) => r.processId === app.id).length;
              return (
                <Card
                  key={app.id}
                  className="flex flex-col justify-between transition-all hover:shadow-card-hover"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary">{app.domain}</Badge>
                      <Badge variant="success">
                        <ShieldCheck className="h-3 w-3" />
                        Live v{app.version}
                      </Badge>
                    </div>
                    <CardTitle className="pt-2">{app.name}</CardTitle>
                    <CardDescription>{app.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500 tabular-nums">
                      {count} active records
                    </span>
                    <Button size="sm" onClick={() => setActiveAppId(app.id)}>
                      Open App
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Active App Runtime View (Mobile-Friendly + Skill Trace)
  const appRecords = runtimeRecords.filter((r) => r.processId === activeApp.id);
  const appSkillLogs = skillLogs.filter((l) => l.processId === activeApp.id);

  return (
    <div className="space-y-4">
      {/* Top Runtime Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 shadow-card ring-1 ring-slate-900/5">
        <Button variant="ghost" size="sm" onClick={() => setActiveAppId(null)}>
          <ArrowLeft className="h-4 w-4" />
          All Apps
        </Button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={traceDrawerOpen ? 'default' : 'outline'}
            onClick={() => setTraceDrawerOpen((prev) => !prev)}
            className={pulseTrace ? 'ring-2 ring-rose-500 animate-pulse' : ''}
          >
            <Activity className="h-3.5 w-3.5" />
            Skill Execution Trace ({appSkillLogs.length})
          </Button>
        </div>
      </div>

      {/* Instant "Skill Rule Fired" Feedback Banner */}
      {latestAlert && (
        <Alert
          variant={
            latestAlert.overallOutcome === 'BLOCK'
              ? 'destructive'
              : latestAlert.overallOutcome === 'WARN'
              ? 'warning'
              : 'info'
          }
          title={`Skill Check (${latestAlert.trigger} · ${latestAlert.actionLabel}): ${latestAlert.overallOutcome}`}
        >
          <div className="space-y-0.5">
            {latestAlert.entries.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center gap-1.5">
                {e.outcome === 'BLOCK' ? (
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>
                  <strong>{e.ruleName}:</strong> {e.message}
                </span>
                {e.policyName && (
                  <Badge variant="violet" className="text-[10px] py-0">
                    Policy: {e.policyName}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Alert>
      )}

      {successMsg && (
        <Alert variant="success" title="Action Committed">
          {successMsg}
        </Alert>
      )}

      {/* Collapsible Skill Execution Trace Panel */}
      {traceDrawerOpen && (
        <Card className="bg-slate-900 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              Live Skill Execution Trace ({activeApp.skillFile.skillName})
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-56 overflow-y-auto space-y-2">
            {appSkillLogs.length === 0 ? (
              <div className="text-xs text-slate-400">No Skill evaluations logged yet.</div>
            ) : (
              appSkillLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg bg-slate-800/80 p-2.5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white">
                      [{log.trigger}] {log.actionLabel}
                    </span>
                    <Badge
                      variant={
                        log.overallOutcome === 'BLOCK'
                          ? 'destructive'
                          : log.overallOutcome === 'WARN'
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {log.overallOutcome}
                    </Badge>
                  </div>
                  {log.entries.map((e) => (
                    <div key={e.id} className="text-slate-300">
                      • {e.ruleName} → {e.outcome}: {e.message}
                    </div>
                  ))}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Dynamic JSON-Driven Screen */}
      <JsonScreenRenderer
        process={activeApp}
        records={appRecords}
        onActionClick={handleActionClick}
      />
    </div>
  );
}
