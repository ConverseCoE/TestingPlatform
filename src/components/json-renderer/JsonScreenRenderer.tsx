import React, { useMemo, useState } from 'react';
import { GitBranch, Search } from 'lucide-react';
import { LOOKUP_OPTIONS } from '../../data/mock-lookup-tables';
import type { ProcessDefinition, ScreenActionSchema } from '../../types/process';
import type { RuntimeRecord } from '../../types/runtime';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '../ui';

interface JsonScreenRendererProps {
  process: ProcessDefinition;
  records?: RuntimeRecord[];
  isPreviewOnly?: boolean;
  onActionClick?: (
    action: ScreenActionSchema,
    formValues: Record<string, string | number | boolean>,
    targetRecord?: RuntimeRecord
  ) => void;
}

export function JsonScreenRenderer({
  process,
  records = [],
  isPreviewOnly = false,
  onActionClick,
}: JsonScreenRendererProps) {
  const { screenJson, workflow } = process;
  const [formValues, setFormValues] = useState<Record<string, string | number | boolean>>({});
  const [tableSearch, setTableSearch] = useState('');

  const handleFieldChange = (name: string, value: string | number | boolean) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const filteredRecords = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      JSON.stringify(r).toLowerCase().includes(q)
    );
  }, [records, tableSearch]);

  const computeKpiValue = (kpi: ProcessDefinition['screenJson']['kpis'][number]): string => {
    if (kpi.metric === 'count_all') return String(records.length);
    if (kpi.metric === 'count_status') {
      return String(records.filter((r) => r.stageName === kpi.filterStatus).length);
    }
    if (kpi.metric === 'sum_field' && kpi.field) {
      const sum = records.reduce((acc, r) => acc + Number(r.data[kpi.field!] ?? 0), 0);
      return kpi.format === 'currency' ? `$${sum.toLocaleString()}` : String(sum);
    }
    return '0';
  };

  if (screenJson.fields.length === 0 && screenJson.kpis.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-50 p-10 text-center ring-1 ring-slate-900/5 space-y-2">
        <div className="text-sm font-semibold text-slate-800">No Screen Schema Generated Yet</div>
        <p className="text-xs text-slate-500">
          Use the AI Chat pane on the left (or pick a quick preset) to generate your Screen JSON, Workflow, and Skill File.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Block */}
      <div
        data-block-id="Header Section"
        className="rounded-xl bg-white p-4 sm:p-5 shadow-card ring-1 ring-slate-900/5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{process.domain}</Badge>
              <Badge variant="default">v{process.version}</Badge>
            </div>
            <h2 className="mt-2 text-lg sm:text-xl font-bold text-slate-900">
              {screenJson.title}
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500">{screenJson.subtitle}</p>
          </div>
          {isPreviewOnly && <Badge variant="violet">Live Schema Preview</Badge>}
        </div>
      </div>

      {/* KPI Row */}
      {screenJson.kpis.length > 0 && (
        <div
          data-block-id="KPI Summary Row"
          className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          {screenJson.kpis.map((kpi) => (
            <Card key={kpi.id}>
              <CardHeader className="pb-1.5">
                <CardDescription>{kpi.label}</CardDescription>
                <CardTitle className="text-2xl font-bold tabular-nums">
                  {computeKpiValue(kpi)}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Workflow Tracker */}
      {workflow.length > 0 && (
        <div
          data-block-id="Workflow Tracker"
          className="rounded-xl bg-white p-4 shadow-card ring-1 ring-slate-900/5"
        >
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-700">
            <GitBranch className="h-3.5 w-3.5 text-blue-600" />
            Workflow Stages
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {workflow.map((stage, idx) => (
              <React.Fragment key={stage.id}>
                <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs ring-1 ring-slate-900/5">
                  <span className="font-semibold text-slate-800">{stage.name}</span>
                  {stage.slaHours && (
                    <span className="ml-1.5 text-[10px] text-slate-500">
                      ({stage.slaHours}h SLA)
                    </span>
                  )}
                </div>
                {idx < workflow.length - 1 && (
                  <span className="text-slate-300 text-xs">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Form */}
      {screenJson.fields.length > 0 && (
        <Card data-block-id={`Form: ${screenJson.formTitle}`}>
          <CardHeader>
            <CardTitle>{screenJson.formTitle}</CardTitle>
            <CardDescription>
              Fields rendered dynamically from ScreenJSON ({screenJson.fields.length} fields).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {screenJson.fields.map((field) => {
                const options = field.lookupTable
                  ? LOOKUP_OPTIONS[field.lookupTable] ?? []
                  : field.options ?? [];
                const val = formValues[field.name] ?? '';

                return (
                  <div
                    key={field.name}
                    data-block-id={`Field: ${field.label}`}
                    className={field.type === 'textarea' ? 'sm:col-span-2 space-y-1.5' : 'space-y-1.5'}
                  >
                    <label className="text-xs font-medium text-slate-700">
                      {field.label}
                      {field.required && <span className="ml-1 text-rose-500">*</span>}
                    </label>

                    {field.type === 'select' ? (
                      <Select
                        value={String(val)}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      >
                        <option value="">Select {field.label}...</option>
                        {options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </Select>
                    ) : field.type === 'textarea' ? (
                      <Textarea
                        value={String(val)}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder ?? `Enter ${field.label}...`}
                      />
                    ) : field.type === 'checkbox' ? (
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(val)}
                          onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                        />
                        <span>Yes</span>
                      </label>
                    ) : (
                      <Input
                        type={
                          field.type === 'currency' || field.type === 'number'
                            ? 'number'
                            : field.type === 'date'
                            ? 'date'
                            : 'text'
                        }
                        value={String(val)}
                        onChange={(e) =>
                          handleFieldChange(
                            field.name,
                            field.type === 'currency' || field.type === 'number'
                              ? e.target.value === ''
                                ? ''
                                : Number(e.target.value)
                              : e.target.value
                          )
                        }
                        placeholder={field.placeholder ?? `Enter ${field.label}...`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {screenJson.primaryActions.length > 0 && (
              <div
                data-block-id="Primary Form Actions"
                className="flex flex-wrap items-center gap-2 pt-2"
              >
                {screenJson.primaryActions.map((act) => (
                  <Button
                    key={act.id}
                    variant={act.variant ?? 'default'}
                    onClick={() => onActionClick?.(act, formValues)}
                  >
                    {act.label}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Records Table */}
      {screenJson.tableColumns.length > 0 && (
        <Card data-block-id={`Table: ${screenJson.tableTitle}`}>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>{screenJson.tableTitle}</CardTitle>
              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter records..."
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  {screenJson.tableColumns.map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                  {screenJson.rowActions.length > 0 && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={screenJson.tableColumns.length + 2}
                      className="text-center text-xs text-slate-400 py-6"
                    >
                      {isPreviewOnly
                        ? 'Runtime records will appear here when End Users submit the form.'
                        : 'No records yet. Submit the form above to create one.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-mono text-xs text-slate-500 tabular-nums">
                        {rec.id}
                      </TableCell>
                      {screenJson.tableColumns.map((col) => {
                        if (col.key === 'stageName' || col.type === 'status') {
                          return (
                            <TableCell key={col.key}>
                              <Badge
                                variant={
                                  rec.stageName.includes('Approved') ||
                                  rec.stageName.includes('Enrolled')
                                    ? 'success'
                                    : rec.stageName.includes('Rejected')
                                    ? 'destructive'
                                    : 'warning'
                                }
                              >
                                {rec.stageName}
                              </Badge>
                            </TableCell>
                          );
                        }
                        const raw = rec.data[col.key];
                        const formatted =
                          col.type === 'currency' && raw !== undefined
                            ? `$${Number(raw).toLocaleString()}`
                            : String(raw ?? '—');
                        return (
                          <TableCell key={col.key} className="text-xs sm:text-sm tabular-nums">
                            {formatted}
                          </TableCell>
                        );
                      })}
                      {screenJson.rowActions.length > 0 && (
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {screenJson.rowActions.map((act) => (
                              <Button
                                key={act.id}
                                size="sm"
                                variant={act.variant ?? 'outline'}
                                onClick={() => onActionClick?.(act, rec.data, rec)}
                              >
                                {act.label}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
