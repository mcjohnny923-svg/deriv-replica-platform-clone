---
name: Imported dependency compatibility
description: Dependency-version alignment lessons for migrating imported frontend apps into the workspace scaffold.
---

When porting an imported frontend, prefer the source app's dependency versions for UI libraries whose component APIs are version-sensitive.

**Why:** The workspace scaffold can contain newer packages than the imported app. A source component may still compile and render in the browser while failing typecheck after an API change, as happened with the calendar component and `react-day-picker`.

**How to apply:** Compare the imported `package.json` with the generated artifact package after copying. Restore source-compatible versions before changing copied components, then reinstall and run the artifact typecheck.