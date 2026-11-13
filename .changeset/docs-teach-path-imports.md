---
'@wso2/oxygen-ui': minor
---

The README, the AI docs and the Claude skills shipped in the package now teach path imports, such as `import Button from '@wso2/oxygen-ui/Button'`, and say that the barrel import is still supported. They explain that path imports need `moduleResolution` set to `bundler`, `node16` or `nodenext`, list the lower-case `data-grid`, `date-pickers` and `tree-view` paths, and describe `npx @wso2/oxygen-ui-codemod path-imports` and its `--check` mode. Run `npx @wso2/oxygen-ui update` to refresh the copies in your project. Examples that named exports the package does not have, such as `OxygenThemeBase`, `OxygenThemeWithRadialBackground`, `Charts`, `useHeader` and `useNotificationPanel`, are corrected.
