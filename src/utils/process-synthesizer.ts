import {
  ENTERPRISE_MASTER_TABLES,
  SEEDED_ENTERPRISE_POLICIES,
} from '../data/mock-lookup-tables';
import type {
  ProcessDefinition,
  ScreenFieldSchema,
  SkillRule,
  TableSchema,
  WorkflowStage,
} from '../types/process';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  artifactsSummary?: string[];
  suggestedQuestions?: string[];
}

export interface SynthesisResult {
  reply: string;
  shouldAutoShowPreview: boolean;
  readinessPct: number;
  updatedProcess: ProcessDefinition;
  artifactsSummary: string[];
  suggestedQuestions?: string[];
}

function toSnakeCase(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildSkillMarkdown(
  name: string,
  rules: SkillRule[]
): string {
  const openRules = rules.filter((r) => r.trigger === 'onScreenOpen');
  const clickRules = rules.filter((r) => r.trigger === 'onButtonClick');
  return [
    `# Skill: ${name}`,
    '',
    '## On Screen Open',
    ...(openRules.length > 0
      ? openRules.map((r) => `- **${r.name}** (${r.outcomeOnMatch}): ${r.message}`)
      : ['- Standard session audit check.']),
    '',
    '## On Button Click',
    ...(clickRules.length > 0
      ? clickRules.map((r) => `- **${r.name}** (${r.outcomeOnMatch}): ${r.message}`)
      : ['- No blocking click rules configured.']),
  ].join('\n');
}

function injectEnterprisePolicies(
  domain: string,
  existingRules: SkillRule[]
): SkillRule[] {
  const result = [...existingRules];
  for (const pol of SEEDED_ENTERPRISE_POLICIES) {
    if (pol.domainScope === 'All' || pol.domainScope.toLowerCase() === domain.toLowerCase()) {
      const alreadyHas = result.some((r) => r.policyName === pol.name);
      if (!alreadyHas) {
        result.push({
          ...pol.injectedRule,
          id: `sk-pol-${pol.id}-${Date.now()}`,
          source: 'policy_injected',
          policyName: pol.name,
        });
      }
    }
  }
  return result;
}

export function synthesizeProcessFromPrompt(
  prompt: string,
  current: ProcessDefinition,
  turnCount: number
): SynthesisResult {
  const lower = prompt.toLowerCase();
  const next = structuredClone(current);
  next.updatedAt = new Date().toISOString();

  // Case 1: Broad initial prompt on an empty draft -> ask 1-2 clarifying questions (Readiness 45%)
  const isEmptyDraft = next.screenJson.fields.length === 0;
  const isSpecificEnough =
    lower.includes('field') ||
    lower.includes('rule') ||
    lower.includes('threshold') ||
    lower.includes('approval') ||
    lower.includes('expense') ||
    lower.includes('vendor') ||
    lower.includes('asset') ||
    turnCount >= 1;

  if (isEmptyDraft && !isSpecificEnough) {
    next.name = prompt.trim().slice(0, 48) || 'Custom ERP Process';
    next.screenJson.title = next.name;
    next.requirements.push({
      id: `req-${Date.now()}`,
      category: 'functionality',
      title: 'Initial Process Scope',
      description: prompt.trim(),
      required: true,
    });
    return {
      reply: `I've captured the initial scope for **${next.name}**. Before I generate the full Screen JSON and Skill File, tell me:\n1. What key fields should be on the form (e.g., employee, amount, department)?\n2. Any approval threshold or blocking rule?`,
      shouldAutoShowPreview: false,
      readinessPct: 45,
      updatedProcess: next,
      artifactsSummary: ['Captured Scope'],
      suggestedQuestions: [
        'Use fields: employee, department, amount, justification; block > $2,000 without justification',
        'Generate standard 2-step Manager Approval workflow',
      ],
    };
  }

  // Case 2: Preset or full generation when draft is empty
  if (isEmptyDraft) {
    let domain = 'Operations';
    let title = 'Custom Operations Request';
    let tableName = 'operations_requests';
    let leveragedTables: TableSchema[] = [ENTERPRISE_MASTER_TABLES[0], ENTERPRISE_MASTER_TABLES[1]];
    let fields: ScreenFieldSchema[] = [
      { name: 'title', label: 'Request Title', type: 'text', required: true, placeholder: 'Enter summary...' },
      { name: 'employee_name', label: 'Requested By', type: 'select', required: true, lookupTable: 'employees' },
      { name: 'department', label: 'Department', type: 'select', required: true, lookupTable: 'departments' },
      { name: 'amount', label: 'Estimated Amount (USD)', type: 'currency', required: true, placeholder: '0.00' },
      { name: 'justification', label: 'Business Justification', type: 'textarea', required: false },
    ];

    if (lower.includes('expense')) {
      domain = 'Finance';
      title = 'Employee Expense Claim & Reimbursement';
      tableName = 'expense_claims';
      fields = [
        { name: 'employee_name', label: 'Employee', type: 'select', required: true, lookupTable: 'employees' },
        { name: 'category', label: 'Expense Category', type: 'select', required: true, options: ['Travel', 'Software', 'Meals', 'Equipment'] },
        { name: 'amount', label: 'Claim Amount (USD)', type: 'currency', required: true, placeholder: '0.00' },
        { name: 'receipt_ref', label: 'Receipt Reference', type: 'text', required: true, placeholder: 'INV-...' },
        { name: 'justification', label: 'Business Justification', type: 'textarea', required: false },
      ];
    } else if (lower.includes('vendor')) {
      domain = 'Procurement';
      title = 'Vendor Onboarding & Risk Screening';
      tableName = 'vendor_onboardings';
      leveragedTables = [ENTERPRISE_MASTER_TABLES[2], ENTERPRISE_MASTER_TABLES[1]];
      fields = [
        { name: 'vendor_name', label: 'Vendor Legal Name', type: 'text', required: true, placeholder: 'e.g., NovaTech Corp' },
        { name: 'department', label: 'Sponsoring Department', type: 'select', required: true, lookupTable: 'departments' },
        { name: 'risk_tier', label: 'Initial Risk Tier', type: 'select', required: true, options: ['Low', 'Medium', 'High'] },
        { name: 'amount', label: 'Estimated Annual Contract (USD)', type: 'currency', required: true },
        { name: 'justification', label: 'Compliance Notes', type: 'textarea', required: false },
      ];
    } else if (lower.includes('asset') || lower.includes('it')) {
      domain = 'IT Operations';
      title = 'IT Asset Allocation & Access';
      tableName = 'it_asset_requests';
      fields = [
        { name: 'employee_name', label: 'Employee', type: 'select', required: true, lookupTable: 'employees' },
        { name: 'asset_type', label: 'Asset Type', type: 'select', required: true, options: ['Laptop', 'Monitor', 'Cloud Sandbox', 'Security Key'] },
        { name: 'priority', label: 'Priority', type: 'select', required: true, options: ['Normal', 'Urgent'] },
        { name: 'justification', label: 'Business Justification', type: 'textarea', required: true },
      ];
    }

    const newTable: TableSchema = {
      id: `tbl-${tableName}`,
      name: tableName,
      kind: 'new_created',
      description: `Transactional records for ${title}.`,
      columns: [
        { name: 'id', type: 'uuid', isPrimaryKey: true, required: true },
        ...fields.map((f) => ({
          name: f.name,
          type: (f.type === 'currency' ? 'currency' : f.lookupTable ? 'reference' : 'string') as
            | 'currency'
            | 'reference'
            | 'string',
          referencesTable: f.lookupTable,
          required: f.required,
        })),
        { name: 'stage_id', type: 'enum', required: true },
      ],
    };

    const workflow: WorkflowStage[] = [
      {
        id: 'stage-submitted',
        name: 'Submitted',
        actorRole: 'end_user',
        slaHours: 24,
        escalateToRole: 'solution_manager',
        description: 'End user submits the request.',
        transitions: [
          {
            actionId: 'submit_request',
            label: 'Submit Request',
            toStageId: 'stage-review',
            allowedRoles: ['end_user', 'principal_admin'],
            variant: 'default',
          },
        ],
      },
      {
        id: 'stage-review',
        name: 'Manager Review',
        actorRole: 'solution_manager',
        slaHours: 48,
        escalateToRole: 'principal_admin',
        description: 'Solution Manager reviews and approves.',
        transitions: [
          {
            actionId: 'approve_request',
            label: 'Approve',
            toStageId: 'stage-approved',
            allowedRoles: ['solution_manager', 'principal_admin'],
            variant: 'default',
          },
        ],
      },
      {
        id: 'stage-approved',
        name: 'Approved',
        actorRole: 'solution_manager',
        description: 'Completed and approved.',
        transitions: [],
      },
    ];

    const baseRules: SkillRule[] = [];
    if (fields.some((f) => f.name === 'amount')) {
      baseRules.push({
        id: `sk-amt-${Date.now()}`,
        name: 'Threshold: Justification Required > $2,000',
        trigger: 'onButtonClick',
        actionId: 'submit_request',
        field: 'amount',
        operator: 'gt',
        value: 2000,
        secondaryField: 'justification',
        secondaryOperator: 'empty',
        outcomeOnMatch: 'BLOCK',
        message: 'Requests above $2,000 require a business justification.',
        source: 'process',
      });
    }

    const finalRules = injectEnterprisePolicies(domain, baseRules);

    next.name = title;
    next.domain = domain;
    next.description = `AI-generated ${domain} process with dynamic Screen JSON, workflow stages, and Skill guardrails.`;
    next.tables = [...leveragedTables, newTable];
    next.workflow = workflow;
    next.requirements = [
      {
        id: `req-${Date.now()}-1`,
        category: 'field',
        title: `${fields.length} Form Fields & Master Lookups`,
        description: fields.map((f) => f.label).join(', '),
        required: true,
      },
      {
        id: `req-${Date.now()}-2`,
        category: 'workflow',
        title: 'Submitted -> Manager Review -> Approved',
        description: '24h / 48h SLA with escalation to Principal Admin.',
        required: true,
      },
    ];
    next.roleMatrix = fields.slice(0, 4).map((f) => ({
      fieldName: f.name,
      permissions: {
        principal_admin: 'Edit',
        solution_specialist: 'Edit',
        solution_manager: 'View',
        tester: 'Edit',
        end_user: 'Edit',
      },
    }));
    next.screenJson = {
      screenId: `scr-${toSnakeCase(title)}`,
      title,
      subtitle: `Operate ${title} with automated Skill File & Policy checks.`,
      kpis: [
        { id: 'kpi-all', label: 'Total Requests', metric: 'count_all', format: 'number' },
        { id: 'kpi-rev', label: 'Manager Review', metric: 'count_status', filterStatus: 'Manager Review', format: 'number' },
      ],
      formTitle: `New ${title}`,
      fields,
      primaryActions: [
        { id: 'submit_request', label: 'Submit Request', variant: 'default', triggerType: 'create_record' },
      ],
      tableTitle: 'Submitted Records',
      tableColumns: [
        ...fields.slice(0, 3).map((f) => ({
          key: f.name,
          label: f.label,
          type: (f.type === 'currency' ? 'currency' : 'text') as 'currency' | 'text',
        })),
        { key: 'stageName', label: 'Stage', type: 'status' },
      ],
      rowActions: [
        {
          id: 'approve_request',
          label: 'Approve',
          variant: 'default',
          triggerType: 'transition',
          allowedRoles: ['solution_manager', 'principal_admin', 'tester'],
        },
      ],
    };
    next.skillFile = {
      skillName: `${toSnakeCase(title)}-skill`,
      version: '1.0.0',
      rules: finalRules,
      markdown: buildSkillMarkdown(title, finalRules),
    };
    next.testCases = [
      {
        id: `tc-${Date.now()}-1`,
        title: 'Screen Open runs Enterprise Audit Policy',
        type: 'skill_open',
        expectedOutcome: 'PASS',
        status: 'Pending',
      },
      {
        id: `tc-${Date.now()}-2`,
        title: 'Submit validates required Skill rules',
        type: 'skill_action',
        expectedOutcome: 'BLOCK',
        status: 'Pending',
      },
    ];

    return {
      reply: `I've generated **${title}** with **${fields.length} fields**, **${next.tables.length} data tables** (${leveragedTables.length} existing + 1 new), a **${workflow.length}-stage workflow**, and **${finalRules.length} Skill rules** (including active Enterprise Policies).\n\nOpening the **Screen Preview** now—you can refine via Chat, Visual Annotation, Blueprint, or Raw JSON.`,
      shouldAutoShowPreview: true,
      readinessPct: 100,
      updatedProcess: next,
      artifactsSummary: [
        `+${fields.length} Fields`,
        `+${next.tables.length} Tables`,
        `+${workflow.length} Stages`,
        `+${finalRules.length} Skill Rules`,
      ],
    };
  }

  // Case 3: Iterative Refinement on an existing/generated process
  const summary: string[] = [];

  if (lower.includes('add field') || lower.includes('priority') || lower.includes('cost center')) {
    const newFieldLabel = lower.includes('priority')
      ? 'Priority'
      : lower.includes('cost center')
      ? 'Cost Center'
      : 'Reference Code';
    const newFieldName = toSnakeCase(newFieldLabel);
    if (!next.screenJson.fields.some((f) => f.name === newFieldName)) {
      next.screenJson.fields.push(
        newFieldName === 'priority'
          ? { name: 'priority', label: 'Priority', type: 'select', required: true, options: ['Low', 'Normal', 'High', 'Critical'] }
          : { name: newFieldName, label: newFieldLabel, type: 'text', required: false, placeholder: `Enter ${newFieldLabel}...` }
      );
      summary.push(`Added Field: ${newFieldLabel}`);
    }
  }

  if (lower.includes('block') || lower.includes('rule') || lower.includes('warn')) {
    const amountMatch = prompt.match(/\$?\s*(\d{3,6})/);
    const threshold = amountMatch ? Number(amountMatch[1]) : 2000;
    const isWarn = lower.includes('warn');
    const rule: SkillRule = {
      id: `sk-custom-${Date.now()}`,
      name: `Custom Rule: ${isWarn ? 'Warn' : 'Block'} > $${threshold}`,
      trigger: 'onButtonClick',
      actionId: next.screenJson.primaryActions[0]?.id ?? 'submit_request',
      field: 'amount',
      operator: 'gt',
      value: threshold,
      outcomeOnMatch: isWarn ? 'WARN' : 'BLOCK',
      message: `Custom rule triggered: Amount exceeds $${threshold.toLocaleString()}.`,
      source: 'process',
    };
    next.skillFile.rules.push(rule);
    next.skillFile.markdown = buildSkillMarkdown(next.name, next.skillFile.rules);
    summary.push(`Added Skill Rule (${rule.outcomeOnMatch})`);
  }

  if (summary.length === 0) {
    next.requirements.push({
      id: `req-ref-${Date.now()}`,
      category: 'functionality',
      title: 'Refinement Note',
      description: prompt.trim(),
      required: false,
    });
    summary.push('Updated Requirements');
  }

  return {
    reply: `Applied your update to **${next.name}**: ${summary.join(', ')}. Screen JSON, Blueprint, and Skill File are synced.`,
    shouldAutoShowPreview: true,
    readinessPct: 100,
    updatedProcess: next,
    artifactsSummary: summary,
  };
}
