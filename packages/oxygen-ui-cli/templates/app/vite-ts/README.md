# {{appName}}

A [Vite](https://vite.dev) + React + TypeScript app scaffolded with
[`@wso2/oxygen-ui-cli`](https://github.com/wso2/oxygen-ui), preconfigured with the
[WSO2 Oxygen UI](https://github.com/wso2/oxygen-ui) design system.

## Getting started

```bash
npm install
npm run dev
```

## What's included

- `@wso2/oxygen-ui` - the Oxygen UI component library (Material UI v7 + WSO2 components)
- `@wso2/oxygen-ui-icons-react` - Lucide-based icon library
- `OxygenUIThemeProvider` wired up in `src/main.tsx` with all preset themes and a
  theme switcher + light/dark toggle in the app header

## Useful commands

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start the dev server           |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview the production build   |
| `npm run lint`    | Lint the sources               |

## Next steps

- Add ready-made pages: `npx @wso2/oxygen-ui-cli add login` (also: dashboard, wizard, ...)
- Generate a custom theme: `npx @wso2/oxygen-ui-cli theme brand`
- Check your setup: `npx @wso2/oxygen-ui-cli doctor`
