import { readFileSync } from "node:fs"
import type { Plugin } from "@ericsanchezok/synergy-plugin"
import { setupCommand } from "./setup"

function loadAgentPrompt(pluginDir: string): string {
  const filePath = `${pluginDir}/agents/frontend-designer.md`
  try {
    return readFileSync(filePath, "utf-8")
  } catch {
    throw new Error(
      `[frontend-kit] Missing required file: ${filePath}. The plugin installation may be incomplete.`,
    )
  }
}

export const FrontendKitPlugin: Plugin = {
  id: "frontend-kit",
  name: "Synergy Frontend Kit",

  async init(ctx) {
    const prompt = loadAgentPrompt(ctx.pluginDir)

    return {
      skills: [
        {
          name: "frontend-design",
          description:
            "Anthropic's frontend design methodology: plan-before-code, declarative-first, atomic refinement. Use when building or redesigning frontend UIs. Triggers: 'frontend', 'design', 'UI', 'component', 'layout', 'styling', 'CSS'.",
          dir: "skills/frontend-design",
        },
        {
          name: "taste-frontend",
          description:
            "Taste Skill v2: systematic design sensibility for frontend. Covers typography, spacing, color theory, and visual hierarchy. Use for design critique and refinement.",
          dir: "skills/taste-frontend",
        },
        {
          name: "soft-design",
          description:
            "Taste soft-skill: design language for gentle, approachable interfaces. Rounded corners, soft shadows, warm palettes, generous whitespace.",
          dir: "skills/soft-design",
        },
        {
          name: "minimalist-design",
          description:
            "Taste minimalist-skill: reductive design principles. Essential elements only, negative space as a feature, typography-driven layouts.",
          dir: "skills/minimalist-design",
        },
      ],

      agents: {
        "frontend-designer": {
          name: "frontend-designer",
          description:
            "Frontend design specialist. Produces visually polished, accessible UIs using React, Tailwind CSS, and shadcn/ui. Applies design methodology from loaded skills. Use for any task where visual quality and design decisions matter — layouts, component selection, styling, design systems, or UI refinement.",
          prompt,
          mode: "subagent" as const,
        },
      },

      cli: {
        setup: setupCommand(ctx),
      },

      async config(config: unknown) {
        const raw = (config as Record<string, unknown> | undefined)?.mcp
        const mcpConfig =
          typeof raw === "object" && raw !== null
            ? (raw as Record<string, unknown>)
            : {}
        const managedKeys = [
          "frontend-kit::shadcn",
          "frontend-kit::layout-context",
          "frontend-kit::playwright",
        ]

        for (const key of managedKeys) {
          if (!(key in mcpConfig)) {
            console.warn(
              `[frontend-kit] MCP server "${key}" not configured. ` +
                `Run 'synergy frontend-kit setup' to initialize frontend tooling.`,
            )
          }
        }
      },
    }
  },
}

export default FrontendKitPlugin
