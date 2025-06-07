import random

import app.models
from app.db.session import get_db
from app.models import Answer, Question
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

router = APIRouter()


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
        "answers": [{"id": a.id, "answer": a.answer} for a in answers],
    }
