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

import { copyFileSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import * as clack from '@clack/prompts'
import { CliError, isInteractive, logger } from '../utils/logger'
import { findInstalledPackageDir } from '../utils/project'
import { copyDirRecursive, copyFilesByExtension } from '../utils/templates'
import { OXYGEN_UI_PACKAGE } from '../versions'

export interface AiOptions {
  claude?: boolean
  internal?: boolean
  cwd?: string
}

/** Skills that are only distributed to WSO2 maintainers. */
const INTERNAL_SKILLS = ['oxygen-sync']

const CLAUDE_IMPORT_MARKER = '.claude/oxygen-ui/CLAUDE.md'
const AGENTS_IMPORT_MARKER = '.ai/oxygen-ui/'

const CLAUDE_IMPORT_REFERENCE = `
## Oxygen UI

For Oxygen UI component guidelines and patterns, see [.claude/oxygen-ui/CLAUDE.md](.claude/oxygen-ui/CLAUDE.md).
`

const AGENTS_IMPORT_REFERENCE = `
## Oxygen UI

For Oxygen UI component guidelines and patterns, see [.ai/oxygen-ui/components.md](.ai/oxygen-ui/components.md).
`

interface DocsSource {
  /** Installed @wso2/oxygen-ui directory. */
  packageDir: string
  aiDir: string
  claudeDir: string
}

/**
 * Resolve the AI documentation shipped inside the installed @wso2/oxygen-ui
 * package, so the docs always match the library version in use.
 */
function resolveDocsSource(cwd: string): DocsSource {
  const packageDir = findInstalledPackageDir(OXYGEN_UI_PACKAGE, cwd)
  if (!packageDir) {
    throw new CliError(
      `${OXYGEN_UI_PACKAGE} is not installed in this project. ` +
        'Install it first (e.g. `oxygen-ui-cli init`) and try again.'
    )
  }
  return {
    packageDir,
    aiDir: join(packageDir, '.ai'),
    claudeDir: join(packageDir, '.claude'),
  }
}

function detectPreviousMode(cwd: string): 'claude' | 'universal' | null {
  if (existsSync(resolve(cwd, '.claude', 'oxygen-ui'))) return 'claude'
  if (existsSync(resolve(cwd, '.ai', 'oxygen-ui'))) return 'universal'
  return null
}

async function promptForMode(): Promise<boolean> {
  if (!isInteractive()) return false
  const choice = await clack.select({
    message: 'Which AI assistant are you using?',
    options: [
      {
        value: 'claude',
        label: 'Claude Code',
        hint: 'includes skills & Claude-specific docs',
      },
      {
        value: 'universal',
        label: 'Other AI assistant',
        hint: 'universal docs for any AI tool',
      },
    ],
  })
  if (clack.isCancel(choice)) {
    clack.cancel('Cancelled.')
    process.exit(130)
  }
  return choice === 'claude'
}

function setupAgentsMd(aiSourceDir: string, cwd: string): void {
  const sourceFile = join(aiSourceDir, 'AGENTS.md')
  const targetFile = resolve(cwd, 'AGENTS.md')

  if (!existsSync(sourceFile)) {
    logger.warn('Source AGENTS.md not found in the installed package.')
    return
  }

  if (!existsSync(targetFile)) {
    copyFileSync(sourceFile, targetFile)
    logger.success('Created root AGENTS.md with the Oxygen UI guide.')
    return
  }

  const content = readFileSync(targetFile, 'utf-8')
  if (content.includes(AGENTS_IMPORT_MARKER)) {
    logger.info('  Root AGENTS.md already contains the Oxygen UI reference.')
    return
  }
  writeFileSync(targetFile, content + AGENTS_IMPORT_REFERENCE)
  logger.success('Updated root AGENTS.md with the Oxygen UI reference.')
}

function updateRootClaudeMd(cwd: string): void {
  const targetFile = resolve(cwd, 'CLAUDE.md')

  if (!existsSync(targetFile)) {
    writeFileSync(targetFile, `# Project Guidelines\n${CLAUDE_IMPORT_REFERENCE}`)
    logger.success('Created root CLAUDE.md with the Oxygen UI reference.')
    return
  }

  const content = readFileSync(targetFile, 'utf-8')
  if (content.includes(CLAUDE_IMPORT_MARKER)) {
    logger.info('  Root CLAUDE.md already contains the Oxygen UI reference.')
    return
  }
  writeFileSync(targetFile, content + CLAUDE_IMPORT_REFERENCE)
  logger.success('Updated root CLAUDE.md with the Oxygen UI reference.')
}

function copySkills(claudeSourceDir: string, cwd: string, includeInternal: boolean): void {
  const skillsSourceDir = join(claudeSourceDir, 'skills')
  if (!existsSync(skillsSourceDir)) {
    logger.info('  No skills directory found in the installed package.')
    return
  }

  const skillDirs = readdirSync(skillsSourceDir).filter(entry => {
    const fullPath = join(skillsSourceDir, entry)
    if (!statSync(fullPath).isDirectory()) return false
    return includeInternal || !INTERNAL_SKILLS.includes(entry)
  })

  for (const skillDir of skillDirs) {
    copyDirRecursive(join(skillsSourceDir, skillDir), resolve(cwd, '.claude', 'skills', skillDir))
    logger.success(`Copied skill: ${skillDir}`)
  }
}

function copyUniversalDocs(source: DocsSource, cwd: string): void {
  const copied = copyFilesByExtension(source.aiDir, resolve(cwd, '.ai', 'oxygen-ui'), ['.md'])
  if (copied === 0) {
    throw new CliError(
      'No AI documentation found in the installed @wso2/oxygen-ui package. ' +
        'Upgrade to a newer version and try again.'
    )
  }
  logger.success(`Copied ${copied} documentation file(s) to .ai/oxygen-ui/`)
}

function copyClaudeDocs(source: DocsSource, cwd: string): void {
  const copied = copyFilesByExtension(source.claudeDir, resolve(cwd, '.claude', 'oxygen-ui'), ['.md'])
  if (copied === 0) {
    throw new CliError(
      'No Claude documentation found in the installed @wso2/oxygen-ui package. ' +
        'Upgrade to a newer version and try again.'
    )
  }
  logger.success(`Copied ${copied} documentation file(s) to .claude/oxygen-ui/`)
}

async function resolveMode(options: AiOptions, previous: 'claude' | 'universal' | null): Promise<boolean> {
  if (options.claude) return true
  if (previous === 'claude') {
    logger.info('Detected previous Claude Code setup.')
    return true
  }
  if (previous === 'universal') {
    logger.info('Detected previous universal setup.')
    return false
  }
  return promptForMode()
}

export async function aiInitCommand(options: AiOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd()
  const source = resolveDocsSource(cwd)
  const claudeMode = options.claude ?? (await promptForMode())

  if (options.internal && !claudeMode) {
    logger.info('Note: --internal is only supported with Claude Code mode (--claude).')
  }

  if (claudeMode) {
    logger.title('Oxygen UI - AI Integration Setup (Claude Code)')
    copyClaudeDocs(source, cwd)
    copySkills(source.claudeDir, cwd, options.internal ?? false)
    updateRootClaudeMd(cwd)
    logger.break()
    logger.success('Setup complete. Claude Code now has access to Oxygen UI docs and skills.')
  } else {
    logger.title('Oxygen UI - AI Integration Setup (Universal)')
    copyUniversalDocs(source, cwd)
    setupAgentsMd(source.aiDir, cwd)
    logger.break()
    logger.success('Setup complete. AI assistants now have access to Oxygen UI docs.')
  }
}

export async function aiUpdateCommand(options: AiOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd()
  const source = resolveDocsSource(cwd)
  const claudeMode = await resolveMode(options, detectPreviousMode(cwd))

  if (claudeMode) {
    logger.title('Oxygen UI - Updating AI Documentation (Claude Code)')
    copyClaudeDocs(source, cwd)
    copySkills(source.claudeDir, cwd, options.internal ?? false)
  } else {
    logger.title('Oxygen UI - Updating AI Documentation (Universal)')
    copyUniversalDocs(source, cwd)
  }
  logger.break()
  logger.success('Update complete.')
}
