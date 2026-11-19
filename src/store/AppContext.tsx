import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  SEEDED_AUDIT_TRAIL,
  SEEDED_PROCESSES,
  SEEDED_RUNTIME_RECORDS,
} from '../data/mock-processes';
import { SEEDED_ENTERPRISE_POLICIES } from '../data/mock-lookup-tables';
import { USER_PERSONAS } from '../data/mock-users';
import type { EnterprisePolicy, ProcessDefinition } from '../types/process';
import type { RoleId, UserPersona } from '../types/rbac';
import type { AuditEntry, RuntimeRecord, SkillExecutionLog } from '../types/runtime';

const STORAGE_KEY = 'nutba_agentic_erp_state_v1';

interface PersistedState {
  currentRole: RoleId | null;
  processes: ProcessDefinition[];
  runtimeRecords: RuntimeRecord[];
  auditTrail: AuditEntry[];
  skillLogs: SkillExecutionLog[];
}

interface AppContextValue extends PersistedState {
  currentUser: UserPersona | null;
  policies: EnterprisePolicy[];
  loginAsRole: (role: RoleId) => void;
  switchRole: (role: RoleId) => void;
  logout: () => void;
  resetDemoData: () => void;
  setProcesses: React.Dispatch<React.SetStateAction<ProcessDefinition[]>>;
  addOrUpdateProcess: (proc: ProcessDefinition) => void;
  addRuntimeRecord: (rec: RuntimeRecord) => void;
  updateRuntimeRecordStage: (recordId: string, stageId: string, stageName: string) => void;
  appendAuditEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  appendSkillLog: (log: SkillExecutionLog) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function getInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (Array.isArray(parsed.processes) && parsed.processes.length > 0) {
        return {
          currentRole: parsed.currentRole ?? null,
          processes: parsed.processes,
          runtimeRecords: parsed.runtimeRecords ?? SEEDED_RUNTIME_RECORDS,
          auditTrail: parsed.auditTrail ?? SEEDED_AUDIT_TRAIL,
          skillLogs: parsed.skillLogs ?? [],
        };
      }
    }
  } catch {
    // Fallback to clean seeded state
  }
  return {
    currentRole: null,
    processes: SEEDED_PROCESSES,
    runtimeRecords: SEEDED_RUNTIME_RECORDS,
    auditTrail: SEEDED_AUDIT_TRAIL,
    skillLogs: [],
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(getInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors in demo mode
    }
  }, [state]);

  const currentUser = state.currentRole ? USER_PERSONAS[state.currentRole] : null;

  const loginAsRole = (role: RoleId) => {
    setState((prev) => ({ ...prev, currentRole: role }));
  };

  const switchRole = (role: RoleId) => {
    setState((prev) => ({ ...prev, currentRole: role }));
  };

  const logout = () => {
    setState((prev) => ({ ...prev, currentRole: null }));
  };

  const resetDemoData = () => {
    const fresh: PersistedState = {
      currentRole: state.currentRole,
      processes: SEEDED_PROCESSES,
      runtimeRecords: SEEDED_RUNTIME_RECORDS,
      auditTrail: SEEDED_AUDIT_TRAIL,
      skillLogs: [],
    };
    setState(fresh);
  };

  const setProcesses: React.Dispatch<React.SetStateAction<ProcessDefinition[]>> = (updater) => {
    setState((prev) => ({
      ...prev,
      processes: typeof updater === 'function' ? updater(prev.processes) : updater,
    }));
  };

  const addOrUpdateProcess = (proc: ProcessDefinition) => {
    setState((prev) => {
      const exists = prev.processes.some((p) => p.id === proc.id);
      const nextProcesses = exists
        ? prev.processes.map((p) => (p.id === proc.id ? proc : p))
        : [proc, ...prev.processes];
      return { ...prev, processes: nextProcesses };
    });
  };

  const addRuntimeRecord = (rec: RuntimeRecord) => {
    setState((prev) => ({
      ...prev,
      runtimeRecords: [rec, ...prev.runtimeRecords],
    }));
  };

  const updateRuntimeRecordStage = (recordId: string, stageId: string, stageName: string) => {
    setState((prev) => ({
      ...prev,
      runtimeRecords: prev.runtimeRecords.map((r) =>
        r.id === recordId ? { ...r, stageId, stageName } : r
      ),
    }));
  };

  const appendAuditEntry = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditEntry = {
      ...entry,
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      auditTrail: [newEntry, ...prev.auditTrail],
    }));
  };

  const appendSkillLog = (log: SkillExecutionLog) => {
    setState((prev) => ({
      ...prev,
      skillLogs: [log, ...prev.skillLogs].slice(0, 50),
    }));
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        currentUser,
        policies: SEEDED_ENTERPRISE_POLICIES,
        loginAsRole,
        switchRole,
        logout,
        resetDemoData,
        setProcesses,
        addOrUpdateProcess,
        addRuntimeRecord,
        updateRuntimeRecordStage,
        appendAuditEntry,
        appendSkillLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used inside AppProvider');
  return ctx;
}
