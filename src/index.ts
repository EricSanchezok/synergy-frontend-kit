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
          name: "color-expert",
          description:
            "Use when working with color naming, color theory, color spaces, color definitions, or any task involving color knowledge - palettes, ramps, gradients, conversions, accessibility, perceptual matching, pigment mixing, print-vs-screen color, CSS color syntax, or historical color terminology. Triggers: 'color', 'palette', 'OKLCH', 'contrast', 'CSS color'.",
          dir: "skills/color-expert",
        },
        {
          name: "typography",
          description:
            "Apply professional typography principles to create readable, hierarchical, and aesthetically refined interfaces. Use when setting type scales, choosing fonts, adjusting spacing, designing text-heavy layouts, implementing dark mode typography, or when asked about readability, font pairing, line height, measure, typographic hierarchy, variable fonts, font loading, or OpenType features. Triggers: 'typography', 'font', 'type scale', 'font pairing', 'readability', 'line height'.",
          dir: "skills/typography",
        },
        {
          name: "motion-design",
          description:
            "Applies motion design principles to create emotionally-driven, technically sound animations and transitions. Provides timing, easing, choreography, and Disney animation principles adapted for UI. Use when creating animations, transitions, micro-interactions, loading states, page transitions, scroll-triggered effects, or any motion work. Triggers: 'animation', 'motion', 'transition', 'easing', 'micro-interaction', 'loading state'.",
          dir: "skills/motion-design",
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
        {
          name: "project-init",
          description:
            "Teaches the agent to self-diagnose and auto-initialize frontend tooling (shadcn/ui, layout.design, Playwright) when MCP tools return configuration-missing errors. Use before starting any frontend design work. Triggers: 'new project', 'init', 'setup', 'MCP error', 'tool not available'.",
          dir: "skills/project-init",
        },
        {
          name: "implementation-rules",
          description:
            "24 deterministic anti-slop coding rules to prevent AI-generated frontend anti-patterns. Covers color, typography, layout, motion, and accessibility. Standing orders for all frontend code. Triggers: 'CSS', 'style', 'component', 'layout', 'Tailwind', 'animation', 'font', 'color', 'spacing', 'accessibility'.",
          dir: "skills/implementation-rules",
        },
        {
          name: "a11y-audit",
          description:
            "Run accessibility audits on web projects combining automated scanning (axe-core, Lighthouse) with WCAG 2.1 AA compliance mapping, manual check guidance, and structured reporting. Triggers: 'accessibility audit', 'a11y audit', 'WCAG audit', 'accessibility check', 'compliance scan'.",
          dir: "skills/a11y-audit",
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
