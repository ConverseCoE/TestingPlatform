export type RoleId =
  | 'principal_admin'
  | 'solution_specialist'
  | 'solution_manager'
  | 'tester'
  | 'end_user';

export interface UserPersona {
  id: string;
  username: RoleId;
  displayName: string;
  roleLabel: string;
  title: string;
  department: string;
  avatarInitials: string;
  description: string;
  landingPageTitle: string;
}

export type Permission =
  | 'view_control_tower'
  | 'design_process'
  | 'submit_process'
  | 'approve_process'
  | 'test_process'
  | 'publish_process'
  | 'run_published_app';

export const ROLE_PERMISSIONS: Record<RoleId, Permission[]> = {
  principal_admin: [
    'view_control_tower',
    'design_process',
    'submit_process',
    'approve_process',
    'test_process',
    'publish_process',
    'run_published_app',
  ],
  solution_specialist: ['design_process', 'submit_process', 'run_published_app'],
  solution_manager: ['approve_process', 'run_published_app'],
  tester: ['test_process', 'publish_process', 'run_published_app'],
  end_user: ['run_published_app'],
};

export function hasPermission(role: RoleId, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
