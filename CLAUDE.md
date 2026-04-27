# Claude Code Configuration - RuFlo V3

## Behavioral Rules (Always Enforced)

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- NEVER save working files, text/mds, or tests to the root folder
- Never continuously check status after spawning a swarm — wait for results
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files

## File Organization

- NEVER save to root folder — use the directories below
- Use `/src` for source code files
- Use `/tests` for test files
- Use `/docs` for documentation and markdown files
- Use `/config` for configuration files
- Use `/scripts` for utility scripts
- Use `/examples` for example code

## Project Architecture

- Follow Domain-Driven Design with bounded contexts
- Keep files under 500 lines
- Use typed interfaces for all public APIs
- Prefer TDD London School (mock-first) for new code
- Use event sourcing for state changes
- Ensure input validation at system boundaries

### Project Config

- **Topology**: hierarchical-mesh
- **Max Agents**: 15
- **Memory**: hybrid
- **HNSW**: Enabled
- **Neural**: Enabled

## Build & Test

```bash
# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

- ALWAYS run tests after making code changes
- ALWAYS verify build succeeds before committing

## Security Rules

- NEVER hardcode API keys, secrets, or credentials in source files
- NEVER commit .env files or any file containing secrets
- Always validate user input at system boundaries
- Always sanitize file paths to prevent directory traversal
- Run `npx @claude-flow/cli@latest security scan` after security-related changes

## Concurrency: 1 MESSAGE = ALL RELATED OPERATIONS

- All operations MUST be concurrent/parallel in a single message
- Use Claude Code's Task tool for spawning agents, not just MCP
- ALWAYS batch ALL todos in ONE TodoWrite call (5-10+ minimum)
- ALWAYS spawn ALL agents in ONE message with full instructions via Task tool
- ALWAYS batch ALL file reads/writes/edits in ONE message
- ALWAYS batch ALL Bash commands in ONE message

## Swarm Orchestration

- MUST initialize the swarm using CLI tools when starting complex tasks
- MUST spawn concurrent agents using Claude Code's Task tool
- Never use CLI tools alone for execution — Task tool agents do the actual work
- MUST call CLI tools AND Task tool in ONE message for complex work

### 3-Tier Model Routing (ADR-026)

| Tier | Handler | Latency | Cost | Use Cases |
|------|---------|---------|------|-----------|
| **1** | Agent Booster (WASM) | <1ms | $0 | Simple transforms (var→const, add types) — Skip LLM |
| **2** | Haiku | ~500ms | $0.0002 | Simple tasks, low complexity (<30%) |
| **3** | Sonnet/Opus | 2-5s | $0.003-0.015 | Complex reasoning, architecture, security (>30%) |

- Always check for `[AGENT_BOOSTER_AVAILABLE]` or `[TASK_MODEL_RECOMMENDATION]` before spawning agents
- Use Edit tool directly when `[AGENT_BOOSTER_AVAILABLE]`

## Swarm Configuration & Anti-Drift

- ALWAYS use hierarchical topology for coding swarms
- Keep maxAgents at 6-8 for tight coordination
- Use specialized strategy for clear role boundaries
- Use `raft` consensus for hive-mind (leader maintains authoritative state)
- Run frequent checkpoints via `post-task` hooks
- Keep shared memory namespace for all agents

```bash
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

## Swarm Execution Rules

- ALWAYS use `run_in_background: true` for all agent Task calls
- ALWAYS put ALL agent Task calls in ONE message for parallel execution
- After spawning, STOP — do NOT add more tool calls or check status
- Never poll TaskOutput or check swarm status — trust agents to return
- When agent results arrive, review ALL results before proceeding

## V3 CLI Commands

### Core Commands

| Command | Subcommands | Description |
|---------|-------------|-------------|
| `init` | 4 | Project initialization |
| `agent` | 8 | Agent lifecycle management |
| `swarm` | 6 | Multi-agent swarm coordination |
| `memory` | 11 | AgentDB memory with HNSW search |
| `task` | 6 | Task creation and lifecycle |
| `session` | 7 | Session state management |
| `hooks` | 17 | Self-learning hooks + 12 workers |
| `hive-mind` | 6 | Byzantine fault-tolerant consensus |

### Quick CLI Examples

```bash
npx @claude-flow/cli@latest init --wizard
npx @claude-flow/cli@latest agent spawn -t coder --name my-coder
npx @claude-flow/cli@latest swarm init --v3-mode
npx @claude-flow/cli@latest memory search --query "authentication patterns"
npx @claude-flow/cli@latest doctor --fix
```

## Available Agents (60+ Types)

### Core Development
`coder`, `reviewer`, `tester`, `planner`, `researcher`

### Specialized
`security-architect`, `security-auditor`, `memory-specialist`, `performance-engineer`

### Swarm Coordination
`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`

### GitHub & Repository
`pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`

### SPARC Methodology
`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`

## Memory Commands Reference

```bash
# Store (REQUIRED: --key, --value; OPTIONAL: --namespace, --ttl, --tags)
npx @claude-flow/cli@latest memory store --key "pattern-auth" --value "JWT with refresh" --namespace patterns

# Search (REQUIRED: --query; OPTIONAL: --namespace, --limit, --threshold)
npx @claude-flow/cli@latest memory search --query "authentication patterns"

# List (OPTIONAL: --namespace, --limit)
npx @claude-flow/cli@latest memory list --namespace patterns --limit 10

# Retrieve (REQUIRED: --key; OPTIONAL: --namespace)
npx @claude-flow/cli@latest memory retrieve --key "pattern-auth" --namespace patterns
```

## Quick Setup

```bash
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest
npx @claude-flow/cli@latest daemon start
npx @claude-flow/cli@latest doctor --fix
```

## Claude Code vs CLI Tools

- Claude Code's Task tool handles ALL execution: agents, file ops, code generation, git
- CLI tools handle coordination via Bash: swarm init, memory, hooks, routing
- NEVER use CLI tools as a substitute for Task tool agents

## Support

- Documentation: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues

---

# HotelOS Project Memory

## Project Overview
HotelOS is a multi-tenant SaaS hotel management platform built with Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, tRPC, Prisma, and PostgreSQL. Authentication via Clerk (org-per-tenant). Background jobs via BullMQ + Redis. Architecture: modular monolith designed for future microservice extraction. Deployment: Vercel (frontend) + Railway (DB/workers). Turkish UI, English codebase. KVKK-compliant (deploy Azure Turkey or AWS Frankfurt).

## Architectural Rules (Non-Negotiable)
- All money stored as integers in kuruş (TRY cents). Use formatCurrency() for display.
- All dates stored as UTC. Display in Europe/Istanbul timezone using Day.js.
- Every repository function receives tenantId as first arg. Always filter by it.
- Modules never import each other's repository files. Use module router interfaces only.
- All inputs validated with Zod. Schemas defined in module/types.ts, shared client+server.
- Every mutation logged to AuditLog via Prisma middleware (tenantId, userId, entity, diff).
- Never log PII (TC ID, passport, full name, card data) in production logs.
- Every tRPC procedure calls ctx.requireTenant() as first line.
- No raw SQL. Prisma query builder only in repository.ts files.
- All user-facing strings in /messages/tr.json. Use next-intl. No hardcoded Turkish text in components.

## Modules
1. Reservation   — rooms, guests, bookings, check-in/out, e-signature, KBS notification
2. Housekeeping  — room/area cleaning tasks, photos, checklists, lost & found, linen
3. Maintenance   — fault reports, equipment registry, preventive maintenance
4. F&B           — menus, allergens, recipes, food cost, name tags
5. Accounting    — stock, GIB e-invoices, warehouse, payables, cash flow, fixed assets
6. HR            — employees, shifts, leave, payroll (SGK/tax brackets), training
7. Sales         — virtual POS (adapter per bank), payment links, refunds, packages
8. Agency        — contracts, price calendar, multipliers, kickback, price audit
9. CRM           — surveys, reviews, complaints (OCR), blacklist, segmentation
10. Reporting    — 19 reports (screen + Excel/PDF export)

## Integrations
- GIB e-invoice/e-dispatch: adapter in lib/integrations/gib/ (never raw XML/SOAP)
- Jandarma KBS: adapter in lib/integrations/jandarma/ (BullMQ job, 5 min after check-in)
- Virtual POS: VirtualPOSAdapter interface, one file per bank in lib/integrations/pos/
- Netgsm SMS/WhatsApp: adapter in lib/integrations/sms/ (always async via BullMQ)
- OCR (complaint book): Azure Vision or Google Vision in lib/integrations/ocr/

## Current Phase
Phase 1 — Foundation (complete 2026-04-23)
## Phase 1 started: 2026-04-23
## Phase 1 completed: 2026-04-23

## Progress Tracker

### Phase 1 — Foundation
✓ Repo setup: Next.js 14 + TypeScript + Tailwind + shadcn/ui + Prisma + PostgreSQL
✓ Clerk integration: org-based multi-tenancy, user sync webhook, role mapping
✓ Tenant onboarding flow: create org → Tenant row → setup wizard
✓ Core DB schema: Tenant, User, Room, RoomType, Guest, Reservation, AuditLog (+ full schema for all phases)
✓ Reservation module: full CRUD, price calculation, list with filters
✓ Room status management: CLEAN / DIRTY / FAULTY / DND with fault detail
✓ Guest module: create, search, profile with reservation history
✓ Audit log middleware: auto-log all mutations via Prisma middleware (lib/db/audit-middleware.ts)
✓ Basic dashboard: occupancy summary, today's arrivals/departures

### Phase 2 — Payments & Agency
☐ Virtual POS adapter interface + Garanti BBVA implementation
☐ Payment link generation and 3D Secure callback flow
✓ Manual payment recording (cash, wire, physical POS)
☐ Refund management with dual-date tracking
☐ Agency module: CRUD, commission/discount/kickback config
☐ Price calendar: date-range pricing, multiplier matrix
✓ Price preview endpoint
☐ Electronic signature: link generation, signing page, storage
✓ WhatsApp/SMS/email sending via Netgsm (adapter + BullMQ queue + worker)

### Phase 3 — Operations
✓ HK module: task creation, assignment, completion validation (Başlat/Tamamla workflow)
✓ HK common area scheduling (BullMQ daily cron at 06:00 + manual trigger + Ortak Alanlar tab in HK page)
✓ HK daily report generation (screen view at /housekeeping/report, date picker, print/PDF, email deferred)
✓ Lost & found module (create, mark returned, stats)
✓ Linen tracking (sent/returned/outstanding per room, 30-day log at /housekeeping/linen)
✓ Maintenance module: fault reports (full CRUD, priority, cannot-fix workflow)
✓ Equipment registry with warranty tracking and service date alerts
✓ Preventive maintenance scheduling (plan, overdue/upcoming stats, complete with notes)
✓ External service firm registry and visit log (firms CRUD + visit history)
✓ F&B: menu management, allergen tagging, auto-name-tag generation (print-ready cards at /fnb/nametags)
✓ KBS integration: guests (check-in) — BullMQ queue + worker + no-op adapter
✓ Folio: FolioLine model, charge lines, balance summary at /reservation/[id]/folio
✓ KBS queue UI: notification status page at /kbs with detail drawer
✓ Printable HK report: A4 print route at /housekeeping/report/print (no chrome, window.open from report page)
✓ Rooms grid: fault indicator dot on room cards with open faultDetail
✓ Design system: Btn component, subtitle on PageHeader, tone prop on StatTile

### Phase 4 — Accounting & HR
☐ Stock item management with barcode support
☐ Warehouse hierarchy (main + department + sub)
☐ Purchase and sale invoice management
☐ GIB e-invoice integration (inbox sync + outbox send)
☐ Department request workflow (PENDING → APPROVED/REJECTED/MODIFIED)
☐ Inter-warehouse transfer slips
☐ Fixed asset register with depreciation
☐ Cash account management and transaction ledger
☐ VAT summary report
☐ HR: employee lifecycle, duplicate detection
☐ Shift management with conflict detection
☐ Leave request workflow
☐ Payroll calculation engine (configurable SGK/tax rates)
☐ Payslip PDF generation
☐ Discipline records and training/certificate tracking

### Phase 5 — CRM, Reporting & Design
☐ Checkout survey gate (blocking + bypassable)
☐ External review import (link-based, manual guest linking)
☐ Complaint book: photo → OCR → translate → pre-fill
☐ Guest segmentation (VIP, first-timer, loyal)
☐ Guest blacklist with reservation blocking
☐ Birthday/special day reminders (BullMQ cron)
☐ All 19 reports (screen views)
☐ Excel / PDF export for all reports
☐ Yield management chart (occupancy vs price trend)
☐ Document designer (invoice, payslip, contract, HK report, name tag)
☐ Price audit report with Excel export
☐ Marketing export (Facebook/Google compatible CSV)

### Phase 6 — Polish, Security & Launch
☐ End-to-end tests (Playwright) for all critical flows
☐ Unit tests (Vitest) for all service and calculation functions
☐ Database indexes on all FK and filter columns
☐ Rate limiting on all API routes (Upstash Redis)
☐ KVKK compliance audit (consent flags, data export, right-to-erasure)
☐ Super admin panel (tenant list, module toggle, impersonation)
☐ Billing integration (Stripe or Iyzico)
☐ Onboarding documentation for hotel staff
☐ CI/CD pipeline: GitHub Actions → Vercel + Railway
☐ Monitoring: Sentry + Axiom/Grafana
