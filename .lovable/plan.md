# Supabase Performance Fix Plan

We'll work through the audit in 6 phases. Each phase is independently shippable and verifiable in the live preview before moving on. After every phase I'll pause so you can confirm nothing broke.

---

## Phase 1 — Stop the bleeding (~30 min, lowest risk, biggest win)

**Goal:** Cut 40–60% of API calls and end the realtime error loop without changing any UI.

1. **Remove global 30s polling**
   - `src/App.tsx`: drop `refetchInterval: 30000` from queryClient defaults.
   - `src/lib/queryConfig.ts`: drop `refetchInterval` from `realtimeQueryConfig`; switch `refetchOnWindowFocus` to `false` everywhere except notifications.
   - Set sensible defaults: `staleTime: 5min`, `gcTime: 10min`.

2. **Fix `useRealtimeNotifications` reconnect loop**
   - Stable channel name: `notifications:${user.id}`.
   - Guard against double-subscribe (StrictMode) with a ref.
   - Add exponential backoff on `CHANNEL_ERROR`.
   - Verify `notifications` is in the realtime publication and RLS allows recipient SELECT (DB migration if missing).

3. **Reception display polling 5s → 60s + N+1 fix**
   - `src/pages/reception/ReceptionDisplayBoard.tsx`: change `refetchInterval: 5000` → `60000` (or wire to realtime).
   - Replace per-row client lookup with a single `.in('id', clientIds)` batch query.

**Verify:** open app, watch Network tab — confirm no 30s polling storm, no `CHANNEL_ERROR` in console.

---

## Phase 2 — Consolidate duplicate pollers (~2 hr)

**Goal:** One source of truth for unread counts, no manual `setInterval`s.

1. Create `src/hooks/useUnreadCounts.ts` — single hook returning `{ notifications, messages }`, backed by the realtime channel from Phase 1 + a 60s React Query fallback.
2. Remove duplicate pollers in:
   - `src/hooks/useNotifications.ts` (drop `refetchInterval`)
   - `src/components/layout/Header.tsx` (remove `setInterval`)
   - `src/components/dashboard/mobile/MobileDashboardHeader.tsx` (remove `setInterval`)
   - `src/components/availability/GoogleCalendarSyncStatus.tsx` (remove `setInterval`, keep realtime only)
   - `src/components/notifications/NotificationAnalytics.tsx` (raise to 5min, manual refresh button)

**Verify:** badges still update when a notification arrives; no duplicate network requests.

---

## Phase 3 — `select('*')` sweep (1 day, split into batches)

**Goal:** Cut bandwidth 30–50% on hot pages.

Done in 4 reviewable batches (one chat turn each):

- **Batch 3a — Notifications** (highest poll frequency): `useNotifications.ts`, `NotificationPanel.tsx`, `NotificationInbox.tsx`, `NotificationDialog.tsx`.
- **Batch 3b — Cases module**: `pages/CaseDetail.tsx`, `CaseDetailEnhanced.tsx`, `CaseOverview.tsx`, `CaseDetails.tsx`, `CaseDocuments.tsx`, `SCCaseDetailView.tsx`.
- **Batch 3c — Appointments & Reception**: `pages/Appointments.tsx`, `ViewAppointmentDialog.tsx`, `AppointmentsTable.tsx`, all `pages/reception/*`.
- **Batch 3d — Remaining hooks**: `useDailyBoardData.ts`, `useCasesFetchStatus.ts`, `useEcourtsCaseDetails.ts`, availability components, clients, contacts, tasks, team.

Each batch: replace `.select('*')` with explicit columns based on what the component actually reads. Verify the page still renders correctly.

---

## Phase 4 — Pagination + limits (1 day)

**Goal:** No unbounded queries.

1. Audit all ~170 unbounded `.from()` queries via a script; add `.limit(50)` minimum.
2. Convert these list pages to keyset/offset pagination with `.range()`:
   - Cases list, Hearings list, Documents list, Notifications inbox, Activities timeline, Appointments list, Tasks list, Notes grid, Clients list.
3. Standardise page size constant in `src/lib/queryConfig.ts` (`PAGE_SIZE = 25`).
4. Cap notifications inbox at 50 most-recent + "Load older" button.

---

## Phase 5 — Realtime tightening (~3 hr)

**Goal:** Subscribe narrowly, never refetch the world.

1. **`HearingsCalendarView`**: explicit columns; debounce invalidations (500ms); remove per-event toast; filter realtime by `firm_id` (requires denormalised `firm_id` column on `case_hearings` — DB migration).
2. **`use-messages.ts` / `use-message-reactions.ts`**: confirm CometChat handles real chat; if these duplicate, disable Supabase realtime here.
3. **Drop realtime entirely** on tables that don't need it: `cases`, `case_documents`, `tasks`, `notes` — rely on invalidation-on-mutation instead.
4. Stable channel names + cleanup audit across every `.channel()` call.

---

## Phase 6 — Database & monitoring (~4 hr)

**Goal:** Make the queries themselves cheaper and prevent regressions.

1. **DB migration** — add missing indexes (cases firm/status/hearing/cnr/client; case_hearings case+date; notifications recipient+read; appointments firm+date; tasks assignee+status; notes owner).
2. **RLS perf rewrite** — wrap `auth.uid()` in `(select auth.uid())` across all policies on hot tables (`cases`, `case_hearings`, `notifications`, `tasks`, `team_members`).
3. **Edge function audit** — add idempotency/locks to `process-fetch-queue`, `process-queued-notifications`, `auto-sync-trigger`, `auto-refresh-hearings`. Confirm `notify_task_assignment` trigger doesn't write back to `tasks`.
4. **Dev monitoring** — add a lightweight per-table call counter in `src/integrations/supabase/client.ts` (DEV-only) so future regressions show up in console.

---

## Order of execution

I'll do them strictly in order: **1 → 2 → 3a → 3b → 3c → 3d → 4 → 5 → 6**. After each step I'll show what changed and ask you to verify before moving to the next. We can pause or skip any phase if priorities change.

**Starting point:** Phase 1 — shall I proceed?
