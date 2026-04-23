# HotelOS Phase 1 — Design Handoff for Claude Code

This folder contains the reference designs for Phase 1. **Translate them into our production stack** (Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui + tRPC + Prisma) following the rules below. The designs are not final code — they are the **visual source of truth**.

---

## What to use as reference

| File | Purpose |
|---|---|
| `HotelOS Phase 1.html` | Entry point. Open in a browser to see every screen on a scrollable canvas. Use the sun/moon toggle in the topbar to flip light/dark. |
| `src/chrome.jsx` | **Shared chrome** — Sidebar, Topbar, AppShell, CommandPalette, Btn, Card, Chip. Treat as the design-system primitives to port into shadcn/ui. |
| `src/brand.jsx` | Logo / brand mark. |
| `src/icons.jsx` | Icon set. Replace with `lucide-react` (already shadcn-native) — each icon name maps 1:1. |
| `src/data.jsx` | Turkish sample data + formatters + status meta. Use as the shape reference for Prisma models and for realistic test seeds. |
| `src/screens/*.jsx` | The 8 Phase 1 screens, one file each. |
| `src/app.jsx` | How screens compose onto the canvas. Ignore the design-canvas wrapper when porting. |

---

## Screen inventory (Phase 1)

1. **Dashboard** — `dashboard.jsx` → `app/(dashboard)/page.tsx`
2. **Reservations list** — `reservation-list.jsx` → `app/(dashboard)/reservation/page.tsx`
3. **Reservation detail** (check-in, payments, e-sig, KBS) — `reservation-detail.jsx` → `app/(dashboard)/reservation/[id]/page.tsx`
4. **Reservation create wizard** — `reservation-create.jsx` → `app/(dashboard)/reservation/new/page.tsx`
5. **Rooms** (status grid: CLEAN / DIRTY / FAULTY / DND) — `rooms.jsx` → `app/(dashboard)/rooms/page.tsx`
6. **Guest profile + history** — `guest-profile.jsx` → `app/(dashboard)/guests/[id]/page.tsx`
7. **Onboarding / setup wizard** (6 steps, step 4 is Operasyon kuralları) — `onboarding.jsx` → `app/(onboarding)/page.tsx`
8. **Audit log viewer** — `audit-log.jsx` → `app/(dashboard)/settings/audit-log/page.tsx`

---

## Design tokens → Tailwind config

The designs use CSS custom properties that switch by theme class (`.theme-light`, `.theme-dark`). Port them to `tailwind.config.ts` with the `class` dark-mode strategy.

```ts
// tailwind.config.ts
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg:            'hsl(var(--bg))',
        surface:       'hsl(var(--surface))',
        'surface-2':   'hsl(var(--surface-2))',
        border:        'hsl(var(--border))',
        'border-strong':'hsl(var(--border-strong))',
        foreground:    'hsl(var(--text))',
        'fg-2':        'hsl(var(--text-2))',
        'fg-3':        'hsl(var(--text-3))',
        accent:        'hsl(var(--accent))',
        'accent-weak': 'hsl(var(--accent-weak))',
        'accent-fg':   'hsl(var(--accent-fg))',
        good:          'hsl(var(--good))',
        'good-bg':     'hsl(var(--good-bg))',
        warn:          'hsl(var(--warn))',
        'warn-bg':     'hsl(var(--warn-bg))',
        bad:           'hsl(var(--bad))',
        'bad-bg':      'hsl(var(--bad-bg))',
        info:          'hsl(var(--info))',
        'info-bg':     'hsl(var(--info-bg))',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',   // 6px
        lg:      'var(--radius-lg)', // 10px
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}
```

Exact hex values are in `HotelOS Phase 1.html` under `.theme-light` and `.theme-dark`. Convert them to HSL for shadcn compatibility.

---

## Component mapping (designs → shadcn/ui)

| Design component | shadcn/ui primitive | Notes |
|---|---|---|
| `<Btn variant="primary\|default\|ghost" size="sm\|md\|lg">` | `<Button variant="default\|outline\|ghost" size="sm\|default\|lg">` | Match padding and heights: sm=28px, md=32px, lg=40px |
| `<Card title right>` | `<Card>` + `<CardHeader>` + `<CardContent>` | Headers use 11px uppercase labels |
| `<Chip tone="good\|warn\|bad\|info\|neutral" dot>` | `<Badge variant=...>` | Add `dot` prop via leading circle span |
| `<Sidebar>` | custom, based on shadcn `<NavigationMenu>` | Collapsible, grouped by `Operasyon` / `Finans` etc |
| `<Topbar>` | custom | Includes sun/moon theme toggle — wire to `next-themes` |
| `<CommandPalette>` | `<Command>` from shadcn | Wire ⌘K shortcut |
| `<FilterPill>` | chip-style small button | Used in list filter bars |
| `<StatusStat>` | custom KPI tile | Used on Dashboard + Rooms |

---

## Hard rules (from section 11 of the roadmap)

These are non-negotiable — enforce in code:

- **Money** stored as integer kuruş. Use `formatCurrency(kurus)` for display. The design's `₺30.400` etc. comes from `trMoney()` in `src/data.jsx` — use that as the formatter shape.
- **Dates** stored UTC, displayed in `Europe/Istanbul`. Use Day.js. The design's `23 Nis 2026` shape comes from `trDate()`.
- **Turkish copy** — do NOT hardcode. Move every visible string into `messages/tr.json` and use `next-intl`. Use the Turkish strings in the designs as the canonical copy.
- **Tenant scoping** — every tRPC procedure calls `ctx.requireTenant()` first. Every repository method receives `tenantId` as first arg.
- **No cross-module DB access** — modules talk to each other only through router interfaces.

---

## Theme toggle

Use `next-themes` with `darkMode: 'class'`. The toggle lives in the topbar next to the bell. Design behavior: one click flips the whole app. Persist to `localStorage` (default) + respect system preference on first load.

---

## What's covered vs. still open (Phase 1)

✅ Every Phase 1 checklist item from Section 10 of the roadmap has a screen:
- Repo setup → N/A (infra)
- Clerk multi-tenancy → N/A (infra)
- Onboarding flow → screen 7 (6 steps, including Operasyon kuralları)
- Core DB schema → N/A (infra, but entity shapes reflected in screens)
- Reservation CRUD + price calc → screens 2, 3, 4
- Room status mgmt → screen 5
- Guest module → screen 6
- Audit log middleware → screen 8 surfaces it
- Basic dashboard → screen 1

⚠ Not yet designed (design discretion, can be added if needed):
- Login / sign-up (use Clerk's hosted UI for Phase 1)
- Error / empty / loading states — add per-screen as implemented
- Responsive breakpoints below 1024px (designs are desktop-first at 1440×900)

---

## Suggested translation order

1. **Tokens + shadcn setup** (tailwind config, theme provider, `next-themes`)
2. **Primitives** (Button, Card, Badge, Chip, FilterPill, KPI tile)
3. **Chrome** (Sidebar, Topbar, AppShell, CommandPalette) — reusable for every screen
4. **Screens** — build in this order to match the Phase 1 roadmap:
   1. Onboarding (Tenant setup is the first real flow)
   2. Rooms
   3. Guest profile
   4. Reservation list
   5. Reservation create wizard
   6. Reservation detail
   7. Dashboard
   8. Audit log

Each screen is self-contained — you can implement and ship one at a time.
