import random

from app.db.session import get_db
from app.models import Answer, Question
from app.routes.dependencies.auth import get_token_validator
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

token_validator = get_token_validator()
router = APIRouter(dependencies=[Depends(token_validator)])


@router.get("/random")
async def get_random_question(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question))
    questions = result.scalars().all()

    if not questions:
        raise HTTPException(status_code=404, detail="No questions found")

    question = random.choice(questions)

    result = await db.execute(select(Answer).where(Answer.question_id == question.id))
    answers = result.scalars().all()
    random.shuffle(answers)

    return {
        "id": question.id,
        "question": question.question,
        "answers": [
            {"id": a.id, "answer": a.answer, "correct": a.correct} for a in answers
        ],
    }


@router.get("/ten")
async def get_random_question(db: AsyncSession = Depends(get_db)):
    """Get 10 questions with their answers."""
    result = await db.execute(select(Question))
    questions = result.scalars().all()

    if not questions:
        raise HTTPException(status_code=404, detail="No questions found")

    selected_questions = random.sample(questions, min(10, len(questions)))
    questions_with_answers = []
    for question in selected_questions:
        result = await db.execute(
            select(Answer).where(Answer.question_id == question.id)
        )
        answers = result.scalars().all()
        random.shuffle(answers)

        questions_with_answers.append(
            {
                "id": question.id,
                "question": question.question,
                "answers": [{"id": a.id, "answer": a.answer} for a in answers],
            }
        )
    return questions_with_answers
