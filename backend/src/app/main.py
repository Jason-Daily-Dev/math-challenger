import app.models
from app.routes import docs, questions
from app.routes.dependencies.auth import get_swagger_ui_oauth
from fastapi import FastAPI

app = FastAPI(
    swagger_ui_init_oauth=get_swagger_ui_oauth(),
    swagger_ui_parameters={
        "persistAuthorization": True,
        "docExpansion": "none",
    },
)

# app.include_router(docs.router)
app.include_router(questions.router, prefix="/questions", tags=["questions"])


@app.get("/")
def health_check():
    return {"status": "ok"}
