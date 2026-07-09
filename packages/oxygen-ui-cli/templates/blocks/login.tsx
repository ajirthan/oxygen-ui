import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  InputLabel,
  Link,
  OutlinedInput,
  Paper,
  ParticleBackground,
  Stack,
  styled,
  Typography,
} from '@wso2/oxygen-ui'
import { Cloud, GitHub, Google, ShieldCheck, TerminalSquare, Zap } from '@wso2/oxygen-ui-icons-react'
import type { JSX } from 'react'

const StyledPaper = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  marginTop: theme.spacing(6),
  marginBottom: theme.spacing(6),
  [theme.breakpoints.up('sm')]: {
    width: '85%',
  },
}))

const highlights: {
  icon: JSX.Element
  title: string
  description: string
}[] = [
  {
    icon: <Cloud />,
    title: 'Flexible Identity Platform',
    description:
      'Centralizes identity management for both on-prem and cloud environments—no protocol lock-in.',
  },
  {
    icon: <ShieldCheck />,
    title: 'Zero-trust Security',
    description:
      'Leverage adaptive authentication, OIDC, and OAuth 2.0 to protect every login and session.',
  },
  {
    icon: <TerminalSquare />,
    title: 'Developer-first Experience',
    description: 'Configure auth flows and manage organizations with powerful SDKs and APIs.',
  },
  {
    icon: <Zap />,
    title: 'Extensible & Enterprise-ready',
    description:
      'Built for scale, integrates with your stack and CI/CD pipelines, and ready for any cloud.',
  },
]

const hasError = false

export default function LoginPage() {
  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      <ParticleBackground opacity={0.5} />
      <Grid container sx={{ flex: 1 }}>
        <Grid
          size={{ xs: 12, md: 7 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 18,
            textAlign: 'left',
            position: 'relative',
          }}
        >
          <Box>
            <Stack
              direction="column"
              alignItems="start"
              gap={5}
              maxWidth={580}
              display={{ xs: 'none', md: 'flex' }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Your Product
              </Typography>
              <Stack sx={{ flexDirection: 'column', alignSelf: 'center', gap: 4 }}>
                {highlights.map(item => (
                  <Stack key={item.title} direction="row" sx={{ gap: 2 }}>
                    {item.icon}
                    <div>
                      <Typography gutterBottom sx={{ fontWeight: 'medium' }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {item.description}
                      </Typography>
                    </div>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <StyledPaper>
            <Box
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2,
                width: '100%',
                maxWidth: 500,
                margin: 'auto',
              }}
            >
              <form method="POST" action="">
                <Box sx={{ mb: 6 }}>
                  <Typography variant="h3" gutterBottom>
                    Login to Account
                  </Typography>

                  <Typography>
                    Don&apos;t have an account? <Link href="">Sign up!</Link>
                  </Typography>
                </Box>

                <Box>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Google />}
                    color="secondary"
                    sx={{ my: 1 }}
                  >
                    Continue with Google
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<GitHub />}
                    color="secondary"
                    sx={{ my: 1 }}
                  >
                    Continue with GitHub
                  </Button>
                </Box>

                <Divider sx={{ my: 3 }}>or</Divider>

                {hasError && (
                  <Alert severity="error" sx={{ my: 2 }}>
                    You have entered either a wrong username or password!
                  </Alert>
                )}

                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    <InputLabel htmlFor="username">Username</InputLabel>
                    <OutlinedInput
                      type="text"
                      id="username"
                      name="username"
                      placeholder="Enter your username"
                      size="small"
                      required
                    />
                  </Box>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    <InputLabel htmlFor="password">Password</InputLabel>
                    <OutlinedInput
                      type="password"
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      size="small"
                      required
                    />
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <FormControlLabel
                      control={<Checkbox name="remember-me-checkbox" />}
                      label="Remember me"
                    />
                    <Link href="">Forgot your password?</Link>
                  </Box>

                  <Button variant="contained" color="primary" type="submit" fullWidth sx={{ mt: 2 }}>
                    Sign In
                  </Button>
                </Box>
              </form>
              <Box component="footer" sx={{ mt: 4 }}>
                <Typography sx={{ textAlign: 'center' }}>
                  © Copyright {new Date().getFullYear()}
                </Typography>
                <Stack direction="row" justifyContent="center" sx={{ mt: 2 }} spacing={1}>
                  <Link>Privacy Policy</Link>
                  <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                  <Link>Terms of Use</Link>
                </Stack>
              </Box>
            </Box>
          </StyledPaper>
        </Grid>
      </Grid>
    </Box>
  )
}
