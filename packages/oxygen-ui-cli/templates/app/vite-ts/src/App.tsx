import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  ColorSchemeToggle,
  Grid,
  Stack,
  ThemeSwitcher,
  Typography,
} from '@wso2/oxygen-ui'
import { BookOpen, Palette, Rocket } from '@wso2/oxygen-ui-icons-react'

const features = [
  {
    icon: <Rocket size={20} />,
    title: 'Ready to build',
    description: 'Vite, React, and TypeScript preconfigured with the Oxygen UI design system.',
  },
  {
    icon: <Palette size={20} />,
    title: 'Theming built in',
    description: 'Switch between preset themes and light/dark color schemes from the header.',
  },
  {
    icon: <BookOpen size={20} />,
    title: 'One import',
    description: 'Material UI components and WSO2 patterns, all from @wso2/oxygen-ui.',
  },
]

function App() {
  const [count, setCount] = useState(0)

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box
        component="header"
        sx={{ px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{{appName}}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <ThemeSwitcher size="small" />
            <ColorSchemeToggle />
          </Stack>
        </Stack>
      </Box>

      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <Stack spacing={4} alignItems="center" sx={{ maxWidth: 860, textAlign: 'center' }}>
          <Chip label="Powered by Oxygen UI" color="primary" variant="outlined" />
          <Typography variant="h2">{{appName}}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>
            This app is wired up with the WSO2 Oxygen UI design system. Edit
            <code> src/App.tsx</code> and save to get started.
          </Typography>

          <Stack direction="row" spacing={2}>
            <Button variant="contained" size="large" onClick={() => setCount(value => value + 1)}>
              count is {count}
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="https://github.com/wso2/oxygen-ui"
              target="_blank"
              rel="noreferrer"
            >
              View on GitHub
            </Button>
          </Stack>

          <Grid container spacing={2} sx={{ pt: 2 }}>
            {features.map(feature => (
              <Grid key={feature.title} size={{ xs: 12, sm: 4 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack spacing={1} alignItems="center">
                      {feature.icon}
                      <Typography variant="subtitle1">{feature.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Box>
    </Box>
  )
}

export default App
