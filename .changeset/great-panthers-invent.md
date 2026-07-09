---
'@wso2/oxygen-ui-cli': minor
---

Introduce `@wso2/oxygen-ui-cli`, a command line interface for the Oxygen UI design system (wso2/oxygen-ui#214):

- `create <app-name>` - scaffold a new Vite + React + TypeScript app with Oxygen UI preconfigured
- `init` - set up Oxygen UI in an existing React app (installs dependencies, wires `OxygenUIThemeProvider` into the entry file, optional charts/ESLint plugin/AI docs)
- `add <template>` - generate ready-made pages (login, dashboard, wizard, empty-state, form, tabbed-content)
- `theme <name>` - scaffold a custom theme based on `createOxygenTheme`, optionally extending a preset theme
- `doctor` - diagnose setup issues (version alignment, peer ranges, duplicate MUI/Emotion copies, provider wiring, direct `@mui/*`/`lucide-react` imports)
- `ai init` / `ai update` - copy AI assistant documentation from the installed `@wso2/oxygen-ui` package
