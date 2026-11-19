import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Layers, Search, UserCheck, Workflow } from 'lucide-react';
import { PERSONA_LIST } from '../../data/mock-users';
import { useAppStore } from '../../store/AppContext';
import type { RoleId } from '../../types/rbac';
import { Badge } from '../ui';

export type AppView =
  | 'control_tower'
  | 'processes_hub'
  | 'process_studio'
  | 'approvals_queue'
  | 'test_bench'
  | 'runtime_apps'
  | 'roadmap_policy'
  | 'roadmap_threads'
  | 'roadmap_agentify';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: AppView, processId?: string) => void;
  onSwitchRole: (role: RoleId) => void;
}

export function CommandPalette({
  open,
  onClose,
  onNavigate,
  onSwitchRole,
}: CommandPaletteProps) {
  const { processes, currentUser } = useAppStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) onClose();
      } else if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const q = query.trim().toLowerCase();

  const matchingProcesses = useMemo(
    () =>
      processes.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.domain.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q)
      ),
    [processes, q]
  );

  const matchingRoles = useMemo(
    () =>
      PERSONA_LIST.filter(
        (r) =>
          r.roleLabel.toLowerCase().includes(q) ||
          r.displayName.toLowerCase().includes(q)
      ),
    [q]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-elevated ring-1 ring-slate-900/10">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a process, role, or module..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {matchingProcesses.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Processes
              </div>
              <div className="space-y-0.5">
                {matchingProcesses.map((proc) => (
                  <button
                    key={proc.id}
                    type="button"
                    onClick={() => {
                      const targetView: AppView =
                        currentUser?.username === 'solution_manager'
                          ? 'approvals_queue'
                          : currentUser?.username === 'tester'
                          ? 'test_bench'
                          : currentUser?.username === 'end_user'
                          ? 'runtime_apps'
                          : 'process_studio';
                      onNavigate(targetView, proc.id);
                      onClose();
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-blue-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Workflow className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium text-slate-900">{proc.name}</div>
                        <div className="text-xs text-slate-500">{proc.domain} · v{proc.version}</div>
                      </div>
                    </div>
                    <Badge variant="secondary">{proc.status}</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchingRoles.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Quick Switch Role
              </div>
              <div className="space-y-0.5">
                {matchingRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      onSwitchRole(role.username);
                      onClose();
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-blue-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="h-4 w-4 text-slate-500" />
                      <div>
                        <span className="font-medium text-slate-900">{role.roleLabel}</span>
                        <span className="ml-2 text-xs text-slate-500">({role.displayName})</span>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchingProcesses.length === 0 && matchingRoles.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-500 flex flex-col items-center gap-1.5">
              <Layers className="h-5 w-5 text-slate-300" />
              No matching processes or roles found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
