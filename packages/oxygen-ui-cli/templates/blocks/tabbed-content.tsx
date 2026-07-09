import { useState } from 'react'
import { Box, Card, CardContent, Tab, Tabs, Typography } from '@wso2/oxygen-ui'

const tabs = [
  {
    label: 'Overview',
    title: 'Overview Analytics',
    body: 'This section displays comprehensive analytics data for your application. Switch between tabs to view different metrics and insights.',
  },
  {
    label: 'Performance',
    title: 'Performance Metrics',
    body: 'Track response times, throughput, and resource usage across your services.',
  },
  {
    label: 'Users',
    title: 'User Insights',
    body: 'Understand how users interact with your application, including sessions and retention.',
  },
  {
    label: 'Settings',
    title: 'Analytics Settings',
    body: 'Configure data sources, sampling rates, and reporting preferences.',
  },
]

export default function TabbedContentPage() {
  const [activeTab, setActiveTab] = useState(0)
  const current = tabs[activeTab]

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          padding: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h4" gutterBottom>
          Analytics
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          padding: 4,
          overflow: 'auto',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_event, value) => setActiveTab(value)}
          sx={{ mb: 3 }}
        >
          {tabs.map(tab => (
            <Tab key={tab.label} label={tab.label} />
          ))}
        </Tabs>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {current.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {current.body}
            </Typography>
            <Box
              sx={{
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'action.hover',
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Chart Visualization Area
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
