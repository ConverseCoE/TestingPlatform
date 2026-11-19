import type { EnterprisePolicy, TableSchema } from '../types/process';

export const ENTERPRISE_MASTER_TABLES: TableSchema[] = [
  {
    id: 'tbl-employees',
    name: 'employees',
    kind: 'existing_leveraged',
    description: 'Core HR employee directory with manager hierarchy and leave balances.',
    columns: [
      { name: 'employee_id', type: 'uuid', isPrimaryKey: true, required: true },
      { name: 'full_name', type: 'string', required: true },
      { name: 'department_id', type: 'reference', referencesTable: 'departments', required: true },
      { name: 'manager_name', type: 'string', required: true },
      { name: 'leave_balance_days', type: 'number', required: true },
    ],
  },
  {
    id: 'tbl-departments',
    name: 'departments',
    kind: 'existing_leveraged',
    description: 'Organizational cost centers and budget owners.',
    columns: [
      { name: 'department_id', type: 'uuid', isPrimaryKey: true, required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'cost_center_code', type: 'string', required: true },
      { name: 'annual_budget', type: 'currency', required: true },
    ],
  },
  {
    id: 'tbl-vendors',
    name: 'vendors',
    kind: 'existing_leveraged',
    description: 'Approved enterprise suppliers and risk tiers.',
    columns: [
      { name: 'vendor_id', type: 'uuid', isPrimaryKey: true, required: true },
      { name: 'vendor_name', type: 'string', required: true },
      { name: 'risk_tier', type: 'enum', required: true },
      { name: 'is_verified', type: 'boolean', required: true },
    ],
  },
  {
    id: 'tbl-students',
    name: 'students',
    kind: 'existing_leveraged',
    description: 'Enrolled student master records and fee standing.',
    columns: [
      { name: 'student_id', type: 'uuid', isPrimaryKey: true, required: true },
      { name: 'full_name', type: 'string', required: true },
      { name: 'program', type: 'string', required: true },
      { name: 'fee_clearance_status', type: 'enum', required: true },
    ],
  },
  {
    id: 'tbl-courses',
    name: 'courses',
    kind: 'existing_leveraged',
    description: 'Academic course catalog with seat capacity and prerequisites.',
    columns: [
      { name: 'course_id', type: 'uuid', isPrimaryKey: true, required: true },
      { name: 'course_code', type: 'string', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'available_seats', type: 'number', required: true },
    ],
  },
];

export const LOOKUP_OPTIONS: Record<string, string[]> = {
  employees: ['Liam Walker', 'Priya Nair', 'David Chen', 'Sofia Rodriguez', 'Maya Patel'],
  departments: ['Operations', 'Engineering', 'Finance', 'Human Resources', 'Academic Affairs'],
  vendors: ['CloudScale Systems', 'Apex Office Supplies', 'Vertex Security', 'Global Logistics Co.'],
  students: ['Aarav Sharma (STU-101)', 'Elena Rostova (STU-102)', 'Marcus Vance (STU-103)'],
  courses: ['CS-401 Agentic Systems', 'FIN-302 Enterprise Accounting', 'MGMT-210 Operations'],
};

export const SEEDED_ENTERPRISE_POLICIES: EnterprisePolicy[] = [
  {
    id: 'pol-high-value-justification',
    name: 'Enterprise Spend Justification Policy',
    domainScope: 'Procurement',
    description: 'Any spend exceeding $5,000 must include a written business justification before submission.',
    injectedRule: {
      name: 'Policy: Justification Required > $5,000',
      trigger: 'onButtonClick',
      actionId: 'submit_request',
      field: 'amount',
      operator: 'gt',
      value: 5000,
      secondaryField: 'justification',
      secondaryOperator: 'empty',
      outcomeOnMatch: 'BLOCK',
      message: 'Enterprise Spend Policy blocks requests over $5,000 without a business justification.',
    },
  },
  {
    id: 'pol-audit-transparency',
    name: 'Mandatory AI & Skill Audit Logging',
    domainScope: 'All',
    description: 'All published screens must log an onScreenOpen governance check for role transparency.',
    injectedRule: {
      name: 'Policy: Active Session Governance Check',
      trigger: 'onScreenOpen',
      operator: 'always_info',
      outcomeOnMatch: 'PASS',
      message: 'Enterprise Audit Policy active: screen session and role permissions verified.',
    },
  },
];
