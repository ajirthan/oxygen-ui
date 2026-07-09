import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  OxygenUIThemeProvider,
  OxygenTheme,
  AcrylicOrangeTheme,
  AcrylicPurpleTheme,
  ClassicTheme,
  HighContrastTheme,
  PaleGrayTheme,
  PaleIndigoTheme,
  WSO2Theme,
} from '@wso2/oxygen-ui'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OxygenUIThemeProvider
      themes={[
        { key: 'oxygen', label: 'Oxygen', theme: OxygenTheme },
        { key: 'acrylicOrange', label: 'Acrylic Orange', theme: AcrylicOrangeTheme },
        { key: 'acrylicPurple', label: 'Acrylic Purple', theme: AcrylicPurpleTheme },
        { key: 'classic', label: 'Classic', theme: ClassicTheme },
        { key: 'highContrast', label: 'High Contrast', theme: HighContrastTheme },
        { key: 'paleGray', label: 'Pale Gray', theme: PaleGrayTheme },
        { key: 'paleIndigo', label: 'Pale Indigo', theme: PaleIndigoTheme },
        { key: 'wso2', label: 'WSO2', theme: WSO2Theme },
      ]}
      initialTheme="oxygen"
    >
      <App />
    </OxygenUIThemeProvider>
  </StrictMode>,
)
