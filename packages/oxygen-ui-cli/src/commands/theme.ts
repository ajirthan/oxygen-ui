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

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { CliError, logger } from '../utils/logger'
import { getTemplatesDir, renderTemplate } from '../utils/templates'

export interface ThemeCommandOptions {
  base?: string
  dir?: string
  force?: boolean
  cwd?: string
}

/** Preset themes exported by @wso2/oxygen-ui that can be used as a base. */
export const PRESET_THEMES = [
  'OxygenTheme',
  'AcrylicOrangeTheme',
  'AcrylicPurpleTheme',
  'ClassicTheme',
  'HighContrastTheme',
  'PaleBaseTheme',
  'PaleGrayTheme',
  'PaleIndigoTheme',
  'WSO2Theme',
]

const DEFAULT_TARGET_DIR = 'src/themes'

/**
 * Convert a user-supplied name to a PascalCase identifier ending in `Theme`,
 * e.g. "brand" -> "BrandTheme", "my-company-theme" -> "MyCompanyTheme".
 */
export function toThemeName(name: string): string {
  const words = name
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  let pascal = words.join('')
  if (!/^[A-Za-z]/.test(pascal)) {
    throw new CliError(`"${name}" is not a valid theme name. It must start with a letter.`)
  }
  pascal = pascal.replace(/theme$/i, '')
  if (pascal.length === 0) {
    throw new CliError(`"${name}" is not a valid theme name.`)
  }
  return `${pascal}Theme`
}

export function themeCommand(name: string, options: ThemeCommandOptions = {}): void {
  const cwd = options.cwd ?? process.cwd()
  const themeName = toThemeName(name)

  const base = options.base
  if (base !== undefined && !PRESET_THEMES.includes(base)) {
    throw new CliError(
      `Unknown base theme "${base}". Available presets: ${PRESET_THEMES.join(', ')}.`
    )
  }

  const targetDir = resolve(cwd, options.dir ?? DEFAULT_TARGET_DIR)
  const targetFile = join(targetDir, `${themeName}.ts`)
  const displayPath = relative(cwd, targetFile)

  if (existsSync(targetFile) && !options.force) {
    throw new CliError(`${displayPath} already exists. Use --force to overwrite.`)
  }

  const template = readFileSync(join(getTemplatesDir(), 'theme', 'theme.ts.tpl'), 'utf-8')
  const content = renderTemplate(template, {
    themeName,
    baseImportSpecifier: base ? `, ${base}` : '',
    baseThemeLabel: base ?? 'the Oxygen base theme',
    baseArgument: base ? `,\n  ${base}` : '',
  })

  mkdirSync(targetDir, { recursive: true })
  writeFileSync(targetFile, content)

  logger.success(`Created ${displayPath}${base ? ` (extends ${base})` : ''}`)
  logger.break()
  logger.info('Register it with OxygenUIThemeProvider:')
  logger.break()
  const importPath = `./${displayPath.replace(/^src\//, '').replace(/\.ts$/, '')}`
  const themeKey = themeName.replace(/Theme$/, '')
  logger.snippet(`import ${themeName} from '${importPath}'

// Single theme:
<OxygenUIThemeProvider theme={${themeName}}>

// Or with theme switching:
<OxygenUIThemeProvider
  themes={[{ key: '${themeKey.charAt(0).toLowerCase()}${themeKey.slice(1)}', label: '${themeKey}', theme: ${themeName} }]}
>`)
}
