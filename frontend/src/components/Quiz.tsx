import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert,
  Stack,
  createTheme,
  ThemeProvider,
  CssBaseline
} from '@mui/material'

// Custom theme with beautiful fonts
const theme = createTheme({
  typography: {
    fontFamily: [
      'SF Pro Display',
      'Helvetica Neue',
      'Arial',
      'sans-serif'
    ].join(','),
    h5: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1.2rem',
    },
    button: {
      fontSize: '1.1rem',
      fontWeight: 500,
    },
  },
  palette: {
    primary: {
      main: '#0070c9',
    },
    background: {
      default: '#2a2a2a', // Darker space gray for background
      paper: '#2a2a2a',   // Same color for cards
    },
    text: {
      primary: '#f0f0f5',  // Softer warm white (easier on eyes)
      secondary: '#c8c8d0', // Soft secondary text
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0,
          backgroundColor: '#2a2a2a',
          minHeight: '100vh',
          width: '100vw',
          overflow: 'hidden'
        },
        '#root': {
          minHeight: '100vh',
          width: '100vw',
        }
      }
    }
  }
});

interface Answer {
  id: number
  answer: string
  correct: boolean
}

interface Question {
  id: number
  question: string
  answers: Answer[]
}

const Quiz: React.FC = () => {
  const [question, setQuestion] = useState<Question | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const fetchQuestion = async () => {
    const response = await fetch('/api/questions/random', {
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    const data = await response.json()
    setQuestion(data)
    setSelected(null)
    setFeedback(null)
    setIsCorrect(null)
  }

  useEffect(() => {
    fetchQuestion()
  }, [])

  const checkAnswer = () => {
    if (!question || selected === null) return
    const correct = question.answers.find(a => a.id === selected)?.correct
    setIsCorrect(!!correct)
    setFeedback(correct ? '✅ Correct!' : '❌ Try again.')
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        minHeight="100vh"
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{
          fontFamily: theme.typography.fontFamily,
          backgroundColor: '#2a2a2a',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box'
        }}
      >
        <Card sx={{ 
          maxWidth: 600, 
          width: '90%',
          padding: 4,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          borderRadius: '16px',
          backgroundColor: '#2a2a2a', // Slightly lighter gray for card
          color: '#f0f0f5' // Softer warm white
        }}>
          <CardContent>
            {question && question.answers ? (
              <Stack spacing={4}>
                <Typography 
                  variant="h5" 
                  fontWeight="bold"
                  sx={{ 
                    color: '#e0e0e2', // Silver text
                    textAlign: 'center',
                    marginBottom: 2
                  }}
                >
                  {question.question}
                </Typography>

                <FormControl fullWidth>
                  <RadioGroup
                    value={selected}
                    onChange={(e) => setSelected(parseInt(e.target.value))}
                  >
                    {question.answers.map((ans) => (
                      <FormControlLabel
                        key={ans.id}
                        value={ans.id}
                        control={
                          <Radio 
                            sx={{ 
                              '& .MuiSvgIcon-root': {
                                fontSize: 28,
                                color: '#0070c9' // Apple blue
                              }
                            }} 
                          />
                        }
                        label={
                          <Typography sx={{ fontSize: '1.2rem', color: '#f0f0f5' }}>
                            {ans.answer}
                          </Typography>
                        }
                        sx={{ 
                          marginY: 1.5,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px'
                          }
                        }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>

                <Box 
                  display="flex" 
                  justifyContent="space-between"
                  mt={2}
                >
                  <Button
                    variant="contained"
                    onClick={checkAnswer}
                    disabled={selected === null}
                    sx={{ 
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      backgroundColor: '#0070c9', // Apple blue
                      color: '#ffffff', // White text for better contrast
                      '&:hover': {
                        backgroundColor: '#0077CC'
                      },
                      '&:disabled': {
                        color: 'rgba(255, 255, 255, 0.5)' // Better contrast for disabled button
                      }
                    }}
                  >
                    Submit
                  </Button>
                  <Button 
                    onClick={fetchQuestion}
                    sx={{ 
                      padding: '12px 24px',
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      color: '#0070c9', // Apple blue
                      '&:hover': {
                        backgroundColor: 'rgba(0, 112, 201, 0.1)'
                      }
                    }}
                  >
                    Next
                  </Button>
                </Box>

                {feedback && (
                  <Alert 
                    severity={isCorrect ? 'success' : 'error'}
                    sx={{ 
                      fontSize: '1.2rem',
                      borderRadius: '8px',
                      '& .MuiAlert-icon': {
                        fontSize: '1.5rem'
                      },
                      backgroundColor: isCorrect ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 76, 48, 0.15)',
                      color: isCorrect ? '#00c853' : '#ff4c30'
                    }}
                  >
                    {feedback}
                  </Alert>
                )}
              </Stack>
            ) : (
              <Typography variant="h6" textAlign="center" py={4} color="#f0f0f5">Loading...</Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  )
}

export default Quiz