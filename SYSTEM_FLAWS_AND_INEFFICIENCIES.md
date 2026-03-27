# SYSTEM_FLAWS_AND_INEFFICIENCIES

This document lists observed flaws and inefficiencies in the current LOOPY system.

## 1) Legacy and New Flows Coexist (Behavior Drift Risk)

- Legacy endpoints (`/upload-and-process`, `/loop`) are still active while new flow uses (`/upload`, `/process`).
- This allows two different processing paths in production behavior.
- Risk: frontend/backends can drift or regress silently depending on which endpoint gets called.

## 2) Global Directory Cleanup on Upload (Multi-User/Concurrency Hazard)

- `POST /upload` currently calls cleanup on shared directories (`temp_uploads`, `separated`) before saving a new file.
- One upload can remove files needed by another in-progress job.
- Risk: random 404/500 failures under concurrent usage.

## 3) Processing is Synchronous and Blocking

- `/process` performs ffmpeg + demucs + looping inline inside request lifecycle.
- Demucs is expensive and can take significant time.
- Risk: request timeouts, poor throughput, and blocked worker under load.

## 4) Temp Processing Artifacts Are Not Cleaned

- Mode pipeline writes to `temp_processing/<job_id>/...` and does not clean afterward.
- Risk: unbounded disk growth over time.

## 5) `/process` Returns Generic 500 for Most Failures

- Most exceptions are re-thrown as `HTTPException(500, detail=str(e))`.
- Client cannot reliably distinguish validation, missing tools, demucs errors, or ffmpeg failures.
- Risk: poor observability and weak UX recovery paths.

## 6) Loop Creation Uses a Hardcoded End-Time Sentinel

- Mode pipeline calls `create_loop(..., 0, 10000, ...)` to include full file after slicing/demucs.
- This is a workaround rather than explicit duration handling.
- Risk: brittle behavior and hidden assumptions if helper logic changes.

## 7) ffmpeg Slicing Uses Stream Copy (`-c copy`)

- Copy mode is fast but can be inaccurate around non-keyframe boundaries.
- Region start/end precision may not exactly match UI selection for compressed inputs.
- Risk: audible offsets in selected loop section.

## 8) No Explicit Validation for Time Window Relationships

- No strict guard in request model for `startTime < endTime` and positive ranges before processing.
- Some failures are deferred to downstream tools.
- Risk: less clear API errors and avoidable processing attempts.

## 9) Frontend Create Loop State Is Not Durable Across Refresh

- `/create-loop` depends on route state (`job_id`, blob URL) passed from `/loop-lab`.
- Browser refresh on create-loop page redirects user back.
- Risk: fragile UX for long workflows.

## 10) Duplicate HTML IDs in Mode Switches

- Both switches in Create Loop use the same `id` (`switch-focus-mode`).
- Risk: accessibility and label association issues.

## 11) Loop Interaction Disable Is Partial

- In vocals-only mode, loop duration input visual state is reduced/disabled.
- Other loop-related interactions can still appear active depending on current button wiring.
- Risk: user confusion about what will be processed.

## 12) Hardcoded Backend URL in Frontend

- Frontend calls use `http://localhost:3000` directly.
- Risk: environment portability issues for staging/production.

## 13) CORS Origins Are Static and Narrow

- Backend CORS is hardcoded to local origins.
- Risk: deployment friction and manual code edits per environment.

## 14) Documentation Drift Was Present (Now Improved)

- Prior docs described old upload/process flow and mixed duplicate sections.
- Risk: onboarding confusion and incorrect integration assumptions.

## 15) Limited Automated Verification

- Build/compile checks exist, but no clear integration test coverage for endpoint behavior modes.
- Risk: regressions in mode branching and payload contract can slip through.

---

## Suggested Prioritization

High priority:
1. Remove or gate legacy endpoints.
2. Replace global cleanup with job-scoped lifecycle cleanup.
3. Add explicit request validation and typed error responses.
4. Add cleanup policy for `temp_processing`.

Medium priority:
1. Move long-running processing off request thread.
2. Remove hardcoded loop sentinel (`10000`) with explicit full-file loop behavior.
3. Improve slice precision strategy where needed.

Low priority:
1. Make create-loop state refresh-safe.
2. Fix duplicate switch IDs.
3. Externalize API base URL and CORS config.
