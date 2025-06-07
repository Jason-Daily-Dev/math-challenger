import asyncio
import os

from app.models import Answer, Base, Question, User
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_and_seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Create question
        q = Question(question="What is 2 + 2?")
        session.add(q)
        await session.flush()  # to get q.id

        # Create 4 answers, one correct
        answers = [
            Answer(question_id=q.id, answer="3", correct=False),
            Answer(question_id=q.id, answer="4", correct=True),
            Answer(question_id=q.id, answer="5", correct=False),
            Answer(question_id=q.id, answer="22", correct=False),
        ]
        session.add_all(answers)

        # Create a user
        user = User(username="test_user")
        session.add(user)

        await session.commit()


if __name__ == "__main__":
    asyncio.run(init_and_seed())
