# LingCode — Environment Loading

How PearPay's environment variables reach the app **without putting any secret
into LingCode's committed config** (`.lingcode/launch.json`, `.lingcode/project.json`).

## Rule

> Secrets live **only** in `.env` (hidden, gitignored). Never paste keys into
> `.lingcode/launch.json` `environmentVariables` — that file can be committed.

## Where env actually gets loaded

| Path | Loads env from | Notes |
|------|----------------|-------|
| `npm run dev` / `next dev` | `.env`, `.env.local`, `.env.development` | Next.js auto-loads these; no config needed |
| `npm run build` / `start` | `.env`, `.env.production` | Next.js auto-loads |
| `scripts/*.mjs` (verify:*, judge:demo) | `.env` via `scripts/load-env.mjs` → `loadEnvFile()` | Vitest/Node don't auto-load, so scripts call it |
| `vitest` (tests) | `.env` (when a test imports `loadEnvFile`) | most tests run in stub mode, no secrets needed |

So when you press **Run** in LingCode and it executes `npm run dev`, the app
picks up `.env` automatically. Nothing more is required.

## Setup (one time)

1. Fill secrets into the hidden `.env` (copy from the visible template):
   ```bash
   cp pearpay.env .env        # then edit .env with real values
   # reveal hidden files in Finder: ⌘⇧.   |  edit: cursor .env
   ```
2. In LingCode, set the run command / scheme to `npm run dev` (or your script).
3. Leave `.lingcode/launch.json` → `environmentVariables` **empty**. The app
   reads `.env` itself.

## If LingCode runs in a sandbox that strips `.env`

Some run environments don't inherit `.env`. In that case, prefer a launcher that
sources `.env` explicitly rather than hardcoding values:

```bash
# package.json already supports this pattern via scripts/load-env.mjs
set -a; [ -f .env ] && . ./.env; set +a; npm run dev
```

Only reference **variable names** in any committed LingCode config — never the
values.

## Files

| File | Committed? | Contains secrets? |
|------|-----------|-------------------|
| `.env` | ❌ gitignored | ✅ yes — your real keys |
| `pearpay.env` | ✅ yes | ❌ no — blank template |
| `.env.example` | ✅ yes | ❌ no — blank template |
| `.lingcode/launch.json` | ✅ yes | ❌ must stay empty |
