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

import path from 'node:path';
import type {Rule} from 'eslint';
import type {ImportDeclaration, ImportSpecifier} from 'estree';
import {OXYGEN_PACKAGE, readInstalledPathMap, type PathMap} from '../pathMap.js';

interface NoDirectMuiImportsOptions {
  allowedPackages?: string[];
  suggestedPackage?: string;
}

const MUI_X_PATHS: Record<string, string> = {
  '@mui/x-data-grid': 'data-grid',
  '@mui/x-date-pickers': 'date-pickers',
  '@mui/x-tree-view': 'tree-view',
};

/** The path inside the Oxygen package that replaces a Material UI or MUI X path import. */
const oxygenSubpathFor = (source: string): string | undefined => {
  const material = /^@mui\/material\/([A-Za-z]\w*)$/.exec(source);
  if (material) return material[1];

  const muiX = /^(@mui\/x-[a-z-]+?)(?:\/(Adapter\w+))?$/.exec(source);
  const base = muiX ? MUI_X_PATHS[muiX[1]] : undefined;
  if (!muiX || !base) return undefined;
  if (muiX[2] && base !== 'date-pickers') return undefined;
  return muiX[2] ? `${base}/${muiX[2]}` : base;
};

const isPlainNamedValueImport = (node: ImportDeclaration): node is ImportDeclaration & {specifiers: ImportSpecifier[]} =>
  (node as {importKind?: string}).importKind !== 'type' &&
  node.specifiers.length > 0 &&
  node.specifiers.every(
    (specifier) =>
      specifier.type === 'ImportSpecifier' && (specifier as {importKind?: string}).importKind !== 'type',
  );

/** One import per Oxygen path for the names of `import {…} from '@mui/material'`, or undefined when a name has no path. */
const pathImportsForMaterialRoot = (
  node: ImportDeclaration,
  map: PathMap,
  suggestedPackage: string,
  quote: string,
): string | undefined => {
  if (!isPlainNamedValueImport(node)) return undefined;

  const byPath = new Map<string, {main?: string; named: string[]}>();
  for (const specifier of node.specifiers) {
    const imported = specifier.imported.type === 'Identifier' ? specifier.imported.name : String(specifier.imported.value);
    const entry = map[imported];
    if (!entry || entry.kind === 'namespace') return undefined;

    const target = suggestedPackage + entry.path.slice(OXYGEN_PACKAGE.length);
    const group = byPath.get(target) ?? {named: []};
    const local = specifier.local.name;
    if (entry.kind === 'default' && group.main === undefined) group.main = local;
    else if (entry.kind === 'default') group.named.push(`default as ${local}`);
    else group.named.push(imported === local ? imported : `${imported} as ${local}`);
    byPath.set(target, group);
  }

  return [...byPath]
    .map(([target, {main, named}]) => {
      const parts = [main, named.length > 0 ? `{${named.join(', ')}}` : undefined];
      return `import ${parts.filter(Boolean).join(', ')} from ${quote}${target}${quote};`;
    })
    .join('\n');
};

const noDirectMuiImportsRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct imports from MUI packages (@mui/*), suggest using Oxygen UI path imports instead',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          allowedPackages: {
            type: 'array',
            items: {type: 'string'},
            description: 'List of MUI packages that are allowed (e.g., @mui/x-data-grid)',
          },
          suggestedPackage: {
            type: 'string',
            description: 'The package to suggest instead of @mui/material',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noDirectMuiImport:
        "Direct imports from MUI packages are not allowed. Use '{{suggestedPackage}}' instead to import Material-UI components.",
      noDirectMuiSubpathImport:
        "Direct imports from '{{source}}' are not allowed. Use '{{suggestedPackage}}' instead.",
      noDirectMuiXImport:
        "Direct imports from '{{source}}' are not allowed. Use the Oxygen path '{{suggestedPath}}' instead.",
    },
  },
  create(context: Rule.RuleContext) {
    const options: NoDirectMuiImportsOptions = (context.options?.[0] as NoDirectMuiImportsOptions) ?? {};
    const allowedPackages: string[] = options.allowedPackages ?? [];
    const suggestedPackage: string = options.suggestedPackage ?? OXYGEN_PACKAGE;
    const lintedDirectory = path.dirname(context.filename ?? context.getFilename());

    return {
      ImportDeclaration(node: ImportDeclaration) {
        const importSource = node.source.value as string;

        if (!importSource.startsWith('@mui/')) {
          return;
        }

        if (allowedPackages.some((pkg: string) => importSource.startsWith(pkg))) {
          return;
        }

        const subpath = oxygenSubpathFor(importSource);
        const suggestedPath = subpath ? `${suggestedPackage}/${subpath}` : undefined;
        const isMuiX = importSource.startsWith('@mui/x-');
        const hasSubpath = /^@mui\/[^/]+\/.+$/.test(importSource);
        const quote = (node.source.raw ?? "'")[0];

        context.report({
          node: node.source,
          messageId: isMuiX && suggestedPath ? 'noDirectMuiXImport' : hasSubpath ? 'noDirectMuiSubpathImport' : 'noDirectMuiImport',
          data: {
            source: importSource,
            suggestedPackage: suggestedPath ?? suggestedPackage,
            suggestedPath: suggestedPath ?? suggestedPackage,
          },
          fix(fixer: Rule.RuleFixer) {
            if (suggestedPath) return fixer.replaceText(node.source, `${quote}${suggestedPath}${quote}`);

            if (importSource === '@mui/material') {
              const map = readInstalledPathMap(lintedDirectory);
              const replacement = map && pathImportsForMaterialRoot(node, map, suggestedPackage, quote);
              return replacement ? fixer.replaceText(node, replacement) : null;
            }
            return null;
          },
        });
      },
    };
  },
};

export default noDirectMuiImportsRule;
