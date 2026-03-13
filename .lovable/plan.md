

## Gujarat High Court CNR API Integration

### Problem

The current code uses the wrong API endpoint for Gujarat HC cases. When a CNR starting with `GJHC` is detected, it hits `case-search/gujarat-high-court` (which expects REGISTRATION/FILING mode body format). The correct endpoint for CNR-based lookup is:

```
POST https://apiservices.legalkart.com/api/v1/application-service/case-search/cnr/gujarat-high-court
Body: { "cnr": "GJHC240842782023" }
Header: authorization: <token>, content-type: application/json
```

This is a **different endpoint** from the existing one -- note the `/cnr/` segment in the path.

### What We Don't Know Yet

We don't know the exact response structure from this Gujarat HC CNR endpoint. The existing `parseGujaratHighCourtData` in `dataParser.ts` is a guess with minimal fields. We need to **capture the actual response** before we can properly parse and store it.

### Plan

#### Step 1: Fix the endpoint and add response logging

In `supabase/functions/legalkart-api/index.ts`, in the `performCaseSearch` function:

- When `effectiveSearchType === 'gujarat_high_court'` and the mode is CNR (not REGISTRATION), use the **correct endpoint**: `https://apiservices.legalkart.com/api/v1/application-service/case-search/cnr/gujarat-high-court`
- Keep the existing `case-search/gujarat-high-court` endpoint for REGISTRATION mode
- Add detailed logging of the full response JSON so we can inspect field names

#### Step 2: Auto-detection in auto-refresh

In `supabase/functions/auto-refresh-hearings/index.ts`, update `detectCourtType`:
- GJHC prefix should return `'gujarat_high_court'` instead of generic `'high_court'`, so the correct endpoint is used during auto-refresh

#### Step 3: Store raw response for inspection

After calling the API, log the full `JSON.stringify(data, null, 2)` (already done at line 1618). Additionally, store the raw response in the `legalkart_case_searches` table (already done at line 928). This means we can inspect the response by querying that table after a single test fetch.

#### Step 4: Parse and store (after we see the response)

Once we see the actual response structure, we will:
- Update `mapLegalkartDataToCRM` to handle Gujarat HC-specific field names
- Update `upsertCaseRelationalData` if the Gujarat HC response uses different keys for hearings, orders, parties, etc.
- Update `parseGujaratHighCourtData` in `dataParser.ts` with the real field names

### Files to Change

1. **`supabase/functions/legalkart-api/index.ts`** (lines ~1550-1570)
   - Split Gujarat HC into two sub-endpoints: CNR mode uses `/cnr/gujarat-high-court`, REGISTRATION mode keeps `/gujarat-high-court`
   - Body for CNR mode: `{ "cnr": "<CNR>" }` (no `caseMode` wrapper)

2. **`supabase/functions/auto-refresh-hearings/index.ts`** (lines ~29-41)
   - Add `GJHC` detection returning `'gujarat_high_court'` in `detectCourtType`

### Implementation Note

This is a **two-phase** task. Phase 1 (this implementation) fixes the endpoint and enables a test fetch. Phase 2 (after inspecting the response) will build the full parser. After implementing, you should fetch a GJHC case from the Cause List or Case Details page to capture the API response, then share the logs so we can build the correct parser.

