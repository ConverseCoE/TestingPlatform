import React, { useState } from 'react';
import { Lock, ShieldCheck, Sparkles, User } from 'lucide-react';
import { DEMO_PASSWORD, PERSONA_LIST } from '../../data/mock-users';
import { useAppStore } from '../../store/AppContext';
import type { RoleId } from '../../types/rbac';
import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '../ui';

export function LoginPage() {
  const { loginAsRole, appendAuditEntry } = useAppStore();
  const [username, setUsername] = useState('solution_specialist');
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = username.trim().toLowerCase() as RoleId;
    const matched = PERSONA_LIST.find((p) => p.username === normalized);

    if (!matched) {
      setError(
        'Unknown role username. Use principal_admin, solution_specialist, solution_manager, tester, or end_user.'
      );
      return;
    }

    if (password !== DEMO_PASSWORD) {
      setError(`Invalid password. Use demo password "${DEMO_PASSWORD}".`);
      return;
    }

    loginAsRole(matched.username);
    appendAuditEntry({
      actorName: matched.displayName,
      actorRole: matched.username,
      category: 'SYSTEM',
      summary: `Signed in as ${matched.roleLabel}`,
    });
  };

  const handleQuickFill = (role: RoleId) => {
    setUsername(role);
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#e8edf2] flex flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            NutbaAI Agentic ERP
          </h1>
          <p className="text-sm text-slate-500">
            Domain-Agnostic Process Generator &amp; Skill-Governed Runtime
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sign in to Workspace</CardTitle>
              <Badge variant="default">Demo Mode</Badge>
            </div>
            <CardDescription>
              Enter a role username and password (<code className="text-slate-700 font-mono">password123*</code>), or use a 1-click quick-fill pill below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && (
              <Alert variant="destructive" title="Authentication Failed">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700" htmlFor="username">
                  Username (Role Name)
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. solution_specialist"
                    className="pl-9"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password123*"
                    className="pl-9"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                <ShieldCheck className="h-4 w-4" />
                Sign In
              </Button>
            </form>

            {/* 1-Click Quick-Fill Demo Pills */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-slate-700">1-Click Quick-Fill Demo Personas</span>
                <span>pwd: <code className="font-mono">password123*</code></span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PERSONA_LIST.map((persona) => {
                  const selected = username.trim().toLowerCase() === persona.username;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => handleQuickFill(persona.username)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        selected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      <span className="font-semibold">{persona.roleLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400">
          UI-only mock JSON demo · State persists locally in your browser
        </p>
      </div>
    </div>
  );
}
