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

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

export interface PackageJson {
  name?: string
  version?: string
  private?: boolean
  packageManager?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  [key: string]: unknown
}

export function readPackageJson(dir: string): PackageJson | null {
  const pkgPath = join(dir, 'package.json')
  if (!existsSync(pkgPath)) return null
  try {
    return JSON.parse(readFileSync(pkgPath, 'utf-8')) as PackageJson
  } catch {
    return null
  }
}

/**
 * Application entry file candidates, in resolution order. Covers Vite
 * (src/main.*) and CRA (src/index.*) conventions.
 */
export const ENTRY_FILE_CANDIDATES = [
  'src/main.tsx',
  'src/main.jsx',
  'src/index.tsx',
  'src/index.jsx',
  'src/main.ts',
  'src/main.js',
  'src/index.ts',
  'src/index.js',
]

export function findEntryFile(cwd: string): string | null {
  for (const candidate of ENTRY_FILE_CANDIDATES) {
    const fullPath = join(cwd, candidate)
    if (existsSync(fullPath)) return fullPath
  }
  return null
}

/**
 * Locate an installed package directory by walking node_modules folders
 * up from `cwd`. Works with hoisted (npm/yarn) and symlinked (pnpm)
 * layouts without going through the `exports` map of the target package.
 */
export function findInstalledPackageDir(pkgName: string, cwd: string): string | null {
  let dir = resolve(cwd)
  for (;;) {
    const candidate = join(dir, 'node_modules', ...pkgName.split('/'))
    if (existsSync(join(candidate, 'package.json'))) return candidate
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

export function getInstalledVersion(pkgName: string, cwd: string): string | null {
  const pkgDir = findInstalledPackageDir(pkgName, cwd)
  if (!pkgDir) return null
  return readPackageJson(pkgDir)?.version ?? null
}

/**
 * True when the project declares the given package in dependencies or
 * devDependencies (regardless of whether node_modules is populated).
 */
export function hasDeclaredDependency(pkg: PackageJson, name: string): boolean {
  return Boolean(pkg.dependencies?.[name] ?? pkg.devDependencies?.[name])
}
