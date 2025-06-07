import app.models
from app.routes import questions
from fastapi import FastAPI

app = FastAPI()

app.include_router(questions.router, prefix="/questions", tags=["questions"])


@app.get("/")
def health_check():
    return {"status": "ok"}
