import type { RoleId } from './rbac';
import type { SkillOutcome, SkillTrigger } from './process';

export interface RuntimeRecord {
  id: string;
  processId: string;
  stageId: string;
  stageName: string;
  createdBy: string;
  createdAt: string;
  data: Record<string, string | number | boolean>;
}

export interface SkillExecutionEntry {
  id: string;
  ruleId: string;
  ruleName: string;
  outcome: SkillOutcome;
  message: string;
  source: 'process' | 'policy_injected';
  policyName?: string;
}

export interface SkillExecutionLog {
  id: string;
  processId: string;
  processName: string;
  trigger: SkillTrigger;
  actionLabel: string;
  actorRole: RoleId;
  timestamp: string;
  overallOutcome: SkillOutcome;
  entries: SkillExecutionEntry[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: RoleId;
  category: 'AI_GENERATION' | 'EDIT' | 'APPROVAL' | 'TEST' | 'RUNTIME_SKILL' | 'SYSTEM';
  processId?: string;
  processName?: string;
  summary: string;
  detail?: string;
}
