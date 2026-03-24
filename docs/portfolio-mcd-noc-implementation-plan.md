# 2-Stock Portfolio (MCD & NOC) — Interactive Implementation Plan

This document outlines how to implement the interactive portfolio page: **SPY vs stock price movement**, **stock regression analysis**, **2-stock efficient frontier**, and **portfolio weight sliders** with live stats.

---

## What You Need to Provide

To implement this with minimal back-and-forth, please provide the following from your Excel file **`306 Portfolio Project (version 1).xlsx`**.

### 1. Excel structure (sheet names and ranges)

Fill in the table below and keep it in sync with your workbook. The app will read these sheets/ranges via the `xlsx` library at runtime.

| Chart / feature                                                 | Sheet name (exact)                 | Data range (e.g. A1:D50) | Column meaning                                                                                                                                        |
| --------------------------------------------------------------- | ---------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SPY vs stock price movement**                                 | _e.g. `Prices` or `Price History`_ | _e.g. `A2:D120`_         | Col A = date, Col B = SPY, Col C = MCD, Col D = NOC (or list your columns)                                                                            |
| **Stock regression analysis**                                   | _e.g. `Regression`_                | _e.g. `A2:E30`_          | _e.g. A=date, B=SPY return, C=MCD return, D=NOC return, E=predicted/fitted_ — or describe which columns are X (market) vs Y (stock) and fitted values |
| **2-stock efficient frontier**                                  | _e.g. `Efficient Frontier`_        | _e.g. `A2:C100`_         | _e.g. A=portfolio volatility (σ), B=portfolio return (μ), C=weight MCD (or describe)_                                                                 |
| **Summary stats for weight sliders** (optional but recommended) | _e.g. `Summary` or `Stats`_        | —                        | See “Portfolio math inputs” below                                                                                                                     |

**Important:**

- Row 1 can be headers (the app can skip row 0 or use it for axis labels).
- Dates should be in a format Excel stores as numbers or `YYYY-MM-DD`-style text so the app can parse them.
- If any chart uses **multiple ranges** (e.g. one range for points, another for the frontier curve), note that and we’ll add a second range.

### 2. Portfolio math inputs (for weight sliders)

To recompute **portfolio expected return**, **volatility**, and **Sharpe ratio** when the user changes weights, the app needs one of the following.

**Option A — Pre-computed in Excel (easiest)**

- One sheet (e.g. `Summary` or `Stats`) with:
  - **Expected returns** (annual or monthly) for MCD, NOC, and Bonds (e.g. 3 cells or 3 rows).
  - **Covariance matrix** 3×3 (or **correlation** 3×3 + **volatilities** so we can derive covariance).
- Provide: **exact sheet name** and **cell addresses** (e.g. “MCD return in B2, NOC in B3, Bonds in B4; covariance in D2:F4”).

**Option B — Raw monthly returns**

- One sheet with dates and monthly returns for MCD, NOC, and Bonds (and optionally SPY).
- The app will compute mean return, covariance matrix, and then portfolio stats from weights.
- Provide: **sheet name** and **range** (e.g. `A2:D120` with A=date, B=MCD ret, C=NOC ret, D=Bonds ret).

**Option C — Hybrid**

- Use **Option A** for the sliders (quick, no heavy math in the browser).
- Use **Option B** only if you also want a “monthly returns over time” chart.

### 3. Risk-free rate

- One number (e.g. 5% or 0.05) for Sharpe ratio.
- Either: tell us the cell (e.g. `Summary!B10`) or we use a default (e.g. 4% annual) that you can later make configurable.

### 4. Checklist before development

- [ ] Sheet names and ranges filled in for: **SPY vs stocks**, **regression**, **efficient frontier**.
- [ ] Decision: **Option A** (pre-computed stats) or **Option B** (raw returns) for portfolio math.
- [ ] If Option A: sheet name + cell addresses for expected returns and covariance (or correlation + vols).
- [ ] Risk-free rate: cell or default value.
- [ ] Excel file is (or will be) in `public/pdfs/` with the same filename as in `projects.ts` (`306 Portfolio Project (version 1).xlsx`).

---

## Technical Approach

- **Data source:** The same Excel file already used for the project (`excelFile` in `projects.ts`). The app will **fetch the file** and parse it in the browser with the existing `xlsx` dependency (no backend).
- **Charts:** A charting library (e.g. **Recharts**) will be added. Data will be extracted from the workbook by **sheet name + range**, then passed to Recharts for interactive line/scatter charts.
- **Portfolio sliders:** When the user changes weights (MCD / NOC / Bonds), the app will:
  - Either read pre-computed expected returns and covariance from Excel (Option A), or
  - Compute them from raw monthly returns (Option B), then
  - Compute portfolio return = w′μ, portfolio variance = w′Σw, and Sharpe (if risk-free rate is set).
- **Single project page:** All of this will live on the existing “2-Stock Portfolio Analysis: MCD & NOC” project route; we’ll add a dedicated section (and optionally a small sub-route or tab) for “Interactive charts & weights” so the page stays organized.

---

## Implementation Phases

### Phase 1 — Data layer and project config

**Goal:** Define how the app finds and reads portfolio data from your Excel file.

1. **Add portfolio-specific config**
   - In `src/data/projects.ts` (or a small `portfolioProjectConfig.ts`), add a config object for the MCD & NOC project that includes:
     - Excel file URL (derived from `excelFile`).
     - Sheet names and ranges for: SPY vs stocks, regression, efficient frontier.
     - If Option A: sheet name + cell refs for expected returns and covariance.
     - If Option B: sheet name + range for monthly returns.
     - Risk-free rate (cell or constant).

2. **Shared Excel loader**
   - Reuse the same fetch + `XLSX.read` pattern as in `ExcelViewer` (or a small hook like `useWorkbook(url)`).
   - Add helper functions:
     - `getSheetRange(wb, sheetName, range)` → 2D array of values.
     - Optionally `getCell(wb, sheetName, address)` for single values (e.g. risk-free rate, single stats).

3. **No UI yet** — just config and loaders; optionally a minimal “Data loaded” indicator for debugging.

**Deliverable:** Config filled from “What you need to provide”; app can load the workbook and return arrays for each chart and for portfolio math.

---

### Phase 2 — Portfolio weight sliders and live stats

**Goal:** User can change weights and see portfolio expected return, volatility, and Sharpe update in real time.

1. **UI**
   - Three inputs (sliders or number inputs): **MCD %**, **NOC %**, **Bonds %**.
   - Constrain so that the three sum to 100% (e.g. adjust the third when the user changes one of the first two).
   - Display: **Portfolio expected return**, **Portfolio volatility (σ)**, **Sharpe ratio** (and optionally a small weight pie/bar chart).

2. **Data**
   - On load: from Excel (Option A or B), obtain expected returns and covariance (3×3).
   - Store in React state (or context) along with weights.
   - On weight change: compute
     - μ_p = w′μ
     - σ²_p = w′Σw, σ_p = √σ²_p
     - Sharpe = (μ_p − r_f) / σ_p (annualized if your μ and σ are annual).

3. **Integration**
   - This block is shown only for the project with `slug === 'financial-markets-and-investments'` (and when the Excel file is present).
   - Place it above or below the existing “View spreadsheet” section.

**Deliverable:** Working sliders and live portfolio stats, with data coming from your Excel structure.

---

### Phase 3 — Interactive charts from Excel

**Goal:** Replace or complement static images with interactive charts whose data comes from the same Excel file.

1. **Install charting library**
   - Add **Recharts** (or an alternative): `npm install recharts`.
   - Recharts works well with React and supports line charts, scatter plots, and tooltips.

2. **SPY vs stock price movement**
   - **Data:** Read the sheet/range you specified (date, SPY, MCD, NOC).
   - **Chart:** Line chart: X = date, Y = price (or normalized price if your Excel uses index = 100 at start).
   - **Interactivity:** Legend to toggle series (SPY, MCD, NOC); tooltip on hover with date and values.
   - If your Excel has “price” in one place and “normalized” elsewhere, we can support both or choose one and document it.

3. **Stock regression analysis**
   - **Data:** From the regression sheet/range (e.g. X = market/SPY return, Y = stock return, plus fitted values if available).
   - **Chart:** Scatter plot: each point = (market return, stock return); optional second series for fitted line (if you have a column of fitted Y).
   - **Interactivity:** Tooltip showing point (x, y), optional display of slope/ R² if we read them from Excel or compute in app.
   - If the regression is “MCD vs SPY” and “NOC vs SPY” separately, we can do two small charts or one with two series of points + two fitted lines (clarify from your sheet).

4. **2-stock efficient frontier**
   - **Data:** From the efficient-frontier sheet/range (e.g. volatility, return, and optionally weight).
   - **Chart:** Scatter or line: X = volatility (σ), Y = expected return (μ).
   - **Interactivity:** Tooltip with σ, μ, and weight if available.
   - **Optional:** Show the “current” portfolio (from Phase 2 sliders) as a distinct point on the same chart (compute its μ and σ from current weights and the same covariance/return inputs).

**Deliverable:** Three interactive charts on the project page, all driven by the ranges you provided.

---

### Phase 4 — Polish and optional extras

**Goal:** Make the page clear and professional.

1. **Layout**
   - Order: short intro → **Portfolio weight sliders + stats** → **SPY vs stocks** → **Regression** → **Efficient frontier** → “View spreadsheet in browser” / Download Excel.
   - Responsive: charts and sliders stack on small screens.

2. **Loading and errors**
   - While the workbook is loading: show “Loading portfolio data…” and disable sliders.
   - If the file fails to load or a sheet/range is missing: show a short message (“Check that the Excel file and sheet names match the config”) and still show the rest of the project page (description, download link).

3. **Optional**
   - **Presets:** Buttons “Equal weight”, “60% Bonds / 40% stocks”, “Max Sharpe” (we can compute max-Sharpe weights from the same covariance and returns).
   - **Small tooltips** for “Standard deviation”, “Sharpe ratio”, “Efficient frontier” for visitors who are less familiar with the terms.

---

## File and Code Structure (Summary)

| Item                                        | Location / approach                                                                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Project config (sheet names, ranges, cells) | `src/data/portfolioProjectConfig.ts` (or inside `projects.ts`)                                                                                |
| Excel fetch + parse                         | Reuse pattern from `ExcelViewer`; optional `useWorkbook(url)` hook                                                                            |
| Portfolio math (μ_p, σ_p, Sharpe)           | `src/utils/portfolioMath.ts` (pure functions)                                                                                                 |
| Weight sliders + stats UI                   | `src/components/PortfolioWeightSlider.tsx` (or similar)                                                                                       |
| Chart components                            | e.g. `PortfolioCharts.tsx` using Recharts, with props = data arrays from Excel                                                                |
| Integration on project page                 | `ProjectPage.tsx`: when `slug === 'financial-markets-and-investments'` and `excelFile` exists, render sliders + charts + existing ExcelViewer |

---

## Dependencies to Add

- **recharts** — for line and scatter charts with tooltips and legend.
  ```bash
  npm install recharts
  ```

Nothing else is required if we stick to reading Excel in the browser and doing portfolio math in JavaScript.

---

## What You Need to Provide (Recap)

1. **Excel structure table** filled with sheet names and ranges for:
   - SPY vs stock price movement
   - Stock regression analysis
   - 2-stock efficient frontier

2. **Portfolio math:** Either
   - **Option A:** Sheet name + cell refs for expected returns (MCD, NOC, Bonds) and 3×3 covariance (or correlation + volatilities), **or**
   - **Option B:** Sheet name + range for monthly returns (date + MCD + NOC + Bonds).

3. **Risk-free rate:** Cell reference or a single number (e.g. 4% or 5%).

4. **Confirm** the Excel file name and that it will be in `public/pdfs/`.

Once you provide the sheet names, ranges, and (for Option A) cell addresses, implementation can follow this plan phase by phase. If any of your charts use a different structure (e.g. multiple ranges or different column order), share that and we’ll adapt the config and data-reading logic accordingly.
