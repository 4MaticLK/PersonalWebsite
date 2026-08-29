/**
 * Historical series backing the two interactive charts on the Argentina paper page.
 * Digitized directly from the paper's own Figure 1 and Figure 2 (pixel-calibrated against each
 * chart's axis gridlines and tick labels, then read off the plotted line for every year), so this
 * matches what the paper actually shows rather than an independent reconstruction. The handful of
 * years the paper's text also states explicitly (1989, 2020–2025 inflation) are pinned to that
 * exact wording. The 1996–2001 near-zero/deflation stretch is clamped to ~1 in the source chart
 * (a log axis can't show zero or negative values), so those years instead use the real published
 * INDEC/World Bank figures, which the clamped pixels can't recover.
 */

export interface InflationPoint {
  year: number;
  /** True annual inflation, % (can be negative during the 1999–2001 deflation). */
  inflation: number;
}

export const ARGENTINA_INFLATION_DATA: InflationPoint[] = [
  { year: 1975, inflation: 336 },
  { year: 1976, inflation: 335 },
  { year: 1977, inflation: 163 },
  { year: 1978, inflation: 169 },
  { year: 1979, inflation: 137 },
  { year: 1980, inflation: 90 },
  { year: 1981, inflation: 133 },
  { year: 1982, inflation: 218 },
  { year: 1983, inflation: 442 },
  { year: 1984, inflation: 674 },
  { year: 1985, inflation: 364 },
  { year: 1986, inflation: 85 },
  { year: 1987, inflation: 180 },
  { year: 1988, inflation: 432 },
  { year: 1989, inflation: 4923 },
  { year: 1990, inflation: 1186 },
  { year: 1991, inflation: 84 },
  { year: 1992, inflation: 17.6 },
  { year: 1993, inflation: 7.3 },
  { year: 1994, inflation: 3.8 },
  { year: 1995, inflation: 1.6 },
  { year: 1996, inflation: 0.1 },
  { year: 1997, inflation: 0.5 },
  { year: 1998, inflation: 0.9 },
  { year: 1999, inflation: -1.2 },
  { year: 2000, inflation: -0.9 },
  { year: 2001, inflation: -1.1 },
  { year: 2002, inflation: 36 },
  { year: 2003, inflation: 3.9 },
  { year: 2004, inflation: 6.3 },
  { year: 2005, inflation: 12.2 },
  { year: 2006, inflation: 9.8 },
  { year: 2007, inflation: 8.4 },
  { year: 2008, inflation: 7.2 },
  { year: 2009, inflation: 7.8 },
  { year: 2010, inflation: 10.8 },
  { year: 2011, inflation: 9.5 },
  { year: 2012, inflation: 10.8 },
  { year: 2013, inflation: 11.3 },
  { year: 2014, inflation: 23.8 },
  { year: 2015, inflation: 27.3 },
  { year: 2016, inflation: 40.3 },
  { year: 2017, inflation: 25.5 },
  { year: 2018, inflation: 47.3 },
  { year: 2019, inflation: 53.5 },
  { year: 2020, inflation: 36.1 },
  { year: 2021, inflation: 50.9 },
  { year: 2022, inflation: 94.8 },
  { year: 2023, inflation: 211.4 },
  { year: 2024, inflation: 117.8 },
  { year: 2025, inflation: 31.5 },
];

export interface FxPoint {
  year: number;
  /** Official pesos-per-dollar rate, year-end. */
  official: number;
  /** Parallel ("blue") rate, year-end — null when no meaningful gap existed (no active controls). */
  parallel: number | null;
}

export const ARGENTINA_FX_DATA: FxPoint[] = [
  { year: 2000, official: 1.0, parallel: null },
  { year: 2001, official: 1.0, parallel: null },
  { year: 2002, official: 3.2, parallel: null },
  { year: 2003, official: 2.9, parallel: null },
  { year: 2004, official: 2.9, parallel: null },
  { year: 2005, official: 2.9, parallel: null },
  { year: 2006, official: 3.0, parallel: null },
  { year: 2007, official: 3.1, parallel: null },
  { year: 2008, official: 3.5, parallel: null },
  { year: 2009, official: 3.7, parallel: null },
  { year: 2010, official: 3.9, parallel: null },
  { year: 2011, official: 4.3, parallel: 4.9 },
  { year: 2012, official: 4.9, parallel: 6.8 },
  { year: 2013, official: 6.5, parallel: 10.0 },
  { year: 2014, official: 8.5, parallel: 13.1 },
  { year: 2015, official: 12.7, parallel: 13.3 },
  { year: 2016, official: 15.9, parallel: null },
  { year: 2017, official: 18.2, parallel: null },
  { year: 2018, official: 37.6, parallel: null },
  { year: 2019, official: 59.9, parallel: 75.7 },
  { year: 2020, official: 84.1, parallel: 165.5 },
  { year: 2021, official: 103.4, parallel: 202.4 },
  { year: 2022, official: 182.1, parallel: 365.2 },
  { year: 2023, official: 800, parallel: 972 },
  { year: 2024, official: 1034, parallel: 1229 },
  { year: 2025, official: 1392, parallel: 1440 },
  { year: 2026, official: 1496, parallel: 1496 },
];

export interface ArgentinaEpisode {
  id: string;
  years: string;
  title: string;
  summary: string;
  body: string;
  /** Numeric range for chart cross-highlighting; omitted for entries that aren't a date range. */
  startYear?: number;
  endYear?: number;
}

/** Episode id whose [startYear, endYear] contains the given year, or null if none does. */
export function findEpisodeForYear(year: number): string | null {
  for (const ep of ARGENTINA_EPISODES) {
    if (ep.startYear != null && ep.endYear != null && year >= ep.startYear && year <= ep.endYear) {
      return ep.id;
    }
  }
  return null;
}

/**
 * An episode's [startYear, endYear] clamped to a chart's own axis domain, for cross-highlighting.
 * Returns null when the episode has no date range or falls entirely outside the domain.
 */
export function clampEpisodeRange(
  episodeId: string,
  domainMin: number,
  domainMax: number
): [number, number] | null {
  const ep = ARGENTINA_EPISODES.find((e) => e.id === episodeId);
  if (!ep || ep.startYear == null || ep.endYear == null) return null;
  if (ep.endYear < domainMin || ep.startYear > domainMax) return null;
  return [Math.max(ep.startYear, domainMin), Math.min(ep.endYear, domainMax)];
}

export const ARGENTINA_EPISODES: ArgentinaEpisode[] = [
  {
    id: 'decline',
    years: '1930–1989',
    startYear: 1930,
    endYear: 1989,
    title: 'The long decline',
    summary:
      'The 1930 Depression shock hardens into the Peronist coalition, the stop-go cycle, and finally 4,923% hyperinflation.',
    body: `Argentina's reversal began with the Great Depression, not fiscal profligacy: the export economy built between 1880 and 1929 lost its market when world trade collapsed, and the state turned inward with exchange controls, tariffs, and a new central bank. Under Juan Perón after 1946, that emergency response became a permanent structure — nationalized utilities, an export tax funding urban industry and wages, and a coalition of organized labor, protected industry, and the provinces whose claims on the treasury were politically enforceable regardless of what the treasury could raise.

That institutional deficit produced three decades of stop-go cycles: industrialization needed imported inputs, imports needed dollars, and dollars came from agricultural exports that policy had deliberately taxed. The 1975 Rodrigazo pushed inflation past 300%, and it stayed structural rather than episodic for sixteen years. The 1980s debt crisis and two failed heterodox stabilization plans (the Austral, the Primavera) ended with prices rising 4,923% in 1989 and a president leaving office five months early.`,
  },
  {
    id: 'convertibility',
    years: '1991–1998',
    startYear: 1991,
    endYear: 1998,
    title: 'Convertibility: a rule instead of an institution',
    summary:
      'The 1:1 dollar peg kills inflation almost overnight — but disciplines the currency, not the budget.',
    body: `The Convertibility Law fixed the peso to the dollar at parity and required the central bank to back the monetary base with reserves — a constitutional device, not just an exchange-rate policy, since reversing it required an act of Congress. It worked immediately: monthly inflation fell from ~27% to effectively zero within five years, and Argentina drew over $100 billion in net capital inflows.

But convertibility was a rule doing work that fiscal institutions were not. The provinces, roughly half of consolidated public spending, kept borrowing against implicit federal guarantees the hard currency constraint never touched. The first proof came in 1995: Mexico's devaluation triggered a run on Argentine deposits, and with no monetary response available under a currency board, the entire adjustment fell on output — unemployment hit 18.4%. The IMF read the episode as proof of resilience; in 1998 its Managing Director called Argentina "exemplary."`,
  },
  {
    id: 'collapse',
    years: '1999–2002',
    startYear: 1999,
    endYear: 2002,
    title: 'The collapse',
    summary:
      'A debt level that looked unremarkable on paper was five times annual export earnings — and the arithmetic finally resolved itself.',
    body: `Russia's 1998 default reversed capital flows to emerging markets; Brazil's January 1999 devaluation hit Argentine exports hard, and the peso — contractually pegged to an appreciating dollar — had no exchange-rate instrument left. The standard account is usually mis-stated here: Argentina's 62.2% debt-to-GDP ratio in 2001 was unremarkable internationally. The composition was the problem. Nearly all debt was dollar-denominated against a peso tax base, and exports were barely 10% of GDP — measured against actual dollar earnings, the debt was roughly five times annual exports.

The June 2001 megacanje bought time at rising cost. The December 2001 corralito (capping withdrawals) and the IMF's withholding of a scheduled disbursement removed the last reasons to hold pesos. Riots, five presidents in two weeks, and a default on $81.8 billion followed. GDP fell 10.9% in 2002; poverty reached 57.5%.`,
  },
  {
    id: 'isolation',
    years: '2003–2015',
    startYear: 2003,
    endYear: 2015,
    title: 'Default, isolation, and the slow return of the deficit',
    summary:
      'A decade of financial isolation — and when the fiscal gap returned, the government changed the measurement, not the policy.',
    body: `The post-collapse float was, on the evidence, the right call: a competitive exchange rate and a commodity boom produced ~8% average growth from 2003–2008. This was the moment the fiscal institution could have been built. It was not. Two restructuring rounds (2005, 2010) cut the defaulted debt but left holdout litigation that kept Argentina out of voluntary capital markets for fifteen years — a government that cannot borrow abroad and will not raise sufficient revenue at home has one remaining option, and after 2011 the deficit was again financed by the central bank.

The clearest illustration of the paper's thesis sits here: from 2007 the government intervened directly in INDEC, the statistics agency, publishing inflation figures private estimates put at less than half the true rate. In 2013 the IMF issued its first-ever declaration of censure over a member's data quality. Faced with inflation it would not address, the government did not change the policy — it changed the measurement.`,
  },
  {
    id: 'imf2018',
    years: '2018–2020',
    startYear: 2018,
    endYear: 2020,
    title: 'The largest programme in IMF history',
    summary:
      '$57 billion — 1,227% of quota — and the Fund\'s own post-mortem says it omitted the measures its designers thought necessary.',
    body: `Macri's "gradualism" — financing a slowly declining deficit by borrowing abroad rather than printing money — worked while global conditions were benign. In April 2018 they stopped being benign: Fed tightening, a severe drought, and a peso under sustained attack. The IMF approved a $50 billion Stand-By Arrangement in June 2018, augmented to $57 billion in October — the largest programme in the Fund's history. It did not work: inflation accelerated, the peso kept falling, and Macri reimposed capital controls in September 2019.

The Fund's own ex-post evaluation, published in December 2021, is unusually direct: the programme "did not fulfil the objectives of restoring confidence," and — most tellingly — it lacked a debt restructuring and capital-flow management, measures its own designers judged necessary, because Argentina's authorities rejected both. A programme missing the preconditions its designers required is not a stabilization. It is financing.`,
  },
  {
    id: 'milei',
    years: '2023–2026',
    startYear: 2023,
    endYear: 2026,
    title: 'The Milei adjustment',
    summary:
      'For the first time, the fiscal surplus comes before the exchange-rate regime — and it has now survived two years, a recession, and an election.',
    body: `Milei inherited net international reserves of negative $11.2 billion — gross reserves of $21.2 billion looked thin but survivable; netted against swap and credit obligations, the central bank had no capacity to defend the currency at all. The December 2023 devaluation (54%, from ~366 to 800 pesos/dollar) was the recognition of arithmetic that had already resolved itself, not a policy choice among alternatives.

What distinguishes this episode is sequencing: the fiscal correction came first and was not deferred. Argentina ran primary surpluses in 2024 and 2025 — the first two consecutive years of cash-basis surplus since 2008 — and inflation fell from a 290% peak to 31.5% by 2025. Two qualifications matter: a $20 billion IMF facility and a $20 billion U.S. Treasury swap have again substituted external support for fully domestic credibility, and the January 2026 band regime indexes to lagged inflation — a mechanism for accommodating inertia, not breaking it.`,
  },
  {
    id: 'verdict',
    years: 'The case against, and what would have to be true',
    title: 'Weighing the counter-case',
    summary:
      'The heterodox objection is partly right — adjustment reliably pushes poverty above 50%. It explains why stabilization is resisted, not why Argentina alone needs one every decade.',
    body: `The strongest objection: the IMF endorsed and lent into convertibility, then designed a 2018 programme its own evaluators judged incomplete — the recurring collapses are as much failures of external advice as of domestic politics, and "building institutions" can be a euphemism for settling a distributional conflict in creditors' favor. Two parts of this are simply correct: the Fund's conduct is indefensible on its own published evidence, and Argentine adjustment reliably produces poverty above 50% within a year, as in 2002 and 2024.

But the objection describes the cost of adjustment, not why Argentina alone needs one every decade. Brazil, Chile, Colombia, Peru, and Uruguay faced the same Volcker shock, debt crisis, commodity cycle, and 2018 Fed tightening — none defaulted three times in twenty-five years. Three tests remain before the current pattern can be called broken: the 2027 election (has fiscal discipline survived one government, or become an institution?), net reserves (still negative or unpublished), and the January 2026 exchange-rate framework (a weaker anchor than the one it replaced).`,
  },
];
