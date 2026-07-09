import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@wso2/oxygen-ui'

const stats = [
  { label: 'Total Users', value: '2,543', change: '+12.5% from last month', positive: true },
  { label: 'Active Sessions', value: '1,823', change: '+8.2% from last month', positive: true },
  { label: 'Total Revenue', value: '$45.2K', change: '-3.1% from last month', positive: false },
  { label: 'Conversion Rate', value: '3.24%', change: '+0.8% from last month', positive: true },
]

const quickActions = ['Create New User', 'Export Data', 'View Reports', 'Settings']

export default function DashboardPage() {
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
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Dashboard</Typography>
          <Button variant="contained" color="primary">
            New Item
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          flex: 1,
          padding: 4,
          overflow: 'auto',
        }}
      >
        <Grid container spacing={3}>
          {stats.map(stat => (
            <Grid key={stat.label} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {stat.label}
                  </Typography>
                  <Typography variant="h4">{stat.value}</Typography>
                  <Typography
                    variant="caption"
                    color={stat.positive ? 'success.main' : 'error.main'}
                  >
                    {stat.change}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Recent Activity
                </Typography>
                <Divider sx={{ marginY: 2 }} />

                <Stack spacing={2}>
                  {[1, 2, 3, 4, 5].map(item => (
                    <Box key={item}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body1">User Action {item}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item} hour{item > 1 ? 's' : ''} ago
                          </Typography>
                        </Box>
                        <Button size="small" variant="outlined">
                          View
                        </Button>
                      </Stack>
                      {item < 5 && <Divider sx={{ marginTop: 2 }} />}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Divider sx={{ marginY: 2 }} />

                <Stack spacing={2}>
                  {quickActions.map(action => (
                    <Button key={action} fullWidth variant="outlined">
                      {action}
                    </Button>
                  ))}
                </Stack>

                <Divider sx={{ marginY: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Recent Notifications
                </Typography>
                <Stack spacing={1.5} sx={{ marginTop: 2 }}>
                  {[1, 2, 3].map(item => (
                    <Box key={item}>
                      <Typography variant="body2">Notification message {item}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item * 5} minutes ago
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
