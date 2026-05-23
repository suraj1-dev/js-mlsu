# main.py
# ✅ Entry point of the FastAPI application
# This file creates the app and connects all routers

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables from .env file
load_dotenv()

# Import routers (each router handles one feature)
# from routers import quiz  # quiz routes

# Create the FastAPI app
app = FastAPI(
    title="Quiz App",
    description="A simple quiz API to learn FastAPI structure",
    version="1.0.0"
)

# -------------------------------------------------------
# Add CORS Middleware to support frontend requests
# -------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------
# Register Routers
# Each router is a group of related endpoints
# -------------------------------------------------------
app.include_router(quiz.router)


# --- LangChain Endpoint & Payload ---
class ResearchRequest(BaseModel):
    topic: str


@app.post("/agent/research")
def run_agent_research(req: ResearchRequest):
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import HumanMessage
    except ModuleNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="LangChain Google GenAI package is not installed in the virtual environment. Please run: pip install langchain-google-genai langchain-core"
        )

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="GEMINI_API_KEY is missing. Please add it to your .env file or export it in your environment."
        )

    try:
        research_agent = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key
        )
        review_agent = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key
        )

        # Step 1: Research agent generates answer
        research_response = research_agent.invoke([
            HumanMessage(content=f"Explain {req.topic}")
        ])

        # Step 2: Reviewer agent reviews it
        review_response = review_agent.invoke([
            HumanMessage(content=f"Review this explanation and improve it:\n\n{research_response.content}")
        ])

        return {
            "research": research_response.content,
            "review": review_response.content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.messages import HumanMessage

    # Read key from env
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")

    # Research Agent
    research_agent = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key
    )

    # Reviewer Agent
    review_agent = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key
    )

    # Step 1: Research agent generates answer
    research_response = research_agent.invoke([
        HumanMessage(content="Explain quantum computing")
    ])

    print("Research Agent:")
    print(research_response.content)

    # Step 2: Reviewer agent reviews it
    review_response = review_agent.invoke([
        HumanMessage(content=f"""
Review this explanation and improve it:

{research_response.content}
""")
    ])

    print("\nReviewer Agent:")
    print(review_response.content)

# -------------------------------------------------------
# Root endpoint (just to check if server is running)
# -------------------------------------------------------
@app.get("/")
def root():
    return {"message": "Welcome to the Quiz API 🎉"}