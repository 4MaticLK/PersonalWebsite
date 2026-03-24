import { useState, useMemo } from 'react';
import { ExcelViewer } from './ExcelViewer';

/**
 * Simplified DCF (FCFF) for Anheuser-Busch / InBev bid context.
 * Base assumptions calibrated so ~8.4% WACC and 2.5% g ≈ $65/share; synergy case in Excel.
 */
const BASE_FCFF_BN = 6.4;
const NET_DEBT_BN = 30;
const SHARES_BN = 1.2;

function computeImpliedPricePerShare(waccPct: number, terminalGrowthPct: number): number {
  const wacc = waccPct / 100;
  const g = terminalGrowthPct / 100;
  if (g >= wacc) return 0;
  const evBn = BASE_FCFF_BN / (wacc - g);
  const equityBn = evBn - NET_DEBT_BN;
  const pricePerShare = equityBn / SHARES_BN; // $ per share (both in billions)
  return Math.max(0, Math.round(pricePerShare * 100) / 100);
}

interface MergersAcquisitionsModelProps {
  downloadUrl: string;
  downloadFilename: string;
}

export function MergersAcquisitionsModel({
  downloadUrl,
  downloadFilename,
}: MergersAcquisitionsModelProps) {
  const [waccPct, setWaccPct] = useState(8.4);
  const [terminalGrowthPct, setTerminalGrowthPct] = useState(2.5);

  const impliedPrice = useMemo(
    () => computeImpliedPricePerShare(waccPct, terminalGrowthPct),
    [waccPct, terminalGrowthPct]
  );

  return (
    <div className="ma-model">
      <h2 className="ma-model__heading">Interactive DCF (simplified)</h2>
      <p className="ma-model__intro">
        Adjust WACC and terminal growth to see how the implied offer price per share changes. The
        full model (including synergy scenario and full sensitivity) is in the downloadable Excel
        file.
      </p>
      <div className="ma-model__inputs">
        <label className="ma-model__label">
          <span className="ma-model__label-text">WACC (%)</span>
          <input
            type="range"
            min={5}
            max={15}
            step={0.1}
            value={waccPct}
            onChange={(e) => setWaccPct(Number(e.target.value))}
            className="ma-model__slider"
          />
          <input
            type="number"
            min={5}
            max={15}
            step={0.1}
            value={waccPct}
            onChange={(e) => setWaccPct(Number(e.target.value))}
            className="ma-model__input"
          />
        </label>
        <label className="ma-model__label">
          <span className="ma-model__label-text">Terminal growth (%)</span>
          <input
            type="range"
            min={1}
            max={6}
            step={0.1}
            value={terminalGrowthPct}
            onChange={(e) => setTerminalGrowthPct(Number(e.target.value))}
            className="ma-model__slider"
          />
          <input
            type="number"
            min={1}
            max={6}
            step={0.1}
            value={terminalGrowthPct}
            onChange={(e) => setTerminalGrowthPct(Number(e.target.value))}
            className="ma-model__input"
          />
        </label>
      </div>
      <div className="ma-model__output">
        <span className="ma-model__output-label">Implied offer price per share</span>
        <span className="ma-model__output-value">${impliedPrice.toFixed(2)}</span>
      </div>
      <details className="ma-model__methodology">
        <summary>Methodology</summary>
        <p>
          Single-stage FCFF perpetuity: EV = FCFF₁ / (WACC − g). Equity value = EV − net debt; per
          share = equity / shares. This is a simplified version; the Excel model includes explicit
          forecast years, synergy scenario (€3B at 6% growth), and full sensitivity.
        </p>
      </details>
      <a
        href={downloadUrl}
        download={downloadFilename}
        className="project-page__download ma-model__download"
        target="_blank"
        rel="noopener noreferrer"
      >
        Download full Excel model
      </a>
      <h2 className="ma-model__heading ma-model__heading--viewer">Spreadsheet</h2>
      <p className="ma-model__viewer-note">
        Read-only preview below (works on localhost and when deployed). Use{' '}
        <strong>Download full Excel model</strong> above to open in Excel and see or edit formulas.
      </p>
      <ExcelViewer url={downloadUrl} />
    </div>
  );
}
