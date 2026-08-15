import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  enrichHoldingsForAllocation,
  formatPct,
  type HoldingRow,
  type PortfolioSummary,
} from '../../utils/parsePersonalPortfolioCsv';

import type { PortfolioFilter } from '../../utils/portfolioFilter';

interface PortfolioAllocationChartProps {
  holdings: HoldingRow[];
  summary: PortfolioSummary;
  filter?: PortfolioFilter | null;
}

const COLORS = ['#ff8f2e', '#0d9488', '#6366f1', '#f59e0b', '#8a8a8a', '#ec4899', '#22c55e', '#8b5cf6', '#14b8a6', '#f97316', '#6b6b6b'];

type AllocationMode = 'ticker' | 'sector';

type ChartSlice = { name: string; value: number; weightPct: number };

function renderSliceLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  name?: string;
  payload?: ChartSlice;
  percent?: number;
}) {
  const { cx, cy, midAngle, outerRadius, name, payload, percent } = props;
  if (cx == null || cy == null || midAngle == null || outerRadius == null) return null;

  const labelName = payload?.name ?? name ?? '';
  const weightPct = payload?.weightPct ?? (percent != null ? percent * 100 : 0);
  if (!labelName || weightPct <= 0) return null;

  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 2) * cos;
  const sy = cy + (outerRadius + 2) * sin;
  const mx = cx + (outerRadius + 24) * cos;
  const my = cy + (outerRadius + 24) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 18;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';
  const textX = ex + (cos >= 0 ? 8 : -8);

  return (
    <g className="personal-portfolio__pie-label-group">
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        className="personal-portfolio__pie-label-line"
      />
      <text
        x={textX}
        y={ey}
        textAnchor={textAnchor}
        dominantBaseline="central"
        className="personal-portfolio__pie-label"
      >
        <tspan className="personal-portfolio__pie-label-name">{labelName}</tspan>
        <tspan className="personal-portfolio__pie-label-pct"> {weightPct.toFixed(1)}%</tspan>
      </text>
    </g>
  );
}

function aggregateBySector(holdings: HoldingRow[]): { name: string; value: number; weightPct: number }[] {
  const map = new Map<string, number>();
  for (const h of holdings) {
    map.set(h.sector, (map.get(h.sector) ?? 0) + h.marketValue);
  }
  const total = [...map.values()].reduce((s, v) => s + v, 0);
  return [...map.entries()]
    .map(([name, value]) => ({
      name,
      value,
      weightPct: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

export function PortfolioAllocationChart({
  holdings,
  summary,
  filter,
}: PortfolioAllocationChartProps) {
  const [mode, setMode] = useState<AllocationMode>('sector');

  const chartData = useMemo(() => {
    const enriched = enrichHoldingsForAllocation(holdings, summary);
    if (mode === 'sector') return aggregateBySector(enriched);
    return enriched
      .map((h) => ({ name: h.ticker, value: h.marketValue, weightPct: h.weightPct }))
      .sort((a, b) => b.value - a.value);
  }, [holdings, summary, mode]);

  return (
    <article
      className="portfolio-chart personal-portfolio__chart personal-portfolio__chart--allocation"
      aria-labelledby="portfolio-allocation-heading"
    >
      <div className="personal-portfolio__chart-header personal-portfolio__chart-header--allocation">
        <h3 id="portfolio-allocation-heading" className="portfolio-chart__title">
          Allocation
        </h3>
        <div className="personal-portfolio__toggle" role="group" aria-label="Allocation view">
          <button
            type="button"
            className={`personal-portfolio__toggle-btn ${mode === 'sector' ? 'personal-portfolio__toggle-btn--active' : ''}`}
            onClick={() => setMode('sector')}
          >
            By sector
          </button>
          <button
            type="button"
            className={`personal-portfolio__toggle-btn ${mode === 'ticker' ? 'personal-portfolio__toggle-btn--active' : ''}`}
            onClick={() => setMode('ticker')}
          >
            By ticker
          </button>
        </div>
      </div>
      <div className="portfolio-chart__container personal-portfolio__chart-container personal-portfolio__chart-container--pie">
        <ResponsiveContainer width="100%" height={400}>
          <PieChart margin={{ top: 4, right: 12, bottom: 4, left: 12 }}>
            <Pie
              key={mode}
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={108}
              paddingAngle={2}
              label={renderSliceLabel}
              labelLine={false}
              activeIndex={-1}
              activeShape={false}
              isAnimationActive
              animationDuration={450}
              onClick={() => undefined}
              onMouseDown={(e) => e.preventDefault()}
            >
              {chartData.map((entry, i) => {
                const dimmed =
                  filter != null &&
                  !(
                    (filter.kind === 'ticker' && mode === 'ticker' && filter.value === entry.name) ||
                    (filter.kind === 'sector' && mode === 'sector' && filter.value === entry.name)
                  );
                return (
                  <Cell
                    key={entry.name}
                    fill={COLORS[i % COLORS.length]}
                    stroke="transparent"
                    fillOpacity={dimmed ? 0.25 : 1}
                  />
                );
              })}
            </Pie>
            <Tooltip
              trigger="hover"
              contentStyle={{
                background: '#111111',
                border: '1px solid rgba(255, 143, 46, 0.35)',
                borderRadius: '0.5rem',
                color: '#e8e8e8',
              }}
              formatter={(_value: number, _name, item) => {
                const payload = item.payload as ChartSlice;
                return [formatPct(payload.weightPct), payload.name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
