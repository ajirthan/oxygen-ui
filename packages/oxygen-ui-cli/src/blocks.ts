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

export interface BlockDefinition {
  /** Identifier used on the command line, e.g. `oxygen-ui-cli add login`. */
  id: string
  /** Name of the exported React component (also used for the file name). */
  componentName: string
  description: string
}

/**
 * Page templates available through `oxygen-ui-cli add`. Each block has a
 * matching `templates/blocks/<id>.tsx` file that only imports from
 * `@wso2/oxygen-ui` and `@wso2/oxygen-ui-icons-react`.
 */
export const BLOCKS: BlockDefinition[] = [
  {
    id: 'login',
    componentName: 'LoginPage',
    description: 'Split-screen login page with social sign-in and product highlights',
  },
  {
    id: 'dashboard',
    componentName: 'DashboardPage',
    description: 'Dashboard with stat cards, recent activity, and quick actions',
  },
  {
    id: 'wizard',
    componentName: 'WizardPage',
    description: 'Multi-step wizard flow built with Form.Wizard',
  },
  {
    id: 'empty-state',
    componentName: 'EmptyStatePage',
    description: 'Empty state placeholder with a call to action',
  },
  {
    id: 'form',
    componentName: 'RegistrationFormPage',
    description: 'Registration form with client-side validation',
  },
  {
    id: 'tabbed-content',
    componentName: 'TabbedContentPage',
    description: 'Tabbed content layout using MUI Tabs',
  },
]

export function findBlock(id: string): BlockDefinition | undefined {
  return BLOCKS.find(block => block.id === id)
}

export function blockFileName(block: BlockDefinition): string {
  return `${block.componentName}.tsx`
}
