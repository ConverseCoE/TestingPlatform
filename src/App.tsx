import { useEffect, useState } from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { AppShell } from './components/layout/AppShell';
import type { AppView } from './components/layout/CommandPalette';
import { ApprovalsQueueView } from './components/lifecycle/ApprovalsQueueView';
import { TestBenchView } from './components/lifecycle/TestBenchView';
import { ProcessStudioView } from './components/process-studio/ProcessStudioView';
import { ControlTowerView } from './components/views/ControlTowerView';
import { ProcessesHubView } from './components/views/ProcessesHubView';
import { RoleLandingPlaceholder } from './components/views/RoleLandingPlaceholder';
import { RuntimeAppsView } from './components/views/RuntimeAppsView';
import { AppProvider, useAppStore } from './store/AppContext';
import type { RoleId } from './types/rbac';

function getLandingViewForRole(role: RoleId): AppView {
  switch (role) {
    case 'principal_admin':
      return 'control_tower';
    case 'solution_specialist':
      return 'processes_hub';
    case 'solution_manager':
      return 'approvals_queue';
    case 'tester':
      return 'test_bench';
    case 'end_user':
      return 'runtime_apps';
  }
}

function PlatformRouter() {
  const { currentUser, switchRole } = useAppStore();
  const [activeView, setActiveView] = useState<AppView>('processes_hub');
  const [selectedProcessId, setSelectedProcessId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (currentUser) {
      setActiveView(getLandingViewForRole(currentUser.username));
    }
  }, [currentUser?.username]);

  if (!currentUser) {
    return <LoginPage />;
  }

  const handleNavigate = (view: AppView, processId?: string) => {
    setActiveView(view);
    if (processId) setSelectedProcessId(processId);
  };

  const handleSwitchRole = (role: RoleId) => {
    switchRole(role);
    setActiveView(getLandingViewForRole(role));
  };

  const renderView = () => {
    switch (activeView) {
      case 'control_tower':
        return <ControlTowerView onNavigate={handleNavigate} />;
      case 'processes_hub':
        return (
          <ProcessesHubView
            onOpenProcess={(id) => handleNavigate('process_studio', id)}
            onCreateNewProcess={() => handleNavigate('process_studio', 'new')}
          />
        );
      case 'process_studio':
        return (
          <ProcessStudioView
            processId={selectedProcessId}
            onBackToHub={() => handleNavigate('processes_hub')}
          />
        );
      case 'approvals_queue':
        return <ApprovalsQueueView initialProcessId={selectedProcessId} />;
      case 'test_bench':
        return <TestBenchView initialProcessId={selectedProcessId} />;
      case 'runtime_apps':
        return <RuntimeAppsView initialProcessId={selectedProcessId} />;
      case 'roadmap_policy':
        return (
          <RoleLandingPlaceholder
            title="Policy Studio"
            phaseLabel="Future Phase"
            description="Enterprise-wide AI & ERP governance rules that auto-inject into generated Skill Files."
            isRoadmap
          />
        );
      case 'roadmap_threads':
        return (
          <RoleLandingPlaceholder
            title="Threads"
            phaseLabel="Future Phase"
            description="Teams-like enterprise messaging hub with process-linked discussions and @agent mentions."
            isRoadmap
          />
        );
      case 'roadmap_agentify':
        return (
          <RoleLandingPlaceholder
            title="User Agentify"
            phaseLabel="Future Phase"
            description="Personal assistant agents and user-impersonating Agent-First Action digital twins."
            isRoadmap
          />
        );
    }
  };

  return (
    <AppShell
      activeView={activeView}
      onNavigate={handleNavigate}
      onSwitchRole={handleSwitchRole}
    >
      {renderView()}
    </AppShell>
  );
}

export function App() {
  return (
    <AppProvider>
      <PlatformRouter />
    </AppProvider>
  );
}

export default App;
