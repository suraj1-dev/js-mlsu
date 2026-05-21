from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
import os

app = FastAPI()


# Configure Gemini
# Note: The previous API key was returning a 403 PERMISSION_DENIED error. 
# Please generate a new API key from Google AI Studio and set it as an environment variable or replace 'YOUR_NEW_API_KEY' below.
GEMINI_API_KEY ="AQ.Ab8RN6IDRLcDA"
client = genai.Client(api_key=GEMINI_API_KEY)

# Simple in-memory array
todos = []


class TodoCreate(BaseModel):
    title: str
    description: str
    completed: bool = False


@app.get("/todos")
def get_todos():
    return todos


@app.post("/todos")
def create_todo(todo: TodoCreate):
    new_todo = {
        "id": len(todos) + 1,
        "title": todo.title,
        "description": todo.description,
        "completed": todo.completed,
    }
    todos.append(new_todo)
    return new_todo


# ─── Gemini Chat Endpoint ────────────────────────────────────────────────────

class GeminiRequest(BaseModel):
    prompt: str
    model: str = "gemini-2.5-flash"


class GeminiResponse(BaseModel):
    response: str
    model: str


@app.post("/gemini", response_model=GeminiResponse)
def chat_with_gemini(body: GeminiRequest):
    try:
        result = client.models.generate_content(
            model=body.model,
            contents=body.prompt,
        )
        return GeminiResponse(response=result.text, model=body.model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
