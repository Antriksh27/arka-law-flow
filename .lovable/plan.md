

## Why Your Daily Board Doesn't Match the Actual Court Board

### Root Cause: Chicken-and-Egg Data Problem

The actual board (PDF) shows **17 hearings** for March 12, 2026 across 10 judges. Your app's daily board can only show hearings that already exist in the `case_hearings` table with `hearing_date = '2026-03-12'`.

The `auto-refresh-hearings` function has a fundamental flaw: **it only refreshes cases that already have today's hearing date in the database**. It queries `case_hearings WHERE hearing_date = targetDate`, then calls the LegalKart API for those cases. This means:

- If a case's last refresh was weeks ago and the `next_hearing_date` wasn't updated to today, the case is invisible to the auto-refresh
- Cases where the hearing date changed (e.g., preponed or newly listed) will never be picked up
- The system can never *discover* new hearings for today -- it only refreshes already-known ones

### Additional Limiting Factors

1. **Daily cap of 35 cases** (`MAX_SUCCESSFUL = 35`) -- even if cases are found, only 35 get refreshed
2. **50-second timeout** (`FUNCTION_TIMEOUT_MS = 50000`) with batch size of 2 and 2-second delays -- can only process ~20 cases before timeout
3. **Cases without CNR numbers are skipped** entirely
4. **No scheduled trigger visible** -- the auto-refresh may not even be running automatically

### The Missing Piece: Gujarat Display Board API

Your codebase already has a `gujarat_display_board` action in the LegalKart API that can fetch today's cause list directly from the Gujarat High Court. This is the correct approach but it's only available as a manual button in `LegalkartCaseSearch.tsx` -- it's not integrated into the daily board workflow or auto-refresh.

### Proposed Fix

**Integrate the Gujarat Display Board API into the daily board generation flow:**

1. **Add a "Sync from Court" step to daily board generation** -- When "Generate Board" is clicked, first call `gujarat_display_board` to fetch today's actual cause list from the court API, then upsert those hearings into `case_hearings`, and finally query `daily_hearings_view`

2. **Update auto-refresh to use display board API** -- Instead of only refreshing cases already in `case_hearings`, fetch today's cause list via `gujarat_display_board` first to discover all hearings, then refresh individual case details

3. **Increase processing limits** -- Raise `MAX_SUCCESSFUL` and optimize batch processing to handle the full cause list

### Files to Change

- `supabase/functions/auto-refresh-hearings/index.ts` -- Add Gujarat Display Board fetch as a discovery step before individual case refresh
- `src/hooks/useDailyBoardData.ts` -- Optionally trigger a sync before querying the view
- `supabase/functions/legalkart-api/index.ts` -- Ensure `gujarat_display_board` response correctly upserts hearing records with today's date, judge, court number, and serial number

### Data Flow (Current vs Fixed)

```text
CURRENT (broken):
  case_hearings (stale dates) → auto-refresh (misses new hearings) → daily_hearings_view (incomplete)

FIXED:
  Gujarat Display Board API → discover today's hearings → upsert into case_hearings → auto-refresh details → daily_hearings_view (complete)
```

