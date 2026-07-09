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
import { BLOCKS } from '../blocks'
import { copyTemplateDir, getTemplatesDir, renderTemplate } from './templates'

describe('renderTemplate', () => {
  it('replaces known placeholders', () => {
    expect(renderTemplate('Hello {{name}}!', { name: 'world' })).toBe('Hello world!')
  })

  it('leaves unknown placeholders and JSX braces untouched', () => {
    const source = 'sx={{ flex: 1 }} and {{unknown}} and {{appName}}'
    expect(renderTemplate(source, { appName: 'demo' })).toBe(
      'sx={{ flex: 1 }} and {{unknown}} and demo'
    )
  })
})

describe('template files', () => {
  it('ships a template file for every block', () => {
    for (const block of BLOCKS) {
      const file = join(getTemplatesDir(), 'blocks', `${block.id}.tsx`)
      expect(existsSync(file), `missing template for block "${block.id}"`).toBe(true)
      const content = readFileSync(file, 'utf-8')
      expect(content).toContain(`export default function ${block.componentName}(`)
    }
  })

  it('ships the theme and app templates', () => {
    expect(existsSync(join(getTemplatesDir(), 'theme', 'theme.ts.tpl'))).toBe(true)
    for (const file of ['index.html', 'vite.config.ts', '_gitignore', 'src/main.tsx', 'src/App.tsx']) {
      expect(existsSync(join(getTemplatesDir(), 'app', 'vite-ts', file)), `missing ${file}`).toBe(true)
    }
  })

  it('block templates only import from Oxygen UI packages and react', () => {
    const allowed = /^(@wso2\/oxygen-ui|@wso2\/oxygen-ui-icons-react|react)$/
    for (const block of BLOCKS) {
      const content = readFileSync(join(getTemplatesDir(), 'blocks', `${block.id}.tsx`), 'utf-8')
      for (const match of content.matchAll(/from\s+'([^']+)'/g)) {
        expect(match[1], `unexpected import "${match[1]}" in block "${block.id}"`).toMatch(allowed)
      }
    }
  })
})

describe('copyTemplateDir', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'oxygen-cli-tpl-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('copies the app template with substitution and renames _gitignore', () => {
    const written = copyTemplateDir(join(getTemplatesDir(), 'app', 'vite-ts'), dir, {
      appName: 'demo-app',
    })

    expect(written).toContain('.gitignore')
    expect(written).not.toContain('_gitignore')
    expect(existsSync(join(dir, '.gitignore'))).toBe(true)

    const html = readFileSync(join(dir, 'index.html'), 'utf-8')
    expect(html).toContain('<title>demo-app</title>')

    const app = readFileSync(join(dir, 'src', 'App.tsx'), 'utf-8')
    expect(app).toContain('demo-app')
    expect(app).not.toContain('{{appName}}')
    // JSX double braces survive the substitution.
    expect(app).toContain('sx={{ minHeight:')
  })
})
