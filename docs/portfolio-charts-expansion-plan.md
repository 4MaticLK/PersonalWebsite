# Portfolio Charts Expansion Plan

You already have one interactive chart (2-Stock Frontier + CAL). This plan covers **how many** to add, **which** charts to add, and **how** to implement them so the page stays interactive and visually consistent.

---

## How many charts to add

**Recommendation: add 3–4 more charts (4–5 total including the frontier).**

- **4 total (frontier + 3):** Strong story (prices → regression → frontier), clear layout, fast to build.
- **5 total (frontier + 4):** Adds one more “deep dive” (e.g. returns over time or correlation) without feeling crowded.

Avoid 6+ on one page; it gets noisy. You can always add a “More charts” or “Download Excel” CTA and keep the main set to 4–5.

---

## Which charts to add (recommended set)

Pick **3 or 4** from this list, in an order that tells the story: **data → relationship to market → risk/return → (optional) detail**.

| # | Chart | Why it fits | Data needed (CSV) |
|---|--------|-------------|--------------------|
| 1 | **SPY vs stock price movement** | Shows how MCD & NOC moved vs the market; sets context. | Date, SPY price, MCD price, NOC price (or normalized index). |
| 2 | **Stock regression (MCD vs market, NOC vs market)** | Shows beta/sensitivity to market; explains risk. | Market return (X), stock return (Y), optional fitted line. One series per stock or two small charts. |
| 3 | **Monthly (or periodic) returns over time** | Shows volatility and timing; supports “why diversification” narrative. | Date, MCD return, NOC return (and optionally SPY, Bonds). |
| 4 | **Correlation matrix (heatmap)** | Quick view of diversification; pairs well with the frontier. | 2×2 or 3×3 (MCD, NOC, optionally Bonds/SPY). |
| 5 | **Portfolio weight sliders + live stats** | Interactivity: change weights, see μ, σ, Sharpe update. | Expected returns + covariance (or raw returns to compute them). |

**Suggested minimum set:** 1 + 2 + (3 or 4).  
**Ideal set:** 1, 2, 3, 4 (all four above), and optionally 5 later.

---

## Layout and aesthetics

**Goal:** One “Charts” section that feels like a single dashboard: same card style, spacing, and behavior.

- **Section structure**
  - Keep the existing **2-Stock Frontier** as the first (or hero) chart.
  - Add a **“Charts”** wrapper: one `<section>` with a heading (e.g. “Portfolio analysis”) and a **responsive grid** of chart cards.

- **Grid**
  - **Desktop (e.g. ≥ 768px):** 2 columns so charts sit side-by-side where it makes sense.
  - **Tablet / mobile:** 1 column so each chart is full-width and easy to scroll.
  - Optional: make the **frontier** full-width and the rest in a 2-column grid so the main chart stands out.

- **Chart card (reuse frontier style)**
  - Same as current frontier: same background, border-radius, padding, title/caption pattern.
  - Each chart: title (e.g. “SPY vs MCD & NOC”), short caption, then the Recharts component.
  - Shared axis styling: same font size, grid, and “start at a sensible min” approach so all charts feel from the same family.

- **Order on page**
  1. Intro text (existing).
  2. **Portfolio statistics** (existing stats panel, optional).
  3. **2-Stock Frontier** (existing).
  4. **Charts grid:** SPY vs prices → Regression → Returns over time → Correlation (or your chosen subset).

---

## Implementation approach

**1. Data: CSV per chart (same as frontier)**  
- Export each chart’s data from Excel to a CSV (e.g. `Sheet 1.csv` = frontier, `Sheet 2.csv` = prices, `Sheet 3.csv` = regression, etc.).
- Put CSVs in `public/pdfs/` (or a dedicated `public/data/` if you prefer).
- Each chart component **fetches its own CSV** and parses it (like `EfficientFrontierChart` + `parseFrontierCsv.ts`). No backend.

**2. One component per chart type**  
- `EfficientFrontierChart.tsx` — already done.
- `PriceMovementChart.tsx` — line chart, date vs price (or index).
- `RegressionChart.tsx` — scatter (market return vs stock return), optional trend line.
- `ReturnsOverTimeChart.tsx` — line or bar, date vs return.
- `CorrelationHeatmapChart.tsx` — 2×2 or 3×3 grid of cells, color = correlation.
- Reuse **Recharts** for line/scatter/bar; heatmap can be Recharts or a simple CSS grid.

**3. Shared styling**  
- Reuse existing classes: `.frontier-chart` (or a generic `.portfolio-chart`) for the card, `.portfolio-chart__title`, `__caption`, `__container`.
- Same axis colors, grid stroke, and margin pattern so every chart looks like the frontier’s “sibling.”

**4. Responsive grid**  
- In `ProjectPage.tsx`, inside the portfolio block, render something like:
  - `<section className="portfolio-charts">`
  - `<h2>Portfolio analysis</h2>`
  - `<div className="portfolio-charts__grid">`
  - `<EfficientFrontierChart />` (optionally full-width)
  - `<PriceMovementChart />`, `<RegressionChart />`, etc.
  - `</div></section>`
- CSS: `.portfolio-charts__grid { display: grid; grid-template-columns: 1fr; gap: var(--space-2xl); }` and `@media (min-width: 768px) { grid-template-columns: repeat(2, 1fr); }`. Optionally make the first child `grid-column: 1 / -1` so the frontier spans both columns.

**5. Loading and errors**  
- Each chart already handles “loading” and “error” (like the frontier). Keep that pattern so a missing CSV doesn’t break the page.

**6. Implementation order**  
1. Add the **grid layout** and a second chart (e.g. **SPY vs prices**) so you see 2 charts side-by-side and can tune spacing.
2. Add **regression** and **returns over time** (or correlation) one at a time, reusing the same card and axis style.
3. Optionally add **weight sliders** and wire them to the same stats/portfolio math.

---

## What you need to provide for each new chart

For each chart you add, we need:

1. **CSV (or sheet/range)**  
   - Columns and their meaning (e.g. “A = date, B = SPY, C = MCD, D = NOC”).
2. **Any special rules**  
   - e.g. “Skip first row,” “Use column B as X,” “Fitted line is column E.”

Once you have the CSVs (or confirm the other sheet names), we can define the URLs and parsers and drop in each chart component in order.

---

## Summary

| Decision | Recommendation |
|----------|----------------|
| **How many** | 4–5 total (frontier + 3–4 more). |
| **Which** | SPY vs prices, Regression (MCD/NOC vs market), Returns over time, Correlation heatmap; optionally weight sliders. |
| **Layout** | One “Charts” section; responsive 2-column grid (1 column on small screens); same card style as frontier. |
| **Implementation** | One component per chart; each fetches its CSV; shared CSS and axis styling; add charts one by one. |

Next step: choose which 3–4 charts you want (from the table above), export their data to CSVs (or tell me the sheet names if you prefer to keep one Excel and we read by sheet), and we can implement the grid and the first new chart (e.g. SPY vs stock price movement).
