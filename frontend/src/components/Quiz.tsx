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
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left')
  const [questionHistory, setQuestionHistory] = useState<{ id: number, correct: boolean | null }[]>([])
  const [currentAnswered, setCurrentAnswered] = useState<{ id: number, correct: boolean | null } | null>(null)
  const [showSlide, setShowSlide] = useState(true)
  const [timeLeft, setTimeLeft] = useState<number>(120) // 2 minutes in seconds
  const [timerActive, setTimerActive] = useState<boolean>(false)
  const [timedOut, setTimedOut] = useState<boolean>(false)

  const fetchQuestion = async () => {
    try {
      // Start exit animation
      setShowSlide(false)

      // Set direction for next slide
      setSlideDirection('right')
      
      // If we have a current answered question, add it to history before moving on
      if (currentAnswered) {
        setQuestionHistory(prev => [...prev, currentAnswered])
        setCurrentAnswered(null)
      }

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
        setIsCorrect(null) // Reset isCorrect when fetching a new question
        setTimeLeft(120) // Reset timer to 2 minutes
        setTimerActive(true) // Start timer
        setTimedOut(false) // Reset timeout status

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
  
  // Timer effect
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          // Time's up - show correct answer and mark as timed out
          setTimedOut(true)
          setIsCorrect(null)
          if (question) {
            setCurrentAnswered({ id: question.id, correct: null }) // mark as unanswered (null)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [timerActive, timeLeft, question])

  const checkAnswer = () => {
    if (!question || selected === null) return
    const correct = question.answers.find(a => a.id === selected)?.correct
    setIsCorrect(!!correct)
    
    // Store current answer but don't update history yet
    setCurrentAnswered({ id: question.id, correct: !!correct })
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
          {/* Timer display with prominent size */}
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center"
            mb={2}
          >
            <SvgIcon sx={{ color: '#9e9e9e', mr: 1, fontSize: 24 }}>
              <path d="M11 2v2H9v2h2v2h2V6h2V4h-2V2h-2zm4.1 7.87c-.5-.51-1.18-.87-1.97-1.03v-3h-1v4.7c-1.07.83-1.35 2.05-.71 3.13c.54.9 1.6 1.33 2.58 1.03c1.05-.32 1.79-1.32 1.79-2.43c0-.64-.22-1.2-.59-1.67l4.09-4.08l-1.42-1.42l-2.77 2.77z" />
            </SvgIcon>
            <Typography color="#f0f0f5" fontSize="1.5rem" fontWeight="medium">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </Typography>
          </Box>

          {/* Question number */}
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            mb={2}
          >
            <Typography color="#f0f0f5" fontWeight="medium" fontSize="1.2rem">
              Question {questionHistory.length + 1}
            </Typography>
          </Box>

          {/* Score counts with consistent ordering (correct, unanswered, incorrect) */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Box display="flex" alignItems="center">
              <CheckCircleIcon sx={{ color: '#4caf50', mr: 1 }} />
              <Typography color="#f0f0f5">
                {questionHistory.filter(q => q.correct).length + (currentAnswered?.correct ? 1 : 0)}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <SvgIcon sx={{ color: '#ffc107', mr: 1 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8c0-4.42 3.58-8 8-8s8 3.58 8 8c0 4.42-3.58 8-8 8z" />
              </SvgIcon>
              <Typography color="#f0f0f5">
                {questionHistory.filter(q => q.correct === null).length + (currentAnswered?.correct === null ? 1 : 0)}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <CancelIcon sx={{ color: '#f44336', mr: 1 }} />
              <Typography color="#f0f0f5">
                {questionHistory.filter(q => q.correct === false).length + (currentAnswered?.correct === false ? 1 : 0)}
              </Typography>
            </Box>
          </Box>

          {/* Custom progress bar with green for correct, yellow for unanswered, red for incorrect */}
          <Box
            sx={{
              height: 8,
              borderRadius: 4,
              display: 'flex',
              overflow: 'hidden',
              width: '100%',
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          >
            {/* Green portion for correct answers */}
            <Box
              sx={{
                height: '100%',
                backgroundColor: '#4caf50',
                width: (() => {
                  const correctCount = questionHistory.filter(q => q.correct).length + (currentAnswered?.correct ? 1 : 0);
                  const totalQuestions = questionHistory.length + (currentAnswered ? 1 : 0);
                  return totalQuestions > 0 ? `${(correctCount / totalQuestions) * 100}%` : '0%';
                })(),
              }}
            />
            {/* Yellow portion for unanswered questions */}
            <Box
              sx={{
                height: '100%',
                backgroundColor: '#ffc107',
                width: (() => {
                  const unansweredCount = questionHistory.filter(q => q.correct === null).length + 
                                         (currentAnswered?.correct === null ? 1 : 0);
                  const totalQuestions = questionHistory.length + (currentAnswered ? 1 : 0);
                  return totalQuestions > 0 ? `${(unansweredCount / totalQuestions) * 100}%` : '0%';
                })(),
              }}
            />
            {/* Red portion for incorrect answers */}
            <Box
              sx={{
                height: '100%',
                backgroundColor: '#f44336',
                width: (() => {
                  const incorrectCount = questionHistory.filter(q => q.correct === false).length + 
                                        (currentAnswered?.correct === false ? 1 : 0);
                  const totalQuestions = questionHistory.length + (currentAnswered ? 1 : 0);
                  return totalQuestions > 0 ? `${(incorrectCount / totalQuestions) * 100}%` : '0%';
                })(),
              }}
            />
          </Box>
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
                      onChange={(e) => isCorrect === null && !timedOut && setSelected(parseInt(e.target.value))}
                    >
                      {question.answers.map((ans) => {
                        const isSelected = selected === ans.id;
                        const showCorrectIcon = (isCorrect !== null || timedOut) && ans.correct;
                        const showIncorrectIcon = isCorrect !== null && isSelected && !ans.correct;
                        
                        return (
                          <FormControlLabel
                            key={ans.id}
                            value={ans.id}
                            disabled={isCorrect !== null || timedOut}
                            control={
                              <Radio 
                                sx={{ 
                                  '& .MuiSvgIcon-root': {
                                    fontSize: 28,
                                    color: showCorrectIcon ? '#4caf50' : 
                                           showIncorrectIcon ? '#f44336' : 
                                           '#0070c9'
                                  }
                                }} 
                              />
                            }
                            label={
                              <Box display="flex" alignItems="center">
                                <Typography sx={{ fontSize: '1.2rem', color: '#f0f0f5' }}>
                                  {ans.answer}
                                </Typography>
                                {showCorrectIcon && (
                                  <CheckCircleIcon sx={{ color: '#4caf50', ml: 2 }} />
                                )}
                                {showIncorrectIcon && (
                                  <CancelIcon sx={{ color: '#f44336', ml: 2 }} />
                                )}
                              </Box>
                            }
                            sx={{ 
                              marginY: 1.5,
                              backgroundColor: showCorrectIcon ? 'rgba(76, 175, 80, 0.1)' : 
                                              showIncorrectIcon ? 'rgba(244, 67, 54, 0.1)' : 
                                              'transparent',
                              borderRadius: '8px',
                              '&:hover': {
                                backgroundColor: isCorrect === null ? 
                                  'rgba(255, 255, 255, 0.05)' : 
                                  showCorrectIcon ? 'rgba(76, 175, 80, 0.15)' : 
                                  showIncorrectIcon ? 'rgba(244, 67, 54, 0.15)' : 
                                  'transparent',
                              }
                            }}
                          />
                        );
                      })}
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
                      disabled={selected === null || isCorrect !== null || timedOut}
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
                          color: 'rgba(255, 255, 255, 0.5)',
                          backgroundColor: 'rgba(0, 112, 201, 0.3)'
                        }
                      }}
                    >
                      Submit
                    </Button>
                    <Button 
                      variant="outlined"
                      onClick={fetchQuestion}
                      disabled={isCorrect === null && !timedOut}
                      sx={{ 
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        borderColor: (isCorrect !== null || timedOut) ? '#0070c9' : 'rgba(0, 112, 201, 0.3)',
                        color: (isCorrect !== null || timedOut) ? '#0070c9' : 'rgba(0, 112, 201, 0.3)',
                        '&:hover': {
                          backgroundColor: (isCorrect !== null || timedOut) ? 'rgba(0, 112, 201, 0.1)' : 'transparent',
                          borderColor: '#0070c9'
                        },
                        '&:disabled': {
                          color: 'rgba(255, 255, 255, 0.3)',
                          borderColor: 'rgba(255, 255, 255, 0.3)'
                        }
                      }}
                    >
                      Next
                    </Button>
                  </Box>
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