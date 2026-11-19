import type { RoleId, UserPersona } from '../types/rbac';

export const DEMO_PASSWORD = 'password123*';

export const USER_PERSONAS: Record<RoleId, UserPersona> = {
  principal_admin: {
    id: 'usr-admin',
    username: 'principal_admin',
    displayName: 'Arjun Mehta',
    roleLabel: 'Principal Admin',
    title: 'VP of Enterprise Architecture',
    department: 'Platform Governance',
    avatarInitials: 'AM',
    description: 'Full unrestricted access across Control Tower, Studios, Approvals, Testing, and Runtime Apps.',
    landingPageTitle: 'Platform Control Tower',
  },
  solution_specialist: {
    id: 'usr-specialist',
    username: 'solution_specialist',
    displayName: 'Priya Nair',
    roleLabel: 'Solution Specialist',
    title: 'Lead ERP Process Architect',
    department: 'Business Solutions',
    avatarInitials: 'PN',
    description: 'Designs ERP processes via Chat, Visual Annotation, Blueprint, Screen JSON, and Skill Files.',
    landingPageTitle: 'Processes Hub',
  },
  solution_manager: {
    id: 'usr-manager',
    username: 'solution_manager',
    displayName: 'David Chen',
    roleLabel: 'Solution Manager',
    title: 'Director of Solution Delivery',
    department: 'Enterprise PMO',
    avatarInitials: 'DC',
    description: 'Reviews submitted processes, inspects compliance & diffs, and approves or requests changes.',
    landingPageTitle: 'Approvals Queue',
  },
  tester: {
    id: 'usr-tester',
    username: 'tester',
    displayName: 'Sofia Rodriguez',
    roleLabel: 'Tester',
    title: 'Senior QA & Skill Verification Lead',
    department: 'Quality Engineering',
    avatarInitials: 'SR',
    description: 'Runs automated & interactive Skill and Workflow tests before certifying processes for production.',
    landingPageTitle: 'Test Bench',
  },
  end_user: {
    id: 'usr-enduser',
    username: 'end_user',
    displayName: 'Liam Walker',
    roleLabel: 'End User',
    title: 'Operations Specialist',
    department: 'Operations',
    avatarInitials: 'LW',
    description: 'Operates published ERP applications with real-time Skill File guardrails and workflows.',
    landingPageTitle: 'Runtime Apps Launcher',
  },
};

export const PERSONA_LIST: UserPersona[] = [
  USER_PERSONAS.principal_admin,
  USER_PERSONAS.solution_specialist,
  USER_PERSONAS.solution_manager,
  USER_PERSONAS.tester,
  USER_PERSONAS.end_user,
];
