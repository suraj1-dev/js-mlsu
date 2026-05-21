# routers/quiz.py
# This file handles all routes related to Quiz
# It connects the HTTP endpoints to the service layer

from fastapi import APIRouter, HTTPException, Depends
from typing import List

from models.quiz_model import (
    QuizResponse, QuizCreateRequest, SubmitAnswer, 
    QuizResultResponse, QuizAttempt, QuizStats
)
import services.quiz_service as quiz_service

# APIRouter groups related routes together
router = APIRouter(
    prefix="/quiz",       # all routes here will start with /quiz
    tags=["Quiz"]         # shown in Swagger UI docs
)


@router.post("/generate", response_model=QuizResponse)
def generate_quiz(req: QuizCreateRequest):
    """Generate a custom quiz using Gemini AI based on topic and difficulty"""
    try:
        return quiz_service.generate_quiz(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[QuizResponse])
def get_all_quizzes():
    """Get all generated quizzes (hiding correct answers)"""
    try:
        return quiz_service.list_quizzes()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=List[QuizAttempt])
def get_quiz_history():
    """Get history of all taken quiz attempts"""
    try:
        return quiz_service.get_attempts_history()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=QuizStats)
def get_dashboard_stats():
    """Get aggregate analytics for the user dashboard"""
    try:
        return quiz_service.get_dashboard_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz_by_id(quiz_id: int):
    """Get details of a single quiz by ID (hiding correct answers)"""
    quiz = quiz_service.get_quiz_by_id(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail=f"Quiz with ID {quiz_id} not found.")
    return quiz


@router.post("/{quiz_id}/submit", response_model=QuizResultResponse)
def submit_quiz_answers(quiz_id: int, submission: SubmitAnswer):
    """Submit quiz answers for grading and receive personalized AI study feedback"""
    try:
        return quiz_service.submit_quiz_answers(quiz_id, submission)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

