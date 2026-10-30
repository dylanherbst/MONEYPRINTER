# Course Creator integration contract

Feature owner: isolated VENTRA-FEATURES worktree, feature/course-creator-20261030.
Frontend reserved worktree: ../VENTRA-UI (frontend/ventra-ui-20261030).
Backend reserved worktree: ../VENTRA-BACKEND (backend/ventra-api-20261030).
Existing protected role sessions have not been reassigned or restarted.

Interactive route: /tools/course-creator. Run npm run dev -- --port 3107 from apps/web.
This is an isolated manual-authoring sandbox, not a published or account-backed course.
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
