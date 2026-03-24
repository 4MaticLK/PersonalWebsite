/** One chart/graph image to show on the project page (export from Excel as PNG/JPG). */
export interface ProjectChartImage {
  /** Filename in public/images/ (e.g. "mcd-returns.png") */
  file: string;
  /** Optional caption shown under the image */
  caption?: string;
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
