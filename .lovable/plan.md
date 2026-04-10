

# Plan: Migrate from Legalkart API to eCourtsIndia API

## Summary

Replace the current Legalkart API integration with the new eCourtsIndia API (v4.0) across the entire app. The new API is simpler (REST with Bearer token, no OAuth), has richer data (AI analysis built-in, markdown orders), and covers all courts (not just Gujarat HC).

---

## Current State

- **Edge function**: `supabase/functions/legalkart-api/index.ts` (2,326 lines) handles all case fetching, authentication, display board, batch search, and data upsert
- **Frontend callers**: 10 files invoke `legalkart-api` edge function
- **Data parser**: `supabase/functions/legalkart-api/dataParser.ts` normalizes Legalkart responses
- **Database tables**: `legalkart_case_searches`, `legalkart_cases`, `legalkart_case_documents`, plus `cases`, `case_hearings`, `petitioners`, `respondents`, etc.

## New eCourtsIndia API (Key Differences)

| Feature | Legalkart (old) | eCourtsIndia (new) |
|---------|----------------|-------------------|
| Auth | JWT login + token refresh | Static Bearer token (`eci_live_xxx`) |
| Case lookup | CNR + court type routing | Single endpoint: `GET /api/partner/case/{cnr}` |
| Search | Limited | Full-text search with facets, filters, pagination |
| Orders | PDF base64 only | PDF + Markdown + AI analysis built-in |
| Cause list | Gujarat HC only | All courts via `/api/partner/causelist/search` |
| Refresh | Manual re-fetch | `POST /api/partner/case/{cnr}/refresh` + bulk refresh |
| Court structure | Hardcoded | Free endpoints for state/district/complex/court hierarchy |

---

## Implementation Plan

### Step 1: Store eCourtsIndia API Key
- Add `ECOURTS_API_KEY` as a Supabase secret (edge function env var)
- No more Legalkart username/password or JWT auth flow needed

### Step 2: Create new edge function `ecourts-api`
A new, clean edge function replacing `legalkart-api` with these actions:

| Action | eCourtsIndia Endpoint | Notes |
|--------|----------------------|-------|
| `case_detail` | `GET /api/partner/case/{cnr}` | Returns everything: parties, orders, AI analysis, files |
| `case_search` | `GET /api/partner/search` | Full-text search with filters |
| `case_refresh` | `POST /api/partner/case/{cnr}/refresh` | Queue fresh scrape |
| `bulk_refresh` | `POST /api/partner/case/bulk-refresh` | Up to 50 CNRs |
| `order_pdf` | `GET /api/partner/case/{cnr}/order/{filename}` | Order PDF download |
| `order_ai` | `GET /api/partner/case/{cnr}/order-ai/{filename}` | Order + AI summary |
| `order_markdown` | `GET /api/partner/case/{cnr}/order-md/{filename}` | Watermarked PDF + markdown |
| `causelist_search` | `GET /api/partner/causelist/search` | All courts, not just Gujarat |
| `causelist_dates` | `GET /api/partner/causelist/available-dates` | Free, discover available dates |
| `court_structure` | `GET /api/partner/causelist/court-structure/*` | States, districts, complexes |
| `enums` | `GET /api/partner/enums` | Live enum reference |
| `upsert_case_data` | (internal) | Parse eCourtsIndia response and upsert into DB |

Key simplifications:
- No more court-type detection/routing -- single CNR endpoint handles all courts
- No more `authenticate` action -- Bearer token is static
- No more Gujarat-specific display board -- unified cause list search covers all courts
- Built-in AI analysis from the API (no separate parsing needed)

### Step 3: Update data parser
- Create `supabase/functions/ecourts-api/dataMapper.ts` to map eCourtsIndia response shape to existing DB tables (`cases`, `petitioners`, `respondents`, `case_hearings`, `case_orders`, etc.)
- The new API returns cleaner data (ISO dates, string arrays for parties) so parsing is simpler
- Map `files[].aiAnalysis` to a new or existing column for AI insights

### Step 4: Update `process-fetch-queue` edge function
- Change `legalkart-api` invocation to `ecourts-api`
- Remove court-type-to-search-type mapping (no longer needed)
- Use `bulk-refresh` for batch operations

### Step 5: Update `auto-refresh-hearings` edge function
- Replace Gujarat display board call with `causelist_search` (covers all courts)
- Replace per-case Legalkart fetch with `case_detail` action
- Use `bulk_refresh` for batch refresh

### Step 6: Update frontend hook `useLegalkartIntegration.ts`
- Rename to `useEcourtsIntegration.ts`
- Simplify: remove `authenticate`, simplify `searchCase` (no searchType needed)
- Replace `getDisplayBoard` with `causelistSearch`
- Update all mutations to call `ecourts-api` edge function

### Step 7: Update all frontend callers (10 files)
- `src/components/cases/LegalkartCaseSearch.tsx` -- Simplify search UI (remove court type selector, no Gujarat-specific modes)
- `src/components/cases/FetchCaseDialog.tsx` -- Use single CNR fetch
- `src/components/cases/legalkart/LegalkartApiDocuments.tsx` -- Use new order endpoints
- `src/components/cases/legalkart/LegalkartDocumentsTable.tsx` -- Update data shape
- `src/components/ecourts/CasesFetchManager.tsx` -- Use bulk refresh
- `src/pages/CaseDetail.tsx` -- Update function invocations
- `src/pages/CaseUnknownAdmin.tsx` -- Update function invocations
- `src/pages/StaleCases.tsx` -- Update function invocations
- `src/pages/DailyBoard.tsx` -- Use causelist search instead of display board
- `src/pages/CauseList.tsx` -- Use causelist search with court/date filters
- `src/pages/ECourts.tsx` -- Update search history and UI

### Step 8: Enhance Cause List page
- Add court structure selectors (State > District > Complex > Court) using free endpoints
- Add date picker using available-dates endpoint
- Support all courts, not just Gujarat HC

### Step 9: Add new capabilities
- **Case Search page**: Full-text search with advocate, judge, party, date filters and faceted results
- **Order AI Analysis**: Display AI summaries, key issues, statutes cited directly in the case detail view
- **Enum-powered dropdowns**: Use `/api/partner/enums` for case type, status, court code selectors

---

## Technical Details

**API call pattern in the new edge function:**
```typescript
const ECOURTS_BASE = 'https://webapi.ecourtsindia.com';
const apiKey = Deno.env.get('ECOURTS_API_KEY');

const response = await fetch(`${ECOURTS_BASE}/api/partner/case/${cnr}`, {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
```

**Error handling**: Map eCourtsIndia error codes (INVALID_CNR, INSUFFICIENT_CREDITS, RATE_LIMIT_EXCEEDED) to user-friendly messages. Implement exponential backoff for 429s.

**Rate limits**: 100/min, 3000/hr, 10 concurrent. Add queuing in the edge function for batch operations.

**Files to create:**
- `supabase/functions/ecourts-api/index.ts`
- `supabase/functions/ecourts-api/dataMapper.ts`
- `src/hooks/useEcourtsIntegration.ts`

**Files to modify:**
- `supabase/functions/process-fetch-queue/index.ts`
- `supabase/functions/auto-refresh-hearings/index.ts`
- All 10+ frontend files listed above

**Files to deprecate (keep temporarily):**
- `supabase/functions/legalkart-api/` (remove after migration verified)

