import {
  capability,
  definePlugin,
  mcp,
  settings,
  skill,
} from "@ericsanchezok/synergy-plugin";
import { setupCommand } from "./setup";
import { SKILL_ENTRIES } from "./skills";

export { SKILL_ENTRIES } from "./skills";

export const FrontendKitPlugin = definePlugin({
  id: "synergy-frontend-kit",
  name: "Synergy Frontend Kit",
  version: "0.5.0",
  description:
    "Official frontend capability kit for Synergy agents: curated design skills, pinned MCP tooling, and setup automation.",
  compatibility: { synergy: ">=3.0.11" },
  author: "EricSanchez",
  homepage: "https://github.com/EricSanchezok/synergy-frontend-kit",
  repository: "https://github.com/EricSanchezok/synergy-frontend-kit",
  license: "MIT",
  icon: "icons/market.svg",
  keywords: [
    "synergy-plugin",
    "frontend",
    "design",
    "ui",
    "tailwind",
    "shadcn",
    "accessibility",
  ],
  assets: [{ source: "icons", target: "icons" }],
  capabilities: [capability("shell.execute")],
  contributions: [
    ...SKILL_ENTRIES.map((entry) => skill({ id: entry.name, skill: entry })),
    mcp({
      id: "shadcn",
      enabledWhen: { setting: "shadcn", equals: true },
      server: {
        type: "local",
        command: ["npx", "-y", "shadcn@4.11.0", "mcp"],
        startup: "eager",
        required: false,
        connectTimeout: 10_000,
        listTimeout: 15_000,
        callTimeout: 120_000,
        idleShutdownMs: 600_000,
        retry: {
          maxAttempts: 2,
          backoffMs: 500,
          backoffMultiplier: 2,
          cooldownMs: 30_000,
        },
        toolFilter: { exclude: [] },
        tools: { approval: "auto", maxOutputBytes: 1_048_576 },
        toolCache: { mode: "session", ttlMs: 300_000 },
      },
    }),
    mcp({
      id: "layout-context",
      enabledWhen: { setting: "layoutContext", equals: true },
      server: {
        type: "local",
        command: ["npx", "-y", "@layoutdesign/context@0.15.3", "serve"],
        startup: "eager",
        required: false,
        connectTimeout: 10_000,
        listTimeout: 15_000,
        callTimeout: 120_000,
        idleShutdownMs: 600_000,
        retry: {
          maxAttempts: 2,
          backoffMs: 500,
          backoffMultiplier: 2,
          cooldownMs: 30_000,
        },
        tools: { approval: "auto", maxOutputBytes: 1_048_576 },
        toolCache: { mode: "session", ttlMs: 300_000 },
      },
    }),
    mcp({
      id: "playwright",
      enabledWhen: { setting: "playwright", equals: true },
      server: {
        type: "local",
        command: ["npx", "-y", "@playwright/mcp@0.0.76"],
        startup: "eager",
        required: false,
        connectTimeout: 10_000,
        listTimeout: 15_000,
        callTimeout: 180_000,
        idleShutdownMs: 600_000,
        retry: {
          maxAttempts: 2,
          backoffMs: 500,
          backoffMultiplier: 2,
          cooldownMs: 30_000,
        },
        tools: { approval: "auto", maxOutputBytes: 1_048_576 },
        toolCache: { mode: "session", ttlMs: 300_000 },
      },
    }),
    settings({
      id: "frontend-kit",
      label: "Frontend Kit",
      icon: "palette",
      group: "plugins",
      formSchema: {
        type: "object",
        description: "MCP servers start automatically unless you turn them off here.",
        properties: {
          shadcn: {
            type: "boolean",
            default: true,
            title: "shadcn/ui",
            description: "Component registry and code generation · v4.11.0",
          },
          layoutContext: {
            type: "boolean",
            default: true,
            title: "layout.design",
            description: "Design-system context and linting · v0.15.3",
          },
          playwright: {
            type: "boolean",
            default: true,
            title: "Playwright MCP",
            description: "Screenshots and browser verification · v0.0.76",
          },
        },
        additionalProperties: false,
      },
    }),
    setupCommand,
  ],
});

export default FrontendKitPlugin;
