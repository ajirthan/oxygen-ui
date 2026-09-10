# Oxygen UI

The published React design system consumers import. Storybook teaches that import, not MUI’s.

## Language

**Import contract**:
The package path a product app is supposed to write. An Oxygen story’s live import is this path.
_Avoid_: visual catalog, demo-only import, “just Storybook”

**Oxygen story**:
A Storybook file whose live imports use the Import contract. HowToContribute snippets that mention `@mui/material` inside code strings are not Oxygen stories.
_Avoid_: MUI story, visual-only demo

**MUI X surface**:
Data Grid, Date Pickers, or Tree View as MUI publishes them. Not an Oxygen wrapper unless Oxygen wraps it (`ListingTable.DataGrid` is a wrapper; a barrel re-export is not).
_Avoid_: Oxygen DataGrid, Oxygen DatePicker, Oxygen TreeView

**Published entry**:
The main `@wso2/oxygen-ui` import every `Table` / `Button` consumer evaluates.
_Avoid_: barrel (except when talking to the bundler)

**Oxygen subpath**:
A published `@wso2/oxygen-ui/<name>` entry that is not the Published entry. A consumer opts in; `Table` / `Button` do not evaluate it. The MUI X surfaces are `data-grid`, `date-pickers`, and `tree-view`. Date adapters are their own subpaths under `date-pickers/` (for example `date-pickers/AdapterDateFns`).
_Avoid_: MUI import, barrel re-export, `DataGrid` namespace
