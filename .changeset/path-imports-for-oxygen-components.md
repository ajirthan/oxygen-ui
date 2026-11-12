---
'@wso2/oxygen-ui': minor
---

Add path imports for Oxygen components. `@wso2/oxygen-ui/TextField`, `@wso2/oxygen-ui/Sidebar` and one path for every other Oxygen component resolve to real modules, and `SearchBarWithAdvancedFilter` has a path of its own beside `SearchBar`. A path gives the component as its default export, with its parts, its hook and its types beside it, and it is the same object the barrel import gives. For `TextField` and `Select` that is the Override, not Material UI's component. Path imports need `moduleResolution` set to `bundler`, `node16` or `nodenext`.

The package also publishes `@wso2/oxygen-ui/path-map.json`, which records for each name the path it lives on, whether it is that path's default export or a named export, and whether it is type-only. Declaration files now name their relative imports with an extension, so types resolve under `node16` and `nodenext`.
