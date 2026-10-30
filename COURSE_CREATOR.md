# Course Creator integration contract

Feature owner: isolated VENTRA-FEATURES worktree, feature/course-creator-20261030.
Frontend reserved worktree: ../VENTRA-UI (frontend/ventra-ui-20261030).
Backend reserved worktree: ../VENTRA-BACKEND (backend/ventra-api-20261030).
Existing protected role sessions have not been reassigned or restarted.

Interactive route: /tools/course-creator. Run npm run dev -- --port 3107 from apps/web.
This is an isolated manual-authoring sandbox with separate, explicit account save/load controls; it does not publish courses.
It reuses EducationCourseDraft v1, lesson validation, optimistic-concurrency persistence,
learner-safe projection, and existing storage namespace with profile course-creator-sandbox.
Supports adding/editing/reordering/removing lessons, preview, save/reload and validated JSON import/export.
Imports replace editor state only after confirmation and require explicit Save.
Corrupt or inaccessible storage disables saving rather than overwriting existing data.

AI boundary: lib/course-creator.ts exports CourseGenerationAdapter and generateCourse.
A trusted adapter must return EducationCourseDraftInput; output passes existing validation.
No provider integration exists in the inspected source. No network generation is invoked,
no credentials are requested in the browser, and no generated content is fabricated.
Backend can supply a server-side authenticated provider adapter later; model/API credentials
and account-backed persistence are external integration blockers, not manual-authoring blockers.
Do not expose provider keys through NEXT_PUBLIC variables.

No deployments, permission configuration edits, or protected-checkout source changes.

Account save/load (2026-10-30):
- Reusable lib/course-account.ts validates account rows, course content, identifiers and revisions;
  requests use same-origin cookies and no-store. Successful saves require an exact next-revision acknowledgement.
- Connect account, choose workspace, refresh courses, load with replacement confirmation,
  save a new account copy, or update the loaded revision. Conflicts preserve editor content;
  refresh and explicitly load to accept the remote version before retrying.
- /api/workspace/courses shares the existing course handlers and uses the existing HttpOnly
  workspace session cookie. Existing bearer-token clients remain supported.
- Account operations never write the browser draft. Browser Save remains explicit.
- Live storage still requires approved Supabase configuration and the existing course migration;
  no migration was applied and no paid service was invoked in this work.
- Browser harness covers mocked account create/load/update/conflict and browser isolation.
  Execution blocker in this session: local server listen on 127.0.0.1:3107 denied with EPERM
  by the sandbox. Run test/course-creator-browser.mjs in a local environment allowing a server.
Next task: run the browser harness where local server binding is allowed, then verify live
account persistence against an approved configured database (migration approval remains external).
Commit blocker: this linked worktree's Git index is under
/Users/dylan/Developer/VENTRA-CLEAN/.git/worktrees/VENTRA-FEATURES.
The sandbox rejected index.lock creation with Operation not permitted; staging and commit
could not complete. Source edits remain exclusively in VENTRA-FEATURES. No permission
bypass or protected checkout edits were attempted.
Verification: 269 tests passed (including account helper tests), zero-warning lint,
typecheck, production build, browser harness syntax check and git diff --check passed.
