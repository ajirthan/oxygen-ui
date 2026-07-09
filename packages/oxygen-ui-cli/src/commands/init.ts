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

import { readFileSync, writeFileSync } from 'node:fs'
import { relative } from 'node:path'
import * as clack from '@clack/prompts'
import { CliError, isInteractive, logger } from '../utils/logger'
import {
  addDependenciesArgs,
  detectPackageManager,
  PACKAGE_MANAGERS,
  runPackageManager,
  type PackageManager,
} from '../utils/package-manager'
import { findEntryFile, hasDeclaredDependency, readPackageJson } from '../utils/project'
import { providerSnippet, wrapEntryWithProvider } from '../utils/entry-transform'
import {
  OXYGEN_UI_CHARTS_PACKAGE,
  OXYGEN_UI_ESLINT_PLUGIN_PACKAGE,
  OXYGEN_UI_ICONS_PACKAGE,
  OXYGEN_UI_PACKAGE,
} from '../versions'
import { aiInitCommand } from './ai'

export interface InitOptions {
  yes?: boolean
  charts?: boolean
  eslint?: boolean
  ai?: boolean
  claude?: boolean
  pm?: string
  /** Defaults to true; disabled via --no-install. */
  install?: boolean
  cwd?: string
}

const ESLINT_CONFIG_SNIPPET = `// eslint.config.js
import oxygenUIPlugin from '@wso2/eslint-plugin-oxygen-ui'

export default [
  // ...your existing config
  oxygenUIPlugin.configs.recommended,
]`

export function resolvePackageManager(pm: string | undefined, cwd: string): PackageManager {
  if (pm === undefined) return detectPackageManager(cwd)
  if ((PACKAGE_MANAGERS as string[]).includes(pm)) return pm as PackageManager
  throw new CliError(
    `Unknown package manager "${pm}". Supported: ${PACKAGE_MANAGERS.join(', ')}.`
  )
}

async function confirmOption(
  value: boolean | undefined,
  interactive: boolean,
  message: string
): Promise<boolean> {
  if (value !== undefined) return value
  if (!interactive) return false
  const answer = await clack.confirm({ message, initialValue: false })
  if (clack.isCancel(answer)) {
    clack.cancel('Cancelled.')
    process.exit(130)
  }
  return answer
}

function wireEntryFile(cwd: string): void {
  const entryFile = findEntryFile(cwd)
  if (!entryFile) {
    logger.warn('Could not find an entry file (src/main.tsx or src/index.tsx).')
    logger.info('  Wrap your app with OxygenUIThemeProvider manually:')
    logger.break()
    logger.snippet(providerSnippet())
    return
  }

  const relativeEntry = relative(cwd, entryFile)
  const source = readFileSync(entryFile, 'utf-8')
  const result = wrapEntryWithProvider(source)

  if (result.ok) {
    writeFileSync(entryFile, result.code)
    logger.success(`Wrapped the app in ${relativeEntry} with OxygenUIThemeProvider.`)
    return
  }

  if (result.reason === 'already-wired') {
    logger.success(`${relativeEntry} already uses OxygenUIThemeProvider.`)
    return
  }

  logger.warn(`Could not automatically update ${relativeEntry}.`)
  logger.info('  Wrap your app with OxygenUIThemeProvider manually:')
  logger.break()
  logger.snippet(providerSnippet())
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd()

  const pkg = readPackageJson(cwd)
  if (!pkg) {
    throw new CliError(
      'No package.json found in the current directory. Run this inside an existing app, ' +
        'or scaffold a new one with `oxygen-ui-cli create <app-name>`.'
    )
  }

  logger.title('Oxygen UI - Project Setup')

  if (!hasDeclaredDependency(pkg, 'react')) {
    logger.warn('This project does not declare a react dependency. Oxygen UI requires React.')
  }

  const interactive = isInteractive() && !options.yes
  const includeCharts = await confirmOption(
    options.charts,
    interactive,
    'Include @wso2/oxygen-ui-charts-react (charts built on Recharts)?'
  )
  const includeEslint = await confirmOption(
    options.eslint,
    interactive,
    'Add @wso2/eslint-plugin-oxygen-ui (enforces Oxygen UI import patterns)?'
  )
  const includeAi = await confirmOption(
    options.ai ?? (options.claude ? true : undefined),
    interactive,
    'Set up AI assistant documentation (AGENTS.md / Claude Code)?'
  )

  const pm = resolvePackageManager(options.pm, cwd)
  const install = options.install ?? true

  const dependencies = [OXYGEN_UI_PACKAGE, OXYGEN_UI_ICONS_PACKAGE]
  if (includeCharts) dependencies.push(OXYGEN_UI_CHARTS_PACKAGE)

  if (install) {
    logger.step(`Installing ${dependencies.join(', ')} with ${pm}...`)
    if (!runPackageManager(pm, addDependenciesArgs(pm, dependencies), cwd)) {
      throw new CliError(`Failed to install dependencies with ${pm}.`)
    }
    logger.success('Dependencies installed.')

    if (includeEslint) {
      logger.step(`Installing ${OXYGEN_UI_ESLINT_PLUGIN_PACKAGE} with ${pm}...`)
      if (!runPackageManager(pm, addDependenciesArgs(pm, [OXYGEN_UI_ESLINT_PLUGIN_PACKAGE], { dev: true }), cwd)) {
        throw new CliError(`Failed to install ${OXYGEN_UI_ESLINT_PLUGIN_PACKAGE} with ${pm}.`)
      }
      logger.success('ESLint plugin installed.')
    }
  } else {
    logger.info('Skipping dependency installation (--no-install). Install manually with:')
    logger.snippet(`${pm} ${addDependenciesArgs(pm, dependencies).join(' ')}`)
    if (includeEslint) {
      logger.snippet(
        `${pm} ${addDependenciesArgs(pm, [OXYGEN_UI_ESLINT_PLUGIN_PACKAGE], { dev: true }).join(' ')}`
      )
    }
  }

  if (includeEslint) {
    logger.break()
    logger.info('Enable the ESLint plugin in your flat config:')
    logger.break()
    logger.snippet(ESLINT_CONFIG_SNIPPET)
  }

  logger.break()
  wireEntryFile(cwd)

  if (includeAi) {
    logger.break()
    await aiInitCommand({ claude: options.claude, cwd })
  }

  logger.break()
  logger.success('Oxygen UI setup complete.')
  logger.info('  Import components from @wso2/oxygen-ui and icons from @wso2/oxygen-ui-icons-react.')
  logger.info('  Run `oxygen-ui-cli doctor` at any time to verify your setup.')
}
