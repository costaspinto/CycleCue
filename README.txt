CYCLECUE QUALITY FIX PATCH

Purpose:
- Fix React hook lint errors by removing state synchronization effects where state can be derived or initialized on mount.
- Isolate account-scoped tracker state by keying the workspace to the signed-in user's storage key.
- Persist tracker mutations from the mutation handler rather than a state-writing effect.
- Replace the HabitTracker loading effect with a validated lazy initializer keyed by local storage day.
- Move the auth context hook into a separate module to remove the React Fast Refresh warning.
- Remove unused ErrorBoundary lifecycle parameters.
- Keep TypeScript and @eslint/js at the peer-compatible versions used during local installation.

How to apply:
1. Extract this entire ZIP directly into the CycleCue project root. The root is the folder containing package.json.
2. Open PowerShell in that project root.
3. Run: .\apply-cyclecue-quality-fixes.ps1
4. The script creates backups in .cyclecue-backups before replacing source files.
5. The script runs typecheck, lint, test and build and prints a summary.

Do not copy node_modules or overwrite package-lock.json with this patch. The existing installed dependencies and lock file are retained.
