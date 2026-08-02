<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/shadcn%2Fui-Radix-000000?style=for-the-badge&logo=radixui&logoColor=white" alt="shadcn/ui"/>
</p>

# 💸 Montrax — Personal Finance, Rendered Beautifully

> The face of the Montrax money management platform — a fast, dark-mode-native, keyboard-friendly React SPA that turns a Spring Boot API into something people actually enjoy opening every day.

This isn't a CRUD form wearing a nice font. Every page here earns its keep: real-time budget progress bars, Chart.js trend lines, a command palette you can drive entirely from the keyboard, and a design system disciplined enough that a new page looks like it belongs the moment you build it.

---

## ✨ What This App Actually Does

Open it and you land on a **Dashboard** that answers "how am I doing?" in one glance — income vs. expense, savings rate, a category-breakdown donut chart, upcoming recurring bills in the next 7 days, budget alerts if you're close to a limit, and a "Who Owes You" widget if you've split any expenses. Everything else is one click away in the sidebar.

| Where | What happens there |
|---|---|
| 📊 **Dashboard** | The 30-second morning check — balance, savings rate, recent activity, upcoming bills, budget alerts |
| 💸 **Expenses / Incomes** | Full CRUD with tags, receipt attachments, optional account linking, optional expense-splitting, a fast client-side "this month" view, and a server-paginated "all transactions" view with real filtering |
| 🏦 **Accounts** | Bank/cash/wallet/credit-card/investment accounts with auto-adjusting balances and a net-worth trend chart |
| 🏷️ **Categories** | Icon-tagged, type-scoped (income vs. expense) categories that every other page depends on |
| 🎯 **Budgets** | Monthly limits per category with live progress bars that go amber, then red |
| 🐖 **Savings Goals** | Target-amount goals with progress tracking |
| 🔁 **Recurring** | Set-and-forget bills/income with reminders and pause/resume |
| 📈 **Analytics** | Weekly/monthly/6-month/yearly/custom-range charts, plus one-click **PDF/Excel report export** |
| 🧠 **AI Insights** | Spending predictions, anomaly detection, and Gemini-generated money-saving tips (plan-gated) |
| 🏛️ **Bank Import** | Upload a CSV/Excel statement, get auto-categorized transactions back |
| 👑 **Subscription** | Plan comparison, Razorpay checkout |
| 🛡️ **Admin** (role-gated) | User management, system stats, live runtime-config editing — invisible unless your role says `ADMIN` |

---

## 🏗️ How It's Put Together

```
┌──────────────────────────────────────────────────────────────┐
│                      BrowserRouter (App.tsx)                  │
│                                                                │
│  Public routes            │  Authenticated routes             │
│  /, /login, /register,    │  wrapped in <DashboardLayout>     │
│  /activate/:token,        │  (Sidebar + Header + <Outlet/>)   │
│  /oauth2/redirect         │  every /dashboard, /expenses, ... │
│                            │  page below                      │
└────────────┬───────────────────────────┬──────────────────────┘
             │                           │
             ▼                           ▼
   ┌───────────────────┐      ┌───────────────────────────┐
   │  Zustand store     │      │  axios instance (api.ts)  │
   │  (persisted:       │◀────▶│  Bearer token injected    │
   │  token + user)     │      │  401 → wipe + redirect    │
   └───────────────────┘      │  429 → debounced toast    │
                                └──────────┬─────────────────┘
                                           ▼
                                  Spring Boot backend
                                  (VITE_API_URL, default
                                   http://localhost:8090)
```

Every authenticated page is **lazy-loaded** (`React.lazy` + `Suspense`) so the initial bundle stays small — the login page doesn't pay for the Analytics page's Chart.js weight. Auth state lives in one small Zustand store (`useStore`), persisted to `localStorage` under `money-manager-storage`; the axios interceptor in `lib/api.ts` reads the JWT and attaches it to every request, and a 401 response hard-clears everything and bounces you to `/login` — no stale sessions lingering in a broken state.

### The OAuth2 flow is worth a special mention

Google sign-in doesn't just drop a JWT in a redirect URL — that's a classic way to leak a bearer token into browser history and access logs. Instead: the backend redirects to `/oauth2/redirect?code=<one-time-code>`, and `OAuth2RedirectPage` immediately exchanges that single-use, 60-second code for the real token via a POST request. The token never appears in a URL, ever.

### Data fetching, honestly described

Most pages use plain `useState` + `useEffect` + `axios` — not `@tanstack/react-query`, even though it's installed and wraps the whole app in a `QueryClientProvider`. That's a deliberate note for anyone touching this code: it's available, it's just not yet the dominant pattern outside a few call sites. Search/filter/pagination on the transaction lists is centralized in one hook — `useTransactionSearch` — rather than copy-pasted across Expenses and Incomes.

---

## 🎨 Design System

- **shadcn/ui + Radix primitives** — 49 pre-built, accessible components in `components/ui/`, never edited directly; app-specific composition happens one layer up in `components/shared/`.
- **Tailwind CSS**, class-based dark mode via `next-themes` (`ThemeProvider` + `ThemeToggle` — the whole app respects system preference by default and remembers your override).
- **A real typographic identity** — `font-display` shows up on every page heading, not just decoration; it's part of how the app reads as one product instead of a pile of pages.
- **Chart.js** (via `react-chartjs-2`) is the actual charting library in use across Analytics, Dashboard, and Accounts — `recharts` is present in `package.json` but not the pattern anything currently follows.
- **A command palette** (`⌘K` / `Ctrl+K`, see `CommandPalette.tsx`) — jump to any page or trigger "add expense" without touching the mouse.

---

## 📂 Project Structure

```
src/
├── App.tsx                     # Route table - public routes + lazy-loaded authenticated routes
├── main.tsx                    # Entry point
├── components/
│   ├── layouts/                # DashboardLayout, AuthLayout, Sidebar, Header
│   ├── shared/                 # App-specific composed components (TransactionCard,
│   │                           # BudgetProgressCard, IconPicker, CommandPalette, ...)
│   └── ui/                     # shadcn/ui primitives - 49 components, untouched
├── hooks/                      # useTransactionSearch, useOpenOnQueryParam, use-mobile, use-toast
├── lib/
│   ├── api.ts                  # axios instance, auth header, 401/429 handling
│   ├── constants.ts            # formatCurrency, formatDate, shared enums
│   ├── download.ts             # blob-download helper (used by report export)
│   └── utils.ts                # cn() classnames helper, getErrorMessage()
├── pages/                      # One file per route - 23 pages
├── store/
│   └── useStore.ts             # Zustand: auth (token, user), subscription, plan-gate checks
├── test/                       # Vitest setup + example test
└── types/
    └── index.ts                # Every DTO shape the backend returns, hand-kept in sync
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** (LTS)
- npm (or yarn/pnpm/bun — no strong opinion here)
- The [Montrax backend](../../moneymanager) running somewhere reachable, or point `VITE_API_URL` at a deployed instance

### Run it

```bash
git clone <this-repo-url>
cd montrax-frontend/money-manager-lovable
npm install
cp .env.example .env    # or create .env manually, see below
npm run dev
```

Open **http://localhost:5173**. That's it.

### Environment variables (`.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend base URL | `http://localhost:8090` if unset |
| `VITE_DEV_PORT` | Dev server port | `5173` if unset |

Both are consumed at build/dev time by `vite.config.ts` and `lib/api.ts` — no secrets live here, this is client-bundled config, not credentials.

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run build:dev` | Production build, development-mode env |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |

---

## 🧪 Testing

Vitest + Testing Library, jsdom environment (`src/test/setup.ts`). Run `npm run test` before shipping anything that touches shared hooks or components — `useTransactionSearch` and the auth store are the highest-leverage places a quiet regression could hide.

---

## 📦 Deployment

Any static host works — this is a Vite SPA, the build output in `dist/` is plain HTML/CSS/JS.

```bash
npm run build
# deploy dist/ to Vercel, Netlify, Cloudflare Pages, S3+CloudFront, nginx, wherever
```

The only thing that has to be set correctly wherever this lands is `VITE_API_URL`, pointed at your running backend, and CORS on the backend side needs that origin allow-listed (see the backend's `SecurityConfig`).

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT — see [LICENSE](LICENSE).

## 🙏 Built On Top Of

[shadcn/ui](https://ui.shadcn.com/) · [Radix UI](https://www.radix-ui.com/) · [Lucide Icons](https://lucide.dev/) · [Chart.js](https://www.chartjs.org/) · [TanStack Query](https://tanstack.com/query) · [Zustand](https://zustand-demo.pmnd.rs/) · [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

---

<p align="center">
  <b>Built with ❤️ for actually enjoying your own finances</b>
</p>
