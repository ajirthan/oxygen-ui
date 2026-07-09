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

/**
 * Dependency version ranges used by generated projects. Kept in one place so
 * they are easy to bump alongside Oxygen UI releases.
 */

export const OXYGEN_UI_PACKAGE = '@wso2/oxygen-ui'
export const OXYGEN_UI_ICONS_PACKAGE = '@wso2/oxygen-ui-icons-react'
export const OXYGEN_UI_CHARTS_PACKAGE = '@wso2/oxygen-ui-charts-react'
export const OXYGEN_UI_ESLINT_PLUGIN_PACKAGE = '@wso2/eslint-plugin-oxygen-ui'

/** Runtime dependencies of a generated app. */
export const APP_DEPENDENCIES: Record<string, string> = {
  [OXYGEN_UI_PACKAGE]: '^0.12.0',
  [OXYGEN_UI_ICONS_PACKAGE]: '^0.12.0',
  react: '^19.2.0',
  'react-dom': '^19.2.0',
}

/** Development dependencies of a generated app. */
export const APP_DEV_DEPENDENCIES: Record<string, string> = {
  '@eslint/js': '^9.39.0',
  '@types/node': '^24.6.0',
  '@types/react': '^19.2.2',
  '@types/react-dom': '^19.2.2',
  '@vitejs/plugin-react-swc': '^4.2.0',
  eslint: '^9.39.0',
  'eslint-plugin-react-hooks': '^5.2.0',
  'eslint-plugin-react-refresh': '^0.4.24',
  globals: '^16.4.0',
  typescript: '~5.9.3',
  'typescript-eslint': '^8.45.0',
  vite: '^7.1.12',
}
