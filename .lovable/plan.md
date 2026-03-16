

# Fix GJHC Routing and Missing Search History

## Root Cause Analysis

There are **three separate bugs** causing the issues you're seeing:

### Bug 1: Database CHECK constraint blocks `gujarat_high_court`
The `legalkart_case_searches` table was created with:
```sql
search_type TEXT NOT NULL CHECK (search_type IN ('high_court', 'district_court', 'supreme_court', 'gujarat_display_board', 'district_cause_list'))
```
**`gujarat_high_court` is NOT in the allowed values.** When the edge function tries to insert a search record with `search_type: 'gujarat_high_court'`, it silently fails. This is why:
- Search history shows empty
- The resolvedSearchType guard works but the record never saves

### Bug 2: Multiple `detectCourtType` functions don't know about GJHC
Several files have their own court type detection that **never returns `gujarat_high_court`**:
- `CasesFetchManager.tsx` line 95-99: Only checks `HC`, `SC` prefixes
- `process-fetch-queue/index.ts` line 32-38: Only returns `high_court`, `district_court`, `supreme_court`

### Bug 3: `LegalkartCaseSearch` component doesn't pass `firmId`
The search component on `/ecourts` doesn't send `firmId` in the request body, which may cause auth issues.

---

## Plan

### Step 1: Database Migration — Add `gujarat_high_court` to CHECK constraint
Create a migration to alter the CHECK constraint on `legalkart_case_searches.search_type` to include `gujarat_high_court`:

```sql
ALTER TABLE public.legalkart_case_searches 
  DROP CONSTRAINT IF EXISTS legalkart_case_searches_search_type_check;

ALTER TABLE public.legalkart_case_searches 
  ADD CONSTRAINT legalkart_case_searches_search_type_check 
  CHECK (search_type IN ('high_court', 'district_court', 'supreme_court', 'gujarat_high_court', 'gujarat_display_board', 'district_cause_list'));
```

This is the **critical fix** — without it, no GJHC search records can be saved.

### Step 2: Unify all court type detection to use centralized resolver
Replace all local `detectCourtType` functions with `resolveLegalkartSearchType` from `src/lib/legalkartSearchType.ts`:

- **`CasesFetchManager.tsx`**: Replace inline `detectCourtType` (lines 95-99) with import of `resolveLegalkartSearchType`
- **`process-fetch-queue/index.ts`**: Replace `mapCourtTypeToSearchType` (lines 32-38) with inline logic that detects GJHC
- **`LegalkartCaseSearch.tsx`**: Force `searchType` to `gujarat_high_court` for GJHC CNRs regardless of user selection (per your preference to lock routing)

### Step 3: Fix `LegalkartCaseSearch` to pass `firmId`
The search component on `/ecourts` doesn't send `firmId`. The edge function already resolves it from JWT, but for consistency and to match how `CasesFetchManager` works, we should ensure it's passed.

### Step 4: Lock UI for GJHC routing
Per your preference, when a GJHC CNR is detected:
- Auto-set search type to `Gujarat High Court`
- Disable the search type dropdown (or show "Locked: Gujarat High Court")
- Prevent manual override

### Step 5: Backfill missing search history
Create a script that finds recent successful fetches (from `cases.last_fetched_at` + `cases.fetched_data`) that have no corresponding `legalkart_case_searches` record, and inserts placeholder records so history is visible.

---

## Files to Change

| File | Change |
|------|--------|
| New migration `.sql` | Add `gujarat_high_court` to CHECK constraint |
| `src/components/ecourts/CasesFetchManager.tsx` | Replace local `detectCourtType` with centralized resolver |
| `src/components/cases/LegalkartCaseSearch.tsx` | Lock search type for GJHC, force Gujarat HC routing |
| `supabase/functions/process-fetch-queue/index.ts` | Add GJHC detection to `mapCourtTypeToSearchType` |
| `supabase/functions/auto-refresh-hearings/index.ts` | Already correct (has GJHC detection) — no change needed |
| `supabase/functions/legalkart-api/index.ts` | Already has hard guard — no change needed |

