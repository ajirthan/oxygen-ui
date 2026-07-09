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

import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import pc from 'picocolors'
import { CliError, logger } from '../utils/logger'
import {
  packageManagerFromUserAgent,
  runPackageManager,
  PACKAGE_MANAGERS,
  type PackageManager,
} from '../utils/package-manager'
import { copyTemplateDir, getTemplatesDir } from '../utils/templates'
import { APP_DEPENDENCIES, APP_DEV_DEPENDENCIES } from '../versions'

export interface CreateOptions {
  pm?: string
  /** Defaults to true; disabled via --no-install. */
  install?: boolean
  cwd?: string
}

/** Simplified npm package name rules (optionally scoped, lowercase). */
const PACKAGE_NAME_REGEX = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

export function buildAppPackageJson(appName: string): string {
  const pkg = {
    name: appName,
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc -b && vite build',
      lint: 'eslint .',
      preview: 'vite preview',
    },
    dependencies: APP_DEPENDENCIES,
    devDependencies: APP_DEV_DEPENDENCIES,
  }
  return `${JSON.stringify(pkg, null, 2)}\n`
}

export async function createCommand(appName: string, options: CreateOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd()

  if (!PACKAGE_NAME_REGEX.test(appName)) {
    throw new CliError(
      `"${appName}" is not a valid package name. Use lowercase letters, digits, ` +
        'hyphens, dots, and underscores (optionally scoped, e.g. @org/my-app).'
    )
  }

  // For scoped names, the directory is the part after the scope.
  const dirName = appName.includes('/') ? appName.split('/')[1] : appName
  const targetDir = resolve(cwd, dirName)

  if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
    throw new CliError(`Directory "${dirName}" already exists and is not empty.`)
  }

  let pm: PackageManager = 'npm'
  if (options.pm !== undefined) {
    if (!(PACKAGE_MANAGERS as string[]).includes(options.pm)) {
      throw new CliError(
        `Unknown package manager "${options.pm}". Supported: ${PACKAGE_MANAGERS.join(', ')}.`
      )
    }
    pm = options.pm as PackageManager
  } else {
    pm = packageManagerFromUserAgent() ?? 'npm'
  }

  logger.title(`Creating ${appName}...`)

  const templateDir = join(getTemplatesDir(), 'app', 'vite-ts')
  const written = copyTemplateDir(templateDir, targetDir, { appName })
  writeFileSync(join(targetDir, 'package.json'), buildAppPackageJson(appName))
  written.push('package.json')

  for (const file of written.sort()) {
    logger.info(`  ${pc.dim('create')} ${join(dirName, file)}`)
  }
  logger.break()

  let installed = false
  if (options.install ?? true) {
    logger.step(`Installing dependencies with ${pm}...`)
    installed = runPackageManager(pm, ['install'], targetDir)
    if (installed) {
      logger.success('Dependencies installed.')
    } else {
      logger.warn(`Failed to install dependencies with ${pm}. Install them manually.`)
    }
  }

  logger.break()
  logger.success(`Created ${appName}. Next steps:`)
  logger.break()
  const steps = [`cd ${dirName}`]
  if (!installed) steps.push(`${pm} install`)
  steps.push(pm === 'npm' ? 'npm run dev' : `${pm} dev`)
  logger.snippet(steps.join('\n'))
  logger.break()
  logger.info('  Add page templates with `oxygen-ui-cli add` (login, dashboard, wizard, ...).')
}
