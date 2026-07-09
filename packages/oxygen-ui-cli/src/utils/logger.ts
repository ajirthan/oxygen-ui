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

import pc from 'picocolors'

/**
 * Error type for expected CLI failures. The program entry point catches
 * these, prints the message, and exits with a non-zero code (without a
 * stack trace).
 */
export class CliError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CliError'
  }
}

export const logger = {
  info(message: string): void {
    console.log(message)
  },
  success(message: string): void {
    console.log(`${pc.green('✔')} ${message}`)
  },
  warn(message: string): void {
    console.log(`${pc.yellow('▲')} ${message}`)
  },
  error(message: string): void {
    console.error(`${pc.red('✖')} ${message}`)
  },
  step(message: string): void {
    console.log(`${pc.cyan('→')} ${message}`)
  },
  title(message: string): void {
    console.log(`\n${pc.bold(message)}\n`)
  },
  break(): void {
    console.log('')
  },
  /**
   * Print a multi-line code snippet, dimmed and indented.
   */
  snippet(code: string): void {
    console.log(
      code
        .split('\n')
        .map(line => `  ${pc.dim(line)}`)
        .join('\n')
    )
  },
}

export function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY)
}
