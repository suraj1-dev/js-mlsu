# models/quiz_model.py
# This file defines the data shapes using Pydantic
# FastAPI uses these to validate request body automatically

from pydantic import BaseModel, Field
from typing import List, Optional


class Question(BaseModel):
    """Full question containing the correct answer (stored in backend)"""
    id: int
    question: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None


class Quiz(BaseModel):
    """Full quiz containing questions and their answers (stored in backend)"""
    id: int
    title: str
    topic: str
    difficulty: str
    questions: List[Question]
    created_at: str


# --- Gemini Generation Schema ---
class GeminiQuestion(BaseModel):
    """Structured question structure for Gemini API schema"""
    question: str = Field(description="The multiple choice question text")
    options: List[str] = Field(description="Exactly 4 realistic options to select from")
    correct_answer: str = Field(description="The exact text match of the correct option from the options list")
    explanation: str = Field(description="A brief educational explanation of why this answer is correct")


class GeminiQuiz(BaseModel):
    """Structured quiz structure for Gemini API schema"""
    title: str = Field(description="A catchy, short title for this quiz")
    questions: List[GeminiQuestion] = Field(description="The list of quiz questions")


# --- Client-Facing Safe Schema (Pre-submission) ---
class QuestionResponse(BaseModel):
    """Shape of a single question sent to the client (HIDES correct answer to prevent cheating)"""
    id: int
    question: str
    options: List[str]


class QuizResponse(BaseModel):
    """Shape of a quiz sent to the client (HIDES correct answers)"""
    id: int
    title: str
    topic: str
    difficulty: str
    questions: List[QuestionResponse]
    created_at: str


# --- Quiz Submission & Grading ---
class QuizCreateRequest(BaseModel):
    """Request payload to generate a new quiz"""
    topic: str
    difficulty: str = "Medium"  # Easy, Medium, Hard
    num_questions: int = 5


class SubmitAnswer(BaseModel):
    """User answers submitted for grading"""
    answers: List[str] = Field(description="List of selected option strings in order of questions")


class QuestionGrading(BaseModel):
    """Individual question results after submission"""
    id: int
    question: str
    options: List[str]
    user_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str


class QuizResultResponse(BaseModel):
    """Result returned after submitting a quiz"""
    quiz_id: int
    title: str
    topic: str
    difficulty: str
    score: int
    total: int
    percentage: float
    feedback: str
    results: List[QuestionGrading]


# --- Attempt History & Dashboard Stats ---
class QuizAttempt(BaseModel):
    """Representation of a completed quiz attempt"""
    attempt_id: int
    quiz_id: int
    title: str
    topic: str
    difficulty: str
    score: int
    total: int
    percentage: float
    feedback: str
    timestamp: str
    results: List[QuestionGrading] = []


class QuizStats(BaseModel):
    """Overall statistics for the user dashboard"""
    total_quizzes: int
    average_score: float
    highest_score: int
    success_rate: float
    attempts_history: List[QuizAttempt]

