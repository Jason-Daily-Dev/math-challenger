import os

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)


async def test_conn():
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT 1;"))
        print("Connection OK:", result.scalar())


import asyncio

asyncio.run(test_conn())
