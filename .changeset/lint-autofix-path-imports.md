---
'@wso2/eslint-plugin-oxygen-ui': minor
---

The autofix of `no-direct-mui-imports` writes Oxygen path imports where it wrote barrel imports. `@mui/material/Button` becomes `@wso2/oxygen-ui/Button`, an import from `@mui/material` becomes one path import per name using the path map of the installed `@wso2/oxygen-ui`, and the MUI X packages point at `@wso2/oxygen-ui/data-grid`, `date-pickers` and `tree-view`. Imports it cannot map are reported and left unchanged: a path the installed version does not have, a name that is not on that path, an import with a comment inside, and any import in a project whose `tsconfig.json` uses the legacy `node` module resolution. Type-only names stay type-only, and the path map is read again when the installed package changes.
