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

import { Command } from 'commander'
import { addCommand, type AddOptions } from './commands/add'
import { aiInitCommand, aiUpdateCommand, type AiOptions } from './commands/ai'
import { createCommand, type CreateOptions } from './commands/create'
import { doctorCommand, type DoctorOptions } from './commands/doctor'
import { initCommand, type InitOptions } from './commands/init'
import { themeCommand, type ThemeCommandOptions } from './commands/theme'
import { CliError, logger } from './utils/logger'
import { getCliVersion } from './utils/templates'

/**
 * Wrap a command action so expected failures (CliError) print a clean
 * message and exit non-zero, without a stack trace.
 */
function run<Args extends unknown[]>(
  action: (...args: Args) => void | Promise<void>
): (...args: Args) => Promise<void> {
  return async (...args: Args) => {
    try {
      await action(...args)
    } catch (error) {
      if (error instanceof CliError) {
        logger.error(error.message)
        process.exit(1)
      }
      throw error
    }
  }
}

const program = new Command()

program
  .name('oxygen-ui-cli')
  .description('Command line interface for the WSO2 Oxygen UI design system')
  .version(getCliVersion())

program
  .command('init')
  .description('Set up Oxygen UI in an existing React app')
  .option('--charts', 'include @wso2/oxygen-ui-charts-react')
  .option('--eslint', 'add @wso2/eslint-plugin-oxygen-ui as a dev dependency')
  .option('--ai', 'set up AI assistant documentation')
  .option('--claude', 'use Claude Code mode for the AI documentation (implies --ai)')
  .option('--pm <package-manager>', 'package manager to use (pnpm, yarn, npm, bun)')
  .option('--no-install', 'skip installing dependencies')
  .option('-y, --yes', 'skip prompts and use defaults')
  .action(run((options: InitOptions) => initCommand(options)))

program
  .command('create')
  .description('Scaffold a new Vite + React + TypeScript app with Oxygen UI preconfigured')
  .argument('<app-name>', 'name of the app (and directory) to create')
  .option('--pm <package-manager>', 'package manager to use (pnpm, yarn, npm, bun)')
  .option('--no-install', 'skip installing dependencies')
  .action(run((appName: string, options: CreateOptions) => createCommand(appName, options)))

program
  .command('add')
  .description('Add a ready-made page template to your project')
  .argument('[template]', 'template id, or "list" to list available templates')
  .option('--dir <dir>', 'directory to write the file to (default: src/pages)')
  .option('-f, --force', 'overwrite the file if it already exists')
  .action(run((template: string | undefined, options: AddOptions) => addCommand(template, options)))

program
  .command('theme')
  .description('Generate a custom theme scaffold based on createOxygenTheme')
  .argument('<name>', 'theme name, e.g. "brand" generates BrandTheme')
  .option('--base <preset>', 'preset theme to extend (e.g. AcrylicOrangeTheme)')
  .option('--dir <dir>', 'directory to write the file to (default: src/themes)')
  .option('-f, --force', 'overwrite the file if it already exists')
  .action(run((name: string, options: ThemeCommandOptions) => themeCommand(name, options)))

program
  .command('doctor')
  .description('Diagnose common Oxygen UI setup issues in the current project')
  .option('--strict', 'exit with a non-zero status when there are warnings')
  .action(run((options: DoctorOptions) => doctorCommand(options)))

const ai = program
  .command('ai')
  .description('Manage AI assistant documentation shipped with @wso2/oxygen-ui')

ai.command('init')
  .description('Copy AI documentation from the installed @wso2/oxygen-ui into this project')
  .option('--claude', 'use Claude Code mode (skips the prompt)')
  .option('--internal', 'include internal/maintainer skills (Claude mode only)')
  .action(run((options: AiOptions) => aiInitCommand(options)))

ai.command('update')
  .description('Refresh the AI documentation after upgrading @wso2/oxygen-ui')
  .option('--claude', 'force Claude Code mode (otherwise auto-detected)')
  .option('--internal', 'include internal/maintainer skills (Claude mode only)')
  .action(run((options: AiOptions) => aiUpdateCommand(options)))

await program.parseAsync(process.argv)
