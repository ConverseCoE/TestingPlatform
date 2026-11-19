# Processes Requirements (Process Generator & Runtime)

> **Status:** Active Phase 1 Focus  
> **Primary Personas:** Solution Specialist (Creator), Solution Manager (Approver), Tester (Verifier), End User (Operator), Principal Admin (All)

---

## 1. Objective
Enable a **Solution Specialist** to build any domain-agnostic ERP process from natural-language requirements via a multi-modal AI studio. The platform synthesizes requirements into:
1. **Structured Requirements & Process Blueprint** (Fields, Flows, Rules, Validations, Workflow Graph)
2. **Data Model / Table Schema** (Existing ERP tables leveraged + New tables created)
3. **Screen JSON** (declarative UI schema for dynamic rendering)
4. **Skill File** (executable business rules, validations, and AI checks evaluated on screen open and button click)

Once generated and streamlined, the process moves through **Solution Manager Approval** → **Tester Verification** → **Published Runtime Application** for End Users.

---

## 2. End-to-End Lifecycle & 3-Minute Demo Story
```text
Draft (Specialist) ──► Pending Approval (Manager) ──► Ready for Testing (Tester) ──► Published (End Users)
                            │                               │
                            ▼ (Reject / Request Changes)     ▼ (Test Failed)
                      Needs Revision ◄──────────────────────┘
```

**Seamless Cross-Role Demo Flow:**
1. **Solution Specialist:** Chat to generate a process (or pick a preset) → Refine via Chat, Visual UI Selection/Draw, Process Blueprint, or Raw JSON/Skill → Streamline → Submit for Approval.
2. **Solution Manager:** Open Approvals Queue → Inspect Screen Preview, Blueprint/Workflow, Data Tables, and Skill File → Approve.
3. **Tester:** Open Test Bench → Run auto-generated Skill & Workflow test cases + interactive test mode → Certify & Publish.
4. **End User:** Launch the newly published app → Open screen (triggers `onScreenOpen` Skill checks), fill form, trigger a `onButtonClick` Skill Block/Warn, fix input, submit, and advance the workflow.

---

## 3. Functional Requirements

### FR-1: Multi-Modal Process Generator (Solution Specialist)
- **FR-1.1 Conversational Chat & Client-Side Process Synthesizer:**
  - Interactive chat panel with 1-click domain prompt presets and free-text input.
  - Lightweight client-side **Process Synthesizer** parses intent, fields, thresholds, and workflow steps to dynamically assemble/update `ScreenJSON`, `Workflow`, `Tables`, and `SkillFile`.
  - Supports multi-turn clarifying Q&A (e.g., asking for approval thresholds or required fields) as well as iterative refinement.
- **FR-1.2 Flexible Split-Pane Layout + Adaptive Preview:**
  - **User-Selectable Split-Pane:** Studio supports a configurable two-pane split where the user can pick which two views sit side-by-side (e.g., *Chat + Screen Preview*, *Blueprint + Screen JSON*, *Screen Preview + Skill File*) and **drag the divider edge** to freely resize pane widths.
  - **Agent-Driven Auto-Show:** The system automatically reveals/focuses the live Screen Preview when the AI agent determines the gathered requirements are mature enough to render a meaningful screen.
  - **Always Accessible On-Demand:** Even right after the first prompt, the user can manually switch or open Screen Preview, Blueprint, Data & Tables, JSON, or Skill at any time.
- **FR-1.3 Multi-Modal Feedback & Editing (4 Ways to Refine):**
  To support different user preferences (business analysts, visual designers, and technical specialists), the studio provides four synchronized ways to give feedback and edit:
  1. **Chat Q&A:** Natural-language instructions in the chat panel.
  2. **Visual UI Annotation (Click-to-Select & Region/Polygon Draw):** On the Screen Preview, users can toggle **Annotate Mode** to click an element or draw a freeform/polygon/box selection over a UI area and attach targeted feedback. Supports **both** modes:
     - **Apply Immediately:** Instant single-annotation regeneration.
     - **Multi-Pin Queue:** Place multiple pins/polygons across the screen and click **"Apply All Feedback"** to regenerate together.
  3. **Process Blueprint View (User-Understandable Representation):** A clean, non-technical visual breakdown of:
     - **Fields & Validations** (human-readable table of fields, types, required/validation rules)
     - **Workflow Movement Graph** (interactive stage-to-stage flow with actors & transitions)
     - **Business Rules & Flows** (plain-English summary of `onScreenOpen` and `onButtonClick` rules)
     - Users can add, edit, reorder, or delete items here, or click **"Streamline Process"** to optimize steps and regenerate artifacts.
  4. **Direct Technical Editors (Raw JSON & Skill Rules):**
     - Editable **Screen JSON** editor with live validation and instant preview sync.
     - Editable **Skill File** editor (both human-readable `SKILL.md` view and structured rule builder).
- **FR-1.4 Data Model & Table Structure Visibility:**
  - Dedicated **Data & Tables** view inside the studio (and visible during governance/policy checks) showing:
    - **Existing Tables Leveraged** (e.g., `employees`, `departments`, `vendors`, `students`) with their columns and relationships.
    - **New Tables Created** by the generated process (e.g., `leave_requests`, `purchase_requisitions`, `course_enrollments`) with field types, keys, and status columns.

### FR-2: Dynamic JSON-Based UI Renderer
- **FR-2.1 Schema-Driven Components:**
  - Renders any process screen purely from `ScreenJSON` without hardcoded domain views.
  - Supported JSON block types:
    - `header` (title, subtitle, status badge, primary/secondary actions)
    - `kpi_row` (summary metric cards computed from mock records)
    - `form` (text, number, currency, select, date, textarea, checkbox, required/validation rules)
    - `table` (searchable/filterable records list with status badges and row actions)
    - `workflow_tracker` (visual current stage + history)
- **FR-2.2 Interactive State:**
  - Submitting forms creates/updates mock records in the process's runtime dataset.
  - Clicking row/header action buttons triggers workflow state transitions.

### FR-3: Skill File Runtime Checker (`onScreenOpen` & `onButtonClick`)
- **FR-3.1 `onScreenOpen` Evaluation:**
  - Whenever a user (or Tester) opens a generated screen, the **Skill Engine** automatically evaluates all `onScreenOpen` rules (e.g., role access check, pending SLA alerts, policy/threshold advisories).
- **FR-3.2 `onButtonClick` Evaluation:**
  - Whenever a user clicks an action button (e.g., `Submit`, `Approve`, `Reject`, `Enroll`), the Skill Engine evaluates all matching `onButtonClick` rules *before* committing the state change:
    - **PASS** (Emerald): Action succeeds; state updates.
    - **WARN** (Amber): Action succeeds with an advisory banner/toast.
    - **BLOCK** (Rose): Action is prevented; clear explanation is shown citing the exact Skill rule.
- **FR-3.3 Visible Skill Execution Trace:**
  - A live **Skill Execution Trace** panel shows every rule evaluated, inputs checked, Pass/Warn/Block status, and reasoning.

### FR-4: Solution Manager Approval Workflow
- **FR-4.1 Approval Queue:**
  - Lists all processes in `Pending Approval` status with summary metadata (Author, Version, Domain, Tables Impacted).
- **FR-4.2 Review & Decision:**
  - Manager can inspect the Screen Preview, Process Blueprint, Data Tables, Screen JSON, and Skill File, then **Approve** (`→ Ready for Testing`) or **Request Changes** with review comments (`→ Needs Revision`).

### FR-5: Tester Verification Bench
- **FR-5.1 Test Bench View:**
  - Lists processes in `Ready for Testing` (and previously tested ones).
  - Provides **Auto-Generated Test Cases** derived from the Skill File & Workflow.
- **FR-5.2 Interactive & Automated Testing:**
  - Tester can run the interactive screen directly in Test Mode (watching Skill checks fire) and run/mark test cases as **Pass** or **Fail**.
  - When all required tests pass, Tester clicks **Certify & Publish** → status becomes `Published`.

### FR-6: End-User Runtime Workspace
- **FR-6.1 App Launcher / Published Apps:**
  - End Users see all `Published` ERP processes as clean application cards/nav items.
- **FR-6.2 Live Operation:**
  - End Users open screens, create records, trigger actions, and experience real-time Skill File checks and workflow transitions.

### FR-7: Enterprise Governance, Simulation & Portability
- **FR-7.1 Policy-to-Skill Auto-Injection & Compliance Badge:**
  - Newly generated or updated processes are automatically checked against active enterprise policies (seeded mock policies in Phase 1, connected to Policy Studio in Phase 2). Policy rules are auto-injected into the `Skill` file, displaying a **Policy Compliant** or **Policy Conflict** badge.
- **FR-7.2 Process Version Diff & Rollback (`v1 → v2`):**
  - Side-by-side diff comparing changes to `ScreenJSON`, `Workflow`, `Tables`, and `Skill` rules across iterations, with one-click rollback.
- **FR-7.3 Interactive "What-If" Simulator in Studio:**
  - Quick test drawer inside Process Studio where Solution Specialists simulate sample inputs (role, field values) and see which `Skill` rules fire (`PASS / WARN / BLOCK`) before submitting for approval.
- **FR-7.4 Reusable Domain Entities & Lookup Dictionary:**
  - Shared catalog of enterprise master tables (`employees`, `departments`, `vendors`, `cost_centers`, `students`, `courses`) so generated processes link to real lookup fields rather than isolated silos.
- **FR-7.5 SLA & Escalation Rules on Workflow Stages:**
  - Each workflow stage in the Blueprint can define an SLA timer and escalation target (e.g., *"Auto-escalate to Finance Director after 48h"*).
- **FR-7.6 Role-Based Field & Action Matrix (RBAC per Screen):**
  - Matrix in the Blueprint defining per-role visibility/editability (`View`, `Edit`, `Hide`) for fields and action buttons.
- **FR-7.7 Audit Trail & Explainability Ledger:**
  - Chronological log of every AI generation, manual edit, approval decision, test run, and runtime `Skill` evaluation with actor, timestamp, and reasoning.
- **FR-7.8 Export / Import Process Package:**
  - One-click export/import of a process as a portable `.json` + `SKILL.md` bundle.

### FR-8: Hybrid Authentication, Role Landing Pages & Demo UX Helpers
- **FR-8.1 Hybrid Login & Quick-Switch:**
  - Clean Enterprise Login page accepting `username` (role name, e.g., `solution_specialist`) and `password` (`password123*`).
  - **1-Click Quick-Fill Demo Pills** below the form for all 5 roles.
  - In-app header includes both **Quick Switch Role** dropdown and **Sign Out** button.
- **FR-8.2 Role-Specific Landing Pages:**
  - **Principal Admin:** *Platform Control Tower* (cross-platform KPIs, process stage breakdown, compliance %, audit highlights, quick jump).
  - **Solution Specialist:** *Processes Hub* (existing processes grid/table with status, version & compliance badges + prominent **"+ Create New Process"** CTA).
  - **Solution Manager:** *Approvals Queue* (`Pending Approval` processes ready for review).
  - **Tester:** *Test Bench* (`Ready for Testing` processes + test suites).
  - **End User:** *Runtime Apps Launcher* (mobile-friendly grid of `Published` ERP apps + recent requests).
- **FR-8.3 Intuitive Demo & Navigation Helpers:**
  - **Collapsible Demo Storyline Helper:** Toggleable 4-step progress pill in the header (*1. Design → 2. Approve → 3. Test → 4. Run*).
  - **Instant "Skill Rule Fired" Feedback:** Plain-English alert banner on `BLOCK` / `WARN` + pulsing indicator on the **Skill Execution Trace** drawer.
  - **One-Click "Reset Demo Data":** Restores the 3 pre-seeded processes and clears runtime mutations.
  - **Quick Command Bar (`Ctrl+K`):** Instant search & jump to any process, screen, or role.

### FR-9: UI Styling & Responsiveness
- **Light Theme Only** with **Royal Blue** (`#2563EB`) primary accent and clean high-contrast slate typography.
- **Shadow-Based Elevation:** Soft shadows (`shadow-sm`, `shadow-md`, `ring-1 ring-slate-900/5`) instead of heavy border lines.
- **Mobile-Friendly End User Experience:** Runtime Apps Launcher and generated `ScreenJSON` runtime screens are fully responsive on mobile, tablet, and desktop; Studio/Approvals/Test Bench are tablet/desktop-optimized.

---

## 4. Pre-Seeded Domain Examples (For Instant Demo)
1. **Procurement (`Published`):** *Purchase Requisition & Approval* — leverages `vendors` & `departments`, creates `purchase_requisitions`; includes budget threshold & justification Skill rules.
2. **HR Leave (`Ready for Testing`):** *Employee Leave & Backfill Request* — leverages `employees`, creates `leave_requests`; includes leave balance & backfill Skill rules. Ready for Tester verification.
3. **College Management (`Pending Approval`):** *Student Course Enrollment & Fee Clearance* — leverages `students` & `courses`, creates `enrollments`; includes prerequisite & fee-clearance Skill rules. Ready for Solution Manager approval.
*(Plus the Solution Specialist can generate a brand-new process live via Chat, Blueprint, or Visual Annotation!)*
