

## Daily Board Sorting Order Implementation

### Sorting Priority

**Court-level sorting (outer):**
1. Supreme Court matters (court_name contains "Supreme Court")
2. Other High Courts — any High Court except Gujarat (court_name contains "High Court" but NOT "Gujarat")
3. Gujarat High Court (court_name contains "Gujarat High Court" or default)
4. Lower Courts (everything else)

**Judge-level sorting within each court (inner):**
1. Chief Justice matters (judge name contains "Chief Justice")
2. Division Bench matters (bench_type from cases table, or fallback: coram/judge contains comma/"and")
3. Single Bench matters (everything else)

### Changes

**1. `src/components/daily-board/types.ts`**
- Add `case_bench_type?: string | null` to `DailyHearing`

**2. `src/hooks/useDailyBoardData.ts`**
- Add `bench_type` to the cases query: `select('id, acts, bench_type')`
- Create `benchTypeByCase` lookup and merge `case_bench_type` into each hearing

**3. `src/pages/DailyBoard.tsx`** — Update the `groupedHearings` useMemo
- After building the grouped array, sort court groups using a priority function:
  - `"supreme court"` → 0
  - `"high court"` but NOT `"gujarat"` → 1
  - `"gujarat"` + `"high court"` → 2
  - Everything else (lower courts) → 3
- Sort judges within each court group:
  - Judge name contains `"chief justice"` → 0
  - Any hearing has division bench (bench_type contains "division"/"DB", or coram has multiple names) → 1
  - Everything else (single bench) → 2

All downstream components (mobile view, print view, `DailyBoardContent`) consume `groupedHearings` and will automatically reflect the new order.

