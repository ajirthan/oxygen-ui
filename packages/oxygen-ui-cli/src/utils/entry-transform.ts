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

export type WrapResult =
  | { ok: true; code: string }
  | { ok: false; reason: 'already-wired' | 'no-render-call' | 'unsupported-entry-shape' }

const PROVIDER_IMPORT = "import { OxygenUIThemeProvider } from '@wso2/oxygen-ui'"

/**
 * Insert the OxygenUIThemeProvider import after the last top-level import
 * statement (or at the top of the file when there are none).
 */
export function addProviderImport(source: string): string {
  const importRegex = /^import\s+(?:[\s\S]*?from\s+)?['"][^'"]+['"];?[^\S\n]*$/gm
  let lastImportEnd = -1
  for (const match of source.matchAll(importRegex)) {
    lastImportEnd = (match.index ?? 0) + match[0].length
  }
  if (lastImportEnd === -1) {
    return `${PROVIDER_IMPORT}\n\n${source}`
  }
  return `${source.slice(0, lastImportEnd)}\n${PROVIDER_IMPORT}${source.slice(lastImportEnd)}`
}

/**
 * Wrap the JSX passed to the root `.render(...)` call with
 * `<OxygenUIThemeProvider>` and add the corresponding import.
 *
 * The transform is deliberately conservative: it handles the common
 * `createRoot(...).render(<App />)` (Vite / modern CRA) and legacy
 * `ReactDOM.render(<App />, container)` shapes, and reports a failure for
 * anything it does not recognize so the caller can fall back to printing a
 * snippet.
 */
export function wrapEntryWithProvider(source: string): WrapResult {
  if (source.includes('OxygenUIThemeProvider')) {
    return { ok: false, reason: 'already-wired' }
  }

  const renderIndex = source.indexOf('.render(')
  if (renderIndex === -1) {
    return { ok: false, reason: 'no-render-call' }
  }

  // Balance parentheses to find the end of the render(...) argument list.
  const openIndex = renderIndex + '.render('.length - 1
  let depth = 0
  let closeIndex = -1
  for (let i = openIndex; i < source.length; i++) {
    const char = source[i]
    if (char === '(') depth++
    else if (char === ')') {
      depth--
      if (depth === 0) {
        closeIndex = i
        break
      }
    }
  }
  if (closeIndex === -1) {
    return { ok: false, reason: 'unsupported-entry-shape' }
  }

  let argsText = source.slice(openIndex + 1, closeIndex).trim()
  if (!argsText.startsWith('<')) {
    return { ok: false, reason: 'unsupported-entry-shape' }
  }

  // Tolerate a trailing comma after the last argument.
  const hadTrailingComma = argsText.endsWith(',')
  if (hadTrailingComma) {
    argsText = argsText.slice(0, -1).trimEnd()
  }

  // Single JSX argument ends with '>'. The legacy two-argument form ends
  // with a container expression after a trailing top-level comma.
  let jsxPart = argsText
  let containerPart: string | null = null
  if (!argsText.endsWith('>')) {
    const legacyMatch = argsText.match(/^([\s\S]*>)\s*,\s*([^<>]+)$/)
    if (!legacyMatch) {
      return { ok: false, reason: 'unsupported-entry-shape' }
    }
    jsxPart = legacyMatch[1].trim()
    containerPart = legacyMatch[2].trim()
  }

  const indentedJsx = jsxPart
    .split('\n')
    .map(line => (line.length > 0 ? `  ${line}` : line))
    .join('\n')

  const wrappedArgs =
    `\n  <OxygenUIThemeProvider>\n${indentedJsx}\n  </OxygenUIThemeProvider>` +
    (containerPart ? `,\n  ${containerPart}` : '') +
    (hadTrailingComma ? ',' : '') +
    '\n'

  const code =
    source.slice(0, openIndex + 1) + wrappedArgs + source.slice(closeIndex)

  return { ok: true, code: addProviderImport(code) }
}

/**
 * Ready-to-paste setup snippet, used when the entry file cannot be found or
 * transformed automatically.
 */
export function providerSnippet(): string {
  return `${PROVIDER_IMPORT}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OxygenUIThemeProvider>
      <App />
    </OxygenUIThemeProvider>
  </StrictMode>,
)`
}
