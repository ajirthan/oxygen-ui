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

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addDependenciesArgs, detectPackageManager } from './package-manager'

describe('detectPackageManager', () => {
  let dir: string
  let savedUserAgent: string | undefined

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'oxygen-cli-pm-'))
    savedUserAgent = process.env.npm_config_user_agent
    delete process.env.npm_config_user_agent
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
    if (savedUserAgent === undefined) {
      delete process.env.npm_config_user_agent
    } else {
      process.env.npm_config_user_agent = savedUserAgent
    }
  })

  it.each([
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['package-lock.json', 'npm'],
    ['bun.lockb', 'bun'],
  ])('detects %s as %s', (lockfile, expected) => {
    writeFileSync(join(dir, lockfile), '')
    expect(detectPackageManager(dir)).toBe(expected)
  })

  it('detects lockfiles in parent directories (monorepos)', () => {
    writeFileSync(join(dir, 'pnpm-lock.yaml'), '')
    const nested = join(dir, 'apps', 'web')
    mkdirSync(nested, { recursive: true })
    expect(detectPackageManager(nested)).toBe('pnpm')
  })

  it('respects the packageManager field', () => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ packageManager: 'yarn@4.5.0' }))
    expect(detectPackageManager(dir)).toBe('yarn')
  })

  it('falls back to the npm user agent', () => {
    process.env.npm_config_user_agent = 'bun/1.2.0 npm/? node/v22.0.0 darwin arm64'
    expect(detectPackageManager(dir)).toBe('bun')
  })

  it('defaults to npm', () => {
    expect(detectPackageManager(dir)).toBe('npm')
  })
})

describe('addDependenciesArgs', () => {
  it('builds install args per package manager', () => {
    expect(addDependenciesArgs('npm', ['a', 'b'])).toEqual(['install', 'a', 'b'])
    expect(addDependenciesArgs('pnpm', ['a'])).toEqual(['add', 'a'])
    expect(addDependenciesArgs('yarn', ['a'])).toEqual(['add', 'a'])
    expect(addDependenciesArgs('bun', ['a'])).toEqual(['add', 'a'])
  })

  it('builds dev-dependency args per package manager', () => {
    expect(addDependenciesArgs('npm', ['a'], { dev: true })).toEqual(['install', '--save-dev', 'a'])
    expect(addDependenciesArgs('pnpm', ['a'], { dev: true })).toEqual(['add', '-D', 'a'])
    expect(addDependenciesArgs('bun', ['a'], { dev: true })).toEqual(['add', '--dev', 'a'])
  })
})
