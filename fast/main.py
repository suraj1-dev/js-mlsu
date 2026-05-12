from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

app = FastAPI()

# ----------------------------
# Models
# ----------------------------

class Question(BaseModel):
    question: str
    options: List[str]
    correct_answer: str


{
   "title":"dghsrghsrhge",
   "questions":[
    {
        "question" :"sfguhskj erghlsfkjgnsklg",
        "options":["Sgs","sdfgewg","wefgsef","afaefqef"],
        "correct_answer":"Sgs"
    }
   ] 
}

class Quiz(BaseModel):
    title: str
    questions: List[Question]


class SubmitAnswer(BaseModel):
    answers: List[str]
# ----------------------------
# Fake Database
# ----------------------------

quizzes = []
# ----------------------------
# Create Quiz
# ----------------------------

@app.post("/quiz")
def create_quiz(quiz: Quiz):
    quiz_data = quiz.dict()
    quiz_id = len(quizzes)

    quizzes.append({
        "id": quiz_id,
        "title": quiz_data["title"],
        "questions": quiz_data["questions"]
    })

    return {
        "message": "Quiz created",
        "quiz_id": quiz_id
    }


# ----------------------------
# Get All Quizzes
# ----------------------------

@app.get("/quiz")
def get_quizzes():
    return quizzes


# ----------------------------
# Get Single Quiz
# ----------------------------

@app.get("/quiz/{quiz_id}")
def get_quiz(quiz_id: int):

    if quiz_id >= len(quizzes):
        raise HTTPException(status_code=404, detail="Quiz not found")

    return quizzes[quiz_id]


# ----------------------------
# Submit Answers
# ----------------------------

@app.post("/quiz/{quiz_id}/submit")
def submit_quiz(quiz_id: int, data: SubmitAnswer):

    if quiz_id >= len(quizzes):
        raise HTTPException(status_code=404, detail="Quiz not found")

    quiz = quizzes[quiz_id]

    questions = quiz["questions"]

    score = 0

    for i in range(len(questions)):

        correct = questions[i]["correct_answer"]

        if i < len(data.answers) and data.answers[i] == correct:
            score += 1

    return {
        "quiz_title": quiz["title"],
        "total_questions": len(questions),
        "score": score
    }


    {
  "title": "Python Quiz",
  "questions": [
    {
      "question": "What is Python?",
      "options": ["Language", "Car", "Phone", "Game"],
      "correct_answer": "Language"
    },
    {
      "question": "Which keyword is used for function?",
      "options": ["fun", "define", "def", "func"],
      "correct_answer": "def"
    }
  ]
}