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

import ts from 'typescript';

export const BARREL = '@wso2/oxygen-ui';

export interface PathMapEntry {
  path: string;
  kind: 'default' | 'named' | 'namespace';
  typeOnly: boolean;
}

export type PathMap = Record<string, PathMapEntry>;

export type RemainingReason =
  | 'unknown-name'
  | 'unsupported-import'
  | 'unsupported-export'
  | 'dynamic-import'
  | 'require';

export interface Report {
  line: number;
  reason: RemainingReason;
  message: string;
}

export interface TransformResult {
  source: string;
  reports: Report[];
}

interface Edit {
  start: number;
  end: number;
  text: string;
}

interface Remaining {
  position: number;
  reason: RemainingReason;
  message: string;
}

const isBarrelLiteral = (node: ts.Node | undefined): boolean =>
  node !== undefined && ts.isStringLiteralLike(node) && node.text === BARREL;

const rewriteImport = (
  statement: ts.ImportDeclaration,
  source: string,
  map: PathMap,
): { text: string } | { remaining: Omit<Remaining, 'position'> } => {
  const clause = statement.importClause;
  const bindings = clause?.namedBindings;
  if (!clause || clause.isTypeOnly || clause.name || !bindings || !ts.isNamedImports(bindings)) {
    return {
      remaining: {
        reason: 'unsupported-import',
        message: 'This barrel import is not a plain named import of values.',
      },
    };
  }

  const byPath = new Map<string, { main?: string; named: string[] }>();
  for (const specifier of bindings.elements) {
    const name = specifier.name.text;
    const entry = map[name];
    if (specifier.isTypeOnly || specifier.propertyName || entry?.kind === 'namespace') {
      return {
        remaining: {
          reason: 'unsupported-import',
          message: `The import of ${name} is a type-only import, a rename or a namespace.`,
        },
      };
    }
    if (!entry) {
      return {
        remaining: {
          reason: 'unknown-name',
          message: `${name} is not in the path map of the installed @wso2/oxygen-ui.`,
        },
      };
    }
    const group = byPath.get(entry.path) ?? { named: [] };
    if (entry.kind === 'default') group.main = name;
    else group.named.push(name);
    byPath.set(entry.path, group);
  }

  const quote = source[statement.moduleSpecifier.getStart()];
  const semicolon = source[statement.getEnd() - 1] === ';' ? ';' : '';
  const lineStart = source.lastIndexOf('\n', statement.getStart() - 1) + 1;
  const indent = source.slice(lineStart, statement.getStart());

  const lines = [...byPath].map(([path, { main, named }]) => {
    const parts = [main, named.length > 0 ? `{ ${named.join(', ')} }` : undefined];
    return `import ${parts.filter(Boolean).join(', ')} from ${quote}${path}${quote}${semicolon}`;
  });
  return { text: lines.join(`\n${indent}`) };
};

const collectBarrelUses = (file: ts.SourceFile, source: string, map: PathMap) => {
  const edits: Edit[] = [];
  const remaining: Remaining[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && isBarrelLiteral(node.moduleSpecifier)) {
      const result = rewriteImport(node, source, map);
      if ('text' in result) {
        edits.push({ start: node.getStart(), end: node.getEnd(), text: result.text });
      } else {
        remaining.push({ position: node.getStart(), ...result.remaining });
      }
      return;
    }
    if (ts.isExportDeclaration(node) && isBarrelLiteral(node.moduleSpecifier)) {
      remaining.push({
        position: node.getStart(),
        reason: 'unsupported-export',
        message: 'This barrel re-export is not rewritten.',
      });
      return;
    }
    if (ts.isCallExpression(node) && isBarrelLiteral(node.arguments[0])) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        remaining.push({
          position: node.getStart(),
          reason: 'dynamic-import',
          message: 'A dynamic import of the barrel is not rewritten.',
        });
      } else if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
        remaining.push({
          position: node.getStart(),
          reason: 'require',
          message: 'A require of the barrel is not rewritten.',
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return { edits, remaining };
};

const applyEdits = (source: string, edits: Edit[]): string => {
  let result = '';
  let cursor = 0;
  for (const edit of edits) {
    result += source.slice(cursor, edit.start) + edit.text;
    cursor = edit.end;
  }
  return result + source.slice(cursor);
};

const positionAfterEdits = (position: number, edits: Edit[]): number =>
  edits
    .filter((edit) => edit.end <= position)
    .reduce((shifted, edit) => shifted + edit.text.length - (edit.end - edit.start), position);

const lineOf = (text: string, position: number): number => {
  let line = 1;
  for (let index = 0; index < position; index++) if (text[index] === '\n') line++;
  return line;
};

export const transformPathImports = (source: string, map: PathMap): TransformResult => {
  if (!source.includes(BARREL)) return { source, reports: [] };

  const file = ts.createSourceFile('input.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const { edits, remaining } = collectBarrelUses(file, source, map);

  if (remaining.some((use) => use.reason === 'unknown-name')) {
    return { source, reports: remaining.map((use) => toReport(source, use.position, use)) };
  }

  const output = applyEdits(source, edits);
  const reports = remaining.map((use) =>
    toReport(output, positionAfterEdits(use.position, edits), use),
  );
  return { source: output, reports };
};

const toReport = (text: string, position: number, use: Remaining): Report => ({
  line: lineOf(text, position),
  reason: use.reason,
  message: use.message,
});

export const findBarrelImports = (source: string, map: PathMap): number[] => {
  if (!source.includes(BARREL)) return [];
  const file = ts.createSourceFile('input.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const { edits, remaining } = collectBarrelUses(file, source, map);
  return [...edits.map((edit) => edit.start), ...remaining.map((use) => use.position)]
    .sort((a, b) => a - b)
    .map((position) => lineOf(source, position));
};
