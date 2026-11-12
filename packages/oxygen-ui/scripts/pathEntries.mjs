/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import ts from 'typescript';

const packageName = '@wso2/oxygen-ui';
const sourceRoot = path.resolve('src');
const componentsRoot = path.join(sourceRoot, 'components');
const publishedFolder = 'paths';
const materialPackage = '@mui/material';

/** Components that live inside another component's folder but are public in their own right. */
const componentsBesideTheirFolder = ['SearchBar/SearchBarWithAdvancedFilter'];

/** `version` is the Oxygen version on the barrel, not Material UI's, and `esm` is Material UI's build output, not a path. */
const materialFoldersWithoutAMaterialPath = ['version', 'esm'];

/** What Oxygen adds to the Material UI path of the same name: where it is defined, and the names. */
const oxygenAdditionsToMaterialPaths = {
  styles: [
    { moduleId: 'utils/createOxygenTheme', names: ['createOxygenTheme'] },
    { moduleId: 'utils/pxToRem', names: ['pxToRem'] },
    { moduleId: 'styles/index', names: ['OxygenThemeType'] },
  ],
  utils: [{ moduleId: 'utils/formatRelativeTime', names: ['formatRelativeTime'] }],
};

/**
 * Names the Material UI root exports and no Material UI path does. They come from the root, because
 * the copy of `@mui/utils` that Material UI uses may not be the copy this package resolves.
 */
const materialRootNamesOnTheUtilsPath = ['unstable_composeClasses'];

/** Barrel names that are a Material UI module as a namespace, not a name Material UI exports. */
const materialNamespacesOnTheBarrel = ['colors'];

const sourceFileOf = moduleId => {
  const file = ['.ts', '.tsx'].map(extension => path.join(sourceRoot, moduleId + extension)).find(existsSync);

  if (!file) throw new Error(`No source file for the module ${moduleId}.`);

  return file;
};

/**
 * One path per Oxygen component folder, named after the folder, so a new component gets its path
 * when its folder appears. A path is the folder's index, so it carries everything the index exports.
 */
function describeComponentPaths() {
  const folders = readdirSync(componentsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && existsSync(path.join(componentsRoot, entry.name, 'index.ts')))
    .map(entry => ({ name: entry.name, moduleId: `components/${entry.name}/index` }));
  const beside = componentsBesideTheirFolder.map(moduleId => ({
    name: path.basename(moduleId),
    moduleId: `components/${moduleId}`,
  }));

  return [...folders, ...beside].map(component => ({ ...component, source: sourceFileOf(component.moduleId) }));
}

/** One path per Material UI path that has an index, discovered from the installed Material UI. */
function describeMaterialPaths(componentPaths) {
  const materialRoot = path.dirname(createRequire(import.meta.url).resolve(`${materialPackage}/package.json`));
  const oxygenNames = new Set(componentPaths.map(component => component.name));

  return readdirSync(materialRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && existsSync(path.join(materialRoot, entry.name, 'index.d.ts')))
    .map(entry => entry.name)
    .filter(name => !materialFoldersWithoutAMaterialPath.includes(name))
    .map(name => ({ name, specifier: `${materialPackage}/${name}`, replacedByOxygen: oxygenNames.has(name) }));
}

function openProgram(rootFiles, barrelModule) {
  const config = ts.getParsedCommandLineOfConfigFile('tsconfig.json', {}, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: diagnostic => {
      throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
    },
  });
  const resolveSpecifier = specifier => {
    const { resolvedModule } = ts.resolveModuleName(specifier, barrelModule, config.options, ts.sys);

    if (!resolvedModule) throw new Error(`${specifier} does not resolve from the barrel.`);

    return resolvedModule.resolvedFileName;
  };
  const sourceOf = fileOrSpecifier => (path.isAbsolute(fileOrSpecifier) ? fileOrSpecifier : resolveSpecifier(fileOrSpecifier));
  const program = ts.createProgram(rootFiles.map(sourceOf), config.options);
  const checker = program.getTypeChecker();
  const moduleSymbol = file => checker.getSymbolAtLocation(program.getSourceFile(sourceOf(file)));

  /** The first path segment of every relative module that a file re-exports from. */
  const reexportedFolders = file =>
    new Set(
      program
        .getSourceFile(sourceOf(file))
        .statements.filter(statement => ts.isExportDeclaration(statement) && statement.moduleSpecifier)
        .map(statement => statement.moduleSpecifier.text.match(/^\.\/([^/]+)/)?.[1])
        .filter(Boolean),
    );

  return {
    moduleSymbol,
    reexportedFolders,
    exportsOf: file => checker.getExportsOfModule(moduleSymbol(file)),
    resolve: symbol => (symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol),
  };
}

const shareDeclaration = (a, b) => a.declarations?.some(declaration => b.declarations?.includes(declaration)) ?? false;

const isTypeOnly = target => !(target.flags & ts.SymbolFlags.Value);

/**
 * An export clause is one line of a path entry. A name that only exists as a type is left out of the
 * JavaScript entry, and written with `type` in the declaration entry.
 */
const renderEntry = (clauses, { declaration }) =>
  clauses
    .flatMap(({ from, star, defaultAs, names = [] }) => {
      const lines = [];

      if (star) lines.push(`export * from '${from}';`);
      if (defaultAs === 'default') lines.push(`export { default } from '${from}';`);
      else if (defaultAs) lines.push(`export { ${defaultAs} as default } from '${from}';`);

      const values = names.filter(name => !name.typeOnly).map(name => name.name);
      const types = names.filter(name => name.typeOnly).map(name => name.name);

      if (values.length) lines.push(`export { ${values.join(', ')} } from '${from}';`);
      if (declaration && types.length) lines.push(`export type { ${types.join(', ')} } from '${from}';`);

      return lines;
    })
    .join('\n') + '\n';

/** A path has the component as its default export: the index's own default, or else the name equal to the folder. */
function defaultExportOf(component, exportNames) {
  if (exportNames.has('default')) return 'default';
  if (exportNames.has(component.name)) return component.name;

  throw new Error(`${component.name} exports neither a default nor a name equal to its folder.`);
}

function describeNameToPathMap(published, barrelNames, { resolve, moduleSymbol, reexportedFolders }) {
  const foldersOfTheMaterialRoot = reexportedFolders(materialPackage);
  const candidates = published.map(entry => ({
    ...entry,
    targets: new Set(entry.exports.values()),
    moduleTarget: entry.module && moduleSymbol(entry.module),
  }));
  const map = {};
  const withoutPath = [];

  for (const barrelName of barrelNames) {
    const name = barrelName.name;
    const target = resolve(barrelName);
    const namespaceOwner = candidates.find(candidate => candidate.moduleTarget === target);
    const exporters = candidates.filter(candidate => candidate.targets.has(target));
    // Material UI's own module augmentation can make two symbols of one interface, so a type is also found by its declarations.
    const exportersOfTheSameDeclarations = () =>
      candidates.filter(candidate => [...candidate.targets].some(other => shareDeclaration(other, target)));
    const found = exporters.length || !isTypeOnly(target) ? exporters : exportersOfTheSameDeclarations();
    // Material UI can export one name from two modules, and its root re-exports only one of them.
    const owner =
      namespaceOwner ??
      found.find(candidate => candidate.name === name) ??
      found.find(candidate => foldersOfTheMaterialRoot.has(candidate.name)) ??
      found[0];

    if (!owner) {
      withoutPath.push(name);
      continue;
    }

    const isDefault =
      owner.exports.get('default') === target && (owner.name === name || owner.exports.get(name) !== target);

    map[name] = {
      path: `${packageName}/${owner.name}`,
      kind: namespaceOwner ? 'namespace' : isDefault ? 'default' : 'named',
      typeOnly: isTypeOnly(target),
    };
  }

  if (withoutPath.length) throw new Error(`On the barrel, and on no path: ${withoutPath.join(', ')}.`);

  return Object.fromEntries(Object.entries(map).sort(([a], [b]) => (a < b ? -1 : 1)));
}

export function describePathEntries() {
  const barrelModule = path.join(sourceRoot, 'index.ts');
  const componentsBarrel = path.join(componentsRoot, 'index.ts');
  const components = describeComponentPaths();
  const materials = describeMaterialPaths(components);
  const additionModules = Object.values(oxygenAdditionsToMaterialPaths).flat().map(({ moduleId }) => sourceFileOf(moduleId));
  const program = openProgram(
    [
      barrelModule,
      ...components.map(component => component.source),
      ...materials.map(material => material.specifier),
      materialPackage,
      `${materialPackage}/version`,
      ...additionModules,
    ],
    barrelModule,
  );
  const { exportsOf, resolve } = program;
  const exportsByName = file => new Map(exportsOf(file).map(symbol => [symbol.name, resolve(symbol)]));
  const componentBarrelNames = new Set(exportsOf(componentsBarrel).map(symbol => symbol.name));
  const materialByName = new Map(materials.map(material => [material.name, material]));

  const oxygenPaths = components.map(component => {
    const exports = exportsByName(component.source);
    const clauses = [{ from: `../${component.moduleId}.js`, star: true, defaultAs: defaultExportOf(component, exports) }];
    const material = materialByName.get(component.name);

    if (material) {
      // The Override replaces these Material UI names on the barrel, so they stay with the Override.
      const materialExports = exportsByName(material.specifier);
      const extras = [...materialExports]
        .filter(([name]) => name !== 'default' && !exports.has(name) && !componentBarrelNames.has(name))
        .map(([name, target]) => ({ name, typeOnly: isTypeOnly(target) }));

      clauses.push({ from: material.specifier, names: extras });
      for (const extra of extras) exports.set(extra.name, materialExports.get(extra.name));
    }

    return { name: component.name, clauses, exports };
  });

  const materialPaths = materials
    .filter(material => !material.replacedByOxygen)
    .map(material => {
      const exports = exportsByName(material.specifier);
      const clauses = [{ from: material.specifier, star: true, defaultAs: exports.has('default') ? 'default' : null }];

      for (const { moduleId, names } of oxygenAdditionsToMaterialPaths[material.name] ?? []) {
        const source = sourceFileOf(moduleId);
        const sourceExports = exportsByName(source);
        const added = names.map(name => ({ name, typeOnly: isTypeOnly(sourceExports.get(name)) }));

        clauses.push({ from: `../${moduleId}.js`, names: added });
        for (const { name } of added) exports.set(name, sourceExports.get(name));
      }

      if (material.name === 'utils') {
        const rootExports = exportsByName(materialPackage);

        clauses.push({
          from: materialPackage,
          names: materialRootNamesOnTheUtilsPath.map(name => ({ name, typeOnly: isTypeOnly(rootExports.get(name)) })),
        });
        for (const name of materialRootNamesOnTheUtilsPath) exports.set(name, rootExports.get(name));
      }

      return { name: material.name, clauses, exports, module: material.specifier };
    });

  const published = [...oxygenPaths, ...materialPaths];
  const barrelExports = exportsOf(barrelModule);
  const mapped = new Set([
    ...componentBarrelNames,
    ...exportsOf(materialPackage).map(symbol => symbol.name),
    ...materialNamespacesOnTheBarrel,
  ]);

  for (const name of [...materialFoldersWithoutAMaterialPath, ...exportsOf(`${materialPackage}/version`).map(symbol => symbol.name)]) {
    mapped.delete(name);
  }

  return {
    sources: components.map(component => component.source),
    paths: published.map(entry => ({
      name: entry.name,
      javascript: renderEntry(entry.clauses, { declaration: false }),
      declaration: renderEntry(entry.clauses, { declaration: true }),
    })),
    nameToPathMap: describeNameToPathMap(
      published,
      barrelExports.filter(symbol => mapped.has(symbol.name)),
      program,
    ),
  };
}

export function writePathEntries({ paths, nameToPathMap }) {
  const distribution = path.resolve('dist');
  const folder = path.join(distribution, publishedFolder);

  mkdirSync(folder, { recursive: true });

  for (const entry of paths) {
    writeFileSync(path.join(folder, `${entry.name}.js`), entry.javascript);
    writeFileSync(path.join(folder, `${entry.name}.d.ts`), entry.declaration);
  }

  writeFileSync(path.join(distribution, 'path-map.json'), `${JSON.stringify(nameToPathMap, null, 2)}\n`);
}
