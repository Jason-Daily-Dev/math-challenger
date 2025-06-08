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
  Stack
} from '@mui/material'

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
    <Box
      height="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
      bgcolor="#f5f7fa"
      px={2}
    >
      <Card sx={{ maxWidth: 500, width: '100%', padding: 3 }}>
        <CardContent>
          {question && question.answers ? (
            <Stack spacing={3}>
              <Typography variant="h5" fontWeight="bold">
                {question.question}
              </Typography>

              <FormControl>
                <RadioGroup
                  value={selected}
                  onChange={(e) => setSelected(parseInt(e.target.value))}
                >
                  {question.answers.map((ans) => (
                    <FormControlLabel
                      key={ans.id}
                      value={ans.id}
                      control={<Radio />}
                      label={ans.answer}
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              <Box display="flex" justifyContent="space-between">
                <Button
                  variant="contained"
                  onClick={checkAnswer}
                  disabled={selected === null}
                >
                  Submit
                </Button>
                <Button onClick={fetchQuestion}>Next</Button>
              </Box>

              {feedback && (
                <Alert severity={isCorrect ? 'success' : 'error'}>
                  {feedback}
                </Alert>
              )}
            </Stack>
          ) : (
            <Typography>Loading...</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default Quiz