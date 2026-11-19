import { CheckCircle2, ChevronUp, Sparkles } from 'lucide-react';
import type { RoleId } from '../../types/rbac';

interface DemoStorylineBarProps {
  open: boolean;
  currentRole: RoleId;
  onSelectStep: (role: RoleId) => void;
  onClose: () => void;
}

const STORY_STEPS: { step: number; label: string; role: RoleId; hint: string }[] = [
  {
    step: 1,
    label: 'Design Process',
    role: 'solution_specialist',
    hint: 'Chat, Annotate, Blueprint & Submit',
  },
  {
    step: 2,
    label: 'Approve Solution',
    role: 'solution_manager',
    hint: 'Inspect & Approve College Enrollment',
  },
  {
    step: 3,
    label: 'Test & Publish',
    role: 'tester',
    hint: 'Verify Skill Rules on HR Leave',
  },
  {
    step: 4,
    label: 'Run as End User',
    role: 'end_user',
    hint: 'Operate Procurement with Live Skill Checks',
  },
];

export function DemoStorylineBar({
  open,
  currentRole,
  onSelectStep,
  onClose,
}: DemoStorylineBarProps) {
  if (!open) return null;

  return (
    <div className="bg-blue-50/70 border-b border-blue-100 px-4 py-2.5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-800">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>Demo Storyline</span>
          <span className="hidden sm:inline font-normal text-blue-700/80">
            — Click any step to switch persona &amp; walkthrough
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STORY_STEPS.map((s) => {
            const active = currentRole === s.role;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => onSelectStep(s.role)}
                title={s.hint}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 shadow-card ring-1 ring-slate-900/5 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {active ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                    {s.step}
                  </span>
                )}
                <span>{s.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={onClose}
            className="ml-1 rounded-lg p-1 text-blue-700 hover:bg-blue-100/80"
            title="Collapse Demo Storyline"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
