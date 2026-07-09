import { Box, Button, Stack, Typography } from '@wso2/oxygen-ui'

export default function EmptyStatePage() {
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
          <Typography variant="h4">Projects</Typography>
          <Button variant="contained" color="primary">
            New Project
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
        }}
      >
        <Stack spacing={3} alignItems="center" sx={{ maxWidth: 400, textAlign: 'center' }}>
          <Typography variant="h5">No projects yet</Typography>
          <Typography variant="body1" color="text.secondary">
            Get started by creating your first project. Projects help you organize and manage your
            work effectively.
          </Typography>
          <Button variant="contained" color="primary" size="large">
            Create Your First Project
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}
