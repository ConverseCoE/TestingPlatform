import type { ProcessDefinition, SkillOutcome, SkillRule, SkillTrigger } from '../types/process';
import type { RoleId } from '../types/rbac';
import type { SkillExecutionEntry, SkillExecutionLog } from '../types/runtime';

function checkSecondary(
  rule: SkillRule,
  values: Record<string, string | number | boolean>
): boolean {
  if (!rule.secondaryField || !rule.secondaryOperator) return true;
  const val = values[rule.secondaryField];
  const isEmpty = val === undefined || val === null || String(val).trim() === '';
  return rule.secondaryOperator === 'empty' ? isEmpty : !isEmpty;
}

function matchesRule(
  rule: SkillRule,
  actorRole: RoleId,
  values: Record<string, string | number | boolean>
): boolean {
  if (rule.operator === 'always_info') return true;
  if (rule.operator === 'role_not_in' && Array.isArray(rule.value)) {
    return !rule.value.includes(actorRole);
  }

  const raw = rule.field ? values[rule.field] : undefined;
  const num = Number(raw ?? 0);
  const str = String(raw ?? '').trim();

  let primaryMatch = false;
  switch (rule.operator) {
    case 'gt':
      primaryMatch = !Number.isNaN(num) && num > Number(rule.value ?? 0);
      break;
    case 'lt':
      primaryMatch = !Number.isNaN(num) && num < Number(rule.value ?? 0);
      break;
    case 'eq':
      primaryMatch = str === String(rule.value ?? '');
      break;
    case 'neq':
      primaryMatch = str !== String(rule.value ?? '');
      break;
    case 'empty':
      primaryMatch = str === '';
      break;
    case 'not_empty':
      primaryMatch = str !== '';
      break;
    default:
      primaryMatch = false;
  }

  return primaryMatch && checkSecondary(rule, values);
}

export function evaluateSkillRules(params: {
  process: ProcessDefinition;
  trigger: SkillTrigger;
  actionId?: string;
  actionLabel: string;
  actorRole: RoleId;
  values: Record<string, string | number | boolean>;
}): SkillExecutionLog {
  const { process, trigger, actionId, actionLabel, actorRole, values } = params;

  const candidateRules = process.skillFile.rules.filter((r) => {
    if (r.trigger !== trigger) return false;
    if (trigger === 'onButtonClick' && r.actionId && actionId && r.actionId !== actionId) {
      return false;
    }
    return true;
  });

  const entries: SkillExecutionEntry[] = candidateRules.map((rule) => {
    const matched = matchesRule(rule, actorRole, values);
    const outcome: SkillOutcome = matched ? rule.outcomeOnMatch : 'PASS';
    return {
      id: `exec-${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      outcome,
      message: matched
        ? rule.message
        : `Passed: condition not violated (${rule.name}).`,
      source: rule.source,
      policyName: rule.policyName,
    };
  });

  let overallOutcome: SkillOutcome = 'PASS';
  if (entries.some((e) => e.outcome === 'BLOCK')) {
    overallOutcome = 'BLOCK';
  } else if (entries.some((e) => e.outcome === 'WARN')) {
    overallOutcome = 'WARN';
  }

  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    processId: process.id,
    processName: process.name,
    trigger,
    actionLabel,
    actorRole,
    timestamp: new Date().toISOString(),
    overallOutcome,
    entries,
  };
}
