# Personal portfolio data

CSV files in this folder feed the **Live Portfolio Tracker** on the site. Analytics (returns, benchmark, risk) are computed in the browser from these files plus live/historical prices from Yahoo Finance via `/api/quotes` and `/api/chart`.

## Required files

### holdings.csv

Current open positions (refresh from Robinhood when allocations change).

| Column | Description |
|--------|-------------|
| ticker | Symbol (e.g. VOO) |
| name | Security name |
| shares | Number of shares |
| cost_basis | Optional avg cost per share — computed from transactions if blank |
| current_price | Fallback price if live quote unavailable |
| market_value | Position value — optional if shares × price |
| weight_pct | Optional; recomputed from market_value if omitted |
| sector | Asset class label |

Tickers without a Yahoo feed (e.g. **CHIP**) keep CSV prices; see `src/utils/yahooSymbols.ts`. **RVI** is NYSE-listed and uses live Yahoo quotes like other equities.

### transactions.csv

Full account activity for FIFO cost basis and return/risk analytics.

| Column | Description |
|--------|-------------|
| date | YYYY-MM-DD |
| type | `buy`, `sell`, `dividend`, `deposit`, `withdrawal` |
| ticker | Symbol (`—` for deposits/withdrawals) |
| shares | Quantity (blank for dividends/deposits if N/A) |
| price | Fill price |
| amount | Cash flow: negative for buys, positive for deposits/dividends; sells use negative proceeds in this export format |

Include **all deposits** and **crypto/stock buys** for accurate realized P/L. The public activity table filters to current holdings only; full history is still used for analytics.

## Updating data (after a trade)

1. Export Robinhood **Account activity report** (full history — see steps below).
2. Run the sync script (dry run first, then write):

   ```bash
   npm run sync:portfolio -- --export path/to/robinhood-activity.csv
   npm run sync:portfolio -- --export path/to/robinhood-activity.csv --write
   ```

3. Run `npm run verify:portfolio` to sanity-check analytics and update `meta.json`.
4. Deploy (or refresh dev server).

The sync script merges new rows into `transactions.csv`, rebuilds `holdings.csv` from open FIFO lots, and updates `meta.json`. Existing manual rows (e.g. older crypto buys) are kept unless duplicated.

### meta.json

Written by `verify:portfolio` (and partially by `sync:portfolio --write`). The site reads this for **data as of**, verification status, and transaction/holding counts — no manual date edits in source code.

To refresh prices only (no new trades):

```bash
npm run refresh:portfolio-prices -- --write
```

### Export from Robinhood

1. Open [robinhood.com/account/reports-statements/activity-reports](https://robinhood.com/account/reports-statements/activity-reports) (desktop browser).
2. **Generate new report** — pick a date range that covers your full account history (or at least since your last sync).
3. Wait for the CSV to generate (can take a few minutes).
4. Download the file — header should start with `Activity Date,Process Date,Settle Date,Instrument,…`.
5. Do **not** edit the file; pass it directly to `sync:portfolio`.

## Verify script

```bash
npm run verify:portfolio
```

Runs FIFO replay, money-weighted returns, and risk metrics against the CSVs (requires network for Yahoo history).

## Deployment notes

- **Dev:** Vite middleware serves `/api/quotes` and `/api/chart` (see `vite.config.ts`).
- **Production:** Vercel serverless functions in `api/` proxy Yahoo Finance; `vercel.json` preserves `/api/*` routes.

## Robinhood export tips

- **Activity report CSV:** Activity Date, Trans Code, Instrument, Quantity, Price, Amount.
- **1099 / 1099-DA:** Use for older crypto buys/sells missing from activity exports.
- Map buys with negative `amount` (cash out), dividends/deposits positive, sells with negative proceeds to match existing rows.
