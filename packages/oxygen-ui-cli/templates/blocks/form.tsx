import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Form,
  FormControlLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@wso2/oxygen-ui'

interface RegistrationValues {
  email: string
  username: string
  password: string
  confirmPassword: string
  organization: string
  agreeToTerms: boolean
}

type RegistrationErrors = Partial<Record<keyof RegistrationValues, string>>

const initialValues: RegistrationValues = {
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  organization: '',
  agreeToTerms: false,
}

function validate(values: RegistrationValues): RegistrationErrors {
  const errors: RegistrationErrors = {}

  if (!values.email) {
    errors.email = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Invalid email format'
  }

  if (!values.username) {
    errors.username = 'Username is required'
  } else if (values.username.length < 3) {
    errors.username = 'Username must be at least 3 characters'
  } else if (values.username.length > 20) {
    errors.username = 'Username must not exceed 20 characters'
  }

  if (!values.password) {
    errors.password = 'Password is required'
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(values.password)) {
    errors.password =
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm password is required'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords must match'
  }

  if (!values.organization) {
    errors.organization = 'Organization is required'
  }

  if (!values.agreeToTerms) {
    errors.agreeToTerms = 'You must accept the terms and conditions'
  }

  return errors
}

export default function RegistrationFormPage() {
  const [values, setValues] = useState<RegistrationValues>(initialValues)
  const [errors, setErrors] = useState<RegistrationErrors>({})
  const [submitted, setSubmitted] = useState<RegistrationValues | null>(null)

  const setField = <Field extends keyof RegistrationValues>(
    field: Field,
    value: RegistrationValues[Field]
  ) => {
    setValues(previous => ({ ...previous, [field]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setSubmitted(Object.keys(nextErrors).length === 0 ? values : null)
  }

  const handleReset = () => {
    setValues(initialValues)
    setErrors({})
    setSubmitted(null)
  }

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', padding: 3 }}>
      <Form.Stack spacing={3}>
        <Box>
          <Form.Header>User Registration Form</Form.Header>
          <Form.Body>Example of a form with client-side validation</Form.Body>
        </Box>

        <Form.Section>
          <form onSubmit={handleSubmit} noValidate>
            <Form.Stack spacing={3}>
              <Form.ElementWrapper label="Email Address" name="email">
                <TextField
                  id="email"
                  placeholder="user@example.com"
                  value={values.email}
                  onChange={event => setField('email', event.target.value)}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  fullWidth
                />
              </Form.ElementWrapper>

              <Form.ElementWrapper label="Username" name="username">
                <TextField
                  id="username"
                  placeholder="Enter username"
                  value={values.username}
                  onChange={event => setField('username', event.target.value)}
                  error={Boolean(errors.username)}
                  helperText={errors.username}
                  fullWidth
                />
              </Form.ElementWrapper>

              <Form.Stack direction="row" spacing={2}>
                <Form.ElementWrapper label="Password" name="password">
                  <TextField
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={values.password}
                    onChange={event => setField('password', event.target.value)}
                    error={Boolean(errors.password)}
                    helperText={errors.password}
                    fullWidth
                  />
                </Form.ElementWrapper>

                <Form.ElementWrapper label="Confirm Password" name="confirmPassword">
                  <TextField
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={values.confirmPassword}
                    onChange={event => setField('confirmPassword', event.target.value)}
                    error={Boolean(errors.confirmPassword)}
                    helperText={errors.confirmPassword}
                    fullWidth
                  />
                </Form.ElementWrapper>
              </Form.Stack>

              <Box>
                <Form.ElementWrapper label="Organization" name="organization">
                  <Select
                    id="organization"
                    value={values.organization}
                    onChange={event => setField('organization', event.target.value)}
                    error={Boolean(errors.organization)}
                    displayEmpty
                    fullWidth
                  >
                    <MenuItem value="">Select an organization</MenuItem>
                    <MenuItem value="wso2">WSO2</MenuItem>
                    <MenuItem value="asgardeo">Asgardeo</MenuItem>
                    <MenuItem value="choreo">Choreo</MenuItem>
                  </Select>
                </Form.ElementWrapper>
                {errors.organization && (
                  <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                    {errors.organization}
                  </Typography>
                )}
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values.agreeToTerms}
                      onChange={event => setField('agreeToTerms', event.target.checked)}
                    />
                  }
                  label="I agree to the terms and conditions"
                />
                {errors.agreeToTerms && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', ml: 2 }}>
                    {errors.agreeToTerms}
                  </Typography>
                )}
              </Box>

              <Form.Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="text" size="large" onClick={handleReset}>
                  Reset
                </Button>
                <Button variant="contained" size="large" type="submit">
                  Register
                </Button>
              </Form.Stack>
            </Form.Stack>
          </form>
        </Form.Section>

        {submitted && (
          <Alert severity="success">
            <Typography variant="h6" gutterBottom>
              Form Submitted Successfully!
            </Typography>
            <Typography variant="body2" component="pre" sx={{ mt: 1 }}>
              {JSON.stringify(submitted, null, 2)}
            </Typography>
          </Alert>
        )}
      </Form.Stack>
    </Box>
  )
}
