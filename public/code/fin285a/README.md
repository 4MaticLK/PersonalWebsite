# FIN 285A — Risk Parity & Tracking Error (replication)

Reproduce the analysis from the project page using the notebooks and data in this folder.

## Files

| File | Purpose |
|------|---------|
| `Part1.ipynb` | 4-asset risk parity vs ALLW-style benchmark (EWMA, monthly rebalance) |
| `Part2.ipynb` | 20-ETF tracking-error minimization, train/test validation, charts |
| `AssetPrices_Part2.xlsx` | Daily adjusted prices for Part 2 (2014–2025) |
| `requirements.txt` | Python dependencies |

## Setup

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

## Run order

1. **`Part1.ipynb`** — Downloads AGG, ACWI, GSG, TIP from Yahoo Finance and runs the risk-parity backtest. Requires internet on first run.

2. **`Part2.ipynb`** — Expects `AssetPrices_Part2.xlsx` in the **same directory** as the notebook (`DATA_FILE = 'AssetPrices_Part2.xlsx'`).

   - Default: `FLAG_DOWNLOAD_DATA = False` uses the included Excel file (fast, reproducible).
   - To refresh prices from Yahoo: set `FLAG_DOWNLOAD_DATA = True` and run the download cell (internet required).

Run all cells in order in Jupyter Lab, VS Code, or Colab (upload these files to your runtime).

## Outputs

- Part 1: printed performance table, weight summaries, saved plots in the working directory.
- Part 2: writes/updates `AssetPrices_Part2.xlsx` if downloading; prints sensitivity tables and saves `fig*.png` charts.

## Notes

- Transaction costs are not modeled (academic backtest).
- Results depend on Yahoo Finance data as of the download date if you re-fetch prices.
- Part 1 uses a longer history (from ~2008); Part 2 train/test split is 2014–2018 / 2019–2025.
