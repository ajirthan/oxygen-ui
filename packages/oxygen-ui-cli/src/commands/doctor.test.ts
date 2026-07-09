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
import { collectInstalledVersions, runDoctorChecks, scanDirectImports } from './doctor'

function installFakePackage(root: string, name: string, version: string, extra: object = {}): void {
  const dir = join(root, 'node_modules', ...name.split('/'))
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, version, ...extra }))
}

describe('doctor', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'oxygen-cli-doctor-'))
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0' }))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('fails when @wso2/oxygen-ui is not installed', () => {
    const results = runDoctorChecks(dir)
    const check = results.find(result => result.name === '@wso2/oxygen-ui')
    expect(check?.status).toBe('fail')
  })

  it('passes for a healthy project', () => {
    installFakePackage(dir, '@wso2/oxygen-ui', '0.12.0', {
      peerDependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
    })
    installFakePackage(dir, '@wso2/oxygen-ui-icons-react', '0.12.0')
    installFakePackage(dir, 'react', '19.2.3')
    installFakePackage(dir, 'react-dom', '19.2.3')

    mkdirSync(join(dir, 'src'), { recursive: true })
    writeFileSync(
      join(dir, 'src', 'main.tsx'),
      "import { OxygenUIThemeProvider } from '@wso2/oxygen-ui'\n"
    )

    const results = runDoctorChecks(dir)
    expect(results.find(r => r.name === '@wso2/oxygen-ui')?.status).toBe('pass')
    expect(results.find(r => r.name === 'react')?.status).toBe('pass')
    expect(results.find(r => r.name === 'OxygenUIThemeProvider')?.status).toBe('pass')
    expect(results.find(r => r.name === 'Direct imports')?.status).toBe('pass')
    expect(results.some(r => r.status === 'fail')).toBe(false)
  })

  it('fails when react does not satisfy the peer range', () => {
    installFakePackage(dir, '@wso2/oxygen-ui', '0.12.0', {
      peerDependencies: { react: '^19.0.0' },
    })
    installFakePackage(dir, 'react', '18.3.1')

    const results = runDoctorChecks(dir)
    expect(results.find(r => r.name === 'react')?.status).toBe('fail')
  })

  it('only warns when react differs from an exact peer pin within the same major', () => {
    installFakePackage(dir, '@wso2/oxygen-ui', '0.12.0', {
      peerDependencies: { react: '19.2.3' },
    })
    installFakePackage(dir, 'react', '19.2.7')

    const results = runDoctorChecks(dir)
    expect(results.find(r => r.name === 'react')?.status).toBe('warn')
  })

  it('warns about mismatched Oxygen UI package versions', () => {
    installFakePackage(dir, '@wso2/oxygen-ui', '0.12.0')
    installFakePackage(dir, '@wso2/oxygen-ui-icons-react', '0.11.0')

    const results = runDoctorChecks(dir)
    expect(results.find(r => r.name === 'Oxygen UI version alignment')?.status).toBe('warn')
  })

  it('warns about direct @mui and lucide-react imports', () => {
    installFakePackage(dir, '@wso2/oxygen-ui', '0.12.0')
    mkdirSync(join(dir, 'src'), { recursive: true })
    writeFileSync(
      join(dir, 'src', 'main.tsx'),
      "import { OxygenUIThemeProvider } from '@wso2/oxygen-ui'\n"
    )
    writeFileSync(join(dir, 'src', 'Bad.tsx'), "import { Button } from '@mui/material'\n")
    writeFileSync(join(dir, 'src', 'Icons.tsx'), "import { Bell } from 'lucide-react'\n")

    const results = runDoctorChecks(dir)
    const check = results.find(r => r.name === 'Direct imports')
    expect(check?.status).toBe('warn')
    expect(check?.message).toContain('2 direct')
  })
})

describe('collectInstalledVersions', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'oxygen-cli-versions-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('finds hoisted, nested, and pnpm-store copies', () => {
    installFakePackage(dir, '@mui/material', '7.3.4')
    // Nested duplicate under another dependency.
    installFakePackage(join(dir, 'node_modules', 'some-lib'), '@mui/material', '6.4.0')
    // pnpm virtual store entry.
    const pnpmEntry = join(dir, 'node_modules', '.pnpm', '@mui+material@5.15.0_react@19.2.3')
    mkdirSync(pnpmEntry, { recursive: true })

    const versions = collectInstalledVersions('@mui/material', dir)
    expect(versions).toEqual(['5.15.0', '6.4.0', '7.3.4'])
  })
})

describe('scanDirectImports', () => {
  it('returns an empty list for a missing directory', () => {
    expect(scanDirectImports(join(tmpdir(), 'does-not-exist-xyz'))).toEqual([])
  })
})
