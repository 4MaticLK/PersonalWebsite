"""
Export CSV time series for interactive FIN 285A charts on the personal website.
Run from repo root: python scripts/export_fin285a_chart_data.py

Requires: numpy pandas scipy yfinance openpyxl matplotlib (Agg)
"""
from __future__ import annotations

import datetime
import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

import numpy as np
import pandas as pd
import yfinance as yf
from scipy.optimize import minimize

REPO = Path(__file__).resolve().parents[1]
OUT = REPO / "public" / "data" / "fin285a"
PART1_NB = REPO / "public" / "code" / "fin285a" / "Part1.ipynb"
PART2_NB = REPO / "public" / "code" / "fin285a" / "Part2.ipynb"
DATA_XLSX = REPO / "public" / "code" / "fin285a" / "AssetPrices_Part2.xlsx"


def _run_part1_exports() -> None:
    """Execute Part 1 notebook cell (no plots), then write CSVs."""
    src = "".join(
        json.loads(PART1_NB.read_text(encoding="utf-8"))["cells"][0]["source"]
    )
    src = src.replace("plt.show()", "pass")
    g: dict = {"__name__": "__main__", "plt": plt}
    exec(compile(src, str(PART1_NB), "exec"), g)

    wts_df = g["wts_df"]
    cum_rp = g["cum_rp"]
    cum_bench = g["cum_bench"]
    roll_corr = g["roll_corr"]

    cum = pd.DataFrame(
        {
            "date": cum_rp.index.strftime("%Y-%m-%d"),
            "riskParity": cum_rp.values,
            "benchmark": cum_bench.reindex(cum_rp.index).values,
        }
    )
    cum.to_csv(OUT / "part1_cumulative.csv", index=False)

    weights = wts_df.copy()
    weights.index = weights.index.strftime("%Y-%m-%d")
    weights.columns = ["AGG", "ACWI", "GSG", "TIP"]
    weights.reset_index(names="date").to_csv(OUT / "part1_weights.csv", index=False)

    corr = pd.DataFrame(
        {
            "date": roll_corr.index.strftime("%Y-%m-%d"),
            "correlation": roll_corr.values,
        }
    )
    corr.to_csv(OUT / "part1_bond_equity_corr.csv", index=False)
    print("Part 1:", len(cum), "months,", len(corr), "corr points")


def _run_part2_exports() -> None:
    """Execute Part 2 notebook cell (no plots), then write CSVs."""
    import os

    os.chdir(REPO / "public" / "code" / "fin285a")
    src = "".join(
        json.loads(PART2_NB.read_text(encoding="utf-8"))["cells"][0]["source"]
    )
    src = src.replace("plt.show()", "pass")
    g: dict = {"__name__": "__main__", "plt": plt}
    exec(compile(src, str(PART2_NB), "exec"), g)

    cum_ma = g["cum_fund_ma"]
    cum_bench = g["cum_bench"]
    idx = cum_ma.index.intersection(cum_bench.index)
    cum = pd.DataFrame(
        {
            "date": idx.strftime("%Y-%m-%d"),
            "optimizedMa": cum_ma.reindex(idx).values,
            "benchmark": cum_bench.reindex(idx).values,
        }
    )
    cum.to_csv(OUT / "part2_cumulative.csv", index=False)

    rolling_te = g["rolling_te_test"] * 10000  # bps
    te = pd.DataFrame(
        {
            "date": rolling_te.index.strftime("%Y-%m-%d"),
            "trackingErrorBps": rolling_te.values,
        }
    )
    te.to_csv(OUT / "part2_rolling_te.csv", index=False)

    pd.DataFrame(
        [
            {
                "forecastMaBps": float(g["te_fcst_ma"] * 10000),
                "oosMaBps": float(g["te_oos_ma"] * 10000),
                "windowDays": int(g["WINDOW"]),
            }
        ]
    ).to_csv(OUT / "part2_te_benchmarks.csv", index=False)

    # Figure 7: training-period monthly returns (matches Part2.ipynb / fin285a-correlation-matrix.png)
    ret_train = g["ret_train"]
    fund_list = g["FUND_LIST"]
    corr = ret_train[fund_list].corr()
    labels = list(corr.columns)
    rows = []
    for i, a in enumerate(labels):
        for j, b in enumerate(labels):
            rows.append({"row": a, "col": b, "value": corr.iloc[i, j]})
    pd.DataFrame(rows).to_csv(OUT / "part2_correlation.csv", index=False)
    pd.DataFrame({"ticker": labels}).to_csv(OUT / "part2_correlation_labels.csv", index=False)
    print("Part 2:", len(cum), "months,", len(labels), "assets in corr matrix")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    print("Writing to", OUT)
    _run_part1_exports()
    _run_part2_exports()
    print("Done.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("Export failed:", e, file=sys.stderr)
        raise
