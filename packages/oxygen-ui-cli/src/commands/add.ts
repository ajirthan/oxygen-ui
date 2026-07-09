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

import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import * as clack from '@clack/prompts'
import pc from 'picocolors'
import { BLOCKS, blockFileName, findBlock, type BlockDefinition } from '../blocks'
import { CliError, isInteractive, logger } from '../utils/logger'
import { getTemplatesDir } from '../utils/templates'

export interface AddOptions {
  dir?: string
  force?: boolean
  cwd?: string
}

const DEFAULT_TARGET_DIR = 'src/pages'

export function listBlocks(): void {
  logger.title('Available templates')
  const width = Math.max(...BLOCKS.map(block => block.id.length))
  for (const block of BLOCKS) {
    logger.info(`  ${pc.cyan(block.id.padEnd(width + 2))} ${block.description}`)
  }
  logger.break()
  logger.info('Usage: oxygen-ui-cli add <template> [--dir <dir>] [--force]')
}

async function promptForBlock(): Promise<BlockDefinition> {
  const choice = await clack.select({
    message: 'Which template do you want to add?',
    options: BLOCKS.map(block => ({
      value: block.id,
      label: block.id,
      hint: block.description,
    })),
  })
  if (clack.isCancel(choice)) {
    clack.cancel('Cancelled.')
    process.exit(130)
  }
  // The selected value always comes from BLOCKS.
  return findBlock(choice as string) as BlockDefinition
}

export async function addCommand(
  templateId: string | undefined,
  options: AddOptions = {}
): Promise<void> {
  const cwd = options.cwd ?? process.cwd()

  if (templateId === 'list' || (templateId === undefined && !isInteractive())) {
    listBlocks()
    return
  }

  let block: BlockDefinition
  if (templateId === undefined) {
    block = await promptForBlock()
  } else {
    const found = findBlock(templateId)
    if (!found) {
      throw new CliError(
        `Unknown template "${templateId}". Available templates: ${BLOCKS.map(b => b.id).join(', ')}.`
      )
    }
    block = found
  }

  const targetDir = resolve(cwd, options.dir ?? DEFAULT_TARGET_DIR)
  const targetFile = join(targetDir, blockFileName(block))
  const displayPath = relative(cwd, targetFile)

  if (existsSync(targetFile) && !options.force) {
    throw new CliError(`${displayPath} already exists. Use --force to overwrite.`)
  }

  const sourceFile = join(getTemplatesDir(), 'blocks', `${block.id}.tsx`)
  mkdirSync(targetDir, { recursive: true })
  copyFileSync(sourceFile, targetFile)

  logger.success(`Added ${block.id} template: ${displayPath}`)
  logger.break()
  logger.info('Use it in your app:')
  logger.break()
  const importPath = `./${displayPath.replace(/^src\//, '').replace(/\.tsx$/, '')}`
  logger.snippet(`import ${block.componentName} from '${importPath}'`)
}
