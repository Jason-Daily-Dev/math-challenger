import asyncio
import json
import os
import sys

# Add backend/src to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../src")))

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

SEED_FILE = os.path.join(os.path.dirname(__file__), "questions-answers.json")


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
        with open(SEED_FILE, "r") as f:
            data = json.load(f)

        for item in data:
            question_text = item["question"]
            if await record_exists(session, Question, question=question_text):
                print(f"Question '{question_text}' already exists. Skipping.")
                continue

            q = Question(question=question_text)
            session.add(q)
            await session.flush()

            answer_objs = [
                Answer(question_id=q.id, answer=a["answer"], correct=a["correct"])
                for a in item["answers"]
            ]
            session.add_all(answer_objs)

        # Seed test user
        if not await record_exists(session, User, username="test_user"):
            session.add(User(username="test_user"))
        else:
            print("User 'test_user' already exists. Skipping.")

        await session.commit()


async def init_and_seed():
    await create_missing_tables()
    await seed_data()


if __name__ == "__main__":
    asyncio.run(init_and_seed())
