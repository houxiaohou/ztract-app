# Ztract – Web App

Ztract is a SaaS document data extraction tool. 
Users upload PDFs, images, Word, and Excel files; the system automatically extracts structured data and exports it as JSON or Excel.

This repository contains the **user-facing web dashboard** (authenticated app, not the marketing site).

## Tech Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript (strict mode)
- **UI**: shadcn/ui — Sky color theme, Vercel-inspired aesthetic (clean, minimal, high-contrast)
- **Styling**: Tailwind CSS v4
- **i18n**: `react-i18next` — default language English (`en`), also supports Chinese (`zh`)
- **State**: TanStack Query (server state) + Zustand (client state)
- **Routing**: React Router v7
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios with a shared instance in `src/lib/api.ts`

## Project Structure

```
src/
├── components/        # Shared UI components
│   └── ui/            # shadcn generated components — do NOT edit manually
├── features/          # Feature modules (each self-contained)
│   └── [feature]/
│       ├── components/
│       ├── hooks/
│       └── index.ts
├── hooks/             # Global custom hooks
├── layouts/           # Page layout wrappers
├── lib/               # Utility modules (api.ts, utils.ts, i18n.ts …)
├── locales/           # i18n translation files
│   ├── en/
│   └── zh/
├── pages/             # Route-level page components
├── stores/            # Zustand stores
└── types/             # Shared TypeScript types/interfaces
```

## Development Commands

```bash
pnpm dev          # Start dev server (http://localhost:5173)
pnpm build        # TypeScript check + Vite production build
pnpm typecheck    # tsc --noEmit only
pnpm lint         # ESLint
pnpm preview      # Preview production build locally
```

> Always run `pnpm typecheck` and `pnpm lint` after making changes. Fix all errors before considering a task done.

## Code Conventions

### TypeScript

- Enable `strict: true` — no `any`, no non-null assertion (`!`) without a comment explaining why.
- Prefer `interface` for object shapes, `type` for unions/intersections.
- Export types from `src/types/` when shared across features; keep them co-located otherwise.

### Components

- Functional components only, no class components.
- File naming: `PascalCase.tsx` for components, `camelCase.ts` for everything else.
- One component per file. Keep files under 300 lines — extract sub-components or hooks if longer.
- Props interfaces named `[ComponentName]Props`, defined in the same file.
- Avoid default exports for non-page files; use named exports.
- Pages (`src/pages/`) are the exception — they use default exports.

### Styling & UI

- Use Tailwind utility classes. Do not write custom CSS unless unavoidable.
- Follow the **Vercel-sky aesthetic**: white/neutral backgrounds, `sky-*` accent colors, clean typography, generous whitespace, subtle borders (`border-border`), no heavy shadows.
- Use shadcn/ui components as the baseline. Extend via `className` prop using `cn()` (from `src/lib/utils.ts`).
- Dark mode is not required in v1 — do not add it unless explicitly asked.
- Responsive breakpoints: design mobile-first (`sm` → `md` → `lg`).

### Internationalisation (i18n)

- **Every user-visible string must use `t()`** — no hardcoded English strings in JSX.
- Translation keys live in `src/locales/en/` and `src/locales/zh/`.
- Namespace by feature: `common`, `auth`, `dashboard`, `extraction`, `settings`, etc.
- Key format: `snake_case` (e.g. `upload_button`, `error_file_too_large`).
- When adding a new string: add the key to **both** `en` and `zh` files in the same commit/change. Use a placeholder like `"[TODO: translate]"` in `zh` if translation is unknown — never leave a key missing.
- Use `useTranslation('namespace')` hook; avoid importing `i18n` directly in components.

### Data Fetching

- All API calls go through `src/lib/api.ts` (the shared Axios instance).
- Use TanStack Query for all server state. No `useEffect` + `fetch` patterns.
- Query keys: array format `['resource', id, filters]`.
- Keep query/mutation logic in custom hooks inside `features/[feature]/hooks/`.

### Forms

- React Hook Form + Zod for all forms. Define the Zod schema first, infer the type from it.
- Do not manage form state with `useState`.

### Error Handling

- API errors should surface via TanStack Query's `error` state — display using a shared `<ErrorMessage>` component.
- Use `toast` (shadcn Sonner integration) for transient feedback (success/error after mutations).
- Never swallow errors silently (`catch (e) {}`).

### File & State Organisation

- Do not put business logic in page components. Pages compose feature components.
- Zustand stores in `src/stores/` handle only client-side UI state (modals, sidebar, preferences). Do not put server data in Zustand.

## Adding shadcn Components

```bash
pnpm dlx shadcn@latest add <component>
```

Generated files land in `src/components/ui/` — do not modify them directly. Wrap and extend in `src/components/` instead.

## Key Docs (load on demand)

- API contract & endpoints: `@docs/api.json`
- Feature specs: `@docs/features/`
- Design tokens / colour palette: `@docs/design.md`

## 关于接口地址与页面地址

- 开发环境的接口根路径为：http://127.0.0.1:8000
- 生产环境的接口根路径为：https://api.ztract.com
- 生产环境的项目部署域名：https://app.ztract.com

## 其他约定
- 链接、按钮等可以点击以及有点击事件的元素，需要用 pointer 鼠标；
- 服务器返回的时间为 utc 时间，需要根据用户本地时间进行展示，所有展示时间的地方都要这么处理。
