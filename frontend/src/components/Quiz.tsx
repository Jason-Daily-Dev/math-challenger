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
  CssBaseline,
  LinearProgress,
  Slide,
  SvgIcon
} from '@mui/material'

// Custom SVG icons to replace Material UI icons
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <SvgIcon {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </SvgIcon>
);

const CancelIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <SvgIcon {...props}>
    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
  </SvgIcon>
);

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
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left')
  const [questionHistory, setQuestionHistory] = useState<{id: number, correct: boolean | null}[]>([])
  const [showSlide, setShowSlide] = useState(true)

  const fetchQuestion = async () => {
    try {
      // Start exit animation
      setShowSlide(false)

      // Set direction for next slide
      setSlideDirection('right')
      
      // Wait a bit for exit animation
      setTimeout(async () => {
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
        
        if (isCorrect !== null) {
          // Add current question to history before moving to next
          if (question) {
            setQuestionHistory(prev => [...prev, {id: question.id, correct: isCorrect}])
          }
          setIsCorrect(null)
        }

        // Start entry animation
        setShowSlide(true)
      }, 300)
    } catch (error) {
      console.error('Error fetching question:', error)
    }
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
        flexDirection="column"
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
        {/* Progress bar and stats */}
        <Box 
          sx={{
            width: '90%', 
            maxWidth: 600,
            mb: 2,
            mt: -8,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <CheckCircleIcon sx={{ color: '#4caf50', mr: 1 }} />
              <Typography color="#f0f0f5">
                {questionHistory.filter(q => q.correct).length}
              </Typography>
            </Box>
            <Typography color="#f0f0f5">
              Question {questionHistory.length + 1}
            </Typography>
            <Box display="flex" alignItems="center">
              <CancelIcon sx={{ color: '#f44336', mr: 1 }} />
              <Typography color="#f0f0f5">
                {questionHistory.filter(q => q.correct === false).length}
              </Typography>
            </Box>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={questionHistory.length > 0 ? (questionHistory.filter(q => q.correct).length / questionHistory.length) * 100 : 0} 
            sx={{ 
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#4caf50'
              }
            }}
          />
        </Box>

        {/* Question card with slide animation */}
        <Slide 
          direction={slideDirection} 
          in={showSlide} 
          mountOnEnter 
          unmountOnExit
          timeout={300}
        >
          <Card sx={{ 
            maxWidth: 600, 
            width: '90%',
            padding: 4,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            borderRadius: '16px',
            backgroundColor: '#2a2a2a',
            color: '#f0f0f5'
          }}>
            <CardContent>
              {question && question.answers ? (
                <Stack spacing={4}>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    sx={{ 
                      color: '#f0f0f5',
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
                                  color: '#0070c9'
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
                      disabled={selected === null || isCorrect !== null}
                      sx={{ 
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        backgroundColor: '#0070c9',
                        color: '#ffffff',
                        '&:hover': {
                          backgroundColor: '#0077CC'
                        },
                        '&:disabled': {
                          color: 'rgba(255, 255, 255, 0.5)'
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
                        color: '#0070c9',
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
        </Slide>
      </Box>
    </ThemeProvider>
  )
}

export default Quiz