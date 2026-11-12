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
import path from 'node:path';
import ts from 'typescript';

const packageName = '@wso2/oxygen-ui';
const sourceRoot = path.resolve('src');
const componentsRoot = path.join(sourceRoot, 'components');
const publishedFolder = 'paths';

/** Components that live inside another component's folder but are public in their own right. */
const componentsBesideTheirFolder = ['SearchBar/SearchBarWithAdvancedFilter'];

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

const resolveAlias = (checker, symbol) =>
  symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;

function openProgram(rootFiles) {
  const config = ts.getParsedCommandLineOfConfigFile('tsconfig.json', {}, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: diagnostic => {
      throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
    },
  });
  const program = ts.createProgram(rootFiles, config.options);
  const checker = program.getTypeChecker();

  return {
    exportsOf: file => checker.getExportsOfModule(checker.getSymbolAtLocation(program.getSourceFile(file))),
    resolve: symbol => (symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol),
  };
}

/** A path has the component as its default export: the index's own default, or else the name equal to the folder. */
function defaultExportClause(component, exportNames) {
  if (exportNames.has('default')) return 'export { default } from';
  if (exportNames.has(component.name)) return `export { ${component.name} as default } from`;

  throw new Error(`${component.name} exports neither a default nor a name equal to its folder.`);
}

function describeNameToPathMap(pathExports, barrelNames, resolve) {
  const map = {};

  for (const barrelName of barrelNames) {
    const name = barrelName.name;
    const target = resolve(barrelName);
    const exporters = pathExports.filter(candidate => [...candidate.exports.values()].includes(target));
    const owner = exporters.find(candidate => candidate.name === name) ?? exporters[0];

    if (!owner) throw new Error(`${name} is exported by the components barrel, and no component path exports it.`);

    const isDefault =
      owner.exports.get('default') === target && (owner.name === name || owner.exports.get(name) !== target);

    map[name] = {
      path: `${packageName}/${owner.name}`,
      kind: isDefault ? 'default' : 'named',
      typeOnly: !(target.flags & ts.SymbolFlags.Value),
    };
  }

  return Object.fromEntries(Object.entries(map).sort(([a], [b]) => (a < b ? -1 : 1)));
}

export function describePathEntries() {
  const barrelModule = path.join(componentsRoot, 'index.ts');
  const components = describeComponentPaths();
  const { exportsOf, resolve } = openProgram([barrelModule, ...components.map(component => component.source)]);

  const paths = components.map(component => {
    const exports = new Map(exportsOf(component.source).map(symbol => [symbol.name, resolve(symbol)]));

    return { ...component, exports, defaultExport: defaultExportClause(component, exports) };
  });

  return {
    sources: components.map(component => component.source),
    paths,
    nameToPathMap: describeNameToPathMap(paths, exportsOf(barrelModule), resolve),
  };
}

export function writePathEntries({ paths, nameToPathMap }, distribution = path.resolve('dist')) {
  const folder = path.join(distribution, publishedFolder);

  mkdirSync(folder, { recursive: true });

  for (const entry of paths) {
    const target = `../${entry.moduleId}.js`;
    const code = `export * from '${target}';\n${entry.defaultExport} '${target}';\n`;

    writeFileSync(path.join(folder, `${entry.name}.js`), code);
    writeFileSync(path.join(folder, `${entry.name}.d.ts`), code);
  }

  writeFileSync(path.join(distribution, 'path-map.json'), `${JSON.stringify(nameToPathMap, null, 2)}\n`);
}
