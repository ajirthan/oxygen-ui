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

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

export type PackageManager = 'pnpm' | 'yarn' | 'npm' | 'bun'

export const PACKAGE_MANAGERS: PackageManager[] = ['pnpm', 'yarn', 'npm', 'bun']

const LOCKFILES: Array<[string, PackageManager]> = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lockb', 'bun'],
  ['bun.lock', 'bun'],
  ['package-lock.json', 'npm'],
]

function parsePackageManagerField(dir: string): PackageManager | null {
  const pkgPath = join(dir, 'package.json')
  if (!existsSync(pkgPath)) return null
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    const field: unknown = pkg.packageManager
    if (typeof field !== 'string') return null
    const name = field.split('@')[0]
    if ((PACKAGE_MANAGERS as string[]).includes(name)) return name as PackageManager
  } catch {
    // Malformed package.json - ignore and keep looking
  }
  return null
}

/**
 * Detect the package manager used by the project at `cwd`, based on the
 * user agent (when invoked through a package manager, e.g. `pnpm dlx`),
 * lockfiles and the `packageManager` field, walking up parent directories
 * to support monorepos. Falls back to npm.
 */
export function detectPackageManager(cwd: string): PackageManager {
  let dir = resolve(cwd)
  for (;;) {
    for (const [lockfile, pm] of LOCKFILES) {
      if (existsSync(join(dir, lockfile))) return pm
    }
    const fromField = parsePackageManagerField(dir)
    if (fromField) return fromField
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return packageManagerFromUserAgent() ?? 'npm'
}

/**
 * Package manager inferred from the npm user agent, e.g. when the CLI is
 * invoked via `pnpm dlx` / `yarn dlx` / `npx` / `bunx`.
 */
export function packageManagerFromUserAgent(): PackageManager | null {
  const userAgent = process.env.npm_config_user_agent
  if (!userAgent) return null
  for (const pm of PACKAGE_MANAGERS) {
    if (userAgent.startsWith(`${pm}/`)) return pm
  }
  return null
}

/**
 * Arguments to add dependencies with the given package manager.
 */
export function addDependenciesArgs(
  pm: PackageManager,
  deps: string[],
  options: { dev?: boolean } = {}
): string[] {
  const dev = options.dev ?? false
  switch (pm) {
    case 'npm':
      return ['install', ...(dev ? ['--save-dev'] : []), ...deps]
    case 'bun':
      return ['add', ...(dev ? ['--dev'] : []), ...deps]
    case 'pnpm':
    case 'yarn':
      return ['add', ...(dev ? ['-D'] : []), ...deps]
  }
}

/**
 * Run a package manager command with inherited stdio. Returns true on
 * success.
 */
export function runPackageManager(pm: PackageManager, args: string[], cwd: string): boolean {
  const result = spawnSync(pm, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  return result.status === 0
}
