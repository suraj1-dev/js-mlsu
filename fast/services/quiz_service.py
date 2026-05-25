# services/quiz_service.py
# This file contains the business logic for Quiz
# Routers call functions from here — keeps routes clean

import os
import json
import random
from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Ensure dotenv loaded (also loaded in main.py)
load_dotenv()

from models.quiz_model import (
    Quiz, Question, GeminiQuiz, GeminiQuestion, QuizCreateRequest, 
    QuizResponse, QuestionResponse, SubmitAnswer, 
    QuizResultResponse, QuestionGrading, QuizAttempt, QuizStats
)

# Paths for local file persistence
DATA_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUIZZES_FILE = os.path.join(DATA_DIR, "quizzes.json")
ATTEMPTS_FILE = os.path.join(DATA_DIR, "attempts.json")

# Helpers to load and save data locally
def _load_json(file_path: str, default_data) -> dict | list:
    if not os.path.exists(file_path):
        with open(file_path, "w") as f:
            json.dump(default_data, f, indent=4)
        return default_data
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except Exception:
        return default_data

def _save_json(file_path: str, data):
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)

# In-memory storage with file backing
def _get_all_stored_quizzes() -> List[dict]:
    return _load_json(QUIZZES_FILE, [])

def _save_all_stored_quizzes(quizzes: list):
    _save_json(QUIZZES_FILE, quizzes)

def _get_all_stored_attempts() -> List[dict]:
    return _load_json(ATTEMPTS_FILE, [])

def _save_all_stored_attempts(attempts: list):
    _save_json(ATTEMPTS_FILE, attempts)


# Initialize Gemini client
def _get_gemini_client() -> Optional[genai.Client]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        # Fallback to general environment check
        api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Error initializing Gemini client: {e}")
        return None


# Business logic functions

def list_quizzes() -> List[QuizResponse]:
    """Return all quizzes from the database, hiding correct answers"""
    quizzes_raw = _get_all_stored_quizzes()
    result = []
    for q in quizzes_raw:
        questions_resp = [
            QuestionResponse(id=item["id"], question=item["question"], options=item["options"])
            for item in q["questions"]
        ]
        result.append(QuizResponse(
            id=q["id"],
            title=q["title"],
            topic=q["topic"],
            difficulty=q["difficulty"],
            questions=questions_resp,
            created_at=q["created_at"]
        ))
    return result


def get_quiz_by_id(quiz_id: int) -> Optional[QuizResponse]:
    """Return a single quiz by its ID, hiding correct answers"""
    quizzes_raw = _get_all_stored_quizzes()
    for q in quizzes_raw:
        if q["id"] == quiz_id:
            questions_resp = [
                QuestionResponse(id=item["id"], question=item["question"], options=item["options"])
                for item in q["questions"]
            ]
            return QuizResponse(
                id=q["id"],
                title=q["title"],
                topic=q["topic"],
                difficulty=q["difficulty"],
                questions=questions_resp,
                created_at=q["created_at"]
            )
    return None


def generate_quiz(req: QuizCreateRequest) -> QuizResponse:
    """Generate a custom quiz using Gemini 2.5 Flash and persist it"""
    client = _get_gemini_client()
    
    # 1. Prompt design
    prompt = (
        f"You are an expert educator. Create a comprehensive multiple-choice quiz of "
        f"exactly {req.num_questions} questions on the topic of '{req.topic}' "
        f"at a '{req.difficulty}' difficulty level. Ensure that for each question, "
        f"there are exactly 4 distinct and highly plausible multiple-choice options, "
        f"only ONE option is fully correct, and the correct_answer field exactly matches "
        f"the text of that correct option. Write a concise, clear explanation for why "
        f"the correct option is correct."
    )
    
    generated_quiz = None

    # Try generating using Gemini Structured Schema
    if client:
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=GeminiQuiz,
                    temperature=0.3,
                ),
            )
            # Response is valid JSON adhering to GeminiQuiz Pydantic model
            raw_data = json.loads(response.text)
            generated_quiz = GeminiQuiz(**raw_data)
        except Exception as e:
            print(f"Gemini generation error: {e}. Falling back to default quiz.")
            # Fallback to local offline quiz generator if Gemini API key fails or errors

    # Off-line Fallback if client is missing or error occurred
    if not generated_quiz:
        generated_quiz = _generate_fallback_quiz(req.topic, req.difficulty, req.num_questions)

    # 2. Map structured quiz into database schema (with IDs)
    quizzes_list = _get_all_stored_quizzes()
    new_id = len(quizzes_list) + 1
    
    questions_mapped = []
    for idx, q in enumerate(generated_quiz.questions):
        questions_mapped.append(Question(
            id=idx + 1,
            question=q.question,
            options=q.options,
            correct_answer=q.correct_answer,
            explanation=q.explanation
        ))
        
    full_quiz = Quiz(
        id=new_id,
        title=generated_quiz.title,
        topic=req.topic,
        difficulty=req.difficulty,
        questions=questions_mapped,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    
    # 3. Persist and return client safe response
    quizzes_list.append(full_quiz.model_dump())
    _save_all_stored_quizzes(quizzes_list)
    
    # Prepare client-facing safe schema (hiding answers)
    questions_resp = [
        QuestionResponse(id=item.id, question=item.question, options=item.options)
        for item in full_quiz.questions
    ]
    return QuizResponse(
        id=full_quiz.id,
        title=full_quiz.title,
        topic=full_quiz.topic,
        difficulty=full_quiz.difficulty,
        questions=questions_resp,
        created_at=full_quiz.created_at
    )


def submit_quiz_answers(quiz_id: int, submission: SubmitAnswer) -> QuizResultResponse:
    """Grade submission, generate AI study feedback, save attempt to history"""
    quizzes_raw = _get_all_stored_quizzes()
    
    # 1. Find the target quiz
    target_quiz = None
    for q in quizzes_raw:
        if q["id"] == quiz_id:
            target_quiz = q
            break
            
    if not target_quiz:
        raise HTTPException(status_code=404, detail=f"Quiz with ID {quiz_id} not found.")
        
    # 2. Grade each answer
    grading_results = []
    score = 0
    questions_list = target_quiz["questions"]
    submitted_answers = submission.answers
    
    for i, q in enumerate(questions_list):
        user_ans = submitted_answers[i] if i < len(submitted_answers) else ""
        correct_ans = q["correct_answer"]
        is_correct = (user_ans == correct_ans)
        if is_correct:
            score += 1
            
        grading_results.append(QuestionGrading(
            id=q["id"],
            question=q["question"],
            options=q["options"],
            user_answer=user_ans,
            correct_answer=correct_ans,
            is_correct=is_correct,
            explanation=q.get("explanation") or "No explanation provided."
        ))
        
    total = len(questions_list)
    percentage = round((score / total) * 100, 1) if total > 0 else 0.0
    
    # 3. Generate personalized AI Study Feedback
    feedback = _generate_ai_study_feedback(
        title=target_quiz["title"],
        topic=target_quiz["topic"],
        difficulty=target_quiz["difficulty"],
        score=score,
        total=total,
        percentage=percentage,
        grading=grading_results
    )
    
    # 4. Save attempt in history
    attempts_list = _get_all_stored_attempts()
    attempt_id = len(attempts_list) + 1
    
    attempt = QuizAttempt(
        attempt_id=attempt_id,
        quiz_id=quiz_id,
        title=target_quiz["title"],
        topic=target_quiz["topic"],
        difficulty=target_quiz["difficulty"],
        score=score,
        total=total,
        percentage=percentage,
        feedback=feedback,
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        results=grading_results
    )
    
    attempts_list.append(attempt.model_dump())
    _save_all_stored_attempts(attempts_list)
    
    return QuizResultResponse(
        quiz_id=quiz_id,
        title=target_quiz["title"],
        topic=target_quiz["topic"],
        difficulty=target_quiz["difficulty"],
        score=score,
        total=total,
        percentage=percentage,
        feedback=feedback,
        results=grading_results
    )


def get_attempts_history() -> List[QuizAttempt]:
    """Return all completed quiz attempts from history"""
    attempts_raw = _get_all_stored_attempts()
    # Sort with newest first
    attempts_raw.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return [QuizAttempt(**a) for a in attempts_raw]


def get_dashboard_stats() -> QuizStats:
    """Calculate and return aggregate analytics for user dashboard"""
    attempts = _get_all_stored_attempts()
    
    if not attempts:
        return QuizStats(
            total_quizzes=0,
            average_score=0.0,
            highest_score=0,
            success_rate=0.0,
            attempts_history=[]
        )
        
    total_quizzes = len(attempts)
    scores = [a["score"] for a in attempts]
    totals = [a["total"] for a in attempts]
    percentages = [a["percentage"] for a in attempts]
    
    average_score = round(sum(percentages) / total_quizzes, 1)
    highest_score = max(scores)
    
    # Success rate is percentage of quizzes scored >= 70%
    passed_quizzes = sum(1 for p in percentages if p >= 70.0)
    success_rate = round((passed_quizzes / total_quizzes) * 100, 1)
    
    # Get attempts mapped and sorted newest first
    attempts_mapped = [QuizAttempt(**a) for a in attempts]
    attempts_mapped.sort(key=lambda x: x.timestamp, reverse=True)
    
    return QuizStats(
        total_quizzes=total_quizzes,
        average_score=average_score,
        highest_score=highest_score,
        success_rate=success_rate,
        attempts_history=attempts_mapped
    )


# Private helper generation functions

def _generate_ai_study_feedback(title: str, topic: str, difficulty: str, score: int, total: int, percentage: float, grading: List[QuestionGrading]) -> str:
    """Generate high-quality encouraging feedback on score and concepts using Gemini"""
    client = _get_gemini_client()
    
    # Extract topics/questions got incorrect
    incorrect_concepts = []
    for g in grading:
        if not g.is_correct:
            incorrect_concepts.append(f"- \"{g.question}\" (Correct Answer was \"{g.correct_answer}\")")
            
    incorrect_summary = "\n".join(incorrect_concepts) if incorrect_concepts else "None! Perfect score!"
    
    prompt = (
        f"You are an encouraging AI study buddy. A student took a multiple choice quiz called '{title}' "
        f"about the topic '{topic}' at a '{difficulty}' difficulty level.\n"
        f"Performance metrics:\n"
        f"- Score: {score}/{total} ({percentage}%)\n\n"
        f"Questions they got incorrect:\n"
        f"{incorrect_summary}\n\n"
        f"Please write a short, highly tailored, engaging study companion response (2-3 paragraphs).\n"
        f"Rules:\n"
        f"1. Keep a very encouraging, energetic, and educational tone.\n"
        f"2. Acknowledge what they did well.\n"
        f"3. In a friendly way, analyze the topics they missed, explain the core concepts of those questions briefly, "
        f"and provide clear, actionable bullet-point steps to help them master this topic.\n"
        f"4. Do NOT output markdown headers (like # or ##) or emojis in a list, make it sound like a cohesive personal coach letter."
    )
    
    if client:
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=500
                )
            )
            return response.text.strip()
        except Exception as e:
            print(f"Failed to generate feedback with Gemini: {e}")
            
    # Local fallback explanation based on percentage
    if percentage >= 90.0:
        return (
            f"Spectacular job on the '{topic}' quiz! Scoring {score}/{total} ({percentage}%) demonstrates "
            f"an exceptional grasp of this subject. You are highly proficient in '{difficulty}' questions. "
            f"Keep pushing your limits by exploring even more advanced concepts in this domain. Excellent work!"
        )
    elif percentage >= 70.0:
        return (
            f"Solid work! You achieved a score of {score}/{total} ({percentage}%) on this '{difficulty}' level quiz. "
            f"You have a firm foundation in '{topic}', though there are a few minor gaps in understanding. "
            f"Review the questions you missed to reinforce your knowledge, and you'll be well on your way to complete mastery!"
        )
    else:
        return (
            f"Keep your head up! You scored {score}/{total} ({percentage}%) on '{topic}'. Learning is a journey, "
            f"and quizzes like this are perfect for highlighting areas that need a bit more study. "
            f"Take some time to review the questions you got wrong, read through their explanations, and try "
            f"generating another quiz when you feel ready. You got this!"
        )


def _generate_fallback_quiz(topic: str, difficulty: str, num_questions: int) -> GeminiQuiz:
    """Generate a clean mock quiz locally when Gemini API key is missing/invalid"""
    print(f"Generating local fallback quiz for '{topic}'...")
    
    # Generic question templates depending on topic keywords
    title = f"Intro to {topic.title()}"
    fallback_questions = []
    
    # Simple hardcoded question templates for general programming, technology or fallback
    general_pool = [
        {
            "question": f"What is the primary purpose or concept behind '{topic}'?",
            "options": [
                f"To manage complexity and streamline workflows associated with {topic}",
                f"To replace all standard database structures with flat text storage",
                f"To execute system instructions strictly in low-level binary assemblies",
                f"To coordinate hardware peripherals through raw voltage modulation"
            ],
            "correct_answer": f"To manage complexity and streamline workflows associated with {topic}",
            "explanation": f"The primary goal of '{topic}' is to provide developers and users with standard structures to reduce manual complexity and optimize delivery."
        },
        {
            "question": f"In the context of '{topic}', which of the following is considered a best practice?",
            "options": [
                "Avoiding all documentation and writing code strictly on-the-fly",
                "Employing clean modular principles, readable structures, and comprehensive tests",
                "Hardcoding all state variables directly in a single global execution namespace",
                "Running continuous loops without base conditions or memory cleanup"
            ],
            "correct_answer": "Employing clean modular principles, readable structures, and comprehensive tests",
            "explanation": "Modularity, readability, and continuous testing are foundational pillars of clean architecture in modern development contexts."
        },
        {
            "question": f"Which difficulty setting is currently applied to this generated {topic} session?",
            "options": [
                f"Novice Level",
                f"Setting: {difficulty}",
                f"Deprecated Standard",
                f"Extreme Theoretical"
            ],
            "correct_answer": f"Setting: {difficulty}",
            "explanation": f"The quiz was generated with the user-selected difficulty configuration set to {difficulty}."
        },
        {
            "question": "What is the primary drawback of using tightly coupled software components?",
            "options": [
                "They are extremely easy to test and swap dynamically",
                "They reduce overall network package footprints to zero",
                "They increase dependencies, making it very difficult to change one component without breaking others",
                "They force compilation processes to run strictly on external clouds"
            ],
            "correct_answer": "They increase dependencies, making it very difficult to change one component without breaking others",
            "explanation": "Tight coupling binds components tightly together, which drastically increases the risk of side effects during modifications and reduces reusability."
        },
        {
            "question": "What does a 404 Status Code represent in client-server architecture?",
            "options": [
                "A successful transmission of standard JSON data payloads",
                "The requested resource could not be found on the target host",
                "The server has crashed due to high database locks",
                "The user does not have sufficient permissions to access the route"
            ],
            "correct_answer": "The requested resource could not be found on the target host",
            "explanation": "In HTTP standards, 404 Not Found indicates that the client was able to communicate with the given server, but the server could not find what was requested."
        }
    ]
    
    # Shuffle and select required count
    selected_pool = random.sample(general_pool, min(num_questions, len(general_pool)))
    
    # Fill remaining count with generic dynamic questions if num_questions > 5
    while len(selected_pool) < num_questions:
        q_idx = len(selected_pool) + 1
        selected_pool.append({
            "question": f"Reviewing '{topic}' Core Concept Quiz Question #{q_idx}: Which choice offers the most scalable structure?",
            "options": [
                "A static monolithic block with no separated concerns",
                "A dynamic, modular component system with clear interfaces",
                "Relying completely on manual human checks at runtime",
                "Bypassing logic processing and storing pre-computed text strings"
            ],
            "correct_answer": "A dynamic, modular component system with clear interfaces",
            "explanation": "Separating concerns via modularity is widely proven to enable maximum scalability and codebase resilience."
        })
        
    for q in selected_pool:
        # Construct GeminiQuestion
        fallback_questions.append(GeminiQuestion(
            question=q["question"],
            options=q["options"],
            correct_answer=q["correct_answer"],
            explanation=q["explanation"]
        ))
        
    return GeminiQuiz(title=title, questions=fallback_questions)

