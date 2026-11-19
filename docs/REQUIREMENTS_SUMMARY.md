# Platform Requirements Summary

## 1. Vision
A **domain-agnostic Agentic ERP Builder & Runtime Platform** where organizations can design, govern, test, approve, and run any ERP application (e.g., Procurement, HR/Leave Management, Inventory, Expense Approvals, IT Service Desk) through conversational AI and structured JSON definitions—without writing custom code per process.

---

## 2. User Roles (RBAC)
| Role | Primary Responsibilities |
| :--- | :--- |
| **Principal Admin** | Full unrestricted access across all studios, approvals, testing, runtime apps, policies, and user management. |
| **Solution Specialist** | Uses the **Process Generator** (and later Policy Generator) to chat with AI, refine requirements, streamline workflows, inspect/edit Screen JSON & Skill files, and submit solutions for approval. |
| **Solution Manager** | Reviews submitted processes, inspects generated UI/workflows/skills, and **Approves** or **Requests Changes** before testing/release. |
| **Tester** | Executes test scenarios against generated screens, workflows, and Skill rules; logs pass/fail results and promotes verified processes. |
| **End User** | Operates published ERP screens, collaborates in **Threads**, and delegates work to personal/impersonating agents (**User Agentify**). |

---

## 3. Platform Modules

### 3.1 Process Generator *(Phase 1 — Active Build Focus)*
- **Doc:** [PROCESSES_REQUIREMENTS.md](file:///e:/nutbaAI/docs/requirements/PROCESSES_REQUIREMENTS.md)
- Conversational chat experience to capture business requirements.
- Generates complete **Processes** consisting of:
  1. **UI** (JSON-based UI Schema)
  2. **Functionalities** (field validations, actions, state mutations)
  3. **Workflows** (multi-step states, transitions, actors)
  4. **Skill File** (executable business rules & AI guardrails checked on screen open and button click)
- Supports iterative requirement modification, process streamlining, Manager approval, Tester verification, and live End-User runtime execution.

### 3.2 Policy Generator *(Future Phase)*
- **Doc:** [POLICY_REQUIREMENTS.md](file:///e:/nutbaAI/docs/requirements/POLICY_REQUIREMENTS.md)
- Enterprise-wide governance studio where Solution Specialists/Admins define policies that constrain how all AI generation and agentic execution behave across the company.

### 3.3 Threads *(Future Phase)*
- **Doc:** [THREADS_REQUIREMENTS.md](file:///e:/nutbaAI/docs/requirements/THREADS_REQUIREMENTS.md)
- Enterprise team communication hub (Microsoft Teams-like) for 1:1, group channels, and process-linked discussions.

### 3.4 User Agentify *(Future Phase)*
- **Doc:** [USER_AGENTIFY_REQUIREMENTS.md](file:///e:/nutbaAI/docs/requirements/USER_AGENTIFY_REQUIREMENTS.md)
- Allows employees to create multiple personal assistant agents as well as a **User-Impersonating Agent** ("agent-first action" representing the user).

---

## 4. Non-Functional & Demo Requirements
- **UI-Only Mock JSON Architecture:** Zero backend dependencies; realistic pre-seeded JSON scenarios + interactive state persisted in `localStorage`.
- **Light-Theme Enterprise SaaS:** Clean shadcn/ui-inspired light interface (`React + TypeScript + Tailwind CSS`).
- **Instant Role Switching:** Top-bar role switcher for seamless live demos across all 5 personas.
