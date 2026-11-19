import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Database,
  FileCode2,
  GitBranch,
  LayoutGrid,
  List,
  Plus,
  Search,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import type { ProcessLifecycleStatus } from '../../types/process';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui';

interface ProcessesHubViewProps {
  onOpenProcess: (processId: string) => void;
  onCreateNewProcess: () => void;
}

const STATUS_BADGE: Record<
  ProcessLifecycleStatus,
  'success' | 'default' | 'warning' | 'destructive' | 'secondary'
> = {
  Published: 'success',
  'Ready for Testing': 'default',
  'Pending Approval': 'warning',
  'Needs Revision': 'destructive',
  Draft: 'secondary',
};

const STATUS_FILTERS: ('ALL' | ProcessLifecycleStatus)[] = [
  'ALL',
  'Draft',
  'Needs Revision',
  'Pending Approval',
  'Ready for Testing',
  'Published',
];

export function ProcessesHubView({
  onOpenProcess,
  onCreateNewProcess,
}: ProcessesHubViewProps) {
  const { processes } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProcessLifecycleStatus>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return processes.filter((p) => {
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [processes, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Processes Hub</h1>
          <p className="mt-1 text-sm text-slate-500">
            Design, streamline, and govern domain-agnostic ERP processes with AI-generated UI, Workflows, and Skill Files.
          </p>
        </div>
        <Button size="lg" onClick={onCreateNewProcess}>
          <Plus className="h-4 w-4" />
          Create New Process
        </Button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3.5 shadow-card ring-1 ring-slate-900/5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search processes by name, domain..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {STATUS_FILTERS.map((st) => {
              const active = statusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st}
                </button>
              );
            })}
          </div>

          <div className="flex items-center rounded-lg bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-1.5 ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-md p-1.5 ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
              aria-label="Table view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Sparkles className="mx-auto h-8 w-8 text-blue-500" />
            <div className="text-sm font-semibold text-slate-900">
              No processes match your filter
            </div>
            <p className="text-xs text-slate-500">
              Try clearing your search or create a brand-new process in the studio.
            </p>
            <Button size="sm" onClick={onCreateNewProcess}>
              <Plus className="h-4 w-4" />
              Create New Process
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((proc) => (
            <Card
              key={proc.id}
              className="flex flex-col justify-between transition-shadow hover:shadow-card-hover"
            >
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="secondary">{proc.domain}</Badge>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={
                        proc.complianceStatus === 'Compliant'
                          ? 'success'
                          : proc.complianceStatus === 'Warning'
                          ? 'warning'
                          : 'destructive'
                      }
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {proc.complianceStatus}
                    </Badge>
                    <Badge variant={STATUS_BADGE[proc.status]}>{proc.status}</Badge>
                  </div>
                </div>
                <CardTitle className="pt-2">{proc.name}</CardTitle>
                <CardDescription className="line-clamp-2">{proc.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-center text-xs ring-1 ring-slate-900/5">
                  <div>
                    <div className="font-semibold text-slate-900 tabular-nums">
                      {proc.workflow.length}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                      <GitBranch className="h-3 w-3" /> Stages
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 tabular-nums">
                      {proc.tables.length}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                      <Database className="h-3 w-3" /> Tables
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 tabular-nums">
                      {proc.skillFile.rules.length}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                      <FileCode2 className="h-3 w-3" /> Skills
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500 tabular-nums">
                    v{proc.version} · {proc.createdBy}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => onOpenProcess(proc.id)}>
                    <Wand2 className="h-3.5 w-3.5 text-blue-600" />
                    Open in Studio
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Process</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Policy Compliance</TableHead>
              <TableHead>Artifacts</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((proc) => (
              <TableRow key={proc.id}>
                <TableCell>
                  <div className="font-medium text-slate-900">{proc.name}</div>
                  <div className="text-xs text-slate-500">v{proc.version} · {proc.createdBy}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{proc.domain}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[proc.status]}>{proc.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={proc.complianceStatus === 'Compliant' ? 'success' : 'warning'}>
                    {proc.complianceStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-500 tabular-nums">
                  {proc.workflow.length} stages · {proc.tables.length} tables · {proc.skillFile.rules.length} skills
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => onOpenProcess(proc.id)}>
                    <Wand2 className="h-3.5 w-3.5 text-blue-600" />
                    Open Studio
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
