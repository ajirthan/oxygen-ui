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

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CliError } from '../utils/logger'
import { addCommand } from './add'
import { createCommand } from './create'
import { themeCommand, toThemeName } from './theme'

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'oxygen-cli-gen-'))
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('createCommand', () => {
  it('scaffolds a complete app without installing', async () => {
    await createCommand('my-app', { cwd: dir, install: false })

    const appDir = join(dir, 'my-app')
    for (const file of [
      'package.json',
      'index.html',
      'vite.config.ts',
      'tsconfig.json',
      'tsconfig.app.json',
      'tsconfig.node.json',
      'eslint.config.js',
      '.gitignore',
      'pnpm-workspace.yaml',
      'README.md',
      'src/main.tsx',
      'src/App.tsx',
      'src/index.css',
    ]) {
      expect(existsSync(join(appDir, file)), `missing ${file}`).toBe(true)
    }

    const pkg = JSON.parse(readFileSync(join(appDir, 'package.json'), 'utf-8'))
    expect(pkg.name).toBe('my-app')
    expect(pkg.dependencies['@wso2/oxygen-ui']).toBeDefined()
    expect(pkg.dependencies['@wso2/oxygen-ui-icons-react']).toBeDefined()

    const main = readFileSync(join(appDir, 'src', 'main.tsx'), 'utf-8')
    expect(main).toContain('OxygenUIThemeProvider')
  })

  it('rejects invalid names', async () => {
    await expect(createCommand('My App!', { cwd: dir, install: false })).rejects.toThrow(CliError)
  })

  it('rejects existing non-empty directories', async () => {
    await createCommand('my-app', { cwd: dir, install: false })
    await expect(createCommand('my-app', { cwd: dir, install: false })).rejects.toThrow(
      /already exists/
    )
  })
})

describe('addCommand', () => {
  it('writes the block into src/pages by default', async () => {
    await addCommand('login', { cwd: dir })
    const file = join(dir, 'src', 'pages', 'LoginPage.tsx')
    expect(existsSync(file)).toBe(true)
    expect(readFileSync(file, 'utf-8')).toContain('export default function LoginPage(')
  })

  it('honors --dir and --force', async () => {
    await addCommand('dashboard', { cwd: dir, dir: 'src/views' })
    const file = join(dir, 'src', 'views', 'DashboardPage.tsx')
    expect(existsSync(file)).toBe(true)

    await expect(addCommand('dashboard', { cwd: dir, dir: 'src/views' })).rejects.toThrow(
      /already exists/
    )
    await expect(
      addCommand('dashboard', { cwd: dir, dir: 'src/views', force: true })
    ).resolves.toBeUndefined()
  })

  it('rejects unknown templates', async () => {
    await expect(addCommand('nope', { cwd: dir })).rejects.toThrow(/Unknown template/)
  })
})

describe('toThemeName', () => {
  it.each([
    ['brand', 'BrandTheme'],
    ['my-company', 'MyCompanyTheme'],
    ['my-company-theme', 'MyCompanyTheme'],
    ['BrandTheme', 'BrandTheme'],
  ])('converts %s to %s', (input, expected) => {
    expect(toThemeName(input)).toBe(expected)
  })

  it('rejects names without letters', () => {
    expect(() => toThemeName('123')).toThrow(CliError)
  })
})

describe('themeCommand', () => {
  it('generates a theme extending the base theme by default', () => {
    themeCommand('brand', { cwd: dir })
    const file = join(dir, 'src', 'themes', 'BrandTheme.ts')
    expect(existsSync(file)).toBe(true)

    const content = readFileSync(file, 'utf-8')
    expect(content).toContain("import { createOxygenTheme } from '@wso2/oxygen-ui'")
    expect(content).toContain('const BrandTheme = createOxygenTheme(')
    expect(content).toContain('export default BrandTheme')
    expect(content).not.toContain('{{')
  })

  it('supports extending a preset theme via --base', () => {
    themeCommand('brand', { cwd: dir, base: 'AcrylicOrangeTheme' })
    const content = readFileSync(join(dir, 'src', 'themes', 'BrandTheme.ts'), 'utf-8')
    expect(content).toContain(
      "import { createOxygenTheme, AcrylicOrangeTheme } from '@wso2/oxygen-ui'"
    )
    expect(content).toMatch(/},?\s*\n\s*AcrylicOrangeTheme\s*\n\)/)
  })

  it('rejects unknown base presets', () => {
    expect(() => themeCommand('brand', { cwd: dir, base: 'NopeTheme' })).toThrow(/Unknown base theme/)
  })

  it('refuses to overwrite without --force', () => {
    themeCommand('brand', { cwd: dir })
    expect(() => themeCommand('brand', { cwd: dir })).toThrow(/already exists/)
    themeCommand('brand', { cwd: dir, force: true })
  })
})
