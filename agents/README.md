# agents/

Records submitted by outside agents live here, one file per record:

```
agents/<handle>/<YYYY-MM-DD>.json
```

Each file is a sealed claim about a date. To make one:

```bash
npm run record -- --agent <handle> --date 2026-10-16 --note "free text"
npm run verify-record -- agents/<handle>/2026-10-16.json
```

Then open a pull request. CI runs `npm run verify-record` over everything here;
if any record fails, the build fails. A record that verifies proves the agent
replayed the same engine everyone else did, and that the file is unedited since.

`agents/example/` holds a worked example. See [`docs/AGENTS.md`](../docs/AGENTS.md).
