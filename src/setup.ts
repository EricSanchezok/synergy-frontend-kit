import type { PluginCLICommand, PluginInput } from "@ericsanchezok/synergy-plugin"

interface SetupArgs {
  "skip-shadcn"?: boolean
  "skip-layout"?: boolean
  "skip-playwright"?: boolean
}

async function execStep(
  ctx: PluginInput,
  label: string,
  command: string[],
  fallback: string,
): Promise<string[]> {
  const results: string[] = []
  results.push(`▸ ${label}...`)
  try {
    await ctx.$`${command[0]} ${command.slice(1)}`.quiet()
    results.push(`  ✓ ${label.split("(")[0].trim()} complete`)
  } catch (err) {
    results.push(`  ✗ ${label.split("(")[0].trim()} failed: ${err instanceof Error ? err.message : String(err)}`)
    results.push(`  Run manually: ${fallback}`)
  }
  results.push("")
  return results
}

export function setupCommand(ctx: PluginInput): PluginCLICommand {
  return {
    description:
      "Initialize frontend tooling in the current project (shadcn/ui, layout.design, Playwright browsers)",
    options: {
      "skip-shadcn": {
        type: "boolean",
        description: "Skip shadcn/ui component library initialization",
      },
      "skip-layout": {
        type: "boolean",
        description: "Skip layout.design design system initialization",
      },
      "skip-playwright": {
        type: "boolean",
        description: "Skip Playwright browser installation for visual testing",
      },
    } as const,
    async execute(args: SetupArgs) {
      const lines: string[] = ["🎨 Synergy Frontend Kit — Setup", ""]

      if (!args["skip-shadcn"]) {
        for (const line of await execStep(
          ctx,
          "Initializing shadcn/ui...",
          ["npx", "shadcn@latest", "init", "-d"],
          "npx shadcn@latest init",
        )) {
          lines.push(line)
        }
      }

      if (!args["skip-layout"]) {
        for (const line of await execStep(
          ctx,
          "Initializing layout.design...",
          ["npx", "@layoutdesign/context", "init"],
          "npx @layoutdesign/context init",
        )) {
          lines.push(line)
        }
      }

      if (!args["skip-playwright"]) {
        for (const line of await execStep(
          ctx,
          "Installing Playwright browsers (this may take a while)...",
          ["npx", "playwright", "install", "--with-deps", "chromium"],
          "npx playwright install --with-deps chromium",
        )) {
          lines.push(line)
        }
      }

      lines.push("─────────────────────────────────────")
      lines.push("Setup complete!")
      lines.push("")
      lines.push("Next steps:")
      lines.push("  • Add shadcn components:    npx shadcn@latest add button card dialog")
      lines.push("  • Customize design tokens:  edit .layout/kit.json")
      lines.push("")
      lines.push("Tip: run 'synergy plugin update synergy-frontend-kit' to upgrade to the latest version.")
      lines.push("─────────────────────────────────────")

      return lines.join("\n")
    },
  }
}
