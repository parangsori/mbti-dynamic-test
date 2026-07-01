# Analytics Events

Date: 2026-06-23

This document describes the operational meaning of client and admin metrics.
It is a working dictionary for PostHog/admin dashboard review, not a promise
that every event is permanent.

## Collection Rules

- PostHog autocapture is disabled; only explicit events and pageview/pageleave
  are collected.
- The browser SDK uses a `phc_` project token through the configured PostHog
  host.
- Personal API keys, admin tokens, Cloudflare Access values, session tokens,
  raw question text, raw option text, raw birth dates, and user names must not
  be sent as analytics properties.
- Admin metrics must stay aggregate-only.

## Dashboard Events

These events are queried by `admin/api/admin/metrics.js`.

| Event | Meaning | Key properties | Admin usage |
| --- | --- | --- | --- |
| `$pageview` | Page view from PostHog pageview capture. | PostHog device/location/referrer properties. | Visitors, acquisition, device mix. |
| `start_click` | User started a test. | `hasName`, `hasProfile`, `ageGroup`, `hasGender`. | Start count and start actors. |
| `complete_test` | Test reached completion and result analysis started. | `usedFollowup`, `followupCount`, `neutralCount`, `questionContextTop`. | Completion count and funnel. |
| `result_view` | Result screen rendered. | `mbti`, `percent`, `questionContextTop`. | Result-view continuity. |
| `share_copy` | One-line text result copied. | `mbti`. | Sharing count. |
| `result_image_share` | Result image shared as a file. | `mbti`, `mode`, share capability booleans. | Image sharing count. |
| `result_image_link_share` | Result image shared with the service URL when the browser supports file+link sharing. | `mbti`, `mode`, share capability booleans. | Counted with image sharing. |
| `result_image_save` | Result image saved through a file picker. | `mbti`, `mode`, share capability booleans. | Direct save count. |
| `result_image_download_fallback` | Browser started download fallback. | `mbti`, `mode`, share capability booleans. | Download fallback count. |
| `result_image_text_share` | Text-only sharing path. | share context. | Text-only share count if emitted by the share path. |
| `result_image_save_fail` | Result image save/share failed or threw an exception. | `mbti`, `mode`, share diagnostics when available. | Save/share failure alert. |
| `home_screen_install_prompt` | User responded to browser install prompt. | `outcome`. | Install prompt and accept rate. |
| `home_screen_app_installed` | Browser reported app installed. | none currently. | Install accepted count. |
| `home_screen_standalone_open` | App opened in standalone/PWA mode. | `mode`, `host`. | Home-screen usage. |
| `client_error` | Sanitized client error diagnostic. | error key/name/source/stage/fingerprint, browser context, app version. | Error diagnostics. |
| `result_server_sync_success` | Supabase result backup succeeded. | sync metadata only. | Result backup success. |
| `result_server_sync_fail` | Supabase result backup failed. | failure metadata only. | Result backup failure. |
| `result_server_sync_skipped` | Supabase result backup was skipped or unavailable. | skip reason. | Result backup skipped. |
| `session_api_start_ok` | Server-backed session start succeeded. | display mode/device metadata, `durationMs`, `questionCount`. | Server-session start volume and latency. |
| `session_api_start_observed` | Server accepted a valid session-start request and scheduled a privacy-preserving observation. | `policy_version`, `environment`, `identity_available`, `account_identity_available`, `access_tier`, `user_agent_family`, `recent_session_count_bucket`, `age_group_present`; server-derived rotating actor keys only when available. | Aggregate start volume, identity coverage, burst windows, browser family, and access-tier mix. |
| `session_api_complete_ok` | Server-backed completion succeeded or returned follow-up questions. | `status`, `phase`, `durationMs`, `followupCount`, `usedFollowup`. | Server-session complete volume and latency. |
| `session_api_fallback` | Legacy event retained for historical dashboards; the current client must not emit it. | historical properties only. | Confirms fallback remains at zero after cutover. |
| `session_api_error` | Server-session API path failed and the user remained in an explicit retry state. | `stage`, `phase`, `durationMs`, sanitized `reason`, display mode/device metadata. | Error monitoring. |
| `followup_start` | Follow-up phase started. | `count`, `neutralCount`. | Follow-up frequency. |

## Additional Client Events

These events are emitted for local behavior or product analysis but are not
currently part of the main admin event-count list.

| Event | Meaning |
| --- | --- |
| `result_recovery_resume` | Pending result recovery resumed after refresh. |
| `result_recovery_incompatible` | A legacy pending result lacked the required display contract and only that pending payload was cleared. |
| `session_recovery_incompatible` | A legacy locally generated in-progress session was cleared after the server-required cutover. |
| `session_api_retry` | User retried a failed server-session stage; properties contain only the stage. |
| `profile_clear` | Local profile cleared. |
| `home_screen_tip_dismiss` | Home-screen tip dismissed for the session. |
| `home_screen_tip_hide_forever` | Home-screen tip hidden persistently. |
| `home_screen_tip_restore` | Home-screen tip restored. |
| `home_screen_migration_copy` | Local history/profile migration text copy path used. |
| `home_screen_migration_import` | Local history/profile migration import path used. |
| `history_open` | History modal opened. |
| `restart_click` | User restarted from result/start flow. |
| `session_resume` | In-progress session resumed from local recovery. |
| `session_discard` | In-progress session recovery discarded. |
| `version_open` | Version modal opened. |
| `analysis_view` | Analysis waiting screen shown. |
| `analysis_complete` | Analysis waiting screen completed. |
| `question_answer` | A question was answered. |
| `question_back` | User moved one question back. |
| `question_reach_3` | Base question index reached 3. |
| `question_reach_6` | Base question index reached 6. |
| `question_reach_9` | Base question index reached 9. |

If one of these becomes operationally important, add it to the admin event list
and decide how it should be grouped.

## Reading Funnel Metrics

- Completion rate is `complete_test / start_click`.
- Share rate is all share/save events divided by completions.
- Home-screen open rate is standalone actors divided by visitors.
- `result_view` should generally track `complete_test`, but timing and refresh
  recovery can make them differ.
- `result_image_download_fallback` is not a confirmed save. It means the app
  started a browser download fallback.

## Reading Server-Session Metrics

- `session_api_start_ok` means the server returned a valid session token and
  question set.
- `session_api_complete_ok` with `status: needs_followup` is not failure; it
  means the server requested follow-up questions.
- `session_api_fallback` is historical after the server-required cutover and
  should remain zero for new clients.
- `session_api_error` means the user stayed on start or the exact last question
  with an explicit retry path; it is no longer paired with local fallback.
- Slow start/complete counts use the admin threshold in code. Review by
  browser/OS/device before changing fallback policy.

## Server Start Observation Contract

`session_api_start_observed` is emitted by the server after a valid
`POST /api/session/start` response. Monitoring delivery is best-effort and is
isolated from the user response: a missing analytics setting, timeout, or
delivery failure must not fail a normal test start.

The event accepts only this fixed property contract:

- `distinct_id`: daily rotating HMAC of the normalized first forwarding IP and
  coarse user-agent family, or the fixed `session-monitoring-unavailable`
  marker when a usable server identity cannot be derived;
- `$process_person_profile`: `false`, so PostHog does not create a person profile
  for this observation;
- `policy_version: 1` and `environment` limited to a small deployment category;
- `identity_available` and `account_identity_available` booleans;
- `access_tier`: `anonymous` today, with `free` and `premium` reserved for a
  future server-verified member context;
- `user_agent_family`: `chrome`, `edge`, `firefox`, `safari`, `other`, or
  `unknown`;
- `recent_session_count_bucket`: `0`, `1-2`, `3-9`, or `10+`;
- `age_group_present`: presence only, never the age-group value;
- optional `account_actor_key`: monthly rotating HMAC of a server-verified
  account ID. It must be absent for anonymous or unverified requests.

The server allowlist rejects any extra event properties. Raw IP addresses,
full user-agent strings, account IDs, email addresses, names, birth data,
request bodies, question or option content, session tokens, and answers are not
part of this event.

### Dashboard Interpretation

- The policy is observation-only. A warning window (`10` starts in one minute)
  or severe window (`30` starts in ten minutes) is a review signal, not a block,
  rate limit, or abuse verdict.
- Burst windows are grouped by the daily rotating network actor key. They do
  not establish a durable person identity and cannot be joined across KST days.
- `unmatchedClientStarts` is `session_api_start_observed` minus
  `session_api_start_ok`, floored at zero. It is an estimate that can differ
  because server and browser delivery are independent; it is not a confirmed
  count of bypass attempts.
- Low identity coverage usually means the salt or forwarding IP was unavailable.
  Check deployment configuration before interpreting it as traffic behavior.
- Monitoring-query failure is optional and must not hide the dashboard's core
  metrics; the panel reports an unavailable state instead.

### Future Member Extension

The current start handler does not pass an authenticated account context, so
events remain `access_tier: anonymous`. A future member integration may set
`free` or `premium` and add `account_actor_key` only after the server has
verified both the account ID and entitlement. Client claims must never select a
tier. The monthly key must remain separate from the daily network key, and the
admin response must continue to expose aggregate tier counts only.

## Privacy Checklist For New Events

Before adding a new analytics event, verify:

- no raw birth date, user name, or free-text answer is included;
- no raw question text, option text, question pool, scoring weight, or session
  token is included;
- no PostHog personal key, Cloudflare Access value, Supabase service role key,
  or server secret can be emitted;
- properties are short, categorical, or numeric;
- admin metrics can use aggregate counts without exposing user rows.

## Follow-Ups

- Decide whether `question_*`, history, and home-screen migration events need a
  dedicated admin panel or should remain product-analysis-only.
- Observe `session_api_start_observed` in production before deciding whether a
  separate enforcement event or durable throttling is justified.
