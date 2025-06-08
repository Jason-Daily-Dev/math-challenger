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
  FormControl
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
  const [feedback, setFeedback] = useState<string>('')

  const fetchQuestion = async () => {
      const response = await fetch('/api/questions/random', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Fetched question:', data)
    setQuestion(data)
    setSelected(null)
    setFeedback('')
  }

  useEffect(() => {
    fetchQuestion()
  }, [])

  const checkAnswer = () => {
    if (!question || selected === null) return
    const correct = question.answers.find(a => a.id === selected)?.correct
    setFeedback(correct ? '✅ Correct!' : '❌ Try again.')
  }

  return (
    <Card variant="outlined">
      <CardContent>
        {question && question.answers ? (
          <>
            <Typography variant="h6">{question.question}</Typography>
            <FormControl>
              <RadioGroup value={selected} onChange={(e) => setSelected(parseInt(e.target.value))}>
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
            <Box mt={2}>
              <Button variant="contained" onClick={checkAnswer}>Submit</Button>
              <Button onClick={fetchQuestion} style={{ marginLeft: '1rem' }}>Next</Button>
            </Box>
            {feedback && <Typography mt={2}>{feedback}</Typography>}
          </>
        ) : (
          <Typography>Loading...</Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default Quiz