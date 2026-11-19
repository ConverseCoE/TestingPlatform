import React, { useEffect, useRef, useState } from 'react';
import {
  AppWindow,
  ArrowLeftToLine,
  ArrowRightToLine,
  Bot,
  Check,
  CheckSquare,
  ChevronUp,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Wand2,
  Workflow,
  X,
} from 'lucide-react';
import { PERSONA_LIST } from '../../data/mock-users';
import { useAppStore } from '../../store/AppContext';
import { hasPermission, type RoleId } from '../../types/rbac';
import { Badge } from '../ui';
import { CommandPalette, type AppView } from './CommandPalette';
import { DemoStorylineBar } from './DemoStorylineBar';

interface AppShellProps {
  activeView: AppView;
  onNavigate: (view: AppView, processId?: string) => void;
  onSwitchRole: (role: RoleId) => void;
  children: React.ReactNode;
}

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
  visible: boolean;
  badge?: string;
}

export function AppShell({
  activeView,
  onNavigate,
  onSwitchRole,
  children,
}: AppShellProps) {
  const { currentUser, processes, logout, resetDemoData } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [storylineOpen, setStorylineOpen] = useState(false); // Default OFF
  const [commandOpen, setCommandOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [resetFeedback, setResetFeedback] = useState(false);

  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    setSidebarCollapsed(true);
  }, [activeView]);

  if (!currentUser) return null;

  const role = currentUser.username;
  const pendingApprovalsCount = processes.filter((p) => p.status === 'Pending Approval').length;
  const readyForTestCount = processes.filter((p) => p.status === 'Ready for Testing').length;
  const publishedCount = processes.filter((p) => p.status === 'Published').length;

  const rawPrimaryNav: NavItem[] = [
    {
      id: 'control_tower',
      label: 'Control Tower',
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
      visible: hasPermission(role, 'view_control_tower'),
    },
    {
      id: 'processes_hub',
      label: 'Processes Hub',
      icon: <Workflow className="h-4 w-4 shrink-0" />,
      visible: hasPermission(role, 'design_process'),
    },
    {
      id: 'process_studio',
      label: 'Process Studio',
      icon: <Wand2 className="h-4 w-4 shrink-0" />,
      visible: hasPermission(role, 'design_process'),
    },
    {
      id: 'approvals_queue',
      label: 'Approvals Queue',
      icon: <CheckSquare className="h-4 w-4 shrink-0" />,
      visible: hasPermission(role, 'approve_process'),
      badge: pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : undefined,
    },
    {
      id: 'test_bench',
      label: 'Test Bench',
      icon: <FlaskConical className="h-4 w-4 shrink-0" />,
      visible: hasPermission(role, 'test_process'),
      badge: readyForTestCount > 0 ? String(readyForTestCount) : undefined,
    },
    {
      id: 'runtime_apps',
      label: 'Runtime Apps',
      icon: <AppWindow className="h-4 w-4 shrink-0" />,
      visible: hasPermission(role, 'run_published_app'),
      badge: publishedCount > 0 ? String(publishedCount) : undefined,
    },
  ];
  const primaryNav = rawPrimaryNav.filter((item) => item.visible);

  const roadmapNav: NavItem[] = [
    {
      id: 'roadmap_policy',
      label: 'Policy Studio',
      icon: <Shield className="h-4 w-4 shrink-0" />,
      visible: true,
      badge: 'Planned',
    },
    {
      id: 'roadmap_threads',
      label: 'Threads',
      icon: <MessageSquare className="h-4 w-4 shrink-0" />,
      visible: true,
      badge: 'Planned',
    },
    {
      id: 'roadmap_agentify',
      label: 'User Agentify',
      icon: <Bot className="h-4 w-4 shrink-0" />,
      visible: true,
      badge: 'Planned',
    },
  ];

  const handleReset = () => {
    resetDemoData();
    setResetFeedback(true);
    setTimeout(() => setResetFeedback(false), 1800);
  };

  const renderSidebarContent = (isCollapsed: boolean) => (
    <div className="flex h-full flex-col justify-between bg-white px-3 py-4">
      <div className="space-y-6">
        {/* Brand */}
        <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-tight text-slate-900">NutbaAI</div>
              <div className="text-[11px] font-medium text-slate-500">Agentic ERP</div>
            </div>
          )}
        </div>

        {/* Active Modules */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </div>
          )}
          {primaryNav.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={isCollapsed ? item.label : undefined}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarCollapsed(true);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center ${
                  isCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                } rounded-xl py-2 text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600/10'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  {item.icon}
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </span>
                {!isCollapsed && item.badge && (
                  <Badge variant={active ? 'default' : 'secondary'} className="px-2 py-0 text-[11px]">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Roadmap Modules */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Roadmap
            </div>
          )}
          {roadmapNav.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={isCollapsed ? `${item.label} (Planned)` : undefined}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarCollapsed(true);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center ${
                  isCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                } rounded-xl py-2 text-sm font-medium transition-all ${
                  active
                    ? 'bg-violet-50 text-violet-700 shadow-sm ring-1 ring-violet-600/10'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  {item.icon}
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </span>
                {!isCollapsed && (
                  <Badge variant="violet" className="px-2 py-0 text-[10px]">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Controls: Ctrl+K Search Bar + User Menu Trigger */}
      <div className="space-y-2.5 pt-3 border-t border-slate-100">
        {/* Ctrl+K Search Bar */}
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          title="Quick Jump (Ctrl+K)"
          className={`flex w-full items-center ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-3'
          } rounded-xl bg-slate-100/80 py-2 text-xs text-slate-500 ring-1 ring-slate-900/5 hover:bg-slate-100 hover:text-slate-800 transition-colors`}
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 shrink-0" />
            {!isCollapsed && <span>Quick Jump...</span>}
          </span>
          {!isCollapsed && (
            <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 shadow-sm">
              Ctrl+K
            </kbd>
          )}
        </button>

        {/* User Name Card + Popover */}
        <div ref={userMenuRef} className="relative">
          {userMenuOpen && (
            <div
              className={`absolute bottom-full mb-2 z-40 w-64 rounded-2xl bg-white p-2 shadow-elevated ring-1 ring-slate-900/10 space-y-2 ${
                isCollapsed ? 'left-0' : 'left-0 right-0 w-full min-w-[236px]'
              }`}
            >
              {/* Change Role */}
              <div className="px-2 pt-1">
                <div className="pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Change Role
                </div>
                <div className="space-y-0.5">
                  {PERSONA_LIST.map((p) => {
                    const active = p.username === currentUser.username;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSwitchRole(p.username);
                          setUserMenuOpen(false);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{p.roleLabel}</span>
                        {active && <Check className="h-3.5 w-3.5 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-1.5 space-y-0.5">
                {/* Demo Storyline Toggle */}
                <button
                  type="button"
                  onClick={() => setStorylineOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    Demo Storyline
                  </span>
                  <Badge variant={storylineOpen ? 'default' : 'secondary'} className="text-[10px]">
                    {storylineOpen ? 'On' : 'Off'}
                  </Badge>
                </button>

                {/* Reset Demo Data */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                  <span>{resetFeedback ? 'Demo Data Reset!' : 'Reset Demo Data'}</span>
                </button>

                {/* Sign Out */}
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            title={isCollapsed ? `${currentUser.displayName} (${currentUser.roleLabel})` : undefined}
            className={`flex w-full items-center ${
              isCollapsed ? 'justify-center p-2' : 'justify-between p-2.5'
            } rounded-xl bg-slate-50 ring-1 ring-slate-900/5 hover:bg-slate-100/80 transition-colors text-left`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {currentUser.avatarInitials}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-slate-900">
                    {currentUser.displayName}
                  </div>
                  <div className="truncate text-[11px] text-slate-500">
                    {currentUser.roleLabel}
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <ChevronUp
                className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                  userMenuOpen ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#e8edf2] flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 shadow-card ring-1 ring-slate-900/5 z-20 transition-all duration-200 ${
          sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
        }`}
      >
        {renderSidebarContent(sidebarCollapsed)}

        {/* Edge Collapse / Expand Button (matching reference placement) */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute top-14 -right-3.5 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-md ring-2 ring-white hover:bg-blue-600 transition-colors"
        >
          {sidebarCollapsed ? (
            <ArrowRightToLine className="h-3.5 w-3.5" />
          ) : (
            <ArrowLeftToLine className="h-3.5 w-3.5" />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 max-w-[80vw] shadow-elevated">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            {renderSidebarContent(false)}
          </div>
        </div>
      )}

      {/* Main Content Column (Full Viewport Height, No Top Header Row) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        }`}
      >
        {/* Mobile Menu Trigger (only on small screens since top header is removed) */}
        <div className="lg:hidden flex items-center justify-between px-4 pt-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-card ring-1 ring-slate-900/5"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
            <span>Menu · {currentUser.roleLabel}</span>
          </button>
        </div>

        {/* Optional Demo Storyline (Default OFF, toggled from User Menu) */}
        <DemoStorylineBar
          open={storylineOpen}
          currentRole={currentUser.username}
          onSelectStep={onSwitchRole}
          onClose={() => setStorylineOpen(false)}
        />

        {/* Full-Height Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7">{children}</main>
      </div>

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={onNavigate}
        onSwitchRole={onSwitchRole}
      />
    </div>
  );
}
