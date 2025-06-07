import asyncio
import os

from app.models import Answer, Base, Question, User
from dotenv import load_dotenv
from sqlalchemy import inspect, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Using database URL: {DATABASE_URL}")
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def create_missing_tables():
    async with engine.begin() as conn:

        def create_tables_if_missing(sync_conn):
            inspector = inspect(sync_conn)
            for table in Base.metadata.sorted_tables:
                print(f"Detected table: {table.name}")
                if not inspector.has_table(table.name):
                    table.create(bind=sync_conn)

        await conn.run_sync(create_tables_if_missing)


async def record_exists(session: AsyncSession, model, **kwargs) -> bool:
    stmt = select(model).filter_by(**kwargs)
    result = await session.execute(stmt)
    return result.first() is not None


async def seed_data():
    async with AsyncSessionLocal() as session:
        # Seed question and answers
        question_text = "What is 2 + 2?"
        if not await record_exists(session, Question, question=question_text):
            q = Question(question=question_text)
            session.add(q)
            await session.flush()

            answers = [
                Answer(question_id=q.id, answer="3", correct=False),
                Answer(question_id=q.id, answer="4", correct=True),
                Answer(question_id=q.id, answer="5", correct=False),
                Answer(question_id=q.id, answer="22", correct=False),
            ]
            session.add_all(answers)
        else:
            print("Question already exists. Skipping.")

        # Seed user
        if not await record_exists(session, User, username="test_user"):
            session.add(User(username="test_user"))
        else:
            print("User already exists. Skipping.")

        await session.commit()


async def init_and_seed():
    await create_missing_tables()
    await seed_data()


if __name__ == "__main__":
    asyncio.run(init_and_seed())
