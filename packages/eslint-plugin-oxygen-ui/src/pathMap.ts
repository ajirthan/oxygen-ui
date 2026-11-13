/**
 * Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com).
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

import {existsSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';

export interface PathMapEntry {
  path: string;
  kind: 'default' | 'named' | 'namespace';
  typeOnly: boolean;
}

export type PathMap = Record<string, PathMapEntry>;

export const OXYGEN_PACKAGE = '@wso2/oxygen-ui';

const MAP_EXPORT = './path-map.json';

const cache = new Map<string, {modified: number; map: PathMap}>();

const findInstalledPackage = (from: string): string | undefined => {
  for (let dir = path.resolve(from); ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', OXYGEN_PACKAGE);
    if (existsSync(path.join(candidate, 'package.json'))) return candidate;
    if (path.dirname(dir) === dir) return undefined;
  }
};

const loadPathMap = (from: string): PathMap | undefined => {
  const packageDirectory = findInstalledPackage(from);
  if (!packageDirectory) return undefined;
  try {
    const manifest = JSON.parse(readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'));
    const exported: unknown = manifest.exports?.[MAP_EXPORT];
    if (typeof exported !== 'string') return undefined;
    const mapFile = path.join(packageDirectory, exported);
    const modified = statSync(mapFile).mtimeMs;
    const cached = cache.get(mapFile);
    if (cached?.modified === modified) return cached.map;
    const map: PathMap = JSON.parse(readFileSync(mapFile, 'utf8'));
    cache.set(mapFile, {modified, map});
    return map;
  } catch {
    return undefined;
  }
};

export const readInstalledPathMap = (fromDirectory: string): PathMap | undefined => loadPathMap(fromDirectory);

export const oxygenSubpathsIn = (map: PathMap): Set<string> =>
  new Set(Object.values(map).map((entry) => entry.path.slice(OXYGEN_PACKAGE.length + 1)));

const LEGACY_RESOLUTIONS = new Set(['node', 'node10', 'classic']);
const LEGACY_MODULES = new Set(['commonjs', 'amd', 'umd', 'system', 'none']);

const parseTsconfig = (file: string): {compilerOptions?: Record<string, unknown>; extends?: unknown} | undefined => {
  try {
    const text = readFileSync(file, 'utf8')
      .replace(/("(?:\\.|[^"\\])*")|\/\/.*|\/\*[\s\S]*?\*\//g, '$1')
      .replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const compilerOption = (file: string, name: string, visited = new Set<string>()): unknown => {
  if (visited.has(file)) return undefined;
  visited.add(file);
  const config = parseTsconfig(file);
  if (!config) return undefined;
  const own = config.compilerOptions?.[name];
  if (own !== undefined) return own;
  if (typeof config.extends !== 'string' || !config.extends.startsWith('.')) return undefined;
  const parent = path.resolve(path.dirname(file), config.extends);
  return compilerOption(parent.endsWith('.json') ? parent : `${parent}.json`, name, visited);
};

export const resolvesPathImports = (fromDirectory: string): boolean => {
  for (let dir = path.resolve(fromDirectory); ; dir = path.dirname(dir)) {
    const tsconfig = path.join(dir, 'tsconfig.json');
    if (existsSync(tsconfig)) {
      const resolution = compilerOption(tsconfig, 'moduleResolution');
      if (typeof resolution === 'string') return !LEGACY_RESOLUTIONS.has(resolution.toLowerCase());
      const module = compilerOption(tsconfig, 'module');
      return !(typeof module === 'string' && LEGACY_MODULES.has(module.toLowerCase()));
    }
    if (path.dirname(dir) === dir) return true;
  }
};
