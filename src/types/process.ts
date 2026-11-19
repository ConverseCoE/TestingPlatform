import type { RoleId } from './rbac';

export type ProcessLifecycleStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Needs Revision'
  | 'Ready for Testing'
  | 'Published';

export type PolicyComplianceStatus = 'Compliant' | 'Warning' | 'Conflict';

export interface TableColumnSchema {
  name: string;
  type: 'uuid' | 'string' | 'number' | 'currency' | 'date' | 'boolean' | 'enum' | 'reference';
  required?: boolean;
  isPrimaryKey?: boolean;
  referencesTable?: string;
  description?: string;
}

export interface TableSchema {
  id: string;
  name: string;
  kind: 'existing_leveraged' | 'new_created';
  description: string;
  columns: TableColumnSchema[];
}

export interface ProcessRequirementItem {
  id: string;
  category: 'field' | 'workflow' | 'rule' | 'functionality';
  title: string;
  description: string;
  required?: boolean;
}

export interface WorkflowTransition {
  actionId: string;
  label: string;
  toStageId: string;
  allowedRoles: RoleId[];
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export interface WorkflowStage {
  id: string;
  name: string;
  actorRole: RoleId;
  slaHours?: number;
  escalateToRole?: RoleId;
  description: string;
  transitions: WorkflowTransition[];
}

export type FieldAccessMode = 'Edit' | 'View' | 'Hide';

export interface RoleFieldPermission {
  fieldName: string;
  permissions: Record<RoleId, FieldAccessMode>;
}

export interface ScreenFieldSchema {
  name: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'select' | 'date' | 'textarea' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  lookupTable?: string;
  defaultValue?: string | number | boolean;
}

export interface ScreenKpiSchema {
  id: string;
  label: string;
  metric: 'count_all' | 'count_status' | 'sum_field';
  filterStatus?: string;
  field?: string;
  format?: 'number' | 'currency';
}

export interface ScreenTableColumn {
  key: string;
  label: string;
  type?: 'text' | 'currency' | 'date' | 'status';
}

export interface ScreenActionSchema {
  id: string;
  label: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  triggerType: 'create_record' | 'transition';
  allowedRoles?: RoleId[];
}

export interface ScreenJSON {
  screenId: string;
  title: string;
  subtitle: string;
  kpis: ScreenKpiSchema[];
  formTitle: string;
  fields: ScreenFieldSchema[];
  primaryActions: ScreenActionSchema[];
  tableTitle: string;
  tableColumns: ScreenTableColumn[];
  rowActions: ScreenActionSchema[];
}

export type SkillTrigger = 'onScreenOpen' | 'onButtonClick';
export type SkillOutcome = 'PASS' | 'WARN' | 'BLOCK';
export type SkillOperator =
  | 'gt'
  | 'lt'
  | 'eq'
  | 'neq'
  | 'empty'
  | 'not_empty'
  | 'role_not_in'
  | 'always_info';

export interface SkillRule {
  id: string;
  name: string;
  trigger: SkillTrigger;
  actionId?: string;
  field?: string;
  operator: SkillOperator;
  value?: string | number | string[];
  secondaryField?: string;
  secondaryOperator?: 'empty' | 'not_empty';
  outcomeOnMatch: SkillOutcome;
  message: string;
  source: 'process' | 'policy_injected';
  policyName?: string;
}

export interface SkillFile {
  skillName: string;
  version: string;
  markdown: string;
  rules: SkillRule[];
}

export interface TestCase {
  id: string;
  title: string;
  type: 'skill_open' | 'skill_action' | 'workflow';
  expectedOutcome: SkillOutcome | 'TRANSITION';
  status: 'Pending' | 'Passed' | 'Failed';
  lastRunNote?: string;
}

export interface ProcessVersionSnapshot {
  version: number;
  timestamp: string;
  summary: string;
  author: string;
  screenJson: ScreenJSON;
  skillFile: SkillFile;
  workflow: WorkflowStage[];
}

export interface ReviewComment {
  id: string;
  author: string;
  role: RoleId;
  decision: 'Approved' | 'Changes Requested';
  comment: string;
  timestamp: string;
}

export interface EnterprisePolicy {
  id: string;
  name: string;
  domainScope: 'All' | 'Procurement' | 'HR' | 'Education' | 'Finance';
  description: string;
  injectedRule: Omit<SkillRule, 'id' | 'source' | 'policyName'>;
}

export interface ProcessDefinition {
  id: string;
  name: string;
  domain: string;
  description: string;
  version: number;
  status: ProcessLifecycleStatus;
  complianceStatus: PolicyComplianceStatus;
  createdBy: string;
  updatedAt: string;
  requirements: ProcessRequirementItem[];
  tables: TableSchema[];
  workflow: WorkflowStage[];
  roleMatrix: RoleFieldPermission[];
  screenJson: ScreenJSON;
  skillFile: SkillFile;
  testCases: TestCase[];
  reviews: ReviewComment[];
  history: ProcessVersionSnapshot[];
}
