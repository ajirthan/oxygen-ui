# @wso2/oxygen-ui-cli

Command line interface for the [WSO2 Oxygen UI](https://github.com/wso2/oxygen-ui) design system.
Scaffold apps, wire up theming, generate pages and themes, and diagnose setup issues.

```bash
npx @wso2/oxygen-ui-cli <command>
```

## Commands

| Command             | Description                                                        |
| ------------------- | ------------------------------------------------------------------ |
| `create <app-name>` | Scaffold a new Vite + React + TypeScript app with Oxygen UI        |
| `init`              | Set up Oxygen UI in an existing React app                          |
| `add [template]`    | Add a ready-made page template to your project                     |
| `theme <name>`      | Generate a custom theme scaffold based on `createOxygenTheme`      |
| `doctor`            | Diagnose common Oxygen UI setup issues                             |
| `ai init` / `ai update` | Set up / refresh AI assistant documentation                    |

## `create` - scaffold a new app

```bash
npx @wso2/oxygen-ui-cli create my-app
cd my-app
npm run dev
```

Generates a Vite + React + TypeScript app with:

- `@wso2/oxygen-ui` and `@wso2/oxygen-ui-icons-react` preinstalled
- `OxygenUIThemeProvider` wired up in `src/main.tsx` with all preset themes
- A starter page with a theme switcher and light/dark toggle
- ESLint (flat config) and strict TypeScript settings

Options:

- `--pm <package-manager>` - use a specific package manager (`pnpm`, `yarn`, `npm`, `bun`)
- `--no-install` - skip installing dependencies

## `init` - set up an existing app

```bash
npx @wso2/oxygen-ui-cli init
```

- Detects your package manager (lockfile-based) and installs `@wso2/oxygen-ui` +
  `@wso2/oxygen-ui-icons-react`
- Wraps your app entry (`src/main.tsx` / `src/index.tsx`) with `OxygenUIThemeProvider`,
  or prints a ready-to-paste snippet when the entry file has an unusual shape
- Optionally includes `@wso2/oxygen-ui-charts-react`, the
  `@wso2/eslint-plugin-oxygen-ui` ESLint plugin, and AI assistant documentation

Options:

- `--charts` - include `@wso2/oxygen-ui-charts-react`
- `--eslint` - add `@wso2/eslint-plugin-oxygen-ui` as a dev dependency
- `--ai` / `--claude` - set up AI assistant documentation (universal / Claude Code)
- `--pm <package-manager>` - use a specific package manager
- `--no-install` - skip installing dependencies (prints the commands instead)
- `-y, --yes` - skip prompts and use defaults

## `add` - page templates

```bash
npx @wso2/oxygen-ui-cli add login
npx @wso2/oxygen-ui-cli add list   # list available templates
```

Writes a self-contained page component (imports only from `@wso2/oxygen-ui` and
`@wso2/oxygen-ui-icons-react`) to `src/pages/`:

| Template         | Component              | Description                                          |
| ---------------- | ---------------------- | ---------------------------------------------------- |
| `login`          | `LoginPage`            | Split-screen login with social sign-in               |
| `dashboard`      | `DashboardPage`        | Stat cards, recent activity, quick actions           |
| `wizard`         | `WizardPage`           | Multi-step wizard built with `Form.Wizard`           |
| `empty-state`    | `EmptyStatePage`       | Empty state placeholder with call to action          |
| `form`           | `RegistrationFormPage` | Registration form with client-side validation        |
| `tabbed-content` | `TabbedContentPage`    | Tabbed content layout using MUI Tabs                 |

Options: `--dir <dir>` (default `src/pages`), `--force`.

## `theme` - custom theme scaffold

```bash
npx @wso2/oxygen-ui-cli theme brand
npx @wso2/oxygen-ui-cli theme brand --base AcrylicOrangeTheme
```

Generates `src/themes/BrandTheme.ts` using `createOxygenTheme` with light/dark
palette placeholders, and prints the `OxygenUIThemeProvider` registration snippet.
`--base` accepts any preset theme (`OxygenTheme`, `AcrylicOrangeTheme`,
`AcrylicPurpleTheme`, `ClassicTheme`, `HighContrastTheme`, `PaleBaseTheme`,
`PaleGrayTheme`, `PaleIndigoTheme`, `WSO2Theme`).

Options: `--dir <dir>` (default `src/themes`), `--force`.

## `doctor` - setup diagnostics

```bash
npx @wso2/oxygen-ui-cli doctor
```

Checks:

- Node.js version
- `@wso2/oxygen-ui*` packages are installed and version-aligned
- `react` / `react-dom` against the library's peer ranges
- Duplicate `@mui/material` / `@emotion/*` copies in node_modules
- `OxygenUIThemeProvider` present in the app entry file
- Direct `@mui/*` / `lucide-react` imports (should go through Oxygen UI packages)

Use `--strict` to exit non-zero on warnings (useful in CI).

## `ai` - AI assistant documentation

```bash
npx @wso2/oxygen-ui-cli ai init            # interactive (universal or Claude Code)
npx @wso2/oxygen-ui-cli ai init --claude   # Claude Code mode
npx @wso2/oxygen-ui-cli ai update          # refresh after upgrading @wso2/oxygen-ui
```

Copies the AI documentation shipped inside the **installed** `@wso2/oxygen-ui`
package into your project (`.ai/oxygen-ui/` + `AGENTS.md`, or `.claude/` with
skills for Claude Code), so the docs always match the library version you use.
Equivalent to the `npx @wso2/oxygen-ui init|update` command shipped with the
main package.

## License

Apache-2.0 © WSO2 LLC
