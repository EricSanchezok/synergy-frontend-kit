---
name: project-init
description: >-
  Diagnose and initialize frontend tooling before design work. Use when starting
  a new frontend project or when MCP tools report missing configuration.
  Triggers include new project, initialization, setup, MCP errors, and unavailable
  tools.
---

# Project Init

Before doing any frontend design work on a project, verify the three MCP servers (shadcn, layout-context, playwright) are fully initialized. If a project hasn't been set up yet, these servers will start but return degraded or empty results. This skill teaches you to detect that state and fix it automatically.

## When to apply

Apply this skill before the first frontend task in a new project, or immediately when an MCP tool returns an error that suggests missing project configuration. Do NOT apply it mid-design unless a tool actually fails.

## Preflight check sequence

Run each check in order. After each check, apply the fix if needed before moving to the next.

### 1. shadcn/ui check

**Probe:** Call the shadcn MCP tool `get_project_registries` (or equivalent discovery tool).

**Symptom if missing:** Response text contains "no components.json found", "no registries configured", or similar.

**Fix:** Ask for user approval, then run `npx shadcn@4.11.0 init -d`. The `-d` flag runs in non-interactive mode. If it still prompts, pass `"y"` to stdin.

### 2. layout-context check

**Probe:** Call the layout-context tool `get_tokens` or `get_design_system`.

**Symptom if missing:** Returns empty data — no tokens, no colors, no spacing, no design system loaded. `check_compliance` returns `passed: true` even with nothing loaded (false negative — unreliable as a probe).

**Fix:** Ask for user approval, then run `npx @layoutdesign/context@0.15.3 init`.

### 3. Playwright check

**Probe:** Call `browser_navigate` with a simple URL like `about:blank`.

**Symptom if missing:** Error mentioning "browser is not installed", "Playwright browser", or "executable doesn't exist".

**Fix:** Ask for user approval, then run `npx playwright@1.61.1 install --with-deps chromium`. This is slow - warn the user it may take 1-2 minutes.

## Decision logic

```
Before starting ANY frontend design work:
  1. Run the preflight sequence on all 3 servers
  2. If any check fails, ask before running setup because it can write files and download packages
  3. If ALL checks pass (or fixes succeed), proceed with the design task
  4. If a fix fails, report the failure to the user with the manual command and continue in degraded mode
  5. Cache: once all checks pass in a session, do not re-run them
```

## Caching

Once all three checks pass in a given session, set a mental flag ("project-init: done"). Do not re-run the preflight sequence until the next session. If the user restarts the session or opens a new project directory, the flag resets.

## Edge cases

- **No shell access:** If you don't have permission to run shell commands, tell the user to run `synergy synergy-frontend-kit setup --dry-run --json` first, then `synergy synergy-frontend-kit setup` after review.
- **shadcn init still prompts:** The `-d` flag should prevent interactive prompts, but if it doesn't, pass `y\n` to stdin.
- **Playwright install times out:** If the install takes longer than 3 minutes, skip it and continue without visual verification. Note this in your response so the user knows screenshots won't work until the browser is installed.
- **Partial setup:** If only some checks pass, fix the failing ones and skip the ones that already passed (caching applies per-check, not just at the end).
