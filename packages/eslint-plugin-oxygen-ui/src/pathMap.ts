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

import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';

export interface PathMapEntry {
  path: string;
  kind: 'default' | 'named' | 'namespace';
  typeOnly: boolean;
}

export type PathMap = Record<string, PathMapEntry>;

export const OXYGEN_PACKAGE = '@wso2/oxygen-ui';

const MAP_EXPORT = './path-map.json';

const cache = new Map<string, PathMap | undefined>();

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
    const mapFile: unknown = manifest.exports?.[MAP_EXPORT];
    if (typeof mapFile !== 'string') return undefined;
    return JSON.parse(readFileSync(path.join(packageDirectory, mapFile), 'utf8'));
  } catch {
    return undefined;
  }
};

/** The name-to-path map of the Oxygen package installed next to the linted file, if it publishes one. */
export const readInstalledPathMap = (fromDirectory: string): PathMap | undefined => {
  if (!cache.has(fromDirectory)) cache.set(fromDirectory, loadPathMap(fromDirectory));
  return cache.get(fromDirectory);
};
