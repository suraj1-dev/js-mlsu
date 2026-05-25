# utils/score_calculator.py
# This file contains helper functions for calculating scores
# These are small reusable functions — not business logic

def calculate_score(questions: list, answers: list) -> int:
    """
    Compare submitted answers with correct answers
    and return the total score.

    questions  → list of question dicts (each has 'correct_answer')
    answers    → list of student's answers (strings)
    """
    score = 0
    for i, question in enumerate(questions):
        if i < len(answers) and answers[i] == question["correct_answer"]:
            score += 1
    return score


def percentage(score: int, total: int) -> float:
    """Return score as a percentage"""
    if total == 0:
        return 0.0
    return round((score / total) * 100, 2)
