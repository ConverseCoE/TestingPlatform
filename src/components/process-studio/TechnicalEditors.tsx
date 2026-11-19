import { useEffect, useState } from 'react';
import { Check, Code2, Plus, Trash2 } from 'lucide-react';
import type {
  ProcessDefinition,
  ScreenJSON,
  SkillOutcome,
  SkillRule,
  SkillTrigger,
} from '../../types/process';
import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Textarea } from '../ui';

export function RawJsonPane({
  process,
  onProcessUpdated,
}: {
  process: ProcessDefinition;
  onProcessUpdated: (updated: ProcessDefinition, summary: string) => void;
}) {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(process.screenJson, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    setJsonText(JSON.stringify(process.screenJson, null, 2));
    setError(null);
  }, [process.id, process.screenJson]);

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText) as ScreenJSON;
      if (!parsed.screenId || !Array.isArray(parsed.fields)) {
        setError('ScreenJSON must include "screenId" and a "fields" array.');
        return;
      }
      const next = structuredClone(process);
      next.screenJson = parsed;
      next.name = parsed.title || next.name;
      setError(null);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
      onProcessUpdated(next, 'Edited Raw ScreenJSON directly');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="p-4 sm:p-5 space-y-3 h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Raw ScreenJSON Editor</h3>
        </div>
        <Button size="sm" onClick={handleApplyJson}>
          <Check className="h-3.5 w-3.5" />
          {savedToast ? 'Applied!' : 'Apply JSON to Preview'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" title="Invalid JSON">
          {error}
        </Alert>
      )}

      <Textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        className="flex-1 min-h-[420px] font-mono text-xs leading-relaxed"
        spellCheck={false}
      />
    </div>
  );
}

export function SkillFilePane({
  process,
  onProcessUpdated,
}: {
  process: ProcessDefinition;
  onProcessUpdated: (updated: ProcessDefinition, summary: string) => void;
}) {
  const [ruleName, setRuleName] = useState('');
  const [trigger, setTrigger] = useState<SkillTrigger>('onButtonClick');
  const [outcome, setOutcome] = useState<SkillOutcome>('BLOCK');
  const [field, setField] = useState(process.screenJson.fields[0]?.name ?? 'amount');
  const [threshold, setThreshold] = useState('1000');
  const [message, setMessage] = useState('');

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !message.trim()) return;
    const next = structuredClone(process);
    const newRule: SkillRule = {
      id: `sk-manual-${Date.now()}`,
      name: ruleName.trim(),
      trigger,
      actionId:
        trigger === 'onButtonClick'
          ? next.screenJson.primaryActions[0]?.id ?? 'submit_request'
          : undefined,
      field: trigger === 'onButtonClick' ? field : undefined,
      operator: trigger === 'onButtonClick' ? 'gt' : 'always_info',
      value: trigger === 'onButtonClick' ? Number(threshold) || 0 : undefined,
      outcomeOnMatch: outcome,
      message: message.trim(),
      source: 'process',
    };
    next.skillFile.rules.push(newRule);
    setRuleName('');
    setMessage('');
    onProcessUpdated(next, `Added Skill Rule "${newRule.name}"`);
  };

  const handleDeleteRule = (id: string) => {
    const next = structuredClone(process);
    next.skillFile.rules = next.skillFile.rules.filter((r) => r.id !== id);
    onProcessUpdated(next, 'Removed Skill Rule');
  };

  return (
    <div className="p-4 sm:p-5 space-y-5">
      <div>
        <h3 className="text-sm font-bold text-slate-900">
          Skill File ({process.skillFile.skillName} · v{process.skillFile.version})
        </h3>
        <p className="text-xs text-slate-500">
          Rules evaluated automatically on <code className="font-mono">onScreenOpen</code> and{' '}
          <code className="font-mono">onButtonClick</code>.
        </p>
      </div>

      {/* Structured Rules List */}
      <div className="space-y-2.5">
        {process.skillFile.rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="p-3.5 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary">{rule.trigger}</Badge>
                  <Badge
                    variant={
                      rule.outcomeOnMatch === 'BLOCK'
                        ? 'destructive'
                        : rule.outcomeOnMatch === 'WARN'
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {rule.outcomeOnMatch}
                  </Badge>
                  {rule.source === 'policy_injected' && (
                    <Badge variant="violet">Policy: {rule.policyName}</Badge>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-900">{rule.name}</div>
                <p className="text-xs text-slate-600">{rule.message}</p>
              </div>
              {rule.source !== 'policy_injected' && (
                <button
                  type="button"
                  onClick={() => handleDeleteRule(rule.id)}
                  className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Delete rule"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Rule Form */}
      <Card className="bg-slate-50/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wider text-slate-600">
            Add Direct Skill Rule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddRule} className="grid gap-2.5 sm:grid-cols-2">
            <Input
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="Rule Name (e.g., Cap Travel Spend)"
              className="text-xs h-8"
            />
            <div className="flex gap-2">
              <Select
                value={trigger}
                onChange={(e) => setTrigger(e.target.value as SkillTrigger)}
                className="text-xs h-8"
              >
                <option value="onButtonClick">onButtonClick</option>
                <option value="onScreenOpen">onScreenOpen</option>
              </Select>
              <Select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as SkillOutcome)}
                className="text-xs h-8"
              >
                <option value="BLOCK">BLOCK</option>
                <option value="WARN">WARN</option>
                <option value="PASS">PASS</option>
              </Select>
            </div>
            {trigger === 'onButtonClick' && (
              <>
                <Input
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder="Field name (e.g., amount)"
                  className="text-xs h-8"
                />
                <Input
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="Threshold > value"
                  className="text-xs h-8"
                />
              </>
            )}
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explanation message shown when rule fires..."
              className="sm:col-span-2 text-xs h-8"
            />
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Add Skill Rule
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* SKILL.md Preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wider text-slate-500">
            Generated SKILL.md
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-xl bg-slate-900 p-3.5 font-mono text-[11px] leading-relaxed text-slate-100">
            {process.skillFile.markdown}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
