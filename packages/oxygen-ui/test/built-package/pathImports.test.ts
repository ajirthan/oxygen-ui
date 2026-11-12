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

// @vitest-environment node

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { installBuiltPackage, type InstalledPackage } from './installBuiltPackage';

const packageRoot = fileURLToPath(new URL('../..', import.meta.url));

interface MapEntry {
  path: string;
  kind: 'default' | 'named' | 'namespace';
  typeOnly: boolean;
}

const nameToPathMap: Record<string, MapEntry> = JSON.parse(
  readFileSync(join(packageRoot, 'dist/path-map.json'), 'utf8'),
);

const componentFolders = readdirSync(join(packageRoot, 'src/components'), { withFileTypes: true })
  .filter(entry => entry.isDirectory() && existsSync(join(packageRoot, 'src/components', entry.name, 'index.ts')))
  .map(entry => entry.name);

const specifierOf = (entry: MapEntry): string => entry.path;

describe('path imports of Oxygen components', { timeout: 120_000 }, () => {
  let installed: InstalledPackage;

  // esbuild, which the bundlers load, refuses to start under Vitest's jsdom environment, so the DOM is installed here.
  // Prism's language modules read the `Prism` that its core puts on `window` as a bare global, so `window` is the global object.
  // The globals stay for the rest of the file, because Prism highlights on a timer after the tests end.
  beforeAll(() => {
    const { window } = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });

    for (const name of Object.getOwnPropertyNames(window)) {
      if (!(name in globalThis)) Object.defineProperty(globalThis, name, { value: window[name as keyof typeof window], configurable: true, writable: true });
    }
    Object.defineProperty(globalThis, 'window', { value: globalThis, configurable: true, writable: true });
    installed = installBuiltPackage();
  });

  afterAll(() => {
    installed?.remove();
  });

  it('gives the Override from the path of TextField and of Select, the same object as the barrel', async () => {
    const app = await installed.evaluate(`
      import { TextField, Select } from '@wso2/oxygen-ui';
      import PathTextField from '@wso2/oxygen-ui/TextField';
      import PathSelect from '@wso2/oxygen-ui/Select';
      import { TextField as MaterialTextField } from '@mui/material';
      export { TextField, Select, PathTextField, PathSelect, MaterialTextField };
    `);

    expect(app.PathTextField).toBe(app.TextField);
    expect(app.PathSelect).toBe(app.Select);
    expect(app.PathTextField).not.toBe(app.MaterialTextField);
  });

  it('has a path for every Oxygen component folder, and one for SearchBarWithAdvancedFilter', () => {
    const publishedPaths = Object.values(nameToPathMap).map(entry => entry.path.replace('@wso2/oxygen-ui/', ''));

    expect([...new Set(publishedPaths)].sort()).toEqual([...componentFolders, 'SearchBarWithAdvancedFilter'].sort());
  });

  it('gives every name in the map as the same object from its path as from the barrel', async () => {
    const valueNames = Object.keys(nameToPathMap).filter(name => !nameToPathMap[name].typeOnly);
    const paths = [...new Set(valueNames.map(name => specifierOf(nameToPathMap[name])))];
    const importOfPath = (path: string) => `path_${paths.indexOf(path)}`;

    const app = await installed.evaluate(`
      import * as barrel from '@wso2/oxygen-ui';
      ${paths.map(path => `import * as ${importOfPath(path)} from '${path}';`).join('\n')}
      export const pairs = [
        ${valueNames
          .map(name => {
            const entry = nameToPathMap[name];
            const fromPath = entry.kind === 'default' ? `${importOfPath(entry.path)}.default` : `${importOfPath(entry.path)}.${name}`;
            return `['${name}', barrel.${name}, ${fromPath}]`;
          })
          .join(',\n')}
      ];
    `);

    const pairs = app.pairs as [string, unknown, unknown][];

    expect(pairs.length).toBe(valueNames.length);
    for (const [name, fromBarrel, fromPath] of pairs) {
      expect(fromBarrel, `${name} from its path`).toBeDefined();
      expect(fromPath, `${name} from its path`).toBe(fromBarrel);
    }
  });

  it('gives every path a default export', async () => {
    const pathNames = [...componentFolders, 'SearchBarWithAdvancedFilter'];
    const app = await installed.evaluate(`
      ${pathNames.map((name, index) => `import d${index} from '@wso2/oxygen-ui/${name}';`).join('\n')}
      export const defaults = {${pathNames.map((name, index) => `${name}: d${index}`).join(', ')}};
    `);

    const missing = Object.entries(app.defaults as Record<string, unknown>).filter(([, value]) => value === undefined);

    expect(missing.map(([name]) => name)).toEqual([]);
  });

  describe.each(['bundler', 'node16', 'nodenext'] as const)('type declarations under moduleResolution %s', moduleResolution => {
    it('resolve to a typed default export for every path', () => {
      const pathNames = [...componentFolders, 'SearchBarWithAdvancedFilter'];
      const source = `
        type IsAny<T> = 0 extends 1 & T ? true : false;
        ${pathNames.map((name, index) => `import d${index} from '@wso2/oxygen-ui/${name}';\nconst notAny${index}: IsAny<typeof d${index}> = false;`).join('\n')}
        export { ${pathNames.map((_, index) => `notAny${index}`).join(', ')} };
      `;

      expect(installed.typeCheck(source, moduleResolution)).toEqual([]);
    });
  });
});
