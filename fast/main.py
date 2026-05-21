# main.py
# ✅ Entry point of the FastAPI application
# This file creates the app and connects all routers

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import routers (each router handles one feature)
from routers import quiz  # quiz routes

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


# -------------------------------------------------------
# Root endpoint (just to check if server is running)
# -------------------------------------------------------
@app.get("/")
def root():
    return {"message": "Welcome to the Quiz API 🎉"}