import { useEffect, useState } from 'react';
import {
  loadPart1BondEquityCorr,
  loadPart1Cumulative,
  loadPart1Weights,
  loadPart2Correlation,
  loadPart2Cumulative,
  loadPart2RollingTe,
  loadPart2TeBenchmarks,
  rebaseCumulative,
  type CorrelationPoint,
  type CumulativeRow,
  type Part2TeBenchmarks,
  type TrackingErrorPoint,
  type WeightsRow,
} from '../../utils/fin285aChartData';

export interface Fin285aChartDataReady {
  status: 'ready';
  part1Cum: CumulativeRow[];
  part1Wts: WeightsRow[];
  bondCorr: CorrelationPoint[];
  part2Cum: CumulativeRow[];
  rollingTe: TrackingErrorPoint[];
  teBenchmarks: Part2TeBenchmarks;
  corr: { labels: string[]; matrix: number[][] };
}

export type Fin285aChartData =
  | { status: 'loading' }
  | { status: 'error' }
  | Fin285aChartDataReady;

export function useFin285aChartData(): Fin285aChartData {
  const [data, setData] = useState<Fin285aChartData>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadPart1Cumulative(),
      loadPart1Weights(),
      loadPart1BondEquityCorr(),
      loadPart2Cumulative(),
      loadPart2RollingTe(),
      loadPart2TeBenchmarks(),
      loadPart2Correlation(),
    ])
      .then(([c1, w1, bc, c2, te, teBench, cm]) => {
        if (cancelled) return;
        setData({
          status: 'ready',
          part1Cum: c1,
          part1Wts: w1,
          bondCorr: bc,
          part2Cum: rebaseCumulative(c2, ['optimizedMa', 'benchmark']),
          rollingTe: te,
          teBenchmarks: teBench,
          corr: cm,
        });
      })
      .catch((err) => {
        console.error('FIN 285A chart data load failed:', err);
        if (!cancelled) setData({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
