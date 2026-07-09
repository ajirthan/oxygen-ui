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

import { describe, expect, it } from 'vitest'
import { addProviderImport, wrapEntryWithProvider } from './entry-transform'

const VITE_ENTRY = `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`

const LEGACY_CRA_ENTRY = `import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));
`

describe('wrapEntryWithProvider', () => {
  it('wraps the modern createRoot().render() argument', () => {
    const result = wrapEntryWithProvider(VITE_ENTRY)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.code).toContain("import { OxygenUIThemeProvider } from '@wso2/oxygen-ui'")
    const providerOpen = result.code.indexOf('<OxygenUIThemeProvider>')
    const strictOpen = result.code.indexOf('<StrictMode>')
    const strictClose = result.code.indexOf('</StrictMode>')
    const providerClose = result.code.indexOf('</OxygenUIThemeProvider>')
    expect(providerOpen).toBeGreaterThan(-1)
    expect(providerOpen).toBeLessThan(strictOpen)
    expect(strictClose).toBeLessThan(providerClose)
    // Trailing comma of the original argument is preserved outside the JSX.
    expect(result.code).toContain('</OxygenUIThemeProvider>,\n)')
  })

  it('wraps only the element in the legacy two-argument render()', () => {
    const result = wrapEntryWithProvider(LEGACY_CRA_ENTRY)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.code).toContain('<OxygenUIThemeProvider>')
    expect(result.code).toMatch(
      /<\/OxygenUIThemeProvider>,\s*document\.getElementById\('root'\)\s*\)/
    )
  })

  it('reports files that already use the provider', () => {
    const source = VITE_ENTRY.replace('<App />', '<OxygenUIThemeProvider><App /></OxygenUIThemeProvider>')
    const result = wrapEntryWithProvider(source)
    expect(result).toEqual({ ok: false, reason: 'already-wired' })
  })

  it('reports files without a render call', () => {
    const result = wrapEntryWithProvider(`export const answer = 42\n`)
    expect(result).toEqual({ ok: false, reason: 'no-render-call' })
  })

  it('reports non-JSX render arguments', () => {
    const result = wrapEntryWithProvider(`root.render(makeApp())\n`)
    expect(result).toEqual({ ok: false, reason: 'unsupported-entry-shape' })
  })
})

describe('addProviderImport', () => {
  it('inserts after the last import, including side-effect imports', () => {
    const code = addProviderImport(VITE_ENTRY)
    const lines = code.split('\n')
    const importIndex = lines.indexOf("import { OxygenUIThemeProvider } from '@wso2/oxygen-ui'")
    expect(lines[importIndex - 1]).toBe("import './index.css'")
  })

  it('handles multi-line import statements', () => {
    const source = `import {
  a,
  b,
} from 'somewhere'

console.log(a, b)
`
    const code = addProviderImport(source)
    expect(code.indexOf("from 'somewhere'")).toBeLessThan(
      code.indexOf("import { OxygenUIThemeProvider }")
    )
    expect(code.indexOf("import { OxygenUIThemeProvider }")).toBeLessThan(
      code.indexOf('console.log')
    )
  })

  it('prepends when there are no imports', () => {
    const code = addProviderImport('console.log(1)\n')
    expect(code.startsWith("import { OxygenUIThemeProvider } from '@wso2/oxygen-ui'")).toBe(true)
  })
})
