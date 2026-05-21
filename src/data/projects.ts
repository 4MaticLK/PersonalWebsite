/** One chart/graph image to show on the project page (export from Excel as PNG/JPG). */
export interface ProjectChartImage {
  /** Filename in public/images/ (e.g. "mcd-returns.png") */
  file: string;
  /** Short title shown under the image */
  caption?: string;
  /** Longer explanation of what the chart shows and how to read it */
  description?: string;
}

/**
 * Interactive chart: data is read from the project's Excel file and rendered with Recharts.
 * - sheet: exact sheet name in the workbook
 * - dataRange: Excel range (e.g. "A2:C25"). First column = x-axis labels, other columns = data series.
 * - chartType: line or bar
 * - title: chart title
 * - seriesNames: optional names for each value column (same order as columns B, C, ...)
 */
export interface ProjectInteractiveChart {
  sheet: string;
  dataRange: string;
  chartType: 'line' | 'bar';
  title?: string;
  seriesNames?: string[];
}

/** Notebook or support file for replicating a project (under public/) */
export interface ProjectCodeFile {
  /** Path relative to site root, e.g. code/fin285a/Part1.ipynb */
  path: string;
  label: string;
  description?: string;
}

export interface Project {
  name: string;
  slug: string;
  shortDescription: string;
  type: 'model' | 'paper' | 'project';
  /** When the project was completed (e.g. "May 2025", "Spring 2025"). Shown on project page. */
  projectDate?: string;
  /** For valuation/financial projects: date of the underlying data (e.g. "Financials as of Dec 31, 2024"). */
  dataAsOf?: string;
  /** Optional: filename in public/pdfs/ (e.g. PBMA_copy.xlsx) for "Download model" link */
  excelFile?: string;
  /** Paper: "Download PDF". Project (report-first): "Read full report (PDF)" when set. */
  pdfFile?: string;
  /** Paper-only: e.g. "Spring 2025" or "January 2026" (legacy; projectDate preferred) */
  paperDate?: string;
  /** Paper-only: abstract/summary */
  abstract?: string;
  /** Paper-only: full text or key sections (paragraphs separated by \n\n) */
  body?: string;
  /** Paper-only: images with labels (e.g. context photos); file in public/images/ */
  paperImages?: { file: string; label: string }[];
  /** Paper-only: key topics the paper covers (short list for scannability) */
  paperTopics?: string[];
  /** Project-only: optional page body (paragraphs separated by \n\n). Replaces placeholder when set. */
  description?: string;
  /** Project-only: chart/graph images (export from Excel as PNG/JPG, place in public/images/) */
  chartImages?: ProjectChartImage[];
  /** Project-only: interactive charts (data read from excelFile; specify sheet + range) */
  interactiveCharts?: ProjectInteractiveChart[];
  /** Project-only: notebooks, requirements, README for replication */
  codeFiles?: ProjectCodeFile[];
}

export const PROJECTS: Project[] = [
  {
    name: 'Goodyear Tire & Rubber: Equity Research & Valuation',
    slug: 'goodyear-equity-research-valuation',
    shortDescription: 'Equity research report and DCF valuation of Goodyear Tire & Rubber (GT)',
    type: 'project',
    projectDate: 'May 2025',
    dataAsOf: 'Financials as of Dec 31, 2024',
    pdfFile: 'Goodyear_Writing_Word2.pdf',
    excelFile: 'GoodYear_Valuation_Final.xlsx',
    description: `Goodyear (GT) is not a simple "cheap vs expensive" stock. It is a balance-sheet and cash-flow story, where operating stability, cost discipline, and leverage determine whether equity value compounds or gets squeezed.

This report walks through the business from the ground up, starting with industry structure and Goodyear's positioning, then moving into debt and liquidity, ratio trends, and working-capital efficiency (cash conversion cycle). I tie those operating and credit factors into an unlevered DCF that is fully traceable, so a reader can follow each assumption from source data to valuation output.

In my base case, the model implies **$11.48 per share** versus the **$11.01** close on **May 2, 2025**, which is a modest headline upside but a useful way to frame the debate. The more important takeaway is *what drives the spread*: margin recovery, cash generation, and the cost of capital. I also include sensitivity analysis to show where the equity is resilient and where leverage meaningfully changes the outcome.

Below you’ll find key metrics and scenario toggles (base / bull / bear), expandable assumption rationales, and ratio tables. For the full write-up and model, use the links above to open the report (PDF) or download the Excel file.`,
  },
  {
    name: 'Risk Parity ETF Design & Tracking Error Optimization',
    slug: 'risk-parity-etf-fin285a',
    shortDescription:
      '200% leveraged risk-parity ETF on four sleeves, then 20-ETF tracking-error replication with out-of-sample validation.',
    type: 'project',
    projectDate: 'Spring 2026',
    dataAsOf: 'Prices 2014–2025 · Train 2014–2018 / Test 2019–2025',
    pdfFile: 'FIN285A_Risk_Parity_ETF.pdf',
    excelFile: 'AssetPrices_Part2.xlsx',
    description: `FIN 285A (Computer Simulations & Risk Assessment): design and backtest a Bridgewater-style “All Weather” portfolio using liquid ETFs—first with dynamic risk parity on four broad sleeves, then with a 20-fund universe that minimizes tracking error against the same benchmark.

Part 1 builds a **200% leveraged** risk-parity strategy on AGG (nominal bonds), ACWI (global equities), GSG (commodities), and TIP (inflation-linked bonds), using an EWMA covariance model (λ = 0.97), an 18-month rolling window, monthly rebalancing, and a static ALLW-style benchmark for comparison. Part 2 disaggregates each sleeve into granular ETFs (equity, bonds, TIPS, commodities) and solves for weights that minimize tracking error, with train/test validation (2014–2018 in-sample, 2019–2025 out-of-sample) and MA vs EWMA covariance models.

A central finding is the **2022 bond–equity correlation regime shift**: when stocks and bonds moved together during the inflation shock, the traditional hedging assumption behind risk parity and 60/40 portfolios broke down—highlighting why TIPS and real assets matter as diversifiers. Out of sample, a **7-year training window with a moving-average covariance model** produced the smallest gap between forecast and realized tracking error (~12 bps).

Charts below summarize performance, weights, tracking error, and correlations. Open the presentation (PDF) for the full methodology, or download the daily price panel (Excel) used in Part 2.`,
    chartImages: [
      {
        file: 'fin285a-cumulative-returns.png',
        caption: 'Part 1 — Cumulative return vs benchmark',
        description:
          'Monthly rebalanced risk parity (EWMA λ = 0.97, 18-month covariance window) compared with a static ALLW-style mix rescaled to 200% leverage on AGG, ACWI, GSG, and TIP. The lines separate when volatility regimes change: risk parity typically runs at lower volatility but can trail the static benchmark in extended risk-on periods.',
      },
      {
        file: 'fin285a-part1-weights.png',
        caption: 'Part 1 — Dynamic weights over time',
        description:
          'Optimized weights after the five-year burn-in. Nominal bonds (AGG) begin near the top of the range and decline as equity volatility rises; TIPS and commodities tend to hold closer to the 10% floor. Rebalancing is visible around 2020 (COVID) and 2022 (inflation shock), when the model shifts risk across sleeves.',
      },
      {
        file: 'fin285a-bond-equity-correlation.png',
        caption: 'Rolling bond–equity correlation',
        description:
          'Rolling correlation between the bond proxy (AGG) and equity proxy (ACWI). Negative or near-zero readings before 2022 supported the classic “bonds hedge stocks” narrative; the sustained positive readings after 2022 show why risk parity and 60/40 portfolios faced a structurally harder environment.',
      },
      {
        file: 'fin285a-part2-cumulative.png',
        caption: 'Part 2 — Optimized 20-ETF vs benchmark (test period)',
        description:
          'Out-of-sample cumulative returns (2019–2025) for the tracking-error-minimized portfolio versus the Part 1 benchmark, using weights fixed after training on 2014–2018. The paths stay close, indicating that a 20-ETF implementation can replicate the broad four-asset ALLW-style exposure without a large return gap in the test window.',
      },
      {
        file: 'fin285a-tracking-error.png',
        caption: 'Part 2 — Rolling tracking error',
        description:
          'Rolling tracking error between the optimized fund portfolio and the benchmark. Spikes align with macro stress (notably 2020 and 2022), when realized TE exceeded in-sample forecasts; in calmer periods TE compresses. This pattern motivated comparing MA vs EWMA models and longer training windows in the sensitivity analysis.',
      },
      {
        file: 'fin285a-correlation-matrix.png',
        caption: 'Part 2 — Correlation matrix (20 ETFs)',
        description:
          'Pairwise correlations for the full Part 2 universe. Equities correlate strongly with each other, as do bonds and commodities within their sleeves, while cross-sleeve correlations are lower—supporting diversification and the choice to split ACWI and GSG into granular funds rather than rely on a single broad ETF per sleeve.',
      },
    ],
    codeFiles: [
      {
        path: 'code/fin285a/README.md',
        label: 'README.md',
        description: 'Setup, run order, and replication notes',
      },
      {
        path: 'code/fin285a/requirements.txt',
        label: 'requirements.txt',
        description: 'Python dependencies (NumPy, pandas, SciPy, matplotlib, yfinance, openpyxl)',
      },
      {
        path: 'code/fin285a/Part1.ipynb',
        label: 'Part1.ipynb',
        description: 'Risk parity on four ETFs vs static ALLW-style benchmark',
      },
      {
        path: 'code/fin285a/Part2.ipynb',
        label: 'Part2.ipynb',
        description: '20-ETF tracking-error optimization, validation, and charts',
      },
      {
        path: 'code/fin285a/AssetPrices_Part2.xlsx',
        label: 'AssetPrices_Part2.xlsx',
        description: 'Daily prices for Part 2 (place next to Part2.ipynb)',
      },
    ],
  },
  {
    name: '2-Stock Portfolio Analysis: MCD & NOC',
    slug: 'financial-markets-and-investments',
    shortDescription: 'Portfolio analysis for McDonald’s & Northrop Grumman',
    type: 'project',
    dataAsOf: 'Historical data as of March 2025',
    excelFile: '306 Portfolio Project (version 1).xlsx',
    description: `This report documents a $100 million portfolio mandate: select two equities and a U.S. government bond position, then recommend an allocation that targets a strong 24-month return while keeping risk disciplined and measurable. The goal is not just to pick "good stocks," but to build a portfolio where the mix is doing real work through diversification and controlled market exposure.

I sourced the two equities from a pre-screened universe and started with six candidates (NOC, MCD, LMT, KO, KR, RTX). I narrowed to Northrop Grumman (NOC) and McDonald's (MCD) because, together, they offered a cleaner balance of defensiveness and return potential, plus diversification benefits versus holding either name alone. I use SPY as the market benchmark and add a 10-year U.S. Treasury sleeve as the risk-free component.

To build the recommendation, I use 10 years of monthly total-return data (April 2015 to March 2025), including stress periods like 2020. I estimate returns, volatility, and covariance, measure market sensitivity using beta and alpha (including regression on excess returns), and map the feasible NOC–MCD set in 5% weight increments to identify an efficient mix. I then convert that optimal risky sleeve into a complete portfolio by blending it with Treasuries.

Recommendation: invest $36M in NOC (36%), $54M in MCD (54%), and $10M in 10-year Treasuries (10%). In my model, this mix targets an expected annual return of ~13.6% with a portfolio beta of ~0.49, meaning it aims for equity-like returns while taking materially less market risk than SPY.`,
    // Interactive charts: data is read from the Excel file. Set sheet name and range (first col = labels, rest = series).
    // interactiveCharts: [
    //   { sheet: 'Returns', dataRange: 'A2:C25', chartType: 'line', title: 'Historical returns', seriesNames: ['MCD', 'NOC'] },
    //   { sheet: 'Weights', dataRange: 'A2:B4', chartType: 'bar', title: 'Portfolio weights', seriesNames: ['Weight'] },
    // ],
  },
  {
    name: 'Mergers and Acquisitions',
    slug: 'mergers-and-acquisitions',
    shortDescription: 'DCF valuation of Anheuser-Busch, synergy scenario and sensitivity analysis',
    type: 'project',
    projectDate: '2025',
    excelFile: 'PBMA_copy.xlsx',
    description: `This project is based on a Harvard Business School case. I can't share case details or the full narrative, but here's what you're looking at: a valuation exercise in a mergers & acquisitions setting. The goal is to estimate a fair value for the target using a DCF (discounted cash flow) model, and to explore how key assumptions—like the cost of capital (WACC) and long-term growth—affect the implied offer price.

Below you'll find a simplified interactive DCF you can use in the browser, plus a read-only preview of the spreadsheet. To see my formulas, assumptions, and full sensitivity analysis, use the "Download full Excel model" button and open the file in Excel.`,
  },
  {
    name: 'International Finance: Argentine Economy',
    slug: 'research-paper',
    shortDescription:
      'Research on Argentina’s economy in an International Finance context — macro drivers, FX and sovereign risk, and implications.',
    type: 'paper',
    projectDate: '2025',
    paperDate: '2025',
    abstract:
      'This paper analyzes Argentina’s economy from an international finance perspective. It reviews the country’s macroeconomic context—including growth, inflation, and fiscal and monetary policy—and examines foreign exchange dynamics, capital flows, and sovereign debt and default history. The discussion covers how these factors interact with global financial conditions and policy choices (including IMF programs) and what they imply for external financing, currency stability, and investment and credit risk. The paper aims to give a structured view of the main drivers and challenges facing Argentina in the international financial system.',
    body: 'Research conducted for an International Finance course. The full paper develops the analysis in the abstract and is available as a PDF below.',
    pdfFile: 'Argentina fixed.pdf',
    paperImages: [
      { file: 'argentine flag.jpg', label: 'Flag of Argentina' },
      { file: 'Javier_Milei_en_el_Salon_Blanco_NEW.jpeg', label: 'Javier Milei' },
    ],
    paperTopics: [
      'Macro context (growth, inflation, fiscal & monetary policy)',
      'Foreign exchange and capital flows',
      'Sovereign debt and default history',
      'IMF programs and policy choices',
      'Implications for financing and credit risk',
    ],
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
