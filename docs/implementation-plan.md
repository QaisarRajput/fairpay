# FairPay — Implementation Plan

> **Product:** _Did You Actually Get a Raise?_ — a personalized, inflation-adjusted wage reality check.
> **Domain:** `fairpay.hubs.dpdns.org`
> **Conforms to:** `docs/instructions.md` (GitHub Pages Application Standard v2). Every rule there is a constraint here.
> **Execution model:** This file is the plan a coding agent executes. Checkbox states: `[ ]` not started · `[~]` in progress · `[x]` complete.

---

## §0 — Source / data validation & resolved decisions

### 0.1 Confirmed data source facts (constrains the whole design)

| Fact | Value | Consequence |
|---|---|---|
| Upstream | **FRED** (Federal Reserve Bank of St. Louis) | Public, authoritative, license permits redistribution with attribution. |
| Auth | API key required (`?api_key=…`) | Key is **secret**, must never reach the browser. See §0.2. |
| CORS | FRED allows CORS, but that is irrelevant to us — we fetch server-side in CI. | No client-side FRED calls anywhere. |
| Series format | Monthly index values, each series is `{ date: 'YYYY-MM-DD', value: '312.332' }`. Value is a string; `'.'` means missing. | Zod-validate + coerce at ingestion (§7). Reject `'.'` rows. |
| Update cadence | CPI released monthly (~mid-month, for the prior month). | ETL cron: weekly is ample; monthly minimum. Idempotent — most runs are no-ops. |
| Base periods differ per series | Each CPI series has its own index base; **never compare index levels across series** — only ratios _within_ one series over time. | Math operates on `C(t1)/C(t0)` within a single series only. |

**CPI series pulled (All Urban Consumers, Seasonally Adjusted):**

| Category (UI label) | FRED series ID |
|---|---|
| All items (headline) | `CPIAUCSL` |
| Food | `CPIUFDSL` |
| Housing | `CPIHOSSL` |
| Transportation | `CPITRNSL` |
| Medical care | `CPIMEDSL` |
| Apparel | `CPIAPPSL` |
| Recreation | `CPIRECSL` |
| Education & communication | `CPIEDUSL` |
| Energy | `CPIENGSL` |

The exact set is declared once in `etl/src/series.ts` and validated at ingestion; any series FRED returns empty is skipped-and-logged, not silently dropped (§7).

### 0.2 — How the FRED key stays out of the browser (non-obvious constraint)

GitHub Pages is static: no server, no runtime env vars, no proxy. A key shipped in client JS is a public key. Resolution:

1. The **only** consumer of `FRED_API_KEY` is `etl/`, which runs in GitHub Actions. The key lives as a repo **Actions secret** (`FRED_API_KEY`), injected as an env var into `etl.yml` only.
2. The ETL fetches all series, normalizes them, and commits `data/cpi/*.json` (index series) + `data/cpi/index.json` (manifest: series list, coverage range, `lastSyncedAt`, per-series `contentHash`).
3. The web app reads **only** the committed JSON — at build time via `fs`, and at runtime via `fetch('/data/cpi/index.json')`. It never knows the key exists.
4. `.env.example` documents the variable name only. The literal value is **never** committed. **Rotate the key** (it was shared in a logged channel) at `https://fredaccount.stlouisfed.org/apikeys`.

### 0.3 — How the "real raise" math works (this is the product, not the CPI lookup)

All math is within a single series (default: `CPIAUCSL`). Let `C(t)` = CPI index at period `t`, `S(t)` = the user's nominal salary at `t`.

- **Break-even salary** at period `t1` for a salary set at `t0`:
  $$\text{breakEven}(t_1) = S(t_0)\cdot\frac{C(t_1)}{C(t_0)}$$
  → _"You'd need \$Y just to break even."_
- **Real (today-\$) value** of an old salary, expressed in the buying power of the base period:
  $$\text{realValue} = S(t_1)\cdot\frac{C(t_0)}{C(t_1)}$$
  → _"Your \$80k in 2021 has the buying power of \$X today."_
- **Real change** when a raise happened ($S(t_0)\to S(t_1)$):
  $$\text{realPct} = \frac{S(t_1)}{\text{breakEven}(t_1)} - 1 = \frac{S(t_1)/C(t_1)}{S(t_0)/C(t_0)} - 1$$
  Positive → a real raise; zero → treading water; negative → a real pay cut despite a nominal bump.
- **Category divergence** (the shareable hook): compute `realPct` against each category series and surface the fastest-eroding one → _"Your transportation costs outran your raise by 6.2%."_

All formulas live in **one** pure module, `packages/schema`-adjacent `packages/calc` (or `apps/web/lib/calc.ts` if kept web-only) with an assert-based self-check fixture (§0 ponytail: one runnable check per non-trivial logic). CPI lookup uses the nearest available month ≤ the requested date; if a date precedes coverage, the UI blocks with a clear message rather than extrapolating.

### 0.4 — How "premium comparison" is handled without a backend (resolved)

A static site cannot verify a payment, so a hard paywall is impossible without lying to the user. **Resolution:** the side-by-side offer comparison ships **free** (it is the virality engine — more shareable cards = more traffic). Monetization is **AdSense + a tip/support button** (§20). No fake "unlock" flows, no honor-system localStorage gate.

### 0.5 — Resolved project-level decisions

| Decision | Value | Source |
|---|---|---|
| Subdomain (§10) | `fairpay.hubs.dpdns.org` (user-specified, used as given) | user |
| `basePath` (§2) | `''` (custom subdomain) | §2 |
| Tone (§17) | **Professional-but-warm** — plain-spoken, second person, curiosity/benefit hooks ("Did you _actually_ get a raise?"), minimal jargon, no heavy emoji. Finance credibility + consumer share-ability. | §17 |
| Monetization (§20) | Display ads (AdSense, wired now / `ready:false`) **+** tip button (`config.monetization.tipUrl`). | user |
| Analytics (§16) | **Cloudflare Web Analytics** (cookieless → no consent banner). | user |
| Image viewer (§12) | **Not applicable** — no photo/infographic corpus; skip lightbox entirely. | §12 |
| CPI scope | National, all-items **+ spending categories** (table in §0.1). | user |
| Comments (giscus, §12) | **Skip** — utilitarian calculator; comments add noise. | §12 |
| Blog topics (§18) | See below. | §18 |
| FAQ topics (§19) | See below. | §19 |
| AdSense timeline (§21) | Wire all artifacts now, `config.adsense.ready:false`; flip to `true` only after the §21 checklist passes on the live site. | user |

**Launch blog posts (§18) — 3–4, scoped to the one niche (wages vs. inflation):**
1. "Nominal vs. real wages: why your raise can shrink while your paycheck grows."
2. "How to read a CPI number — and why 'inflation is 3%' doesn't mean your costs rose 3%."
3. "What salary would just keep pace with inflation since [year]? A worked example."
4. "Negotiating your next raise using inflation data (a script that actually works)."

**FAQ topics (§19) — homepage section (single-purpose tool ⇒ inline, not a dedicated page):**
1. Is my salary data sent anywhere? (No — localStorage only; the trust feature.)
2. Where does the inflation data come from? (FRED CPI-U, updated monthly.)
3. Which CPI do you use, and why not "my" personal inflation rate?
4. Why does the category breakdown differ from the headline number?
5. How current is the data? (Show `lastSyncedAt`.)
6. Can I compare multiple job offers?
7. Does this account for taxes / my city? (Scope disclosure.)

---

## §1 — Guiding principles (non-negotiable)

- **Ponytail discipline (§0 of the standard):** reuse before writing, standard-lib before dependency, smallest correct diff, root-cause fixes, one runnable check per non-trivial logic, `ponytail:` comments on intentional shortcuts.
- **Privacy is the product.** Salary history is **localStorage-only, never transmitted**. This is marketed, and enforced: no analytics event ever carries a salary value; CSP `connect-src` does not include any endpoint that could receive user figures.
- **The FRED key never reaches the browser** (§0.2). Any client-side FRED call is a bug.
- **One series per calculation.** Never compare raw index levels across categories — only within-series ratios (§0.1).
- **Config is centralized (§9).** Every URL/key/CTA/price/domain lives only in `config/site.ts`. Grep for stray `https://`/`mailto:`/IDs is a merge gate.
- **Static-first, client-enhanced (§3).** Every route is prerendered HTML; the calculator hydrates on top. The result card is server-renderable from URL params so shared links have real OG previews.
- **Monetization:** AdSense (deferred, `ready:false`) + tip button only — chosen because this is a virality-first play; ads follow traffic, and the free comparison view is what generates the traffic (§0.4).
- **Accessibility (§14) and the Lighthouse gate (§8) are AdSense-readiness work**, not separate polish.

---

## §2 — Design system spec

**Tokens (CSS custom properties, wired into Tailwind `theme.extend`; §11):**

```css
/* Light */
--bg:#FAFAF8; --surface:#FFFFFF; --surface-muted:#F2F2EF;
--text:#1A1A18; --text-muted:#6B6B66; --border:#E7E7E2;
--accent:#0E7C66; --accent-contrast:#FFFFFF;   /* confident emerald — trust + money, not alarmist */
--gain:#15803D; --loss:#DC2626;                 /* semantic: real raise vs. real cut */

/* Dark (.dark on <html>) */
--bg:#0E0E10; --surface:#17171A; --surface-muted:#202024;
--text:#F4F4F2; --text-muted:#A1A1A8; --border:#2A2A2E;
--accent:#2DD4A7; --accent-contrast:#06231C;
--gain:#4ADE80; --loss:#F87171;
```

- **Theme:** `class="dark"` strategy; pre-paint inline `<head>` script reads `localStorage` → falls back to `prefers-color-scheme` (no FOUC); manual toggle persists.
- **Typography:** `Inter` variable via `next/font` (self-hosted) for UI; `JetBrains Mono` for the salary figures and computed numbers. Fluid `clamp()` scale, no fixed px.
- **Motion:** every transition gated behind `@media (prefers-reduced-motion: no-preference)` — the result-card count-up animation especially.
- **Spacing** 4px scale · **radii** cards 16 / pills 9999 / inputs·buttons 12 · **elevation** soft, low-spread, hover/focus only.
- **Contrast:** verify `--accent`, `--gain`, `--loss` on `--surface` meet ≥4.5:1 (text) in both themes; darken `--gain`/`--loss` for small text if needed.

**Brand assets (generated at build time via `satori`/`@napi-rs/canvas`, §10 & §15) — no hand-drawn per-page files:**
- SVG wordmark/icon "FairPay" using only `accent`+`text` tokens; crisp at 32px and 512px.
- OG banner 1200×630 (logo + tagline + accent background).
- Homepage hero variant.
- **Dynamic per-page OG:** the result page composites the headline number (_"Your \$80k in 2021 = \$X today"_) onto the banner so shared cards preview the user's actual result. Result figures come from URL params, never from stored PII.
- PWA icons 192/512 + maskable + 180 Apple touch icon, all from the SVG (§23).

---

## Phase 1 — Monorepo scaffold & config foundation

- [x] `pnpm` workspace: `apps/web` (Next.js `output:'export'`), `packages/schema`, `packages/calc`, `etl/`, `data/`, `content/blog/`, `config/site.ts`. (§1)
- [x] `tsconfig.base.json` with strict flags from §4; every package extends it.
- [x] Prettier + ESLint (`@typescript-eslint/recommended`, warnings-as-errors) at repo root. (§22)
- [x] `next.config.js`: `output:'export'`, `images.unoptimized:true`, `basePath:''`. (§2)
- [x] `apps/web/public/.nojekyll` (empty) and `CNAME` = `fairpay.hubs.dpdns.org` (must equal `config.site.domain`). (§2)
- [x] `config/site.ts` with `siteConfigSchema` (§9): real values for `site.*`, `analytics.provider:'cloudflare'`; placeholders (`''`) for social, `monetization.tipUrl`, `adsense.publisherId` (+ `ready:false`), Cloudflare token, GSC verification. Derive `adsenseIds` from the single publisher ID.
- [x] `prebuild` script validates `config/site.ts` against the schema; fail fast naming the missing required field.
- [x] `.env.example` documents `FRED_API_KEY` (value never committed). Add `data/` is committed, `.next/`, `out/`, `.env` to `.gitignore`.
- [x] Vitest set up; add the `config/site.ts` schema test.

**Definition of done:** `pnpm install && pnpm -w build` produces `apps/web/out/`; config validation blocks on a deliberately-broken field; `CNAME`/`.nojekyll` present in output.

---

## Phase 2 — Schema & ETL (FRED → committed CPI JSON)

- [x] `packages/schema`: `CpiPoint` (`{date, value:number}`), `CpiSeries` (`{seriesId, label, category, base, points[], contentHash}`), `CpiIndex` (manifest: series meta, coverage range, `lastSyncedAt`), and re-export `SiteConfig`. Types via `z.infer` only (§4/§5).
- [x] `etl/src/series.ts`: the 9-series registry from §0.1.
- [x] `etl/src/fetch.ts`: fetch each series from FRED using `process.env.FRED_API_KEY`. Never log the key. Per-record `try/catch`; skip-and-log `'.'` / malformed rows; parse dates with explicit format (no `new Date(str)`); Zod-validate at the boundary (§7).
- [x] Compute `contentHash` = sha256 of normalized `points` only (no timestamps) → idempotent; write nothing if unchanged (§6).
- [x] Emit `data/cpi/<seriesId>.json` + `data/cpi/index.json`.
- [x] `pnpm --filter etl run validate` re-validates all committed chunks (CI gate, §5).
- [x] Drift threshold: if skipped rows > 1% or >3 absolute, fail and open/update a tracking Issue via `actions/github-script` (§8).
- [x] `packages/calc`: pure `breakEven`, `realValue`, `realPct`, `categoryDivergence`, `nearestPointAtOrBefore` (§0.3) + an assert-based self-check fixture (known CPI values → known outputs).

**Definition of done:** running the ETL locally with the key populates `data/cpi/*.json`; a second run is a zero-diff no-op; `calc` self-check passes; validate script green.

---

## Phase 3 — Calculator UX (the core interactive tool)

- [x] Home = static shell (hero hook + copy §17, entry CTA, featured "how it works", FAQ §19) that hydrates the calculator (§3).
- [x] Salary-history form: add rows `{ periodMonth, amount }`; **localStorage-only** persistence with a visible "stored on your device, never sent" affordance. No network write, ever.
- [x] CPI data loaded via `fetch('/data/cpi/index.json')` + chunk(s); run calc in-thread (small data) — no worker needed. (`ponytail:` note the size ceiling.)
- [x] Result card: headline sentence (break-even \$Y, real value \$X, real % with `--gain`/`--loss` color), reduced-motion-gated count-up, category-divergence line.
- [x] Series selector (all-items default; category dropdown) — single-series invariant enforced (§0.1).
- [x] Boundary UX: dates outside CPI coverage blocked with a clear message; nearest-month lookup documented in the tooltip.
- [x] Result is URL-encodable (`?from=2021-06&fromPay=80000&to=2024-06&toPay=88000&series=CPIAUCSL`) so shared links prerender the correct OG image; **no PII in the URL beyond the figures the user chose to share**.
- [x] Free side-by-side **offer comparison** view (2–3 offers, real-terms ranking) — the virality feature (§0.4).
- [x] Share button (`navigator.share()` → desktop fallback menu) using canonical URL + title (§12).

**Definition of done:** enter a raise → correct real % and narrative; refresh preserves history from localStorage; DevTools Network shows **zero** requests carrying salary values; shared URL reproduces the card.

---

## Phase 4 — SEO, brand assets, PWA

- [x] `generateMetadata` on home, result, `/faq`-content, each blog post, `/about|/privacy|/terms|/cookies` — title/description/OG/twitter, canonical from `config.site.url` (§15).
- [x] Dynamic OG generator (`satori`) for home + result (composites the user's headline number) + blog. Fallback `config.seo.defaultOgImage` (§15).
- [x] `app/sitemap.ts` across home, blog, legal, and static tool pages with `lastModified` (§15).
- [x] `robots.txt` `Allow: /` + sitemap URL. JSON-LD: `SoftwareApplication`/`WebApplication` on home, `BlogPosting` on posts, `FAQPage` matching visible FAQ exactly (§15/§19).
- [x] GSC verification meta from `config.seo.googleSiteVerification` (§16).
- [x] Brand SVG logo, OG/hero banners, PWA icons (192/512/maskable/180) from §2. `app/manifest.ts` (standalone, theme/background colors, icons) + `metadata.manifest` (§23).
- [x] Minimal Workbox service worker: precache app shell + fonts + CPI index; offline reopen of the tool (§23).
- [x] `<meta http-equiv="Content-Security-Policy">` allow-list built from config (self, Cloudflare analytics, googlesyndication when `adsense.ready`, satori-none-at-runtime). **No** salary-receiving origins in `connect-src` (§21).

**Definition of done:** DevTools → Manifest shows no errors; all icon URLs 200; add-to-home-screen yields a branded standalone window; OG images render per page; Lighthouse SEO ≥ 0.95 locally.

---

## Phase 5 — Content, legal & monetization

- [x] `content/blog/*.md` — the 4 posts (§0.5), remark + Zod frontmatter (`title, slug, description, publishedAt, tags, ogImage?`), rendered via `generateStaticParams`; each gets metadata + `BlogPosting` JSON-LD + share button (§18).
- [x] FAQ homepage section, `<details>/<summary>`, matching `FAQPage` JSON-LD (§19).
- [x] Legal pages `/about`, `/privacy`, `/terms`, `/cookies` generated from `config.site`/`config.analytics`/`config.adsense` — cookie list reflects only what's wired (Cloudflare cookieless; AdSense cookies only once `ready`). Footer: short flat nav (Home · Compare · Blog · About · Privacy · Cookies · Contact). (§21)
- [x] `<TipButton>` from `config.monetization.tipUrl` — disabled "coming soon" state while empty (§20).
- [x] `<AdSlot>` renders only when `adsense.publisherId` set **and** `adsense.ready===true`; never on thin/result-only pages placed against user PII flows. `ads.txt` + `google-adsense-account` meta derived from `adsenseIds`, emitted only when `publisherId` set (§21).
- [x] Cloudflare Web Analytics loaded from `config.analytics.cloudflareToken` (no banner) (§16).

**Definition of done:** 4 posts live and linked from home; legal pages reachable from footer on every page; tip button renders (disabled if unset); no dead links.

---

## Phase 6 — CI/CD, QA gates & launch readiness

- [x] `.github/workflows/etl.yml`: `schedule`(weekly)+`workflow_dispatch`; install→fetch(`FRED_API_KEY` secret)→validate→build-index→`git-auto-commit-action` `chore(data):` as a named bot; `contents:write` (§8).
- [x] `.github/workflows/deploy.yml`: trigger on push to `data/**|content/**|apps/web/**|packages/**|config/**` + dispatch; `pages:write`+`id-token:write`; concurrency `pages` cancel-in-progress; steps install→validate config→restore `.next/cache`→build→size-limit→Lighthouse CI→`touch out/.nojekyll`→`upload-pages-artifact`→`deploy-pages` (§8).
- [x] `.next/cache` action cache; `.size-limit.json` (measure real baseline, then set); `lighthouserc.json` gates (perf .9 / a11y .95 / seo .95 / best-practices .9) — treat red as a failing test (§8).
- [x] `app/not-found.tsx` styled with design tokens → `out/404.html` (§8).
- [x] Renovate/Dependabot config, grouped weekly (§8).
- [x] Responsive QA (§13): portrait + **landscape phone** (short viewport) for the calculator, result card, comparison view, and any modal/slide-over — no horizontal overflow 320px+; app bar shrinks in landscape.
- [x] A11y pass (§14): focus rings, `Esc` closes overlays, `/` focuses (n/a — no search; skip), 44px targets, one `<h1>`/page, contrast in both themes.
- [x] Optional GSC `sitemaps.submit` step via `googleapis` + service-account secret after deploy (§16). Skip the deprecated ping + Indexing API (§16).
- [ ] **AdSense pre-flight (§21):** legal pages + 4 posts live, no dead links (checked against live site), Lighthouse green, then set `publisherId`, verify `curl /ads.txt` + `curl | grep google-adsense-account` against production, redeploy, let cache clear, **then** flip `adsense.ready:true` and apply.

**Definition of done:** green `deploy.yml` (incl. Lighthouse + size gates) publishing to `https://fairpay.hubs.dpdns.org`; `etl.yml` commits a data update on schedule and is a no-op when unchanged; production passes the §21 curl checks.

---

## §7 — Open questions

| # | Question | Status |
|---|---|---|
| 1 | Subdomain name | ✅ `fairpay.hubs.dpdns.org` |
| 2 | Monetization pattern | ✅ AdSense (deferred) + tip button |
| 3 | Analytics provider | ✅ Cloudflare Web Analytics |
| 4 | CPI scope | ✅ National all-items + 8 category series |
| 5 | Premium comparison handling | ✅ Ships free (virality); no paywall |
| 6 | AdSense timeline | ✅ Wire now / apply after launch content live |
| 7 | Tip destination (Ko-fi vs Buy Me a Coffee) URL | ⛔ Needed before flipping tip button live (renders disabled until provided) |
| 8 | Cloudflare Web Analytics token | ⛔ Needed to emit the analytics script (no-op until provided) |
| 9 | GSC + AdSense publisher IDs | ⛔ Needed for §21 flip; placeholders until then |
| 10 | **Rotate the shared FRED key** before first ETL run | ⚠️ Recommended (key was shared in a logged channel) |

---

## §8 — Immediate next steps (unblock Phase 1)

1. Create the GitHub repo; add **Actions secret** `FRED_API_KEY` (use a freshly rotated key, not the one shared in chat).
2. Scaffold the pnpm monorepo (Phase 1 layout) + `tsconfig.base.json`, Prettier, ESLint, Vitest.
3. Write `config/site.ts` + `siteConfigSchema` with real `site.*`/analytics values and explicit `''` placeholders elsewhere; wire the `prebuild` validation.
4. Add `next.config.js`, `public/.nojekyll`, `public/CNAME` (`fairpay.hubs.dpdns.org`).
5. Define `packages/schema` CPI schemas and `packages/calc` formulas + self-check.
6. Stub `etl/` fetch against one series (`CPIAUCSL`) to prove the key→`data/cpi/*.json` path end-to-end.
7. Configure the DNS `CNAME` for `fairpay.hubs.dpdns.org` → GitHub Pages and enable Pages on the repo.
