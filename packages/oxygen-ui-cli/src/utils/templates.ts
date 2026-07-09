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

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readPackageJson } from './project'

const CLI_PACKAGE_NAME = '@wso2/oxygen-ui-cli'

/**
 * Root directory of the installed @wso2/oxygen-ui-cli package. Resolved by
 * walking up from this module, which works both for the bundled dist/ output
 * and for the TypeScript sources (tests).
 */
export function getPackageRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url))
  for (;;) {
    if (readPackageJson(dir)?.name === CLI_PACKAGE_NAME) return dir
    const parent = dirname(dir)
    if (parent === dir) {
      throw new Error(`Unable to locate the ${CLI_PACKAGE_NAME} package root`)
    }
    dir = parent
  }
}

export function getTemplatesDir(): string {
  return join(getPackageRoot(), 'templates')
}

export function getCliVersion(): string {
  return readPackageJson(getPackageRoot())?.version ?? '0.0.0'
}

/**
 * Replace `{{key}}` placeholders with values from `vars`. Unknown keys are
 * left untouched, so regular JSX double braces are never mangled.
 */
export function renderTemplate(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key: string) => vars[key] ?? match)
}

/**
 * Files that are renamed while copying. `_gitignore` is used in the template
 * because npm excludes `.gitignore` files from published packages.
 */
const RENAMED_FILES: Record<string, string> = {
  _gitignore: '.gitignore',
}

/**
 * Recursively copy a template directory to `targetDir`, applying `{{var}}`
 * substitution to every file and renaming special files. Returns the list of
 * written files (paths relative to `targetDir`).
 */
export function copyTemplateDir(
  sourceDir: string,
  targetDir: string,
  vars: Record<string, string> = {}
): string[] {
  const written: string[] = []

  const copyRecursive = (source: string, target: string) => {
    mkdirSync(target, { recursive: true })
    for (const entry of readdirSync(source)) {
      const sourcePath = join(source, entry)
      const targetName = RENAMED_FILES[entry] ?? entry
      const targetPath = join(target, targetName)
      if (statSync(sourcePath).isDirectory()) {
        copyRecursive(sourcePath, targetPath)
      } else {
        const content = readFileSync(sourcePath, 'utf-8')
        writeFileSync(targetPath, renderTemplate(content, vars))
        written.push(relative(targetDir, targetPath))
      }
    }
  }

  copyRecursive(sourceDir, targetDir)
  return written.sort()
}

/**
 * Copy every file with one of the given extensions from `sourceDir` into
 * `targetDir` (non-recursive). Returns the number of files copied.
 */
export function copyFilesByExtension(
  sourceDir: string,
  targetDir: string,
  extensions: string[]
): number {
  if (!existsSync(sourceDir)) return 0
  mkdirSync(targetDir, { recursive: true })
  let copied = 0
  for (const entry of readdirSync(sourceDir)) {
    const sourcePath = join(sourceDir, entry)
    if (!statSync(sourcePath).isFile()) continue
    if (!extensions.some(ext => entry.endsWith(ext))) continue
    copyFileSync(sourcePath, join(targetDir, entry))
    copied++
  }
  return copied
}

/**
 * Recursively copy a directory as-is (no substitution). Returns the number
 * of files copied.
 */
export function copyDirRecursive(sourceDir: string, targetDir: string): number {
  if (!existsSync(sourceDir)) return 0
  mkdirSync(targetDir, { recursive: true })
  let copied = 0
  for (const entry of readdirSync(sourceDir)) {
    const sourcePath = join(sourceDir, entry)
    const targetPath = join(targetDir, entry)
    if (statSync(sourcePath).isDirectory()) {
      copied += copyDirRecursive(sourcePath, targetPath)
    } else {
      copyFileSync(sourcePath, targetPath)
      copied++
    }
  }
  return copied
}
