import {
  For,
  Show,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import type { Component, JSX } from "solid-js";
import type { PluginSurfaceContext } from "@ericsanchezok/synergy-plugin";

const MCP_SERVERS = [
  {
    id: "shadcn",
    label: "shadcn/ui",
    version: "4.11.0",
    purpose: "Component registry and code generation",
  },
  {
    id: "layoutContext",
    label: "layout.design",
    version: "0.15.3",
    purpose: "Design-system context and linting",
  },
  {
    id: "playwright",
    label: "Playwright MCP",
    version: "0.0.76",
    purpose: "Screenshots and browser verification",
  },
] as const;

const DEFAULT_VALUES = {
  mcp: {
    shadcn: true,
    layoutContext: true,
    playwright: true,
    startup: "lazy",
    timeoutMs: 120000,
  },
  setup: {
    autoPrompt: true,
    visualVerification: "smoke",
  },
};

function readSection(
  values: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const section = values[key];
  return section && typeof section === "object" && !Array.isArray(section)
    ? (section as Record<string, unknown>)
    : {};
}

function readBool(
  section: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  return typeof section[key] === "boolean" ? Boolean(section[key]) : fallback;
}

function readString(
  section: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  return typeof section[key] === "string" ? String(section[key]) : fallback;
}

function readNumber(
  section: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = section[key];
  return typeof value === "number" ? Number(value) : fallback;
}

export const SettingsPanel: Component<PluginSurfaceContext> = (context) => {
  const [values, setValues] = createSignal<Record<string, unknown>>({
    ...DEFAULT_VALUES,
  });
  const mcp = createMemo(() => readSection(values(), "mcp"));
  const setup = createMemo(() => readSection(values(), "setup"));

  const replace = async (next: Record<string, unknown>) => {
    await context.settings.replace(next);
    setValues(next);
  };
  const patch = (sectionName: "mcp" | "setup", key: string, value: unknown) => {
    const currentValues = values();
    const current = readSection(currentValues, sectionName);
    void replace({
      ...currentValues,
      [sectionName]: { ...current, [key]: value },
    });
  };

  const reset = () => void replace({ ...DEFAULT_VALUES });
  let unsubscribe: (() => void) | undefined;
  onMount(() => {
    unsubscribe = context.settings.subscribe(setValues);
    void context.settings.get().then(setValues);
  });
  onCleanup(() => unsubscribe?.());

  return (
    <div
      class="sfk-settings"
      role="tabpanel"
      aria-label="Frontend Kit settings"
    >
      <style>{styleSheet()}</style>

      <header class="sfk-header">
        <div>
          <h2 class="sfk-title">Frontend Kit</h2>
          <p class="sfk-subtitle">
            Pinned MCP servers and setup behavior for frontend tasks.
          </p>
        </div>
      </header>

      <section class="sfk-card" aria-labelledby="sfk-mcp-title">
        <h3 id="sfk-mcp-title" class="sfk-section-title">
          MCP Servers
        </h3>
        <p class="sfk-section-desc">
          Enable the design/frontend MCP servers this plugin can start
          automatically.
        </p>
        <div class="sfk-rows">
          <For each={MCP_SERVERS}>
            {(server) => {
              const enabled = readBool(mcp(), server.id, true);
              return (
                <label class="sfk-row">
                  <span class="sfk-row-text">
                    <span class="sfk-row-title">{server.label}</span>
                    <span class="sfk-row-desc">
                      {server.purpose} · v{server.version}
                    </span>
                  </span>
                  <span class="sfk-toggle">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onInput={(event) =>
                        patch("mcp", server.id, event.currentTarget.checked)
                      }
                    />
                    <span class="sfk-toggle-track" aria-hidden="true" />
                  </span>
                </label>
              );
            }}
          </For>
        </div>
      </section>

      <section class="sfk-card" aria-labelledby="sfk-runtime-title">
        <h3 id="sfk-runtime-title" class="sfk-section-title">
          Runtime
        </h3>
        <p class="sfk-section-desc">
          When and how long MCP servers are allowed to start.
        </p>
        <div class="sfk-rows">
          <label class="sfk-row">
            <span class="sfk-row-text">
              <span class="sfk-row-title">Startup mode</span>
              <span class="sfk-row-desc">
                Lazy avoids downloading packages until a server is actually
                used.
              </span>
            </span>
            <select
              class="sfk-select"
              value={readString(mcp(), "startup", "lazy")}
              onInput={(event) =>
                patch("mcp", "startup", event.currentTarget.value)
              }
            >
              <option value="lazy">Lazy</option>
              <option value="manual">Manual</option>
            </select>
          </label>

          <label class="sfk-row">
            <span class="sfk-row-text">
              <span class="sfk-row-title">Timeout</span>
              <span class="sfk-row-desc">
                Maximum wait time for MCP/setup commands.
              </span>
            </span>
            <input
              class="sfk-input sfk-input--number"
              type="number"
              min="5000"
              step="5000"
              value={readNumber(mcp(), "timeoutMs", 120000)}
              onInput={(event) =>
                patch("mcp", "timeoutMs", Number(event.currentTarget.value))
              }
            />
          </label>
        </div>
      </section>

      <section class="sfk-card" aria-labelledby="sfk-setup-title">
        <h3 id="sfk-setup-title" class="sfk-section-title">
          Setup
        </h3>
        <p class="sfk-section-desc">
          How agents should behave when project tooling is missing.
        </p>
        <div class="sfk-rows">
          <label class="sfk-row">
            <span class="sfk-row-text">
              <span class="sfk-row-title">
                Prompt before running setup commands
              </span>
              <span class="sfk-row-desc">
                Agents ask for confirmation instead of running shell setup
                automatically.
              </span>
            </span>
            <span class="sfk-toggle">
              <input
                type="checkbox"
                checked={readBool(setup(), "autoPrompt", true)}
                onInput={(event) =>
                  patch("setup", "autoPrompt", event.currentTarget.checked)
                }
              />
              <span class="sfk-toggle-track" aria-hidden="true" />
            </span>
          </label>

          <label class="sfk-row">
            <span class="sfk-row-text">
              <span class="sfk-row-title">Visual verification</span>
              <span class="sfk-row-desc">
                How strongly frontend tasks should rely on screenshots and
                browser checks.
              </span>
            </span>
            <select
              class="sfk-select"
              value={readString(setup(), "visualVerification", "smoke")}
              onInput={(event) =>
                patch("setup", "visualVerification", event.currentTarget.value)
              }
            >
              <option value="off">Off</option>
              <option value="smoke">Smoke</option>
              <option value="strict">Strict</option>
            </select>
          </label>
        </div>
      </section>

      <footer class="sfk-footer">
        <button class="sfk-reset" type="button" onClick={reset}>
          Reset to defaults
        </button>
      </footer>
    </div>
  );
};

export default SettingsPanel;

function styleSheet(): string {
  return `
    .sfk-settings {
      box-sizing: border-box;
      min-height: 100%;
      padding: 28px 32px 40px;
      font-family: var(--font-family-sans, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      font-size: var(--type-ui-body-size, 0.875rem);
      line-height: var(--type-ui-body-line-height, 1.375rem);
      color: var(--text-base);
      background: transparent;
    }
    .sfk-settings *, .sfk-settings *::before, .sfk-settings *::after { box-sizing: border-box; }

    .sfk-header {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid color-mix(in srgb, var(--border-base) 42%, transparent);
    }
    .sfk-title {
      margin: 0;
      font-size: var(--type-ui-page-title-size, 1.5rem);
      font-weight: var(--font-weight-semibold, 600);
      line-height: var(--type-ui-page-title-line-height, 1.875rem);
      color: var(--text-strong);
      letter-spacing: var(--letter-spacing-normal, 0);
    }
    .sfk-subtitle {
      margin: 4px 0 0;
      color: var(--text-weak);
      font-size: var(--type-ui-body-size, 0.875rem);
      line-height: var(--type-ui-body-line-height, 1.375rem);
    }

    .sfk-card {
      margin-bottom: 16px;
      padding: 18px 20px;
      border-radius: var(--radius-lg, 0.5rem);
      border: 1px solid var(--border-weaker-base, rgba(17, 24, 39, 0.06));
      background: var(--surface-raised-base, #ffffff);
      box-shadow: var(--shadow-xs-border, 0 0 0 1px rgba(17, 24, 39, 0.06));
    }
    .sfk-section-title {
      margin: 0 0 4px;
      font-size: var(--type-ui-section-title-size, 1rem);
      font-weight: var(--font-weight-semibold, 600);
      line-height: var(--type-ui-section-title-line-height, 1.375rem);
      color: var(--text-strong);
    }
    .sfk-section-desc {
      margin: 0 0 12px;
      color: var(--text-weak);
      font-size: var(--type-ui-body-size, 0.875rem);
      line-height: var(--type-ui-body-line-height, 1.375rem);
    }

    .sfk-rows {
      display: flex;
      flex-direction: column;
    }
    .sfk-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      min-height: 54px;
      padding: 12px 0;
      cursor: pointer;
    }
    .sfk-row:not(:last-child) {
      border-bottom: 1px solid color-mix(in srgb, var(--border-base) 24%, transparent);
    }
    .sfk-row-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1 1 auto;
    }
    .sfk-row-title {
      color: var(--text-base);
      font-size: var(--type-ui-row-title-size, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: var(--type-ui-row-title-line-height, 1.25rem);
    }
    .sfk-row-desc {
      color: var(--text-weak);
      font-size: var(--type-ui-caption-size, 0.75rem);
      line-height: var(--type-ui-caption-line-height, 1rem);
    }

    .sfk-select {
      min-width: 140px;
      padding: 7px 10px;
      border: 1px solid var(--border-weaker-base, rgba(17, 24, 39, 0.06));
      border-radius: var(--radius-md, 0.375rem);
      background: var(--input-base, #f4f4f5);
      color: var(--text-strong);
      font: inherit;
      font-size: var(--type-ui-control-size, 0.8125rem);
      line-height: var(--type-ui-control-line-height, 1.125rem);
      outline: none;
    }
    .sfk-select:focus-visible {
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--text-strong) 24%, transparent),
                  0 0 0 3px color-mix(in srgb, var(--text-strong) 7%, transparent);
    }

    .sfk-input {
      padding: 7px 10px;
      border: 1px solid var(--border-weaker-base, rgba(17, 24, 39, 0.06));
      border-radius: var(--radius-md, 0.375rem);
      background: var(--input-base, #f4f4f5);
      color: var(--text-strong);
      font: inherit;
      font-size: var(--type-ui-control-size, 0.8125rem);
      line-height: var(--type-ui-control-line-height, 1.125rem);
      outline: none;
    }
    .sfk-input--number { width: 120px; }
    .sfk-input:focus-visible {
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--text-strong) 24%, transparent),
                  0 0 0 3px color-mix(in srgb, var(--text-strong) 7%, transparent);
    }

    .sfk-toggle {
      position: relative;
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
      width: 40px;
      height: 24px;
    }
    .sfk-toggle input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      margin: 0;
      cursor: pointer;
      z-index: 1;
    }
    .sfk-toggle-track {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 999px;
      background: var(--border-base, rgba(17, 24, 39, 0.14));
      transition: background-color 140ms ease;
    }
    .sfk-toggle-track::after {
      content: "";
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--surface-raised-base, #ffffff);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
      transition: transform 140ms ease;
    }
    .sfk-toggle input:checked + .sfk-toggle-track {
      background: var(--surface-interactive-base, var(--cobalt-light-3));
    }
    .sfk-toggle input:checked + .sfk-toggle-track::after {
      transform: translateX(16px);
    }
    .sfk-toggle input:focus-visible + .sfk-toggle-track {
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--text-strong) 24%, transparent),
                  0 0 0 3px color-mix(in srgb, var(--text-strong) 7%, transparent);
    }

    .sfk-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
    }
    .sfk-reset {
      padding: 7px 12px;
      border-radius: var(--radius-md, 0.375rem);
      border: 1px solid var(--border-weaker-base, rgba(17, 24, 39, 0.06));
      background: var(--surface-base, #ffffff);
      color: var(--text-base);
      font: inherit;
      font-size: var(--type-ui-control-size, 0.8125rem);
      line-height: var(--type-ui-control-line-height, 1.125rem);
      cursor: pointer;
      transition: background-color 120ms ease;
    }
    .sfk-reset:hover {
      background: var(--surface-hover-base, #f7f7f8);
    }

    @media (prefers-reduced-motion: reduce) {
      .sfk-toggle-track, .sfk-toggle-track::after, .sfk-reset { transition: none; }
    }
  `;
}
