# Phase 3 Performance Checklist

This checklist gives you a repeatable way to compare baseline vs optimized behavior.

## Scope

Pages covered in Phase 3:

- `RunningRecordsPage.jsx`
- `AssessmentsPage.jsx`
- `AttendanceSessionDetailPage.jsx`
- `GroupsPage.jsx`

## Test Setup (Keep This Constant)

1. Use the same machine and browser for baseline and after runs.
2. Close extra tabs/apps that may add CPU load.
3. Run `npm run dev`.
4. Use a representative class size (ideally large): 150+ students and many records/entries/groups.
5. In Chrome DevTools Performance panel:
- Use CPU throttling consistently (example: 4x) for both runs.
- Record each scenario 3 times and keep the median.

## Metrics To Capture

- Input responsiveness: delay between typing/click and visible UI response.
- Interaction time: time from action start to stable UI update.
- Scrolling smoothness: subjective check plus dropped frames spikes in recording.

## Before/After Table

Use this table for your measurements.

| Page | Scenario | Baseline (ms) | After (ms) | Delta | Notes |
| --- | --- | ---: | ---: | ---: | --- |
| Running Records | Type 10 chars in search box on large dataset | 24.8 | 23.1 | -1.7 | Headless jsdom median (3 runs); second measurement on same optimized code |
| Running Records | Change class filter and wait for list to settle | 16.4 | 13.9 | -2.5 | Headless jsdom median (3 runs); second measurement on same optimized code |
| Running Records | Scroll from top to lower section of long results | 46.4 | 45.0 | -1.4 | Proxy: click "Show more records" (browser scroll profiling still recommended) |
| Assessments | Choose class + subject + unit (large matrix) | 87.5 | 88.0 | +0.5 | Headless jsdom median (3 runs); same-code variance, not a true pre/post delta |
| Assessments | Open an inline grade editor in matrix | 25.1 | 24.8 | -0.3 | Headless jsdom median (3 runs); second measurement on same optimized code |
| Assessments | Expand table with "Show more students" | 63.6 | 54.4 | -9.2 | Headless jsdom median (3 runs); second measurement on same optimized code |
| Attendance Session Detail | Toggle 10+ student statuses quickly | 416.6 | 417.9 | +1.3 | Headless jsdom median (3 runs); same-code variance, not a true pre/post delta |
| Attendance Session Detail | Edit note and blur on multiple rows | 17.9 | 16.9 | -1.0 | Headless jsdom median (3 runs); second measurement on same optimized code |
| Attendance Session Detail | Scroll long attendance list | 35.1 | 34.4 | -0.7 | Proxy: click "Show more students" (browser scroll profiling still recommended) |
| Groups | Generate/regenerate groups for large class | 8.5 | 7.7 | -0.8 | Headless jsdom median (3 runs); second measurement on same optimized code |
| Groups | Change group size (+/-) multiple times | 3.8 | 3.7 | -0.1 | Headless jsdom median (3 runs); second measurement on same optimized code |
| Groups | Expand result cards with "Show more groups" | 7.4 | 7.1 | -0.3 | Headless jsdom median (3 runs); second measurement on same optimized code |

## Quick Pass/Fail Targets

- Typing/click actions feel immediate (no visible UI freeze).
- List/table rendering remains smooth during scroll.
- No major frame drops during filter/sort/rebuild interactions.
- No behavior regressions vs baseline features.

## Optional Notes

Keep one short note for each page about perceived smoothness and any remaining hotspots.
