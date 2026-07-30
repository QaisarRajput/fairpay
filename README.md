<div align="center">

<br/>

<!-- Logo mark -->
<svg width="56" height="56" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="8" fill="#0e7c66"/>
  <path d="M16 6v2.5M16 23.5V26M11 10.5C11 9.12 12.12 8 13.5 8h5a2.5 2.5 0 0 1 0 5h-5A2.5 2.5 0 0 0 11 15.5v1A2.5 2.5 0 0 0 13.5 19h5a2.5 2.5 0 0 1 0 5h-5A2.5 2.5 0 0 1 11 21.5" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M20 5.5 23 8.5l-3 3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
</svg>

# FairPay

### Did You Actually Get a Raise?

**A personalized, inflation-adjusted wage reality check.**

Your paycheck grew. But did your *buying power*?

[**→ Try it live**](https://fairpay.hubs.dpdns.org) · [Blog](https://fairpay.hubs.dpdns.org/blog) · [Inflation Explorer](https://fairpay.hubs.dpdns.org/inflation)

<br/>

</div>

---

## What FairPay does

Most people feel like their raise "didn't go anywhere" — but they never see the actual number. FairPay turns that vague feeling into a precise, personal verdict.

You enter your salary at two points in time. FairPay answers three questions:

| Question | What you see |
|---|---|
| Did I actually get a raise? | Your **real % change** in purchasing power |
| What would I *need* to break even? | The exact dollar amount inflation required |
| Which costs hit me hardest? | A ranked breakdown of 9 spending categories |

The result is shareable — a link anyone can open to see your exact inflation-adjusted reality.

---

## The main calculator

Enter your salary at any two points in time (or build a full career timeline with as many checkpoints as you like).

**What you get back:**

- **Purchasing Power Gauge** — a circular meter showing at a glance whether your real income rose or fell, from −100% to any positive gain
- **Break-even salary** — the dollar figure you would have needed just to stay even with inflation
- **Real value of your current pay** — what today's salary is actually worth in the dollars of your starting year
- **Real % change** — the single honest number: positive means a real raise, zero means treading water, negative means a pay cut disguised as a raise
- **Salary vs. Inflation chart** — a line chart showing your nominal salary path against the CPI-adjusted break-even line; the shaded gap between them is your gain or loss made visual

All inputs are stored **on your device only** in browser localStorage. Nothing is ever sent to a server.

---

## Category breakdown

Headline CPI hides a lot. Rent, groceries, gas, and medical bills each move at a completely different pace.

After your result is calculated, FairPay shows:

- **"Where inflation hit hardest"** — all 9 CPI spending categories ranked by real impact on *your specific salary change*, sorted from worst offender to best
- A zero-centered bar chart so you can see at a glance which categories eroded your raise and which ones worked in your favor
- The worst category is called out by name in plain language: *"Food inflation outran your raise by 7.9%"*

The 9 categories tracked:

> All items (headline) · Food · Housing · Transportation · Medical care · Apparel · Recreation · Education & communication · Energy

---

## Offer comparison

Evaluating a job offer? Enter up to three competing salaries and FairPay tells you the real value of each one — not just the nominal number — relative to your current pay. A bar chart shows the gap immediately. The ranking sorts them by inflation-adjusted outcome, not the number on the page.

---

## Inflation Explorer

A standalone data page for browsing the full US CPI history dating back to **1947**.

Switch between any of the 9 spending categories with a single click. Two views:

- **Line chart** with a draggable range brush — zoom into any era (COVID spike, 1970s stagflation, post-2008 deflation) and see the exact trajectory
- **Month-over-month heatmap** — a calendar-style grid where each cell is colored by that month's inflation intensity; red means a spike, green means deflation, and patterns jump out immediately

Pre-computed statistics shown for each series:
- Cumulative inflation since 1947
- Worst single-month spike ever recorded
- Last 12 months change
- 5-year change

---

## The data

All CPI data comes from the **Federal Reserve Bank of St. Louis (FRED)** — the authoritative US government source for economic data, updated monthly (typically around the 10th–15th of each month for the prior month's data).

**How it works without a server:**

FairPay is a fully static website — there is no backend, no database, and no API proxy. Keeping the FRED API key secret in a static site requires a different approach:

1. A scheduled pipeline (GitHub Actions, running weekly) calls the FRED API server-side with a secret key, fetches all 9 CPI series, validates every data point, and commits the resulting JSON files directly to the repository
2. The website reads those committed JSON files — never the FRED API directly
3. Your browser only ever touches `fairpay.hubs.dpdns.org` — it never contacts FRED or any external data service
4. The committed data files are version-controlled, so every CPI update is a traceable diff in git history

This means the data is always current (within a week of FRED's monthly release), fully offline-capable, and requires zero trust in any third party at runtime.

**What "seasonally adjusted" means for you:**

All series use the seasonally-adjusted variants (CPIAUCSL, etc.). This removes predictable seasonal patterns (heating costs rising every winter, back-to-school spikes) so the numbers reflect genuine economic pressure rather than calendar noise. It's the same methodology the Federal Reserve uses for monetary policy decisions.

---

## Privacy

- **No account required.** Nothing to sign up for.
- **Your salary data never leaves your device.** It is stored in browser localStorage and never transmitted anywhere.
- **Analytics are cookieless.** Cloudflare Web Analytics is used — it records aggregate page views only, requires no cookie consent banner, and cannot track individual users.
- **The shareable link contains only your salary figures and dates** — there is no identifier that ties the link back to you. Anyone with the link sees the same result you do.

---

## The math (plain English)

All calculations happen within a single CPI series (your choice — defaults to the headline all-items index).

**Break-even salary** answers: *"What would I need to earn today to have the same purchasing power as my old salary?"*

$$\text{break-even} = \text{old salary} \times \frac{\text{CPI today}}{\text{CPI then}}$$

**Real value** answers: *"What is my current salary actually worth in old dollars?"*

$$\text{real value} = \text{new salary} \times \frac{\text{CPI then}}{\text{CPI today}}$$

**Real % change** answers: *"Did I get ahead of inflation, fall behind, or just keep pace?"*

$$\text{real change} = \frac{\text{new salary} / \text{CPI today}}{\text{old salary} / \text{CPI then}} - 1$$

A positive result is a genuine raise. Zero means you're exactly where you started in real terms. Negative means inflation quietly cut your pay — even if the number on your paycheck went up.

---

## Data coverage

| Detail | Value |
|---|---|
| Source | FRED (Federal Reserve Bank of St. Louis) |
| Series | 9 CPI-U (All Urban Consumers, Seasonally Adjusted) |
| History | January 1947 — present |
| Update frequency | Weekly pipeline (monthly FRED releases) |
| License | Public domain — redistribution permitted with attribution |

---

## Blog

Four articles included covering the ideas behind the tool:

- **Nominal vs. Real Wages — Why Your Paycheck Lies to You**
- **How to Use CPI Data to Negotiate Your Next Raise**
- **Break-Even Salary: The Number Your Boss Doesn't Want You to Know**
- **How to Read a CPI Report (Without Falling Asleep)**

---

<div align="center">

Built with real Federal Reserve data · Your salary stays on your device · No account needed

[fairpay.hubs.dpdns.org](https://fairpay.hubs.dpdns.org)

</div>
