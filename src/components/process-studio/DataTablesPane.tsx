import { useState } from 'react';
import { Database, KeyRound, Link2, Plus } from 'lucide-react';
import { ENTERPRISE_MASTER_TABLES } from '../../data/mock-lookup-tables';
import type { ProcessDefinition } from '../../types/process';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui';

interface DataTablesPaneProps {
  process: ProcessDefinition;
  onProcessUpdated: (updated: ProcessDefinition, summary: string) => void;
}

export function DataTablesPane({ process, onProcessUpdated }: DataTablesPaneProps) {
  const [showCatalog, setShowCatalog] = useState(false);

  const existingTables = process.tables.filter((t) => t.kind === 'existing_leveraged');
  const newTables = process.tables.filter((t) => t.kind === 'new_created');

  const handleLinkMasterTable = (tableId: string) => {
    const master = ENTERPRISE_MASTER_TABLES.find((t) => t.id === tableId);
    if (!master) return;
    if (process.tables.some((t) => t.id === master.id)) return;
    const next = structuredClone(process);
    next.tables.push(master);
    onProcessUpdated(next, `Linked existing master table "${master.name}"`);
    setShowCatalog(false);
  };

  const renderTableCard = (tbl: ProcessDefinition['tables'][number]) => (
    <Card key={tbl.id}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-600" />
            {tbl.name}
          </CardTitle>
          <Badge variant={tbl.kind === 'existing_leveraged' ? 'default' : 'success'}>
            {tbl.kind === 'existing_leveraged' ? 'Existing Leveraged' : 'New Table Created'}
          </Badge>
        </div>
        <CardDescription>{tbl.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-slate-100 rounded-xl bg-slate-50/70 ring-1 ring-slate-900/5">
          {tbl.columns.map((col) => (
            <div
              key={col.name}
              className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs"
            >
              <div className="flex items-center gap-2">
                {col.isPrimaryKey && <KeyRound className="h-3 w-3 text-amber-500" />}
                {col.referencesTable && <Link2 className="h-3 w-3 text-blue-500" />}
                <span className="font-mono font-medium text-slate-800">{col.name}</span>
                {col.referencesTable && (
                  <span className="text-[11px] text-blue-600">→ {col.referencesTable}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px]">
                  {col.type}
                </Badge>
                {col.required && (
                  <span className="text-[10px] font-semibold text-rose-600">NOT NULL</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 sm:p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Data Model &amp; Table Schemas</h3>
          <p className="text-xs text-slate-500">
            Visibility into existing enterprise master tables leveraged and new transactional tables created.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowCatalog((prev) => !prev)}>
          <Plus className="h-3.5 w-3.5" />
          Link Master Table
        </Button>
      </div>

      {showCatalog && (
        <Card className="bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-blue-800">
              Enterprise Master Lookup Dictionary
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {ENTERPRISE_MASTER_TABLES.map((mt) => {
              const linked = process.tables.some((t) => t.id === mt.id);
              return (
                <Button
                  key={mt.id}
                  size="sm"
                  variant={linked ? 'secondary' : 'outline'}
                  disabled={linked}
                  onClick={() => handleLinkMasterTable(mt.id)}
                >
                  {mt.name} {linked ? '(Linked)' : '+'}
                </Button>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          New Tables Created ({newTables.length})
        </div>
        {newTables.length === 0 ? (
          <div className="text-xs text-slate-500">No new tables generated yet.</div>
        ) : (
          <div className="grid gap-3">{newTables.map(renderTableCard)}</div>
        )}
      </div>

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Existing Enterprise Tables Leveraged ({existingTables.length})
        </div>
        {existingTables.length === 0 ? (
          <div className="text-xs text-slate-500">No existing tables linked yet.</div>
        ) : (
          <div className="grid gap-3">{existingTables.map(renderTableCard)}</div>
        )}
      </div>
    </div>
  );
}
