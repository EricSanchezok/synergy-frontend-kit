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
  version: "0.3.0",
  description:
    "Official frontend capability kit for Synergy agents: curated design skills, pinned MCP tooling, and setup automation.",
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
  capabilities: [capability("settings.write"), capability("shell.execute")],
  contributions: [
    ...SKILL_ENTRIES.map((entry) => skill({ id: entry.name, skill: entry })),
    mcp({
      id: "shadcn",
      server: {
        type: "local",
        command: ["npx", "-y", "shadcn@4.11.0", "mcp"],
        startup: "lazy",
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
      server: {
        type: "local",
        command: ["npx", "-y", "@layoutdesign/context@0.15.3", "serve"],
        startup: "lazy",
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
      server: {
        type: "local",
        command: ["npx", "-y", "@playwright/mcp@0.0.76"],
        startup: "lazy",
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
      requires: ["settings.write"],
      component: { source: "src/ui.tsx", exportName: "SettingsPanel" },
      formSchema: {
        type: "object",
        properties: {
          mcp: {
            type: "object",
            properties: {
              shadcn: { type: "boolean", default: true },
              layoutContext: { type: "boolean", default: true },
              playwright: { type: "boolean", default: true },
              startup: {
                type: "string",
                enum: ["lazy", "manual"],
                default: "lazy",
              },
              timeoutMs: { type: "number", default: 120_000 },
            },
          },
          setup: {
            type: "object",
            properties: {
              autoPrompt: { type: "boolean", default: true },
              visualVerification: {
                type: "string",
                enum: ["off", "smoke", "strict"],
                default: "smoke",
              },
            },
          },
        },
        additionalProperties: false,
      },
    }),
    setupCommand,
  ],
});

export default FrontendKitPlugin;
