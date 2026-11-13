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

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { PathMap } from './transform.js';

const PACKAGE = '@wso2/oxygen-ui';
const MAP_EXPORT = './path-map.json';

export class PathMapError extends Error {}

const findInstalledPackage = (from: string): string | undefined => {
  for (let dir = path.resolve(from); ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', PACKAGE);
    if (existsSync(path.join(candidate, 'package.json'))) return candidate;
    if (path.dirname(dir) === dir) return undefined;
  }
};

export const readInstalledPathMap = (appDirectory: string): PathMap => {
  const packageDirectory = findInstalledPackage(appDirectory);
  if (!packageDirectory) {
    throw new PathMapError(`${PACKAGE} is not installed in ${appDirectory} or a parent folder.`);
  }

  const manifest = JSON.parse(readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'));
  const mapFile: unknown = manifest.exports?.[MAP_EXPORT];
  if (typeof mapFile !== 'string' || !existsSync(path.join(packageDirectory, mapFile))) {
    throw new PathMapError(
      `${PACKAGE} ${manifest.version} has no path map, so the codemod cannot tell which path each name lives on. Upgrade to a version that publishes ${PACKAGE}/path-map.json.`,
    );
  }
  return JSON.parse(readFileSync(path.join(packageDirectory, mapFile), 'utf8'));
};
