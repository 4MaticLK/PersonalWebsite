import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface CellData {
  /** Raw value (number or string) for formatting */
  raw: unknown;
  /** String fallback for display when not formatting as percent */
  v: string;
  /** Excel number format (e.g. "0.00%") when cellNF is used */
  z?: string;
  f?: string;
}

interface ExcelViewerProps {
  url: string;
}

function formatCellDisplay(cell: CellData, showFormulas: boolean): string {
  if (showFormulas && cell.f != null && cell.f !== '') return cell.f;
  if (typeof cell.raw === 'number' && cell.z != null && cell.z.includes('%')) {
    return (cell.raw * 100).toFixed(2) + '%';
  }
  return cell.v;
}

function sheetToCellGrid(sheet: XLSX.WorkSheet): CellData[][] {
  const ref = sheet['!ref'];
  if (!ref) return [];
  const range = XLSX.utils.decode_range(ref);
  const rows: CellData[][] = [];
  for (let R = range.s.r; R <= range.e.r; R++) {
    const row: CellData[] = [];
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = sheet[addr];
      const raw = cell?.v;
      const v = raw != null ? String(raw) : '';
      const z =
        typeof (cell as { z?: string })?.z === 'string' ? (cell as { z: string }).z : undefined;
      const f = typeof cell?.f === 'string' ? cell.f : undefined;
      row.push({ raw, v, z, f });
    }
    rows.push(row);
  }
  return rows;
}

export function ExcelViewer({ url }: ExcelViewerProps) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [tables, setTables] = useState<CellData[][][]>([]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [showFormulas, setShowFormulas] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setStatus('loading');
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error('File not found');
          return res.arrayBuffer();
        })
        .then((ab) => {
          if (cancelled) return;
          const wb = XLSX.read(ab, { type: 'array', cellFormula: true, cellNF: true });
          const names = wb.SheetNames;
          const allRows = names.map((name) => sheetToCellGrid(wb.Sheets[name]));
          setSheetNames(names);
          setTables(allRows);
          setStatus('ok');
        })
        .catch(() => {
          if (!cancelled) setStatus('error');
        });
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (status === 'loading') {
    return (
      <div className="excel-viewer excel-viewer--loading">
        <p>Loading spreadsheet…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="excel-viewer excel-viewer--error">
        <p>
          Excel file not found. Add the workbook to the{' '}
          <strong>public/pdfs/</strong> folder in your project to display it here. You can still use
          the interactive model above and the Download button once the file is in place.
        </p>
      </div>
    );
  }

  const rows = tables[activeSheetIndex] ?? [];
  const maxCols = Math.max(0, ...rows.map((r) => r.length));
  const hasAnyFormula = tables.some((grid) =>
    grid.some((row) => row.some((cell) => cell.f != null && cell.f !== ''))
  );

  return (
    <div className="excel-viewer">
      <div className="excel-viewer__toolbar">
        {sheetNames.length > 1 && (
          <div className="excel-viewer__tabs">
            {sheetNames.map((name, i) => (
              <button
                key={name}
                type="button"
                className={`excel-viewer__tab ${i === activeSheetIndex ? 'excel-viewer__tab--active' : ''}`}
                onClick={() => setActiveSheetIndex(i)}
              >
                {name}
              </button>
            ))}
          </div>
        )}
        {hasAnyFormula && (
          <label className="excel-viewer__formula-toggle">
            <input
              type="checkbox"
              checked={showFormulas}
              onChange={(e) => setShowFormulas(e.target.checked)}
            />
            <span>Show formulas</span>
          </label>
        )}
      </div>
      <div className="excel-viewer__scroll">
        <table className="excel-viewer__table">
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.slice(0, maxCols).map((cell, ci) => {
                  const display = formatCellDisplay(cell, showFormulas);
                  const title =
                    !showFormulas && cell.f != null && cell.f !== '' ? cell.f : undefined;
                  return (
                    <td
                      key={ci}
                      className={`excel-viewer__cell ${cell.f ? 'excel-viewer__cell--has-formula' : ''}`}
                      title={title}
                    >
                      {display}
                    </td>
                  );
                })}
                {row.length < maxCols &&
                  Array.from({ length: maxCols - row.length }).map((_, ci) => (
                    <td key={`empty-${ci}`} className="excel-viewer__cell" />
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
