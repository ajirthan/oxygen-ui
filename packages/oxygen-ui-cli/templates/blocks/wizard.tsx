import { useState } from 'react'
import { Alert, Box, Button, Form, TextField, Typography } from '@wso2/oxygen-ui'

export default function WizardPage() {
  const [activeStep, setActiveStep] = useState(0)
  const [completed, setCompleted] = useState(false)

  const steps = [
    {
      label: 'Select Campaign Type',
      component: (
        <Form.Stack spacing={2} flexGrow={1}>
          <Form.Header>Select Campaign Type</Form.Header>
          <Form.Body>Choose the type of campaign you want to create</Form.Body>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Box sx={{ width: 200 }}>
              <Form.CardButton>
                <Form.CardContent>
                  <Typography variant="h6">Email Campaign</Typography>
                  <Typography variant="caption">Send emails to your subscribers</Typography>
                </Form.CardContent>
              </Form.CardButton>
            </Box>
            <Box sx={{ width: 200 }}>
              <Form.CardButton>
                <Form.CardContent>
                  <Typography variant="h6">SMS Campaign</Typography>
                  <Typography variant="caption">Send SMS to your contacts</Typography>
                </Form.CardContent>
              </Form.CardButton>
            </Box>
          </Box>
        </Form.Stack>
      ),
    },
    {
      label: 'Campaign Details',
      component: (
        <Form.Stack spacing={2} flexGrow={1}>
          <Form.Header>Campaign Details</Form.Header>
          <Form.ElementWrapper label="Campaign Name" name="campaignName">
            <TextField id="campaignName" placeholder="Enter campaign name" fullWidth />
          </Form.ElementWrapper>
          <Form.ElementWrapper label="Description" name="description">
            <TextField
              id="description"
              placeholder="Enter description"
              multiline
              minRows={3}
              fullWidth
            />
          </Form.ElementWrapper>
        </Form.Stack>
      ),
    },
    {
      label: 'Review & Launch',
      component: (
        <Form.Stack spacing={2} flexGrow={1}>
          <Form.Header>Review & Launch</Form.Header>
          <Form.Body>Review your campaign details before launching</Form.Body>
          <Alert severity={completed ? 'info' : 'success'}>
            <Typography variant="body2">
              {completed ? 'Campaign launched!' : 'Your campaign is ready to launch!'}
            </Typography>
          </Alert>
        </Form.Stack>
      ),
    },
  ]

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', padding: 3 }}>
      <Form.Wizard
        steps={steps}
        activeStep={activeStep}
        actions={
          <Form.Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button
              variant="text"
              onClick={() => setActiveStep(previous => previous - 1)}
              disabled={activeStep === 0}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                if (activeStep === steps.length - 1) {
                  setCompleted(true)
                  setActiveStep(0)
                } else {
                  setActiveStep(previous => previous + 1)
                }
              }}
            >
              {activeStep === steps.length - 1 ? 'Launch' : 'Next'}
            </Button>
          </Form.Stack>
        }
      />
    </Box>
  )
}
