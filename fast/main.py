from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage
import os
import base64
import tempfile
import threading

# Optional audio imports - app can run without them
try:
    import speech_recognition as sr
    SPEECH_RECOGNITION_AVAILABLE = True
except ImportError:
    SPEECH_RECOGNITION_AVAILABLE = False

try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False

try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False
from routers import pdf_rag

# Load env variables
load_dotenv()

app = FastAPI(
    title="Gemini Chatbot API",
    description="FastAPI backend for LangChain Gemini Chatbot with Memory",
    version="1.0.0"
)

# Register RAG router
app.include_router(pdf_rag.router)

# Add CORS Middleware to support frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini Model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# Store conversation memory
chat_memory = []

# Speech recognizer instance (only if available)
recognizer = sr.Recognizer() if SPEECH_RECOGNITION_AVAILABLE else None

# Thread lock for pyttsx3 engine since it is not thread safe
tts_lock = threading.Lock()

def text_to_speech(text: str) -> str:
    """
    Synthesizes the text to an audio file and returns the base64 encoded audio.
    Prioritizes gTTS (MP3) for maximum browser compatibility, falling back to pyttsx3.
    Returns None if TTS is not available.
    """
    if not GTTS_AVAILABLE and not PYTTSX3_AVAILABLE:
        return None

    # Try gTTS (MP3) first
    if GTTS_AVAILABLE:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_mp3:
            mp3_path = temp_mp3.name
        try:
            tts = gTTS(text=text, lang="en")
            tts.save(mp3_path)
            with open(mp3_path, "rb") as audio_file:
                audio_data = audio_file.read()
            base64_audio = base64.b64encode(audio_data).decode("utf-8")
            return f"data:audio/mp3;base64,{base64_audio}"
        except Exception as e:
            print(f"gTTS failed: {e}. Falling back to pyttsx3...")
        finally:
            if os.path.exists(mp3_path):
                os.remove(mp3_path)

    # Fallback to local pyttsx3 (AIFC/WAV depending on OS)
    if PYTTSX3_AVAILABLE:
        with tts_lock:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_wav:
                wav_path = temp_wav.name
            try:
                engine = pyttsx3.init()
                engine.save_to_file(text, wav_path)
                engine.runAndWait()
                with open(wav_path, "rb") as audio_file:
                    audio_data = audio_file.read()
                base64_audio = base64.b64encode(audio_data).decode("utf-8")
                return f"data:audio/wav;base64,{base64_audio}"
            finally:
                if os.path.exists(wav_path):
                    os.remove(wav_path)

    return None

# Request Body
class ChatRequest(BaseModel):
    message: str

# Chat API with Memory
@app.post("/chat")
def chat(req: ChatRequest):
    try:
        # Add user message to memory
        chat_memory.append(
            HumanMessage(content=req.message)
        )

        # Send full history to AI
        response = llm.invoke(chat_memory)

        # Add AI response to memory
        chat_memory.append(
            AIMessage(content=response.content)
        )

        return {"response": response.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Voice Chat API
@app.post("/chat/voice")
async def chat_voice(file: UploadFile = File(...)):
    if not SPEECH_RECOGNITION_AVAILABLE:
        raise HTTPException(status_code=503, detail="Speech recognition is not available on this server")

    try:
        # Save uploaded file contents to a temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_wav:
            contents = await file.read()
            temp_wav.write(contents)
            temp_wav_path = temp_wav.name

        try:
            # Transcribe audio using SpeechRecognition
            with sr.AudioFile(temp_wav_path) as source:
                audio_data = recognizer.record(source)

            # Recognizing using Google Speech API
            user_text = recognizer.recognize_google(audio_data)
        except sr.UnknownValueError:
            raise HTTPException(status_code=400, detail="Could not understand audio")
        except sr.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Google Speech Recognition service error: {e}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Audio decoding error. Make sure you send a valid WAV file: {e}")
        finally:
            if os.path.exists(temp_wav_path):
                os.remove(temp_wav_path)

        # Add user message to memory
        chat_memory.append(HumanMessage(content=user_text))

        # Send history to Gemini
        response = llm.invoke(chat_memory)

        # Add AI response to memory
        chat_memory.append(AIMessage(content=response.content))
        ai_reply = response.content

        # Synthesize reply back to audio (base64)
        audio_base64 = None
        try:
            audio_base64 = text_to_speech(ai_reply)
        except Exception as tts_err:
            print(f"TTS Synthesis error: {tts_err}")

        return {
            "user_text": user_text,
            "response": ai_reply,
            "audio": audio_base64
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Clear history endpoint
@app.post("/chat/clear")
def clear_chat():
    global chat_memory
    chat_memory = []
    return {"message": "Chat history cleared"}

# Root endpoint for health check
@app.get("/")
def root():
    return {"message": "Chat API is running!"}

