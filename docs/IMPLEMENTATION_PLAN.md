# Implementation Plan — Process Generator & Runtime Platform

This plan organizes the build into **granular, feature-aligned phases** (`React + TypeScript + Tailwind CSS`, light-theme **Royal Blue** Enterprise SaaS with shadow-based elevation). Each phase produces a clean, verifiable increment.

---

## Phase 1: Project Scaffolding, Design System & Core Data Store
**Goal:** Establish the runnable foundation, Royal Blue shadow-elevated UI primitives, TypeScript models, and pre-seeded mock JSON store.
- **1.1 Project Scaffolding:**
  - Vite + React 18+ + TypeScript (`strict: true`) + Tailwind CSS + `lucide-react`, `clsx`, `tailwind-merge`.
  - Configure Royal Blue (`#2563EB`) primary tokens, clean slate typography, and shadow-based card/surface styles (`shadow-sm`, `ring-1 ring-slate-900/5`, no heavy border lines).
- **1.2 Core UI Primitives (`src/components/ui/`):**
  - `Button`, `Card`, `Badge`, `Input`, `Textarea`, `Select`, `Tabs`, `Dialog/Drawer`, `Table`, `Alert/Toast`.
- **1.3 Core Types, Store & Pre-Seeded Domains:**
  - TypeScript models for `Role`, `ProcessDefinition`, `TableSchema`, `ScreenJSON`, `SkillFile`, `WorkflowStage`, `TestCase`, `RuntimeRecord`, and `AuditEntry`.
  - Pre-seed 3 domain-agnostic processes:
    1. **Procurement — Purchase Requisition & Approval** (`Published`)
    2. **HR Leave — Employee Leave & Backfill Request** (`Ready for Testing`)
    3. **College Management — Student Course Enrollment & Fee Clearance** (`Pending Approval`)
  - Seed enterprise master lookup dictionary (`employees`, `departments`, `vendors`, `students`, `courses`) and active mock Enterprise Policies.
  - `AppContext` with `localStorage` persistence + `resetDemoData` state action.

---

## Phase 2: Hybrid Login, AppShell & Global Demo Controls
**Goal:** Deliver the authentication flow, responsive navigation shell, header controls, and `Ctrl+K` command bar.
- **Hybrid Login Page:** Username (role name, e.g. `solution_specialist`) + Password (`password123*`) + **1-Click Quick-Fill Demo Pills** for all 5 roles.
- **Responsive AppShell:** Sidebar + Topbar navigation (marking `Policy Studio`, `Threads`, and `User Agentify` as *Planned / Roadmap*).
- **Header Controls:** **Quick Switch Role**, **Sign Out**, **Collapsible Demo Storyline Helper** (4-step progress pill), and **Reset Demo Data** button.
- **Quick Command Bar (`Ctrl+K`):** Jump directly to any process, screen, or role.
- Clean role-landing placeholders wired up for subsequent phases.

---

## Phase 3: Principal Admin — Platform Control Tower
**Goal:** Build the Principal Admin landing page with cross-platform visibility.
- Cross-platform KPIs (processes by lifecycle stage, policy compliance rate, active runtime records).
- Process directory overview with quick-jump to any module/role view.
- **Audit Trail & Explainability Ledger** viewer across generations, approvals, tests, and runtime events.

---

## Phase 4: Solution Specialist — Processes Hub
**Goal:** Build the Solution Specialist landing page to browse, filter, and launch processes.
- Grid/table of existing processes with status, version, domain, and Policy Compliance badges.
- Search & status filters + prominent **"+ Create New Process"** CTA launching the Process Studio.

---

## Phase 5: Solution Specialist — Flexible Resizable Split-Pane Studio Shell
**Goal:** Build the configurable two-pane workspace for the Process Studio.
- User-selectable two-pane layout where any two views can sit side-by-side (`Chat`, `Screen Preview`, `Process Blueprint`, `Data & Tables`, `Raw Screen JSON`, `Skill File`).
- **Draggable edge divider** to freely adjust pane widths, plus single-pane toggle when preferred.

---

## Phase 6: Solution Specialist — Client-Side Process Synthesizer & Conversational Chat
**Goal:** Build the conversational requirement-gathering experience and live artifact synthesizer.
- Multi-turn chat UI with quick-start domain presets and clarifying Q&A.
- Client-side **Process Synthesizer** dynamically assembling/updating `ScreenJSON`, `Workflow`, `Tables`, and `SkillFile`.
- **Adaptive Auto-Show** (auto-focuses Screen Preview when requirements are ready, while keeping all views clickable anytime).

---

## Phase 7: Solution Specialist — Visual UI Annotation (Click & Polygon Draw)
**Goal:** Enable direct visual feedback on the generated Screen Preview.
- Toggle **Annotate Mode** on Screen Preview to click elements or draw freeform/box/polygon regions via SVG overlay.
- Attach targeted feedback supporting both **Immediate Apply** and **Multi-Pin Queue ("Apply All Feedback")**.

---

## Phase 8: Solution Specialist — Process Blueprint, Data & Tables, and Technical Editors
**Goal:** Deliver the business-friendly Blueprint and technical JSON/Skill editors.
- **Process Blueprint:** Editable **Fields & Validations**, interactive **Workflow Movement Graph** (with SLA/escalation rules), **Role-Based Field & Action Matrix**, plain-English **Rules**, and **"Streamline Process"** optimizer.
- **Data & Tables:** Visual schema cards showing *Existing Tables Leveraged* (linked to lookup dictionary) vs. *New Tables Created*.
- **Raw Screen JSON** & **Skill File** (`SKILL.md` + structured rule builder) with live sync.

---

## Phase 9: Solution Specialist — Studio Governance, Simulator, Diff & Submit
**Goal:** Add enterprise governance, simulation, versioning, portability, and submission to the Process Studio.
- **Policy-to-Skill Auto-Injection** & Compliance Badge.
- **Interactive "What-If" Simulator** drawer to test Skill rules before submission.
- **Version Diff & Rollback** (`v1 → v2`) and **Export / Import Process Package** (`.json` + `SKILL.md`).
- **Submit for Approval** (`→ Pending Approval`).

---

## Phase 10: Solution Manager — Approvals Queue
**Goal:** Build the Solution Manager landing page and review/approval workflow.
- Prioritized queue of `Pending Approval` processes (pre-seeded with **College Management**).
- Full inspection of Screen Preview, Blueprint, Data Tables, Version Diff, Policy Compliance, and Skill File.
- **Approve** (`→ Ready for Testing`) or **Request Changes** (`→ Needs Revision` with review comments).

---

## Phase 11: Tester — Verification Bench
**Goal:** Build the Tester landing page and Skill/Workflow verification workflow.
- Queue of `Ready for Testing` processes (pre-seeded with **HR Leave**).
- Auto-generated test cases derived from Skill rules & Workflow transitions + interactive Screen Test Mode with live Skill Trace.
- Pass/Fail test execution and **Certify & Publish** (`→ Published`).

---

## Phase 12: End User — Mobile-Friendly Runtime Apps, JSON Renderer & Skill Engine
**Goal:** Build the mobile-friendly End User runtime experience powered by dynamic JSON rendering and live Skill evaluation.
- **Mobile-Friendly Runtime Apps Launcher:** Responsive app grid of `Published` ERP apps (pre-seeded with **Procurement**) + recent submissions.
- **`JsonScreenRenderer` (`src/components/json-renderer/`):** Dynamically renders `header`, `kpi_row`, `form` (with lookup bindings), `table` (searchable/filterable with row actions), and `workflow_tracker` cleanly across mobile, tablet, and desktop.
- **`SkillEvaluator` Engine:** Automatically runs `onScreenOpen` rules on screen load and `onButtonClick` rules before actions (`PASS`, `WARN`, `BLOCK`), with instant **"Skill Rule Fired"** banner + pulsing **Skill Execution Trace** drawer.

---

## Phase 13: End-to-End Verification & Polish
- Run `npx tsc --noEmit` and `npm run build` to verify zero TypeScript/build errors.
- Verify mobile responsiveness on End User runtime views and walk through the full 4-role demo story.
