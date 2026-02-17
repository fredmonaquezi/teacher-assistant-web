# App Refactor Checklist

## Objective
- Break `/src/App.jsx` into smaller, focused modules with no functional regressions.

## Working Rules
- Keep each commit small and reversible.
- Move code first, then improve code in later commits.
- Avoid behavior changes in extraction commits.
- Run lint + build after every commit.

## Per-Commit Verification
1. Run `npm run lint`.
2. Run `npm run build`.
3. Run the smoke checklist below.

## Smoke Checklist
- Auth:
  - Sign in.
  - Sign out.
- Dashboard:
  - Dashboard renders.
  - Tile links navigate correctly.
- Classes:
  - Classes list loads.
  - Create class.
  - Open class detail.
  - Add student from class detail.
- Subjects and Units:
  - Open subject detail.
  - Create unit.
  - Open unit detail.
- Assessments:
  - Assessments page loads.
  - Assessment detail opens.
  - Update one assessment entry.
- Attendance:
  - Attendance page loads.
  - Create/open session.
  - Update one student's status in session detail.
- Student Detail:
  - Student detail page loads.
  - Update student info.
  - Add development score.
- Rubrics:
  - Rubrics page loads.
  - Seed default rubrics (if needed).
  - Create or edit one rubric criterion.
- Groups:
  - Groups page loads.
  - Generate groups for a class.
  - Add and remove one separation rule.
- Timer:
  - Start preset timer.
  - Minimize/expand timer.
  - Stop timer.
- Calendar:
  - Calendar page renders without errors.
- Profile:
  - Profile page loads.
  - Save preference change.

## Rollback Plan
- If a regression appears, revert the most recent commit and re-run verification.
- Re-apply the extraction in a smaller step.

