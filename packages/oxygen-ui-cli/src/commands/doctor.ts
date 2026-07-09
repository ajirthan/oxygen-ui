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

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import pc from 'picocolors'
import semver from 'semver'
import { logger } from '../utils/logger'
import {
  findEntryFile,
  findInstalledPackageDir,
  getInstalledVersion,
  readPackageJson,
} from '../utils/project'
import {
  OXYGEN_UI_CHARTS_PACKAGE,
  OXYGEN_UI_ESLINT_PLUGIN_PACKAGE,
  OXYGEN_UI_ICONS_PACKAGE,
  OXYGEN_UI_PACKAGE,
} from '../versions'

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'skip'

export interface CheckResult {
  name: string
  status: CheckStatus
  message: string
}

export interface DoctorOptions {
  strict?: boolean
  cwd?: string
}

const MIN_NODE_MAJOR = 20

/** Packages that must not be duplicated, or context/theming breaks subtly. */
const SINGLETON_PACKAGES = ['@mui/material', '@emotion/react', '@emotion/styled']

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']
const MAX_SCANNED_FILES = 5000

/**
 * Collect every installed version of a package that is reachable from `cwd`:
 * the hoisted copy, one level of nested node_modules (npm/yarn dedupe
 * failures), and the pnpm virtual store.
 */
export function collectInstalledVersions(pkgName: string, cwd: string): string[] {
  const versions = new Set<string>()
  const pkgPathSegments = pkgName.split('/')

  const addFrom = (dir: string) => {
    const version = readPackageJson(dir)?.version
    if (version) versions.add(version)
  }

  // Hoisted copy (walking up for monorepos).
  const hoisted = findInstalledPackageDir(pkgName, cwd)
  if (hoisted) addFrom(hoisted)

  // One level of nested installs: node_modules/<dep>/node_modules/<pkg>.
  const nodeModules = join(cwd, 'node_modules')
  if (existsSync(nodeModules)) {
    for (const entry of safeReaddir(nodeModules)) {
      if (entry.startsWith('.')) continue
      const entryPath = join(nodeModules, entry)
      const candidates = entry.startsWith('@')
        ? safeReaddir(entryPath).map(sub => join(entryPath, sub))
        : [entryPath]
      for (const candidate of candidates) {
        const nested = join(candidate, 'node_modules', ...pkgPathSegments)
        if (existsSync(join(nested, 'package.json'))) addFrom(nested)
      }
    }
  }

  // pnpm virtual store: node_modules/.pnpm/<name>@<version>[_peerhash].
  const pnpmStore = findNearestPnpmStore(cwd)
  if (pnpmStore) {
    const prefix = `${pkgName.replace('/', '+')}@`
    for (const entry of safeReaddir(pnpmStore)) {
      if (!entry.startsWith(prefix)) continue
      const version = entry.slice(prefix.length).split('_')[0]
      if (version) versions.add(version)
    }
  }

  return [...versions].sort()
}

function safeReaddir(dir: string): string[] {
  try {
    return readdirSync(dir)
  } catch {
    return []
  }
}

function findNearestPnpmStore(cwd: string): string | null {
  let dir = resolve(cwd)
  for (;;) {
    const candidate = join(dir, 'node_modules', '.pnpm')
    if (existsSync(candidate)) return candidate
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

export interface DirectImport {
  file: string
  specifier: string
}

/**
 * Scan project sources for direct `@mui/*` / `lucide-react` imports, which
 * should go through @wso2/oxygen-ui / @wso2/oxygen-ui-icons-react instead.
 */
export function scanDirectImports(srcDir: string): DirectImport[] {
  const results: DirectImport[] = []
  const importRegex = /from\s+['"](@mui\/[^'"]+|lucide-react(?:\/[^'"]+)?)['"]/g
  let scanned = 0

  const walk = (dir: string) => {
    for (const entry of safeReaddir(dir)) {
      if (entry.startsWith('.') || entry === 'node_modules') continue
      const fullPath = join(dir, entry)
      let stats
      try {
        stats = statSync(fullPath)
      } catch {
        continue
      }
      if (stats.isDirectory()) {
        walk(fullPath)
      } else if (SOURCE_EXTENSIONS.some(ext => entry.endsWith(ext))) {
        if (++scanned > MAX_SCANNED_FILES) return
        const content = readFileSync(fullPath, 'utf-8')
        for (const match of content.matchAll(importRegex)) {
          results.push({ file: relative(srcDir, fullPath), specifier: match[1] })
        }
      }
    }
  }

  if (existsSync(srcDir)) walk(srcDir)
  return results
}

export function runDoctorChecks(cwd: string): CheckResult[] {
  const results: CheckResult[] = []

  // Node.js version.
  const nodeMajor = Number(process.version.slice(1).split('.')[0])
  results.push({
    name: 'Node.js version',
    status: nodeMajor >= MIN_NODE_MAJOR ? 'pass' : 'warn',
    message:
      nodeMajor >= MIN_NODE_MAJOR
        ? `${process.version}`
        : `${process.version} - Node.js ${MIN_NODE_MAJOR}+ is recommended`,
  })

  // Project manifest.
  const pkg = readPackageJson(cwd)
  if (!pkg) {
    results.push({
      name: 'Project',
      status: 'fail',
      message: 'No package.json found in the current directory',
    })
    return results
  }

  // Oxygen UI packages.
  const oxygenVersion = getInstalledVersion(OXYGEN_UI_PACKAGE, cwd)
  results.push({
    name: OXYGEN_UI_PACKAGE,
    status: oxygenVersion ? 'pass' : 'fail',
    message: oxygenVersion ?? 'not installed - run `oxygen-ui-cli init`',
  })

  const iconsVersion = getInstalledVersion(OXYGEN_UI_ICONS_PACKAGE, cwd)
  results.push({
    name: OXYGEN_UI_ICONS_PACKAGE,
    status: iconsVersion ? 'pass' : 'warn',
    message: iconsVersion ?? 'not installed - it is a peer dependency of @wso2/oxygen-ui',
  })

  const chartsVersion = getInstalledVersion(OXYGEN_UI_CHARTS_PACKAGE, cwd)
  if (chartsVersion) {
    results.push({ name: OXYGEN_UI_CHARTS_PACKAGE, status: 'pass', message: chartsVersion })
  }

  // The Oxygen UI packages are released together as a fixed version group.
  const installedOxygenVersions = [oxygenVersion, iconsVersion, chartsVersion].filter(
    (version): version is string => Boolean(version)
  )
  if (new Set(installedOxygenVersions).size > 1) {
    results.push({
      name: 'Oxygen UI version alignment',
      status: 'warn',
      message:
        `mismatched versions (${installedOxygenVersions.join(', ')}) - ` +
        'the @wso2/oxygen-ui* packages are released together and should match',
    })
  } else if (installedOxygenVersions.length > 1) {
    results.push({
      name: 'Oxygen UI version alignment',
      status: 'pass',
      message: `all at ${installedOxygenVersions[0]}`,
    })
  }

  // React / ReactDOM against the library's peer ranges.
  if (oxygenVersion) {
    const oxygenDir = findInstalledPackageDir(OXYGEN_UI_PACKAGE, cwd)
    const peerDeps = (oxygenDir && readPackageJson(oxygenDir)?.peerDependencies) || {}
    for (const reactPkg of ['react', 'react-dom']) {
      const installed = getInstalledVersion(reactPkg, cwd)
      const range = peerDeps[reactPkg]
      if (!installed) {
        results.push({ name: reactPkg, status: 'fail', message: 'not installed' })
        continue
      }
      if (!range || !semver.validRange(range)) {
        results.push({ name: reactPkg, status: 'pass', message: installed })
        continue
      }
      const satisfied = semver.satisfies(installed, range, { includePrerelease: true })
      if (satisfied) {
        results.push({ name: reactPkg, status: 'pass', message: `${installed} (satisfies ${range})` })
      } else if (semver.valid(range) && semver.major(installed) === Number(semver.major(range))) {
        // Exact-version peer pins (a catalog substitution artifact) are
        // advisory; only a different major is a real problem.
        results.push({
          name: reactPkg,
          status: 'warn',
          message: `${installed} differs from the pinned peer version ${range} (same major, usually fine)`,
        })
      } else {
        results.push({
          name: reactPkg,
          status: 'fail',
          message: `${installed} does not satisfy the required peer range ${range}`,
        })
      }
    }
  }

  // Duplicate copies of context-sensitive packages.
  for (const singleton of SINGLETON_PACKAGES) {
    const versions = collectInstalledVersions(singleton, cwd)
    if (versions.length > 1) {
      results.push({
        name: `Duplicate ${singleton}`,
        status: 'warn',
        message:
          `multiple versions installed (${versions.join(', ')}) - ` +
          'duplicates can break theming and React context',
      })
    }
  }

  // Theme provider wiring.
  const entryFile = findEntryFile(cwd)
  if (entryFile) {
    const wired = readFileSync(entryFile, 'utf-8').includes('OxygenUIThemeProvider')
    results.push({
      name: 'OxygenUIThemeProvider',
      status: wired ? 'pass' : 'warn',
      message: wired
        ? `found in ${relative(cwd, entryFile)}`
        : `not found in ${relative(cwd, entryFile)} - run \`oxygen-ui-cli init\` to wire it up`,
    })
  } else {
    results.push({
      name: 'OxygenUIThemeProvider',
      status: 'skip',
      message: 'no entry file found (src/main.tsx or src/index.tsx)',
    })
  }

  // Direct @mui/* and lucide-react imports.
  const srcDir = join(cwd, 'src')
  if (existsSync(srcDir)) {
    const directImports = scanDirectImports(srcDir)
    if (directImports.length > 0) {
      const files = [...new Set(directImports.map(hit => hit.file))]
      const examples = files.slice(0, 3).join(', ')
      results.push({
        name: 'Direct imports',
        status: 'warn',
        message:
          `${directImports.length} direct @mui/* or lucide-react import(s) in ${files.length} file(s) ` +
          `(e.g. ${examples}) - import from @wso2/oxygen-ui / @wso2/oxygen-ui-icons-react instead ` +
          `(${OXYGEN_UI_ESLINT_PLUGIN_PACKAGE} enforces this)`,
      })
    } else {
      results.push({
        name: 'Direct imports',
        status: 'pass',
        message: 'no direct @mui/* or lucide-react imports found',
      })
    }
  }

  return results
}

const STATUS_ICONS: Record<CheckStatus, string> = {
  pass: pc.green('✔'),
  warn: pc.yellow('▲'),
  fail: pc.red('✖'),
  skip: pc.dim('-'),
}

export async function doctorCommand(options: DoctorOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd()

  logger.title('Oxygen UI - Doctor')
  const results = runDoctorChecks(cwd)

  for (const result of results) {
    console.log(`  ${STATUS_ICONS[result.status]} ${pc.bold(result.name)}: ${result.message}`)
  }

  const failures = results.filter(result => result.status === 'fail').length
  const warnings = results.filter(result => result.status === 'warn').length

  logger.break()
  if (failures === 0 && warnings === 0) {
    logger.success('No problems found.')
  } else {
    logger.info(
      `Found ${failures} problem(s) and ${warnings} warning(s). ` +
        'See the messages above for suggested fixes.'
    )
  }

  if (failures > 0 || (options.strict && warnings > 0)) {
    process.exitCode = 1
  }
}
