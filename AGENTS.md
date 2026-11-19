# AGENTS.md — Platform Engineering & Agent Guidelines

This file defines the architecture, UI/UX standards, mock-data rules, and development workflow for the **Domain-Agnostic Agentic ERP Platform** (`e:\nutbaAI`).

---

## 1. Project Overview & Scope
- **Nature:** UI-only, mock-JSON-based **demoable application** for a domain-agnostic Agentic ERP platform.
- **No Backend / No Real LLM Calls:** All AI chat responses, process generation, JSON UI schemas, skill file evaluations, approvals, and state mutations are simulated deterministically or interactively in the browser using mock JSON + `localStorage` persistence (with a one-click Reset Demo Data option).
- **Current Build Focus:**
  1. Platform Shell + Role Switcher (RBAC simulation)
  2. **Process Generator** (Conversational Requirements -> Process/Workflow/JSON UI + Skill File -> Review/Approve -> Test -> Run as End User)
  - *Future phases (documented, not yet implemented in Phase 1):* Policy Generator, Threads, User Agentify.

---

## 2. Tech Stack
- **Framework:** React 18+ with TypeScript (`strict: true`)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Component System:** **shadcn/ui-style** components (light theme only) using `lucide-react` for icons, `clsx` + `tailwind-merge` for class composition.
- **State Management:** React Context / lightweight store (`useReducer` or Zustand) backed by `localStorage` for demo persistence.

---

## 3. Design & UI Rules (Strict)
- **Light Theme ONLY:** Never implement or toggle a dark theme. Use a clean Enterprise SaaS palette:
  - Background: `#F8FAFC` / `#FFFFFF` (`bg-slate-50`, `bg-white`)
  - **Shadow-Based Borders (No Heavy Lines):** Prefer soft elevation (`shadow-sm`, `shadow-md`, `ring-1 ring-slate-900/5`) over strong/heavy border lines (`border-slate-300` etc.). Use ultra-subtle hairlines (`border-slate-100`) only when needed for dividers.
  - Text & Typography: Clean readable sans-serif with high-contrast slate (`text-slate-900`, `text-slate-600`, `text-slate-500`).
  - **Primary Accent:** **Royal Blue** (`blue-600` `#2563EB` / `blue-700` `#1D4ED8`).
  - Semantic Statuses: Emerald (Approved/Pass), Amber (Pending Review/Warning), Rose (Rejected/Failed), Violet (AI/Agentic).
- **shadcn/ui Conventions:**
  - Cards, Badges, Tabs, Dialogs/Drawers, Data Tables, Buttons (`default`, `secondary`, `outline`, `ghost`, `destructive`), Inputs, Select, Toast notifications.
  - Consistent spacing, `rounded-lg` / `rounded-xl`, soft shadows, tabular numbers (`tabular-nums`) for metrics/IDs.
- **Responsiveness:**
  - **End User** views (`Runtime Apps Launcher` and generated `ScreenJSON` runtime screens) MUST be **mobile-friendly and responsive** across mobile, tablet, and desktop.
  - Studio, Approvals, and Test Bench views are desktop/tablet-optimized (responsive where practical, allowing liberal desktop space for split-panes and graphs).
- **Demo-First Clarity & Hybrid Auth:**
  - Start with a **Hybrid Login Page** (username = role name, password = `password123*`, plus 1-click quick-fill demo pills) AND include an in-app **Quick Switch Role** + **Sign Out** control in the top header.
  - Keep navigation clean: show active role-appropriate modules (`Control Tower`, `Process Studio`, `Approvals`, `Test Bench`, `Runtime Apps`) and show upcoming modules (`Policy Studio`, `Threads`, `User Agentify`) as clearly badged *"Planned / Roadmap"* items.

---

## 4. Folder Structure (Target)
```text
src/
├── components/
│   ├── ui/                  # Reusable shadcn-style primitives (Button, Card, Badge, Tabs, etc.)
│   ├── layout/              # AppShell, Sidebar, Topbar, RoleSwitcher
│   ├── process-studio/      # Chat builder, Requirements editor, Workflow visualizer, JSON/Skill inspector
│   ├── json-renderer/       # Dynamic JSON-to-UI Screen Renderer + Skill Rule Evaluator
│   └── lifecycle/           # Approval queue (Manager) & Test bench (Tester)
├── data/
│   ├── mock-processes.ts    # Pre-seeded domain-agnostic ERP templates (e.g., Procurement, Leave/HR, Incident)
│   ├── mock-chat-scripts.ts # Simulated AI requirement-gathering & generation scripts
│   └── mock-users.ts        # Demo personas for the 5 RBAC roles
├── types/
│   ├── rbac.ts              # Role & permission types
│   ├── process.ts           # Process, Workflow, ScreenJSON, SkillFile, Approval & TestRun types
│   └── runtime.ts           # Runtime record & skill execution log types
├── store/
│   └── AppContext.tsx       # Central state + localStorage sync + Reset Demo action
└── App.tsx
```

---

## 5. Key Engineering Guardrails
1. **JSON-Driven Rendering:** Generated screens MUST be rendered dynamically from `ScreenJSON` schema—never hardcode a specific ERP domain screen in the runtime view.
2. **Skill File Enforcement:** Every runtime screen open (`onLoad`) and button click (`onAction`) MUST pass through the **Skill Evaluator**, which checks the process's `SkillFile` rules and logs a visible execution trace (Pass / Warn / Block + reasoning).
3. **Role-Aware UX:** Actions like *Approve/Reject* belong to `Solution Manager` (and `Principal Admin`), *Run Test Suite* to `Tester` (and `Principal Admin`), *Design/Modify* to `Solution Specialist` (and `Principal Admin`), and *Operate Published App* to `End User` (and `Principal Admin`).
4. **Keep Code Modular:** Keep UI primitives separate from domain logic; keep mock JSON datasets separate from components.

---

## 6. Verification Commands (Once Scaffolded)
- Type-check: `npm run build` (or `npx tsc --noEmit`)
- Dev server: `npm run dev`
- Lint: `npm run lint`
