# TECHAVEN — CURRENT CODEBASE AUDIT

**Generated:** 2026-09-20
**Scope:** Read-only inspection of `/home/giftshaibu/Documents/techaven_version1`
**Method:** No code was modified, refactored, deleted, or reformatted. No packages were installed. Only non-destructive inspection commands were run (`git status`, `git log`, `find`, `cat`, `tsc --noEmit`, `eslint .`, `npm run build`).

---

## 1. EXECUTIVE SUMMARY

Techaven is a **Lovable-generated TanStack Start (Vite) single-page application** with a **Supabase Postgres backend**. The repository is a *first-pass marketplace front end* built against a stated plan (`/home/giftshaibu/Documents/techaven_version1/.lovable/plan/techaven-marketplace-front-end-first-pass-2026-09-19.md`).

**What is solid:** The public browsing shell is complete and coherent — homepage, category pages, shop directory, shop storefronts, product pages, search, deals, catalogs, cart (localStorage), compare, trade-in, help. One canonical `ProductCard` component exists. A real design system (Tailwind v4 tokens in `src/styles.css`) is in place. TypeScript compiles cleanly. Production build succeeds.

**What is partially built:** Checkout is real end-to-end (Supabase `orders`/`order_items` inserts, address save, 3-step flow) but has **no payment provider integration** — all four payment methods are "manual" (Airtel Money / Mpamba / bank transfer / COD) with no webhook, no SDK, no capture. Authentication is real (Supabase email+password and Google OAuth via Lovable Cloud auth). Account pages (orders, saved, addresses) are real and query Supabase. The `/_authenticated` route tree is genuinely guarded.

**What is placeholder/mock:** **Every product, shop, category, brand, catalog, and promotion in the entire application is hardcoded static TypeScript** in `src/data/catalog.ts` (~50 products, 8 shops, 8 categories, 4 catalogs). There is **no database-backed product catalog at all**. Product images are not real images — `ImageStage` renders a neutral background + a Solar icon glyph per category. There is no Strapi/CMS of any kind. There is no admin/seller portal. There are no reviews (only a static `reviews` count). There is no real search backend. Compare and trade-in are static UI with no persistence.

**What is missing entirely:** Seller/shop management, seller onboarding, catalog management by shops, promotions engine, banners, campaigns, editorial content, real payments, email integration, order fulfillment automation, admin dashboard, Strapi CMS, analytics, wishlist persistence beyond `saved_products`, real product images, inventory management, multi-vendor order splitting, dispute/refund flow.

**Bottom line:** The customer-facing *browsing* experience is real and shippable. The *marketplace machinery* (sellers, catalogs, promotions, CMS, payments) does not exist yet. The Supabase schema only covers **accounts, addresses, saved products, and orders** — it has no `shops`, `products`, `categories`, `brands`, `promotions`, or `catalogs` tables.
---

## 2. TECHNOLOGY STACK

| Layer | Technology | Evidence |
|-------|-----------|----------|
| Meta-framework | TanStack Start v1.168.32 (Nitro under Cloudflare Workers) | `package.json`, `vite.config.ts`, `src/server.ts`, `src/start.ts` |
| Router | TanStack Router v1.170.18, file-based `src/routes/` | `src/routeTree.gen.ts`, `src/router.tsx` |
| Build/Vite | Vite 8.1.5 via `@lovable.dev/vite-tanstack-config` | `vite.config.ts`, `package.json` |
| Frontend | React 19.2.0, TS 5.8.3, Tailwind CSS v4 + `@tailwindcss/vite` | `package.json`, `src/styles.css` |
| State | TanStack React Query v5 (server state), React Context (cart, auth) | `src/lib/cart.tsx`, `src/lib/auth.tsx`, `src/lib/saved.ts` |
| Database | Supabase Postgres (via `@supabase/supabase-js` v2.116) | `src/integrations/supabase/*`, `drizzle/migrations/0000_accounts_orders_saved.sql` |
| ORM | Drizzle ORM v0.45 + drizzle-kit v0.31 (configured but **schema file is blank**) | `drizzle.config.ts`, `drizzle/schema.ts` (1 line, empty) |
| Auth | Supabase Auth (email/password + Google OAuth via Lovable Cloud) | `src/integrations/supabase/client.ts`, `auth-attacher.ts`, `auth-middleware.ts`, `src/lib/auth.tsx` |
| Icons | `@iconify/react` + Solar icon set (`@iconify-json/solar`) | `src/components/Icon.tsx`, `package.json` |
| UI primitives | shadcn-style Radix UI components in `src/components/ui/` | `components.json` ("new-york" style) |
| Forms | React Hook Form + Zod + `@hookform/resolvers` | `package.json` (present but **not used anywhere** in routes) |
| Payments | **None.** Manual payment instructions only | `src/routes/_authenticated/checkout.tsx:32-57` |
| Email | **None.** No SendGrid/Resend/EmailJS | No integration files |
| CMS | **None.** No Strapi | No integration files |
| Deployment | Cloudflare Workers via Nitro (auto-generated) | `.output/nitro.json`, `wrangler.json` |
| Package manager | npm (lockfile present) + bun.lock also present | `package-lock.json`, `bun.lock` |
| Lint/format | ESL 9 + Prettier 3.7 + `eslint-plugin-prettier` | `eslint.config.js`, `.prettierrc` |
| Typecheck | `tsc --noEmit` — **passes cleanly** | Verified |
| Tests | **No test framework.** No vitest/jest/playwright config or files | `find . -name "*.test.*"` → none |
| CI/CD | **None.** No `.github/workflows`, no Dockerfile | Repository root inspection |

### Environment variables (from `.env`, values NOT displayed)

| Variable | Used by | Status |
|----------|---------|--------|
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | Supabase client (client + server) | Referenced in `.env` |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase client | Referenced in `.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | `client.server.ts` (admin client, bypasses RLS) | **NOT in `.env`** — will throw at runtime if used |
| `LOVABLE_DB_MIGRATION_URL` | `drizzle.config.ts` dbCredentials | **NOT in `.env`** — drizzle-kit will fail |
| `SUPABASE_PROJECT_ID` | `.lovable/project.json` / `supabase/config.toml` | Static, in repo |

**Finding:** The `.env` file ships with **public Supabase keys** (`sb_publishable_...`), which is correct for a frontend. The `SUPABASE_SERVICE_ROLE_KEY` is **expected but absent** — any server-side admin operation will fail. `LOVABLE_DB_MIGRATION_URL` is absent — `drizzle-kit` cannot run against the DB. No secret values are exposed in the repo beyond the publishable key, which is intended.
test

---

## 3. REPOSITORY STRUCTURE

```
techaven_version1/
├── .env                    # SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (public)
├── .lovable/
│   ├── plan/
│   │   └── techaven-marketplace-front-end-first-pass-2026-09-19.md   # STATED PLAN
│   └── project.json        # template: tanstack_start_ts_current
├── drizzle/
│   ├── schema.ts           # BLANK (1 line comment: "auto-generated and intentionally left blank")
│   └── migrations/
│       ├── 0000_accounts_orders_saved.sql   # REAL migration: profiles, addresses, saved_products, orders, order_items
│       └── meta/0000_snapshot.json          # EMPTY snapshot (tables: {})
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── start.ts            # TanStack Start entry, CSRF middleware, error middleware, attachSupabaseAuth
│   ├── server.ts           # Cloudflare Workers entry, h3 error normalization
│   ├── router.tsx          # Router factory with QueryClient
│   ├── routeTree.gen.ts    # AUTO-GENERATED route tree (20 routes)
│   ├── styles.css          # DESIGN SYSTEM TOKENS (Tailwind v4 @theme inline)
│   ├── data/
│   │   └── catalog.ts      # ALL PRODUCT/SHOP/CATEGORY/CATALOG DATA (hardcoded)
│   ├── integrations/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser Supabase client (lazy proxy)
│   │   │   ├── client.server.ts     # Admin client w/ SERVICE ROLE KEY (bypasses RLS)
│   │   │   ├── types.ts             # GENERATED Database type (4 tables)
│   │   │   ├── auth-attacher.ts     # Attaches Bearer token to serverFn RPCs
│   │   │   ├── auth-middleware.ts   # requireSupabaseAuth middleware (UNUSED)
│   │   │   ├── cron-auth.ts         # Cron auth helper
│   │   │   └── previewAuthStorage.ts # Lovable preview auth storage
│   │   └── lovable/index.ts         # Lovable Cloud auth (Google OAuth)
│   ├── lib/
│   │   ├── auth.tsx         # AuthProvider, useAuth, safeRedirect
│   │   ├── cart.tsx         # CartProvider (localStorage), useCart
│   │   ├── saved.ts         # useSavedSlugs, useToggleSaved (Supabase)
│   │   ├── utils.ts         # cn() (clsx + tailwind-merge)
│   │   ├── error-capture.ts # Global error capture for SSR
│   │   ├── error-page.ts    # renderErrorPage() HTML
│   │   └── lovable-error-reporting.ts
│   ├── hooks/
│   │   └── use-mobile.tsx   # useIsMobile (768px breakpoint)
│   ├── components/
│   │   ├── Header.tsx        # Global header: announcement bar, utility row, search, mega menu, cart/auth
│   │   ├── MegaHeader.tsx    # Reusable page hero (categories, shops, catalogs, campaigns)
│   │   ├── Footer.tsx        # Global footer
│   │   ├── TrustStrip.tsx    # 4-trust badges
│   │   ├── ProductCard.tsx   # CANONICAL PRODUCT CARD
│   │   ├── ProductGrid.tsx   # ProductGrid + ProductRail
│   │   ├── ShopCard.tsx      # Shop directory card
│   │   ├── CategoryTile.tsx  # CategoryTile (home grid) + CategoryCard (categories page)
│   │   ├── PromoTile.tsx     # PromoTile + InlinePromo
│   │   ├── ImageStage.tsx    # PLACEHOLDER PRODUCT IMAGE (bg + Solar icon)
│   │   ├── SectionHeader.tsx # SectionHeader + ViewAllLink
│   │   └── Icon.tsx          # Solar icon wrapper
│   └── routes/
│       ├── __root.tsx        # Root shell: Header + <Outlet/> + Footer + AuthProvider + CartProvider
│       ├── index.tsx         # /  HOME
│       ├── categories.tsx    # /categories
│       ├── category.$slug.tsx # /category/:slug
│       ├── shops.index.tsx   # /shops
│       ├── shops.$shopSlug.tsx # /shops/:shopSlug
│       ├── catalogs.tsx      # /catalogs
│       ├── product.$slug.tsx # /product/:slug
│       ├── search.tsx        # /search
│       ├── deals.tsx         # /deals
│       ├── compare.tsx       # /compare
│       ├── trade-in.tsx      # /trade-in
│       ├── help.tsx          # /help
│       ├── cart.tsx          # /cart
│       ├── auth.tsx          # /auth (sign in / sign up)
│       └── _authenticated/
│           ├── route.tsx     # GUARD: redirects to /auth if no session
│           ├── checkout.tsx  # /checkout (3-step, real order creation)
│           ├── account.tsx   # /account (layout w/ tabs)
│           ├── account.index.tsx    # /account (details + addresses)
│           ├── account.orders.tsx   # /account/orders
│           ├── account.saved.tsx    # /account/saved
│           └── orders.$reference.tsx # /orders/:reference
├── supabase/config.toml     # project_id = "rzuhtysgkxavcewvztqp"
├── package.json, bun.lock, package-lock.json
├── tsconfig.json, vite.config.ts, drizzle.config.ts, eslint.config.js
└── AGENTS.md, README.md
```

---

## 4. ARCHITECTURE MAP (ASCII)

```
┌─────────────────────────────────────────────────────────┐
│                        BROWSER                          │
│   TanStack Router (file-based routes)                   │
│   ┌─────────────────────────────────────────────────┐   │
│   │  __root.tsx shell:                              │   │
│   │  Header │ <Outlet/> │ Footer                    │   │
│   │  Providers: QueryClient, AuthProvider, CartProvider │
│   └──────────────────────┬──────────────────────────┘   │
└──────────────────────────┼──────────────────────────────┘
                           │  fetch (SSR + SPA)
                           ▼
┌─────────────────────────────────────────────────────────┐
│  VITE / NITRO (Cloudflare Workers)                      │
│  src/server.ts → @tanstack/react-start/server-entry      │
│  src/start.ts: CSRF middleware, error middleware,        │
│    attachSupabaseAuth (functionMiddleware)              │
└──────────────────────────┬──────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌──────────────┐  ┌──────────┐  ┌──────────────────┐
   │  TanStack    │  │  Supabase│  │  Lovable Cloud   │
   │  Server Fns  │  │  Auth    │  │  Auth (Google)   │
   │  (none yet)  │  │  REST/   │  │  OAuth bridge    │
   └──────────────┘  │  Postgres│  └──────────────────┘
                     └────┬─────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌─────────┐ ┌─────────┐ ┌──────────┐
        │profiles │ │addresses│ │  orders  │
        │         │ │         │ │ + order_ │
        └─────────┘ └─────────┘ │  items   │
                                └──────────┘
                                saved_products
                                (4 tables total)

DATA LAYER (frontend):
  src/data/catalog.ts  ──  HARDODED STATIC TS
    ├── categories[]  (8)
    ├── shops[]       (8)
    ├── products[]    (50, derived from drafts[])
    ├── catalogs[]    (4)
    └── popularBrands[] (13)
  No API client file exists. No `services/` directory. No `api/` directory.
```

**Key architectural observation:** The frontend has **zero server functions (`createServerFn`)** and **zero API routes**. All "data" is imported directly from `src/data/catalog.ts`. The only real backend communication is:
1. Supabase Auth (login/signup/session)
2. Supabase Postgres queries for: `profiles`, `addresses`, `saved_products`, `orders`, `order_items`

There is no `products`/`shops`/`categories`/`promotions` table in Supabase. The entire merchandising catalog lives in a frontend TS file.
--- test append ---

---

## 5. ROUTE / PAGE INVENTORY

All routes are file-based under `src/routes/`. Source of truth: `src/routeTree.gen.ts`.

| # | Route | File | Status | Notes |
|---|-------|------|--------|-------|
| 1 | `/` | `src/routes/index.tsx` | ✅ WORKING | Full home: MegaHeader, category tiles, featured shops, hot deals, 2 editorial promos, browse-by-category, featured catalog, compare/trade-in callouts, TrustStrip, Footer |
| 2 | `/categories` | `src/routes/categories.tsx` | ✅ WORKING | All-category grid (CategoryCard), popular brands (static tags), featured catalogs, shops-by-specialty |
| 3 | `/category/:slug` | `src/routes/category.$slug.tsx` | ✅ WORKING | MegaHeader, subcategory pills, brand filter pills, shop filter select, condition filter select, sort select, ProductGrid, inline PromoTile, load-more button, compare CTA |
| 4 | `/shops` | `src/routes/shops.index.tsx` | ✅ WORKING | MegaHeader (dark), shop search, verified-only toggle, sort (4 options), ShopCard grid, empty state |
| 5 | `/shops/:shopSlug` | `src/routes/shops.$shopSlug.tsx` | ✅ WORKING | Store header (verified badge, location), store stats (rating/orders/specialty), store catalogs (filtered by `owner === shop.name`), full product grid |
| 6 | `/catalogs` | `src/routes/catalogs.tsx` | ✅ WORKING | MegaHeader (editorial), 4 catalogs, each with ProductRail (5 items) |
| 7 | `/product/:slug` | `src/routes/product.$slug.tsx` | ✅ WORKING | Image stage + 4 thumbnails, price/condition/discount, seller block, "also offered by" (computed, not real), specs, highlights, add-to-basket, related products, TrustStrip |
| 8 | `/search` | `src/routes/search.tsx` | 🟡 PARTIAL | Client-side in-memory filter over hardcoded data only. Matches name, brand, category. Returns category/shop/catalog links. No search index, no typo tolerance, no history. Empty-state + no-query state present |
| 9 | `/deals` | `src/routes/deals.tsx` | 🎨 UI ONLY | Filters `dealProducts` (products with `oldPrice`) by category, sorts by discount %. No "deal" data model — it is derived from `oldPrice` on the static product |
| 10 | `/compare` | `src/routes/compare.tsx` | 🎨 UI ONLY | Select up to 4 from first 16 products, renders comparison table (price, condition, shop, rating, specs, warranty). State is local React only — not persisted, not shareable |
| 11 | `/trade-in` | `src/routes/trade-in.tsx` | 🎨 UI ONLY | Static device-type cards, static 3-step process explanation. **No form, no valuation, no submission, no integration.** Links to `/help` |
| 12 | `/help` | `src/routes/help.tsx` | ✅ WORKING | Static FAQ content grid + "still need a hand" CTA |
| 13 | `/cart` | `src/routes/cart.tsx` | ✅ WORKING | Reads from CartProvider (localStorage). Line items, qty +/-, remove, empty basket state, subtotal/delivery/total. Delivery rule: free > MWK 900,000 or 0 items, else MWK 6,000 |
| 14 | `/auth` | `src/routes/auth.tsx` | ✅ WORKING | Sign in / sign up toggle. Email+password via Supabase Auth. Google OAuth via Lovable Cloud. Email-confirmation state. Redirects authenticated users to `safeRedirect` target |
| 15 | `/checkout` | `src/routes/_authenticated/checkout.tsx` | 🟡 PARTIAL | 3-step (delivery, payment, review). Real address save to Supabase. Real order insert (`orders` + `order_items`). **No payment SDK, no webhook, no capture.** All 4 payment methods are "manual instructions" |
| 16 | `/account` | `src/routes/_authenticated/account.tsx` | ✅ WORKING | Account layout: Details / Orders / Saved tabs, sign-out |
| 17 | `/account` (index) | `src/routes/_authenticated/account.index.tsx` | ✅ WORKING | Profile form (full name, phone → `profiles`), address CRUD (add/remove/make-default → `addresses`) |
| 18 | `/account/orders` | `src/routes/_authenticated/account.orders.tsx` | ✅ WORKING | Reads `orders` + `order_items` for current user. Status badge map (pending/confirmed/cancelled). Empty state |
| 19 | `/account/saved` | `src/routes/_authenticated/account.saved.tsx` | ✅ WORKING | Reads `saved_products` for current user, renders ProductGrid |
| 20 | `/orders/:reference` | `src/routes/_authenticated/orders.$reference.tsx` | ✅ WORKING | Order confirmation page. Reads `orders` + `order_items` by reference. Success state, totals, delivery/payment summary, CTAs |

**Auth guard:** `src/routes/_authenticated/route.tsx:7-15` — `beforeLoad` calls `supabase.auth.getSession()` and `throw redirect` to `/auth?redirect=...` if no session. This is a **real, working guard** for `/checkout`, `/account/*`, `/orders/*`.

**Dead/unused routes:** None. All 20 routes are linked from navigation (Header, Footer, MegaMenu, or CTAs).

**404 / error handling:** `src/routes/__root.tsx` defines `NotFoundComponent` and `ErrorComponent`. `src/server.ts` wraps SSR fetch and converts h3-swallowed HTTPError 500s into a rendered error page.

---

## 6. COMPONENT INVENTORY

### 6.1 Business components (in `src/components/`)

| Component | File | Reusability | Status |
|-----------|------|-------------|--------|
| `Header` | `src/components/Header.tsx` | Global, used by `__root.tsx` | ✅ Complete: announcement bar, utility row, wordmark, search field, mega menu, account/cart icons, mobile nav |
| `MegaHeader` | `src/components/MegaHeader.tsx` | Reused on `/`, `/categories`, `/category/:slug`, `/shops`, `/shops/:shopSlug`, `/catalogs`, `/compare`, `/trade-in`, `/help` | ✅ Reusable, data-driven (eyebrow, title, support, actions, stages, tone, aside) |
| `Footer` | `src/components/Footer.tsx` | Global | ✅ Complete: 4-column links, social icons, "Demo catalogue — placeholders" disclaimer |
| `TrustStrip` | `src/components/TrustStrip.tsx` | Reused on `/`, `/deals`, `/product/:slug` | ✅ Complete |
| `ProductCard` | `src/components/ProductCard.tsx` | **Canonical.** Used by `ProductGrid` and `ProductRail` everywhere | ✅ Complete: image, discount badge, wishlist heart, name, shop + verified, rating/reviews, price, old price, condition. Has `compact` prop (unused) |
| `ProductGrid` | `src/components/ProductGrid.tsx` | Reused everywhere product grids appear | ✅ Complete: columns (3|4), optional inline `PromoTile` at `promoAfter` index |
| `ProductRail` | `src/components/ProductGrid.tsx` | Reused on home + catalogs | ✅ Complete: horizontal snap rail, degrades to grid ≥md |
| `ShopCard` | `src/components/ShopCard.tsx` | Reused on `/`, `/categories`, `/shops` | ✅ Complete: logo placeholder (initials), verified badge, rating, location, product count |
| `CategoryTile` | `src/components/CategoryTile.tsx` | Reused on home | ✅ Complete: icon + name |
| `CategoryCard` | `src/components/CategoryTile.tsx` | Reused on `/categories` | ✅ Complete: icon, name, blurb, 3 subcategories |
| `PromoTile` | `src/components/PromoTile.tsx` | Reused on home (2 editorial) + category (inline) | ✅ Complete: headline, support, CTA, theme, optional stage image |
| `InlinePromo` | `src/components/PromoTile.tsx` | Reused inside `ProductGrid` | ✅ Complete |
| `SectionHeader` | `src/components/SectionHeader.tsx` | Reused everywhere | ✅ Complete: title, description, action, editorial font variant |
| `ViewAllLink` | `src/components/SectionHeader.tsx` | Reused everywhere | ✅ Complete |
| `ImageStage` | `src/components/ImageStage.tsx` | Reused everywhere | 🧪 PLACEHOLDER: renders `bg-stage` + a Solar category icon. No real product photography. Has `ratio` (square|portrait|wide) and `tone` (stage|brand|white) props |
| `Icon` | `src/components/Icon.tsx` | Global | ✅ Complete: Solar iconset wrapper |

### 6.2 UI primitive components (`src/components/ui/`)

shadcn/new-york style Radix primitives: `accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, checkbox, command, context-menu, collapsible, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, skeleton, slider, slot, sonner, switch, table, tabs, textarea, toast, toggle, toggle-group, tooltip`.

**Status:** All present as boilerplate. **Almost none are actually used by the application routes** — the routes use plain `<button>`, `<input>`, `<select>`, `<textarea>`, `<Link>`, and Tailwind classes directly. The `sonner` `Toaster` is wired in `__root.tsx`. `command.tsx` (cmdk) is unused. `form.tsx` (React Hook Form) is unused despite being in `package.json`.

### 6.3 Duplicate / inconsistent implementations

- **No duplicate ProductCard.** There is exactly one `ProductCard` and it is used everywhere. ✅
- **Two shop-card-like components?** No — only `ShopCard`. But `shops.$shopSlug` renders shop stats inline in `MegaHeader`'s `aside` prop instead of reusing `ShopCard`. Minor duplication of rating/order rendering.
- **Three different "shop name + verified" patterns:**
  - `ProductCard.tsx:73-86` — `shop?.name · N shops` + verified icon
  - `product.$slug.tsx:146-173` — "Sold by" block with avatar initials + verified
  - `shops.$shopSlug.tsx:56-66` — verified badge in eyebrow
- **Three different field components** (`Field`) are defined inline and duplicated across `auth.tsx`, `checkout.tsx`, `account.index.tsx`. Nearly identical 270-line copies.
- **Delivery fee logic duplicated** in `cart.tsx:33` and `checkout.tsx:97` (same `> 900000 ? 0 : 6000` rule). Single source of truth does not exist.

---

## 7. FEATURE MATRIX

| Area | Status | Evidence | Notes |
|------|--------|----------|-------|
| Homepage | ✅ WORKING | `src/routes/index.tsx` | 10 sections, all data-driven from `catalog.ts` |
| Header / nav | ✅ WORKING | `src/components/Header.tsx` | Announcement, search, mega menu, mobile nav, cart badge, auth state |
| Footer | ✅ WORKING | `src/components/Footer.tsx` | 4-col + social + placeholder disclaimer |
| Search | 🟡 PARTIAL | `src/routes/search.tsx` | Client-side only; no backend, no index, no history |
| Categories (list) | ✅ WORKING | `src/routes/categories.tsx` | Grid + brands + catalogs + shops |
| Category page | ✅ WORKING | `src/routes/category.$slug.tsx` | Filters, sort, inline promo, load-more |
| Product grid | ✅ WORKING | `src/components/ProductGrid.tsx` | Canonical grid + rail |
| Product page | ✅ WORKING | `src/routes/product.$slug.tsx` | Full PDP: images, price, seller, specs, related |
| Shops directory | ✅ WORKING | `src/routes/shops.index.tsx` | Search, verified filter, sort |
| Shop storefront | ✅ WORKING | `src/routes/shops.$shopSlug.tsx` | Header, stats, catalogs, product grid |
| Catalogs | ✅ WORKING | `src/routes/catalogs.tsx` | 4 curated catalogs with rails |
| Compare | 🎨 UI ONLY | `src/routes/compare.tsx` | Local state only, not persisted |
| Trade-in | 🎨 UI ONLY | `src/routes/trade-in.tsx` | Static info page, no form, no valuation |
| Cart | ✅ WORKING | `src/routes/cart.tsx`, `src/lib/cart.tsx` | localStorage-backed, persists across refresh |
| Checkout | 🟡 PARTIAL | `src/routes/_authenticated/checkout.tsx` | Real order creation in Supabase. **No payment provider.** 4 manual payment methods |
| Authentication | ✅ WORKING | `src/lib/auth.tsx`, `src/routes/auth.tsx`, `auth-attacher.ts` | Supabase email/password + Google OAuth. Session persisted |
| User account | ✅ WORKING | `src/routes/_authenticated/account.*` | Details, orders, saved, sign-out |
| Addresses | ✅ WORKING | `account.index.tsx`, `checkout.tsx` | CRUD via `addresses` table, RLS enforced |
| Orders | ✅ WORKING | `account.orders.tsx`, `orders.$reference.tsx` | List + detail, real Supabase queries |
| Wishlist / saved | ✅ WORKING | `src/lib/saved.ts`, `account.saved.tsx` | `saved_products` table, toggle from ProductCard |
| Reviews | ⚪ NOT BUILT | — | Only a static `reviews` integer on each Product. No review UI, no review table, no review submission |
| Promotions / deals | 🧪 MOCKED | `src/routes/deals.tsx` | Derived from `oldPrice` on static products. No promotion data model, no date windows, no shop-targeting |
| Banners / campaigns | ⚪ NOT BUILT | — | No banner component beyond `MegaHeader`. All homepage sections hardcoded into `index.tsx` |
| CMS / Strapi readiness | ⚪ NOT BUILT | — | No CMS integration. See §13 |
| Seller model | ⚪ NOT BUILT | — | `shops[]` is a static array. No seller portal, no onboarding, no catalog management. See §9 |
| Admin dashboard | ⚪ NOT BUILT | — | No admin routes, no admin auth |
| Payments | ⚪ NOT BUILT | `checkout.tsx:32-57` | All methods are "manual instructions". No Stripe/Mono/Pesa/Paystack SDK, no webhook handler, no capture |
| Email | ⚪ NOT BUILT | — | No email service, no order confirmation email, no receipt |
| Inventory | ⚪ NOT BUILT | — | `inStock: true` hardcoded on every product. No stock tracking, no low-stock alerts |
| Returns / refunds / disputes | ⚪ NOT BUILT | — | Only a static "buyer protection" marketing claim |
| Trade-in valuation | 🎨 UI ONLY | `src/routes/trade-in.tsx` | No form, no eligibility check, no value calculation |

---

## 8. PRODUCT-CARD AUDIT

### 8.1 Canonical component

**One canonical `ProductCard` exists at `src/components/ProductCard.tsx`.** It is used by both `ProductGrid` and `ProductRail`, and therefore by every product grid/rail on the site (home, category, shop, catalogs, search, related, saved). There is **no duplicate product-card implementation**.

### 8.2 What the canonical card renders

| Element | Status | Code |
|---------|--------|------|
| Image | 🧪 Placeholder | `ImageStage` — bg + Solar category icon. No real photography. `ratio="square"`, hover scale |
| Discount badge | ✅ | `-X%` black badge, top-left, shown only when `oldPrice` exists (`discountPercent`) |
| Wishlist heart | ✅ | Top-right toggle. Uses `useSavedSlugs` + `useToggleSaved`. Redirects to `/auth` if signed out |
| Product name | ✅ | 2-line clamp, link to PDP |
| Shop / seller | ✅ | Shows `shop.name` + verified icon. Special case: if `shopsCount > 1` shows "X · N shops" |
| Rating | ✅ | Star + `rating.toFixed(1)` + `(reviews)` count |
| Price | ✅ | `formatMwk(price)` |
| Old price | ✅ | Line-through, shown only when `oldPrice` exists |
| Condition | ✅ | Shown only when `condition !== "New"` (green pill) |
| Add-to-cart | ⚪ NOT ON CARD | Cart is handled at the PDP level, not the card. Card has no ATC button |

### 8.3 Gaps in the canonical card

1. **No "Add to cart" button on the card.** Users must click through to the PDP to add to basket. This is a deliberate design choice (flat cards, no hover ATC), but it is a UX cost.
2. **No stock indicator.** `inStock` exists on the Product type but is never rendered.
3. **No variant selector** (storage/color). `storage` exists on the type but is not shown on the card.
4. **No "quick compare" checkbox.** Compare page uses name pills, not card-level selection.
5. **`compact` prop is defined but never used.** Dead prop.
6. **No loading skeleton.** Cards render instantly from static data. A skeleton would be needed once data is async.

### 8.4 Where the card SHOULD live

Based on the architecture, the canonical product card should live in `src/components/` (it does) and be the **only** component importing `Product` and rendering a product tile. It currently imports from `@/data/catalog` directly, which is correct for now but **will need to be decoupled** when products come from an API/DB — the card should accept a `Product` prop, not import the data source. It already does this. ✅

The `ImageStage` component is the single chokepoint for all product imagery and is explicitly documented as "Placeholder imagery for now: a calm stage with a category glyph, sized so real photography can drop in later unchanged." This is the right design — **the image layer is the one place where a real photo feed (Strapi/CDN) can be swapped in without touching any card.**

---

## 9. MARKETPLACE / SHOP ARCHITECTURE

### 9.1 The current data model (from `src/data/catalog.ts`)

```ts
type Shop = {
  slug, name, specialty, location, verified, rating, orders, blurb
}
type Product = {
  slug, name, brand, category, shop, price, oldPrice?, condition, rating,
  reviews, shopsCount, storage?, warranty, delivery, inStock, specs[], highlights[]
}
type Catalog = { slug, title, owner, blurb, productSlugs[] }
type Category = { slug, name, icon, blurb, subcategories[], brands[] }
```

### 9.2 Answering the specific questions

| Question | Answer | Evidence |
|----------|--------|----------|
| Can one shop have many products? | **Yes** (in data) | `productsByShop(slug)` filters `products` by `p.shop === slug`. Shops have 1–7 products |
| Can one product belong to a shop? | **Yes** (in data) | `Product.shop` is a single `shop` slug string |
| Can multiple shops sell the same underlying product? | **Partially.** The model has `shopsCount` (an integer) and "Also offered by" is **computed by adding MWK 15,000 to the price per other shop**, not from real data | `product.$slug.tsx:57-60`: `otherShops = shops.filter(s => s.slug !== shop.slug).slice(0, max(shopsCount-1,0)).map((s,i) => ({shop:s, price: product.price + (i+1)*15000}))` — **FAKE PRICING** |
| Does the system distinguish a product from a seller's listing? | **No.** There is no `listing`/`offer` entity. A product IS the listing. `Product.shop` is a single string, not a many-to-many | `catalog.ts` types |
| Does inventory belong to the product or the shop listing? | **Neither.** `inStock: true` is hardcoded on every product. No inventory table exists | All 50 products have `inStock: true` |
| Can a shop have its own catalog? | **Yes** (in data) | `Catalog.owner` is a shop name string. `shops.$shopSlug` filters `catalogs.filter(c => c.owner === shop.name)` |
| Can a shop have its own page? | **Yes** | `/shops/:shopSlug` renders shop header, stats, catalogs, product grid |
| Can a customer browse products from one shop? | **Yes** | `productsByShop(slug)` + `ProductGrid` on the shop page |
| Can shops have logos, banners, descriptions, policies? | **Partially.** `Shop` has `blurb` (description) and `specialty`. **No logo, no banner, no policy fields.** ShopCard renders a placeholder logo (initials in a circle) | `ShopCard.tsx:12-14` uses `shop.name.charAt(0)` as logo |
| Can promotions target a specific shop? | **No.** No promotion model exists. `dealProducts` is `products.filter(p => p.oldPrice)` — no shop targeting | `catalog.ts` |
| Can promotions target a catalog? | **No.** Same as above | — |
| Can products belong to multiple catalogs? | **Yes** (in data) | `Catalog.productSlugs[]` is an array; a product can appear in multiple catalogs. But there is **no reverse index** (`productsByCatalog`) — only `productsBySlugs` | `catalog.ts` |

### 9.3 Architectural gaps (the mall model does NOT exist)

1. **No `shops` table in Supabase.** The `shops` array lives in frontend TS only.
2. **No `products` table.** All 50 products are static TS objects.
3. **No `categories` table.** Static TS.
4. **No `brands` table.** Static strings.
5. **No `catalogs` table.** Static TS.
6. **No `listings` / `offers` table.** The product↔shop relationship is a single string field, so **a product cannot be sold by two shops with different prices/stock** in the data model. `shopsCount` is a decorative integer.
7. **No seller auth / seller portal.** There is no way for a shop owner to log in, manage products, set prices, or view orders.
8. **No shop verification workflow.** `verified: true/false` is a static boolean.
9. **No inventory table.** `inStock` is a hardcoded boolean.
10. **No promotion/coupon/discount model.** "Deals" are derived entirely from `oldPrice`.
11. **No multi-vendor order splitting.** `orders` and `order_items` store `shop_slug` per line item, which is the right foundation, but nothing splits fulfillment or payouts by shop.
12. **No shop policies, return policies, delivery promises (beyond a static string), or operating hours.**

### 9.4 What the schema DOES have

The Supabase migration (`drizzle/migrations/0000_accounts_orders_saved.sql`) creates **only**:
- `profiles` (id, full_name, phone) — one row per auth user
- `addresses` (user_id, label, recipient, phone, city, area, street, notes, is_default)
- `saved_products` (user_id, product_slug) — wishlist
- `orders` (user_id, reference, status, payment_method, fulfilment, recipient, phone, city, area, street, notes, subtotal, delivery_fee, total)
- `order_items` (order_id, user_id, product_slug, product_name, shop_slug, unit_price, quantity)

**This is a customer-account + order schema. It is NOT a marketplace catalog schema.**

---

## 10. DATA-SOURCE AUDIT

Every UI section and where its data comes from:

| UI Section | Data Source | Category |
|-----------|-------------|----------|
| Homepage — all sections (hero, category tiles, featured shops, hot deals, editorial promos, browse-by-category, featured catalog, compare/trade-in callouts, recommended) | `src/data/catalog.ts` | **HARDCODED** |
| Categories list page | `src/data/catalog.ts` | **HARDCODED** |
| Category page (products, filters, subcategories, brands) | `src/data/catalog.ts` | **HARDCODED** |
| Shops directory | `src/data/catalog.ts` | **HARDCODED** |
| Shop storefront (header, catalogs, products) | `src/data/catalog.ts` | **HARDCODED** |
| Catalogs page | `src/data/catalog.ts` | **HARDCODED** |
| Product detail page | `src/data/catalog.ts` (via `getProduct` in route `loader`) | **HARDCODED** |
| Search | In-memory filter over `src/data/catalog.ts` | **HARDCODED** |
| Deals | `dealProducts = products.filter(p => p.oldPrice)` | **HARDCODED** (derived) |
| Compare | `products` array | **HARDCODED** |
| Trade-in | Static JSX only, no data | **HARDCODED** |
| Help | Static JSX only | **HARDCODED** |
| Cart lines | `localStorage` (`techaven.cart.v1`) via React Context | **LOCALSTORAGE** |
| Cart item details (name, price, shop) | `src/data/catalog.ts` via `getProduct` | **HARDCODED** |
| Checkout — saved addresses | Supabase `addresses` table | **DATABASE** (real) |
| Checkout — profile (name/phone) | Supabase `profiles` table | **DATABASE** (real) |
| Checkout — order creation | Supabase `orders` + `order_items` insert | **DATABASE** (real) |
| Account — details (name, phone) | Supabase `profiles` | **DATABASE** (real) |
| Account — addresses CRUD | Supabase `addresses` | **DATABASE** (real) |
| Account — orders list | Supabase `orders` + `order_items` | **DATABASE** (real) |
| Account — saved products | Supabase `saved_products` | **DATABASE** (real) |
| Order confirmation page | Supabase `orders` + `order_items` by reference | **DATABASE** (real) |
| Authentication (session, user) | Supabase Auth | **REAL** |
| Product images | `ImageStage` component | **PLACEHOLDER** (bg + icon) |
| Banners / promotions / campaigns | None exist | **NOT BUILT** |
| Editorial content | None exists | **NOT BUILT** |

**Summary:** 100% of merchandising content (products, shops, categories, brands, catalogs, deals) is **hardcoded TypeScript**. The only real database data is **customer account data and orders**. There is no CMS, no API layer, no Strapi.

---

## 11. API CONNECTIONS

### 11.1 Actual architecture

There are **no API endpoints, no server functions, no `createServerFn`, and no route handlers** in this repository. The TanStack Start SSR layer exists but is only used for:
- Rendering pages server-side
- Supabase Auth session middleware (`auth-attacher.ts`)
- CSRF protection (`start.ts`)
- Error normalization (`server.ts`)

All data fetching from the frontend is direct Supabase PostgREST calls via `@supabase/supabase-js`.

### 11.2 The real data-flow map

```
PRODUCT BROWSING (every public page)
    ↓
src/data/catalog.ts  (hardcoded TS)
    ↓
Page component renders directly — NO client/service/endpoint/handler/model chain
    ↓
(NOTHING in the database)

CART
    ↓
src/lib/cart.tsx  (React Context + localStorage)
    ↓
(NOTHING in the database)

ADDRESSES (checkout + account)
    ↓
src/routes/_authenticated/checkout.tsx, account.index.tsx
    ↓
useQuery → supabase.from("addresses").select("*")
    ↓
GET https://<project>.supabase.co/rest/v1/addresses?user_id=eq.<uid>
    ↓
addresses table (RLS: auth.uid() = user_id)

PROFILES
    ↓
checkout.tsx, account.index.tsx
    ↓
useQuery → supabase.from("profiles").select("full_name, phone").eq("id", user.id)
    ↓
profiles table (RLS: auth.uid() = id)

ORDERS (creation)
    ↓
checkout.tsx → useMutation
    ↓
supabase.from("orders").insert({...}).select().single()
    supabase.from("order_items").insert([...])
    ↓
POST /rest/v1/orders, /rest/v1/order_items
    ↓
orders + order_items tables (RLS: auth.uid() = user_id for insert)

ORDERS (reading)
    ↓
account.orders.tsx → supabase.from("orders").select("*, order_items(id, product_name, quantity)").order("created_at", desc)
    orders.$reference.tsx → supabase.from("orders").select("*, order_items(*)").eq("reference", reference).maybeSingle()
    ↓
orders + order_items tables

SAVED PRODUCTS
    ↓
src/lib/saved.ts → useSavedSlugs, useToggleSaved
    ↓
supabase.from("saved_products").select("product_slug")
    insert/delete with .eq("user_id", user.id)
    ↓
saved_products table (RLS: auth.uid() = user_id)

AUTH
    ↓
src/lib/auth.tsx → supabase.auth.onAuthStateChange, getSession
    src/routes/auth.tsx → supabase.auth.signUp, signInWithPassword
    src/integrations/lovable/index.ts → lovableAuth.signInWithOAuth → supabase.auth.setSession
    ↓
Supabase Auth (GoTrue)
```

### 11.3 Flags

| Issue | Detail |
|-------|--------|
| **Frontend calls with no backend implementation** | All product/shop/category/catalog/search/deals/compare/trade-in data. There is no backend for any of it |
| **Backend endpoints with no frontend consumer** | None — there are no backend endpoints |
| **Duplicated API clients** | Two Supabase clients: `client.ts` (browser, lazy proxy) and `client.server.ts` (service-role admin, lazy proxy). This is correct, not duplication. `auth-middleware.ts` creates a **third** ephemeral client per request with the user's bearer token — this one is **defined but never imported anywhere** |
| **Hardcoded URLs** | `auth.tsx:63`: `emailRedirectTo: ${window.location.origin}${destination}` — uses `window.location.origin`, acceptable. No other hardcoded API URLs |
| **Inconsistent error handling** | Supabase errors are caught and shown via `toast.error(error instanceof Error ? error.message : ...)` in auth/checkout/account. `saved.ts` throws the raw error from `queryFn`. `orders.$reference` has no error state beyond the `!order.data` branch. Mixed |
| **Missing validation** | Checkout inserts `subtotal`, `delivery_fee`, `total` computed on the **client** from cart data. The database has no CHECK constraints beyond `quantity > 0`. Prices are **client-supplied** — a manipulated cart could submit arbitrary totals |
| **Unused endpoints/middleware** | `requireSupabaseAuth` (`auth-middleware.ts`) is exported but **never used**. No server function is protected by it. The only auth guard is the route-level `beforeLoad` in `_authenticated/route.tsx`, which runs on the client |
| **No server functions at all** | `src/start.ts` registers `attachSupabaseAuth` as a `functionMiddleware`, but there are **zero `createServerFn` calls** in the entire codebase. The CSRF middleware filters `ctx.handlerType === "serverFn"` — which will never fire |

---

## 12. DATABASE / MODEL FINDINGS

### 12.1 Supabase schema (generated type: `src/integrations/supabase/types.ts`)

Only **4 tables** exist in the `public` schema:

| Table | Columns | Purpose |
|-------|---------|---------|
| `profiles` | id (FK auth.users), full_name, phone, created_at, updated_at | Customer contact details |
| `addresses` | id, user_id (FK), label, recipient, phone, city, area, street, notes, is_default, created_at | Saved delivery addresses |
| `saved_products` | id, user_id (FK), product_slug, created_at | Wishlist (UNIQUE user_id, product_slug) |
| `orders` | id, user_id (FK), reference (UNIQUE), status, payment_method, fulfilment, recipient, phone, city, area, street, notes, subtotal (BIGINT), delivery_fee (BIGINT), total (BIGINT), created_at | Order header |
| `order_items` | id, order_id (FK), user_id (FK), product_slug, product_name, shop_slug, unit_price (BIGINT), quantity (INTEGER, CHECK > 0) | Order lines |

**No views, no enums, no composite types, no functions, no triggers in the generated type.**

### 12.2 Migration file

`drizzle/migrations/0000_accounts_orders_saved.sql` (113 lines) creates all 5 tables above plus:
- RLS policies on every table (users can only touch their own rows)
- A `handle_new_user()` trigger + `on_auth_user_created` trigger that auto-creates a `profiles` row on signup
- Indexes: `addresses_user_idx`, `order_items_order_idx`

**RLS is correctly enforced on every table.** `orders` and `order_items` grant SELECT/INSERT to `authenticated`, service_role gets ALL.

### 12.3 Drizzle status

- `drizzle.config.ts` exists, dialect `postgresql`, schema path `./drizzle/schema.ts`, out `./drizzle/migrations`
- **`drizzle/schema.ts` is BLANK** (1 line: `// auto-generated and intentionally left blank, do not edit`)
- `drizzle/migrations/meta/0000_snapshot.json` has `"tables": {}` — the snapshot is empty
- The SQL migration file exists but was **not generated by drizzle-kit** (it predates the blank schema)
- `LOVABLE_DB_MIGRATION_URL` is not in `.env` — `drizzle-kit push` cannot run

**Conclusion:** Drizzle is configured but **non-functional**. The actual schema is managed by a hand-written SQL migration in `supabase/`-adjacent `drizzle/migrations/`. There is no Drizzle ORM schema to generate from.

### 12.4 Models that exist ONLY in frontend TS (`src/data/catalog.ts`)

| Model | Fields | Has DB table? |
|-------|--------|---------------|
| `Category` | slug, name, icon, blurb, subcategories[], brands[] | ❌ No |
| `Shop` | slug, name, specialty, location, verified, rating, orders, blurb | ❌ No |
| `Product` | slug, name, brand, category, shop, price, oldPrice, condition, rating, reviews, shopsCount, storage, warranty, delivery, inStock, specs[], highlights[] | ❌ No |
| `Catalog` | slug, title, owner, blurb, productSlugs[] | ❌ No |

### 12.5 Relationships that exist

```
auth.users ──(1)──(many)── addresses.user_id
auth.users ──(1)──(many)── saved_products.user_id
auth.users ──(1)──(many)── orders.user_id
orders ──(1)──(many)── order_items.order_id
order_items.shop_slug ──(references nothing)── [no shops table]
order_items.product_slug ──(references nothing)── [no products table]
saved_products.product_slug ──(references nothing)── [no products table]
```

**All `*_slug` fields are free strings with no foreign key constraints.** This is correct for now (the referenced tables don't exist) but means orphaned slugs are possible.

### 12.6 Missing models for a real marketplace

`shops`, `products`, `product_variants`, `categories`, `brands`, `catalogs`, `catalog_products`, `listings`/`offers`, `inventory`, `promotions`, `coupons`, `reviews`, `brands`, `shops` (logo/banner/policy), `seller_accounts` (linking auth users to shops), `payouts`, `withdrawals`.

---

## 13. CMS / STRAPI READINESS

### 13.1 Current state: NOT READY

There is no Strapi, no headless CMS, no content API, and no content-fetching pattern anywhere in the codebase.

### 13.2 How homepage sections are currently built

Every section in `src/routes/index.tsx` is **hardcoded directly into the page component**:

| Homepage section | How it is built | Reusable component? | Data-driven? |
|-----------------|-----------------|--------------------|--------------|
| MegaHeader hero | Inline JSX in `index.tsx` | ✅ `MegaHeader` | Hardcoded strings + `shops.length`, `products.length` |
| Category tiles | `categories.map((c) => <CategoryTile category={c} />)` | ✅ `CategoryTile` | From `catalog.ts` array |
| Featured shops | `shops.slice(0,4).map((s) => <ShopCard shop={s} />)` | ✅ `ShopCard` | From `catalog.ts` array |
| Hot deals | `dealProducts.slice(0,5)` → `ProductRail` | ✅ `ProductRail` → `ProductCard` | From `catalog.ts` array |
| Editorial promos (2) | `editorialPromos.map((p) => <PromoTile promo={p} />)` | ✅ `PromoTile` | **Hardcoded array literal inside the component** |
| Browse by category | `categories.slice(0,4).map((c) => <CategoryCard category={c} />)` | ✅ `CategoryCard` | From `catalog.ts` array |
| Featured catalog | Inline JSX + `catalogs[0]` + `productsBySlugs(...).slice(0,4)` | ❌ Inline, not a component | From `catalog.ts` |
| Compare callout | Inline JSX | ❌ Inline | Hardcoded |
| Trade-in callout | Inline JSX | ❌ Inline | Hardcoded |
| Recommended | `products.slice(12,17)` → `ProductRail` | ✅ `ProductRail` | From `catalog.ts` array |
| TrustStrip | `<TrustStrip />` | ✅ `TrustStrip` | Hardcoded strings inside component |

### 13.3 The good news

- `MegaHeader`, `PromoTile`, `CategoryTile`, `CategoryCard`, `ShopCard`, `ProductCard`, `ProductGrid`, `ProductRail`, `SectionHeader`, `ViewAllLink` are all **reusable, prop-driven components**. They can be re-rendered from CMS data without touching their internals.
- `ImageStage` is a single chokepoint for imagery — a CMS image URL could replace the icon+bg without touching any consumer.
- The `Promo` type (`src/components/PromoTile.tsx:40-49`) is already structured: `headline, support, cta, to, params?, theme, stageCategory?, editorial?`. This is close to what a CMS entry would need.

### 13.4 What would need to change for Strapi to drive the homepage

A Strapi content type equivalent to:

```json
{
  "type": "promotion_banner",
  "title": "Samsung Week",
  "image": "...",
  "targetType": "catalog",
  "target": "samsung-week"
}
```

would require:

1. **A homepage-sections data structure** — currently `index.tsx` imports `catalogs`, `categories`, `products`, `shops`, `dealProducts` directly. There is no "homepage sections" array. A CMS would need to either replace these imports or sit alongside them.
2. **A `target` resolution layer** — `targetType: "catalog"` → `target: "samsung-week"` needs to resolve to a route. Currently `Promo.to` is a hardcoded route string. A CMS-driven promo needs a `targetType` + `targetSlug` → route resolver.
3. **Image handling** — `ImageStage` currently takes a `category` string and renders an icon. A CMS image URL would need a new prop or a new component variant (e.g. `ImageStage src={cmsUrl} />`).
4. **The `editorialPromos` array is defined inside the component** — it would need to move to a data file or a fetch.
5. **No fetching client** — there is no `lib/api.ts`, no `services/cms.ts`, no `usePromos()` hook. A Strapi client + React Query hooks would need to be added from scratch.

### 13.5 Readiness rating

** ███░░░░░░░ (3/10 — Early)**

The component library is ready. The data model, fetching layer, and image handling are not. The gap is **moderate** — the components are reusable, but the page currently imports data directly and has no CMS-fetching pattern, no `target` resolution, and no image URL support.

### 13.6 What would make it CMS-ready (recommendations, not implementation)

- Extract `editorialPromos` and all hardcoded homepage copy into a `src/data/homepage.ts` (or fetch from Strapi)
- Add `src` (image URL) support to `ImageStage`
- Add a `resolveTarget(type, slug)` helper for promo links
- Add a Strapi client + React Query hooks in `src/lib/`
- Define a Strapi content-type schema matching the `Promo`/`MegaHeader`/`SectionHeader` shapes

---

## 14. DESIGN-SYSTEM IMPLEMENTATION STATUS

### 14.1 Specified vs implemented

The stated plan (`.lovable/plan/...first-pass-2026-09-19.md`) specifies:
- Brand blue `#404DFE` with lighter/darker steps
- Deep ink `#11123A` / `#050526`
- Neutral canvas `#FAFAFA`, white surfaces
- Public Sans for all interface text; Source Serif 4 for large campaign headlines
- 1440px max width, 4px spacing rhythm, near-zero shadows, flat product cards, pill-shaped search, 8px buttons
- Colour rationed: product images stay the most colourful thing on browse pages

### 14.2 What is actually implemented (`src/styles.css`)

| Token | Spec value | Implemented value | Match? |
|-------|-----------|-------------------|--------|
| Brand 500 | `#404DFE` | `oklch(0.542 0.264 269.5)` ≈ `#4D4DFF` | Close (slightly more saturated) |
| Brand 100/300/700/800 | steps | oklch steps at 283.9/274.3/271.6/273.5 hue | ✅ Full scale present |
| Ink 900 | `#11123A` | `oklch(0.146 0.048 279.3)` ≈ `#1A1A4A` | Close |
| Ink 800 | `#050526`? | `oklch(0.222 0.056 277.4)` ≈ `#2A2A5A` | Close |
| Canvas | `#FAFAFA` | `--neutral-050: oklch(0.985 0 0)` ≈ `#FCFCFC` | ✅ |
| Surface | white | `--surface: oklch(1 0 0)` | ✅ |
| Stage | — | `--stage: oklch(0.961 0 0)` ≈ `#F5F5F5` | ✅ |
| Font sans | Public Sans | `--font-sans: "Public Sans", system-ui...` via Google Fonts link | ✅ |
| Font editorial | Source Serif 4 | `--font-editorial: "Source Serif 4", Georgia...` via Google Fonts link | ✅ |
| Max width | 1440px | `.shell` utility: `max-width: 1360px` | ⚠️ 1360 vs 1440 (5.5% narrower) |
| Radius | — | `--radius: 0.5rem` (8px) | ✅ |
| Shadows | "near-zero" | **Zero shadows used anywhere** | ✅ |
| Product cards | "flat" | Flat, no shadow, border on hover only | ✅ |
| Search | "pill-shaped" | `rounded-full` | ✅ |
| Buttons | "8px" | `rounded-lg` (0.5rem = 8px) | ✅ |

### 14.3 Design-system consistency

**There is one design system.** All components use the same Tailwind token names (`brand-500`, `ink-900`, `surface`, `stage`, `info-soft`, `success-soft`, `rating`, `border`, `muted-foreground`). There is **no hardcoded hex colour anywhere** in the business components — every colour is a Tailwind semantic class.

**Breakpoints used:** `sm: 640px`, `md: 768px`, `lg: 1024px`, `2xl: 1536px`. Consistent.

**Spacing:** 4px rhythm is mostly respected (gap-3 = 12px, gap-4 = 16px, gap-5 = 20px, gap-6 = 24px, gap-8 = 32px, py-10 = 40px, py-14 = 56px, py-16 = 64px). A few arbitrary values exist (`w-[62%]` in `ProductRail`, `w-24`/`w-28` for thumbnails, `lg:-mr-24` in `MegaHeader`) but they are justified by layout needs.

### 14.4 Issues found

1. **Two different "shop name + verified" patterns** (see §6.3) — inconsistent micro-patterns for the same concept.
2. **Three duplicated `Field` components** (`auth.tsx`, `checkout.tsx`, `account.index.tsx`) — nearly identical 270-line copies with the same markup. Should be a shared `src/components/Field.tsx`.
3. **`Field` in `auth.tsx` is more featureful** (placeholder, autoComplete, required) than the others — the copies are not identical, so a shared component would need all props.
4. **Delivery fee logic duplicated** in `cart.tsx:33` and `checkout.tsx:97`.
5. **`MegaHeader` has 4 `tone` variants** (`brand-soft`, `neutral`, `dark`, `brand`) and they are used consistently — good.
6. **No dark mode implemented** despite `.dark` class being defined in `styles.css:137`. The `.dark` variant is defined but never applied to `<html>`.
7. **No loading/empty/error states** for any data-driven component — everything renders instantly from static data. These will need to be added when data becomes async.
8. **Typography scale is informal** — font sizes are chosen ad-hoc (`text-[15px]`, `text-[13px]`, `text-[11px]`) rather than from a defined type scale. This is a Lovable-generated pattern and is internally consistent but not tokenized.

### 14.5 Verdict

**The design system is real, tokenized, and consistently applied.** The implementation closely matches the stated plan. The main debt is **duplicated `Field` components** and **missing shared form primitives** (the shadcn `input.tsx`/`label.tsx`/`form.tsx` exist but are unused — routes use inline-styled inputs instead).

---

## 15. AUTHENTICATION / SECURITY REVIEW

### 15.1 Authentication: WORKING

| Mechanism | Status | Evidence |
|-----------|--------|----------|
| Email/password signup | ✅ Working | `auth.tsx:58-71` — `supabase.auth.signUp({email, password, options: {emailRedirectTo, data: {full_name, phone}}})` |
| Email/password sign in | ✅ Working | `auth.tsx:73-77` — `supabase.auth.signInWithPassword({email, password})` |
| Google OAuth | ✅ Working | `auth.tsx:85-101` — via `lovable.auth signInWithOAuth("google")` → `supabase.auth.setSession(result.tokens)` |
| Email confirmation flow | ✅ Working | `auth.tsx:104-119` — "Confirm your email" state when `!data.session` after signup |
| Session persistence | ✅ Working | `auth.tsx:48-52` — `onAuthStateChange` + `getSession`, `persistSession: true` in client config |
| Session on server Fns | ✅ Working | `auth-attacher.ts` — attaches `Authorization: Bearer <token>` to every serverFn RPC |
| Sign out | ✅ Working | `account.tsx:23-28` — clears React Query cache, `supabase.auth.signOut()`, navigates to `/auth` |

### 15.2 Authorization: PARTIAL

| Area | Status | Detail |
|------|--------|--------|
| Authenticated-route guard | ✅ Working | `_authenticated/route.tsx:7-15` — `beforeLoad` checks session, redirects to `/auth?redirect=...` |
| Row-level security | ✅ Working | All 5 tables have RLS policies enforcing `auth.uid() = user_id` |
| Service-role admin client | ⚠️ Defined but unused | `client.server.ts` — `SUPABASE_SERVICE_ROLE_KEY` not in `.env`, would throw if used |
| `requireSupabaseAuth` middleware | ❌ Dead code | `auth-middleware.ts:34` — exported, validates Bearer token + JWT claims, but **never imported or applied anywhere** |
| CSRF protection | ✅ Working | `start.ts` — `createCsrfMiddleware` filters `serverFn` handlers. **However, there are zero server functions, so this protects nothing yet** |
| Shop/seller authorization | ⚪ Not built | No seller roles, no shop ownership checks |

### 15.3 Commerce security: MAJOR GAPS

| Risk | Status | Detail |
|------|--------|--------|
| **Client-supplied prices** | 🔴 HIGH | `checkout.tsx:95` computes `subtotal` from `product.price * line.quantity` where `product` comes from `getProduct(line.slug)` in the **frontend catalog**. An attacker who edits `product.price` in `catalog.ts` or manipulates the cart could change the total. The database stores whatever the client sends |
| **Client-supplied totals** | 🔴 HIGH | `checkout.tsx:198-203` inserts `subtotal`, `delivery_fee`, `total` directly into `orders` with **no server-side revalidation**. No CHECK constraint compares against catalog prices |
| **No inventory decrement** | 🔴 HIGH | `checkout.tsx` never decrements stock. `inStock` is a static boolean. Two users can buy the last unit |
| **No payment capture** | 🔴 HIGH | All 4 payment methods (Airtel Money, Mpamba, bank transfer, COD) are **manual instructions**. No webhook handler, no capture, no refund flow. Orders are placed as `status: 'placed'` with no payment confirmation |
| **Order reference is client-generated** | 🟡 MEDIUM | `checkout.tsx:172`: `reference = TH-${Date.now().toString(36).toUpperCase().slice(-6)}` — predictable, client-side, no uniqueness guarantee at the app layer (UNIQUE constraint in DB would catch collisions) |
| **No IDOR protection on orders** | 🟡 MEDIUM | `orders.$reference.tsx:34-41` queries by `reference`, not `user_id`. RLS on the table (`auth.uid() = user_id`) should prevent cross-user reads at the PostgREST layer, but the query does not explicitly filter by user. **Relies entirely on RLS** |
| **No input sanitization** | 🟡 MEDIUM | Address fields (recipient, phone, city, area, street, notes) are inserted verbatim into Postgres. No validation beyond "field is non-empty" for checkout step 1. Phone is free-text |
| **No webhook handling** | ⚪ N/A | No webhooks exist |
| **Secrets exposure** | ✅ OK | `.env` contains only public Supabase keys (`sb_publishable_*`). `SUPABASE_SERVICE_ROLE_KEY` is referenced in code but **not in `.env`** — so it cannot be accidentally committed. No Stripe keys, no email keys |
| **Frontend-exposed secrets** | ✅ OK | `VITE_SUPABASE_PUBLISHABLE_KEY` is a public key, safe to expose |
| **No admin routes** | ⚪ N/A | No admin panel exists to protect |

---

## 16. BUILD / TEST / LINT RESULTS

### 16.1 Typecheck: ✅ PASSES

```
$ npx tsc --noEmit
(no output — exit code 0)
```

**Result:** Zero type errors. `tsconfig.json` has `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `noPropertyAccessFromIndexSignature: true`. The codebase passes under the strictest practical settings.

### 16.2 Build: ✅ PASSES

```
$ npm run build
✓ built in 883ms
[nitro] ✔ You can preview this build using npx vite preview
[nitro] ✔ You can deploy this build using npx nitro deploy --prebuilt
```

**Result:** Production build succeeds. SSR bundles generated in `.output/server/`. No build errors, no warnings.

### 16.3 Lint: 🔴 FAILS (formatting only)

```
$ npx eslint .
✖ 382 problems (373 errors, 9 warnings)
  372 errors and 0 warnings potentially fixable with the --fix option.
```

**All 373 errors are `prettier/prettier` formatting violations** — not logic errors, not type errors, not security issues. Examples:
- `account.index.tsx:250` — multi-line `disabled={...}` condition should be one line
- `checkout.tsx:89` — inline type annotation should be broken across lines
- `cart.tsx:28-29` — type annotation should be multiline
- `search.tsx:42` — extra blank line

**9 warnings** are `react-refresh/only-export-components` warnings (constant exports allowed).

**Verdict:** The codebase is **not Prettier-clean**. Running `npm run lint -- --fix` would resolve 372 of 373 problems automatically. This is a formatting debt, not a correctness debt. The project ships with `eslint-plugin-prettier` in the recommended config, so formatting is enforced as an error — meaning `npm run lint` currently fails.

### 16.4 Tests: ⚪ NONE

No test framework is configured. No `vitest.config.ts`, no `jest.config.js`, no `playwright.config.ts`, no `*.test.*` or `*.spec.*` files anywhere. `package.json` has no test script. The `devDependencies` include no test runner.

**Verdict:** There is zero test coverage. No unit, integration, or E2E tests exist for any feature — including checkout, auth, or cart.

### 16.5 Runtime risks

1. **Supabase Auth requires network.** If `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` are missing, `createSupabaseClient()` throws at module load. This would break the entire app at runtime.
2. **`SUPABASE_SERVICE_ROLE_KEY` is absent.** `client.server.ts` throws if used. Any future admin operation will fail until the env var is added.
3. **`LOVABLE_DB_MIGRATION_URL` is absent.** `drizzle-kit` cannot connect to the database.
4. **Google OAuth depends on Lovable Cloud.** `lovable.auth.signInWithOAuth` uses `@lovable.dev/cloud-auth-js`. If the Lovable integration is removed, Google sign-in breaks.
5. **No error boundary around React Query.** If a Supabase query fails (network, RLS, timeout), the `useQuery` error is unhandled — `orders.tsx`, `account.index.tsx`, `checkout.tsx` all have `if (error) throw error` patterns that propagate to the TanStack root `ErrorComponent`.
6. **`ImageStage` renders nothing meaningful.** Every product image is a coloured box + icon. This is intentional per the plan but will look broken to users if not replaced with real photography.

---

## 17. TECHNICAL DEBT

### 17.1 Explicit markers found

| Marker | Count | Locations |
|--------|-------|-----------|
| `eslint-disable` | 3 | `MegaHeader.tsx:116`, `PromoTile.tsx:74`, `PromoTile.tsx:98`, `SectionHeader.tsx:49`, `Footer.tsx:156` — all `@typescript-eslint/no-explicit-any` for Link `to={...as any}` |
| `// @ts-nocheck` | 1 | `routeTree.gen.tsx:1` (generated file, correct) |
| `// eslint-disable` | 1 | `routeTree.gen.tsx:2` (generated file, correct) |
| `console.log` | 0 | None found |
| `console.error` | 2 | `client.ts:29`, `client.server.ts:30` (generated Supabase wrappers — correct), `server.ts:37` (error logging — correct) |
| `TODO` | 0 | None |
| `FIXME` | 0 | None |
| `HACK` | 0 | None |
| `TEMP` | 0 | None |
| `MOCK` | 0 | None |
| `DUMMY` | 0 | None |
| `PLACEHOLDER` | 1 | `ImageStage.tsx:16-17` — "Placeholder imagery for now..." (documented, correct) |
| `hardcoded` | 1 | `ImageStage.tsx:17` (in comment) |

### 17.2 Debt by category

**Duplicated logic:**
- `Field` component duplicated 3× (`auth.tsx:238-271`, `checkout.tsx:581-605`, `account.index.tsx:266-290`)
- Delivery-fee rule duplicated (`cart.tsx:33`, `checkout.tsx:97`)
- Shop-name + verified pattern duplicated 3× (see §6.3)
- Address form fields duplicated between `checkout.tsx:351-408` and `account.index.tsx:219-260`

**Duplicated API requests:**
- `profiles` query duplicated in `checkout.tsx:114-126` and `account.index.tsx:45-57`
- `addresses` query duplicated in `checkout.tsx:100-112` and `account.index.tsx:65-77`

**Dead code:**
- `requireSupabaseAuth` (`auth-middleware.ts`) — exported, never imported
- `compact` prop on `ProductCard` — defined, never passed
- `cron-auth.ts` — exported helper, never imported
- `command.tsx` (cmdk) — shadcn component, never used
- `form.tsx` (React Hook Form) — shadcn component, never used
- `@hookform/resolvers`, `react-hook-form`, `zod` in `package.json` — installed, never imported
- `recharts` in `package.json` — installed, never imported
- `react-day-picker`, `input-otp`, `embla-carousel-react`, `vaul`, `react-resizable-panels`, `date-fns` — installed, never imported

**Unused dependencies (installed, never imported):**
`@hookform/resolvers`, `react-hook-form`, `zod`, `recharts`, `react-day-picker`, `input-otp`, `embla-carousel-react`, `vaul`, `react-resizable-panels`, `date-fns`, `cmdk`, `lucide-react` (Icon uses `@iconify/react` instead), `@radix-ui/react-*` (many primitives unused).

**Giant components:**
- `checkout.tsx` — 605 lines, 3 steps + 2 helper components + address form + payment selection + review. Does delivery, payment, AND review. Single responsibility violated.
- `account.index.tsx` — 290 lines, does profile edit + address CRUD + address list.

**Inconsistent naming:**
- Shop is called `shop` (singular) on `Product.shop`, but `shops` (plural) is the array name
- `catalog.ts` exports `categories`, `shops`, `products`, `catalogs` (all plural) — consistent
- Route files use `$slug` and `$shopSlug` — consistent
- `saved_products` (DB) vs `saved` (lib) vs `Saved` (tab label) — minor inconsistency

**Hardcoded values:**
- Delivery threshold: MWK 900,000 in `cart.tsx:33` and `checkout.tsx:97`
- Delivery fee: MWK 6,000 in `cart.tsx:33` and `checkout.tsx:97`
- Free-delivery messaging in `Header.tsx:59` ("Free delivery on orders over MWK 900,000")
- Price mark-up for "also offered by": MWK 15,000 per shop in `product.$slug.tsx:60`
- `TH-` prefix + 6-char base-36 reference in `checkout.tsx:172`

---

## 18. PRODUCTION BLOCKERS

These are things that **must** be fixed before Techaven can reliably operate as a live e-commerce marketplace:

### P0 — Blocking core commerce

1. **No real payment processing.** All 4 payment methods are manual instructions. No capture, no webhook, no refund. An order can be "placed" without any payment confirmation. 🔴
2. **Client-supplied prices and totals.** `checkout.tsx` inserts `subtotal`/`total` computed from frontend catalog data with no server-side revalidation. A price change in `catalog.ts` or a cart manipulation changes what the customer pays, but **the database trusts the client**. 🔴
3. **No inventory tracking or decrement.** `inStock: true` is static. Stock is never reserved, decremented, or checked at checkout. overselling is guaranteed. 🔴
4. **No product/shop/category database.** The entire catalog is a frontend TS file. There is no way for a shop to add a product, change a price, or go out of stock. The "mall" is a static brochure. 🔴
5. **No order fulfillment pipeline.** Orders are inserted with `status: 'placed'` and nothing happens next. No shop notification, no status transitions (placed → confirmed → dispatched → delivered), no courier integration, no customer updates. 🔴

### P1 — Marketplace foundation

6. **No seller/shopper model.** No seller auth, no seller portal, no product management, no onboarding. The `shops` array is static. 🔴
7. **No promotions engine.** "Deals" are derived from `oldPrice`. No date windows, no coupon codes, no shop-targeted or catalog-targeted promotions, no banner management. 🔴
8. **No CMS.** All homepage content is hardcoded in `index.tsx`. No way for marketing to change banners, promotions, or editorial content without a code deploy. 🔴
9. **No real product images.** Every image is a coloured box + icon. 🔴
10. **No reviews or ratings.** `reviews` is a static integer. No review UI, no review submission, no verified-purchase badge. 🟡

### P2 — Shopping experience

11. **Search is client-side only.** No full-text index, no typo tolerance, no query analytics, no backend. Scales poorly past ~50 products. 🟡
12. **Compare is not persisted.** State lives in React component local state. Cannot share a comparison link. 🟡
13. **Trade-in has no form, no valuation, no submission.** It is a static information page. 🟡
14. **No wishlist persistence across devices** (works via Supabase `saved_products` but only when signed in — correct, but untested end-to-end). 🟡
15. **No recently-viewed tracking.** The home page uses a hardcoded `products.slice(12,17)` for "recommended". 🟡

### P3 — CMS / merchandising

16. **Homepage is not modular.** Sections are hardcoded into `index.tsx`. Adding/reordering sections requires editing the page component. 🟡
17. **No image URL support in `ImageStage`.** Cannot drop in a CMS image without a component change. 🟡
18. **No `target` resolution for promos.** `Promo.to` is a hardcoded route string. A CMS promo needs `targetType` + `target` → route resolution. 🟡

### P4 — Polish

19. **Prettier formatting fails** (373 errors). `npm run lint` does not pass. 🟡
20. **No test coverage** of any kind. 🟡
21. **No dark mode** (`.dark` class defined but never applied). 🟡
22. **Duplicated `Field` components** and duplicated address forms. 🟡
23. **No loading/empty/error states** for any data-driven UI. 🟡
24. **Unused dependencies** inflate the bundle (`react-hook-form`, `zod`, `recharts`, `lucide-react`, `embla-carousel-react`, etc.). 🟡

---

## 19. WHAT IS ALREADY SOLID

These are genuinely working and would be a foundation to build on:

1. **TypeScript compiles cleanly under strict mode.** `tsc --noEmit` passes. This is rare in a Lovable-generated codebase and means the types are real, not decorative.
2. **Production build succeeds.** `npm run build` produces a valid Nitro/Cloudflare Workers output.
3. **The entire public browsing shell works.** 13 public routes render correctly with consistent navigation, breadcrumbs, metadata (title/description/OG), and a 404/error page.
4. **One canonical `ProductCard`.** Used everywhere. Prop-driven, decoupled from data source. The single chokepoint for product tile rendering.
5. **One design system.** Tailwind v4 tokens in `src/styles.css`, consistently applied. No hardcoded hex colours in business components. Brand palette, ink scale, surface/stage/info/success/rating tints all defined and used consistently.
6. **Auth is real and working.** Supabase email/password + Google OAuth + email confirmation + session persistence + sign-out + safe redirect. The `/_authenticated` route guard is real.
7. **Account management is real.** Profile CRUD, address CRUD (add/remove/make-default), order history, saved products — all backed by Supabase with RLS.
8. **Checkout is real end-to-end (minus payment).** 3-step flow, address save, order + order_items insert into Supabase. The `orders`/`order_items` schema is the right shape for a marketplace (it stores `shop_slug` per line item).
9. **RLS is correctly enforced** on all 5 tables. The `handle_new_user` trigger auto-creates profiles.
10. **`ImageStage` is a deliberate abstraction.** The comment explicitly says "sized so real photography can drop in later unchanged." This is the right seam for swapping in real images.
11. **`MegaHeader` is genuinely reusable.** Used on 9+ pages with 4 tone variants, optional `aside`, `actions`, `stages`, `editorial` font. This is the modular building block the blueprint asked for.
12. **Cart works and persists.** localStorage-backed, count badge in header, empty/ready states.
13. **The stated plan exists** (`.lovable/plan/...first-pass-2026-09-19.md`) and accurately describes what was built. No surprises between plan and implementation.

---

## 20. WHAT IS PARTIALLY BUILT

| Item | What works | What doesn't |
|------|-----------|--------------|
| **Checkout** | Address save, order creation, 3-step UI, totals, order confirmation page | No payment provider, no server-side price validation, no inventory check, no fulfillment |
| **Search** | UI, empty state, no-query state, results rendering | Client-side only, no backend, no index, no history, no analytics |
| **Account** | Details, orders, saved, sign-out all work | No payment methods saved, no order tracking beyond status string, no returns initiation |
| **Compare** | UI renders, up to 4 devices, spec comparison table | Local state only, not persisted, not shareable, product selection limited to first 16 |
| **Trade-in** | UI, device-type cards, 3-step explanation | No form, no valuation, no submission, no shop integration |
| **Deals** | UI, category filter, discount sort | Derived from `oldPrice`, no promotion model, no date windows, no shop targeting |
| **Shops** | Directory, storefront, catalogs, stats | No seller portal, no onboarding, no verification workflow, no logo/banner/policy fields |
| **Auth guard** | Route-level `beforeLoad` works | No server-function-level auth (`requireSupabaseAuth` is dead code), no CSRF protection of anything real (no server fns exist) |

---

## 21. WHAT IS STILL MISSING

**Completely absent (zero files, zero references):**
- Strapi / any CMS
- Stripe, Mono, Pesa, Paystack, or any payment gateway SDK
- SendGrid, Resend, EmailJS, or any email service
- Any admin dashboard or admin auth
- Any seller portal, seller auth, or seller routes
- Any `createServerFn`, server route, or API endpoint
- Any test files or test configuration
- Any CI/CD configuration
- Any Dockerfile or container config
- Any analytics (Google Analytics, Plausible, etc.)
- Any `shops`/`products`/`categories`/`promotions`/`catalogs`/`reviews`/`inventory` database tables
- Any shop logo, banner, policy, or operating-hours fields
- Any coupon, discount code, or promotion model
- Any inventory tracking, stock reservation, or low-stock alerts
- Any order fulfillment automation, courier integration, or status transitions
- Any returns, refunds, or disputes flow
- Any trade-in valuation or submission
- Any review submission or display UI
- Any dark mode application
- Any loading skeletons or streaming/progressive enhancement

**Present but placeholder:**
- All product imagery (`ImageStage` → bg + icon)
- All merchandising data (`catalog.ts` → hardcoded)
- "Also offered by" pricing on PDP (computed by adding MWK 15,000)
- "Recommended for you" on home (hardcoded `products.slice(12,17)`)

---

## 22. WHERE TECHAVEN IS RIGHT NOW

> You have a **complete, working customer-facing storefront** — homepage, categories, shops, products, search, cart, and a real account/checkout backend — built on a solid TanStack Start + Supabase foundation with a real design system and clean TypeScript.
>
> What you **don't** have is the **marketplace machinery**. Every product, shop, category, and promotion in the app is a hardcoded TypeScript file. There is no database for any of it. There is no way for a shop owner to log in, list products, or manage stock. There is no payment gateway — checkout creates an order record but takes no money. There is no CMS, so marketing content is committed to source code.
>
> The Supabase schema that *does* exist (profiles, addresses, saved_products, orders, order_items) is well-designed and correctly secured with RLS — it is the right foundation for a real customer account + order system. It just needs a catalog layer built on top of it.
>
> In short: **the browsing experience is shippable today. The mall is not.**

### The honest summary

| Layer | State |
|-------|-------|
| Public browsing (13 routes) | ✅ Complete and working |
| Design system | ✅ Real, tokenized, consistent |
| Customer account + orders | ✅ Real, Supabase-backed, RLS-protected |
| Authentication | ✅ Real (email + Google) |
| Cart | ✅ Real (localStorage) |
| Checkout (order creation) | ✅ Real, but no payment |
| Catalog data (products/shops/categories) | 🧪 Hardcoded TS — no DB, no API, no seller management |
| Payments | ⚪ Not built (manual instructions only) |
| Seller/marketplace model | ⚪ Not built |
| Promotions / CMS | ⚪ Not built |
| Inventory | ⚪ Not built |
| Reviews | ⚪ Not built |
| Trade-in | 🎨 UI only |
| Compare | 🎨 UI only |
| Search | 🟡 Client-side only |
| Tests / CI / admin / email | ⚪ Not built |

---

## 23. REMAINING WORK BY PRIORITY

### P0 — Blocking core commerce (must fix before live operation)

1. **Payment gateway integration** — replace 4 manual methods with real capture (Stripe/Mono/Pesa/Paystack), webhook handler, refund flow
2. **Server-side price validation** — checkout must recompute totals from server-side catalog, never trust client-supplied prices
3. **Inventory tracking** — `products` table with stock quantity, decrement on order, low-stock alerts, out-of-stock blocking
4. **Catalog database** — `products`, `shops`, `categories`, `brands` tables + API/server functions so shops can manage their own catalog
5. **Order fulfillment pipeline** — status transitions, shop notifications, courier integration, customer updates

### P1 — Marketplace foundation

6. **Seller model** — `seller_accounts` linking auth users to shops, seller portal routes, product CRUD, shop settings (logo, banner, policies)
7. **Promotions engine** — `promotions` table (shop-targeted, catalog-targeted, date windows, coupon codes), banner management
8. **CMS / Strapi** — content types for homepage sections, promos, banners, editorial blocks; frontend fetch layer + `target` resolution
9. **Real product images** — replace `ImageStage` placeholder with real photography (Strapi media or CDN)
10. **Reviews** — `reviews` table, review submission (verified purchase), review display on PDP and cards

### P2 — Shopping experience

11. **Backend search** — full-text search service (Postgres full-text, Typesense, or Algolia), query analytics
12. **Persisted compare** — shareable comparison URLs, saved comparison lists
13. **Trade-in flow** — device eligibility form, valuation engine, submission, shop integration
14. **Recommendations** — real recently-viewed + personalized recommendations (replace hardcoded `products.slice(12,17)`)

### P3 — CMS / merchandising

15. **Modular homepage** — extract sections into a data-driven structure Strapi can drive
16. **`ImageStage` image URL support** — add `src` prop for CMS images
17. **Promo `target` resolution** — `targetType` + `target` → route resolver

### P4 — Polish

18. **Prettier formatting** — `npm run lint -- --fix` (372 auto-fixable)
19. **Test coverage** — unit (cart, catalog helpers, formatMwk, discountPercent), integration (checkout flow), E2E (browse → cart → checkout)
20. **Dark mode** — apply `.dark` class, add toggle
21. **Shared `Field` component** — deduplicate 3 copies into `src/components/Field.tsx`
22. **Remove unused dependencies** — `react-hook-form`, `zod`, `recharts`, `lucide-react`, `embla-carousel-react`, `vaul`, `react-resizable-panels`, `date-fns`, `react-day-picker`, `input-otp`
23. **Loading/empty/error states** — skeletons for grids, error boundaries for queries
appending

---

## 24. RECOMMENDED NEXT DEVELOPMENT CHUNK

### What to build next: **Catalog Database + Seller-Ready Product API**

### Why this should come next

Right now the entire catalog is a frontend TypeScript file. Every future feature — seller portals, promotions, inventory, real search, CMS integration, recommendations — is blocked on the catalog existing as **database rows with an API**. This is the single highest-leverage gap. Building it unblocks P0 items 3, 4 and P1 items 6, 7, 8, 10 simultaneously.

### Which existing files it will touch

- `src/data/catalog.ts` — will need to be replaced by API calls (or kept as fallback/seed data)
- `src/integrations/supabase/types.ts` — will need new table types generated
- `drizzle/migrations/` — new migration for `shops`, `products`, `categories`, `brands`, `catalogs`, `catalog_products`
- `src/lib/` — new `catalog.ts` service with React Query hooks (replacing direct `catalog.ts` imports)
- `src/components/ProductCard.tsx`, `ImageStage.tsx` — will need to accept CMS/image URLs
- Every route that imports from `@/data/catalog` — will need to switch to the new hooks

### New components/services/models required

**Database models:**
- `shops` (slug, name, specialty, location, verified, rating, orders_count, blurb, logo_url, banner_url, policies, seller_user_id)
- `categories` (slug, name, icon, blurb, subcategories, brands)
- `brands` (name, category_slugs)
- `products` (slug, name, brand, category_slug, shop_slug, price, old_price, condition, rating, reviews_count, shops_count, storage, warranty, delivery_template, in_stock, specs, highlights)
- `product_variants` (optional — for storage/color variants)
- `catalogs` (slug, title, owner_type, owner_slug, blurb)
- `catalog_products` (catalog_slug, product_slug, sort_order)
- `inventory` (shop_slug, product_slug, quantity, reserved)
- `promotions` (slug, title, type, target_type, target_slug, image_url, starts_at, ends_at, shop_slug)
- `reviews` (product_slug, user_id, rating, title, body, verified_purchase)

**Frontend services:**
- `src/lib/catalog.ts` — `useProducts()`, `useProduct(slug)`, `useShops()`, `useShop(slug)`, `useCategories()`, `useCatalogs()`, `usePromotions()` — all React Query hooks backed by Supabase
- `src/lib/promo-link.ts` — `resolveTarget(type, slug)` → route resolver for CMS-driven promos

**Frontend components:**
- `src/components/ProductForm.tsx` — for seller product management (P1, not this chunk)
- `src/components/ShopForm.tsx` — for seller shop settings (P1, not this chunk)

### Dependencies / blockers

- **None external.** Supabase is already configured. PostgREST is already used for orders/addresses/profiles — the same pattern extends to catalog tables.
- **RLS policies** will need to be written for the new tables (users read all; sellers write only their own shops/products).
- **`SUPABASE_SERVICE_ROLE_KEY`** needs to be added to `.env` for any admin/seller operations that bypass RLS.
- **`LOVABLE_DB_MIGRATION_URL`** needs to be added to `.env` so `drizzle-kit push` works (or continue with hand-written SQL migrations).

### Acceptance criteria

1. `products`, `shops`, `categories`, `brands`, `catalogs`, `catalog_products` tables exist in Supabase with RLS
2. A migration seeds the existing 50 products / 8 shops / 8 categories / 4 catalogs from `catalog.ts` into the DB
3. `src/lib/catalog.ts` provides React Query hooks that replace all direct `@/data/catalog` imports
4. All 13 public routes continue to render identically using data from the new hooks
5. `ProductCard` and `ImageStage` accept optional `image_url` from the new `products` table
6. A shop owner (identified by `seller_user_id` on `shops`) can update their shop's `blurb` and product prices via a future seller portal — the schema supports this even if the UI is not built in this chunk
7. `tsc --noEmit` still passes; `npm run build` still succeeds
8. The old `src/data/catalog.ts` is retained as seed data (not deleted) until the migration is verified
