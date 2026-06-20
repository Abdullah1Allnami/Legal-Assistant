from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from uuid import uuid4

from ollama_client import ask_ollama


app = FastAPI(
    title="Legal AI Gateway",
    description="Frontend + FastAPI Gateway + Ollama",
    version="1.0.0"
)


app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")


sessions = {}


@app.get("/")
def home():
    return FileResponse("frontend/t1.html")


@app.get("/health")
def health():
    return {
        "status": "running",
        "service": "Legal AI Gateway"
    }


class StartSessionRequest(BaseModel):
    user_id: str = "demo-user"
    language: str = "auto"


class EndSessionRequest(BaseModel):
    session_id: str


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    language: str = "auto"
    country: str = "auto"


@app.post("/session/start")
def start_session(request: StartSessionRequest):
    session_id = str(uuid4())

    sessions[session_id] = {
        "user_id": request.user_id,
        "language": request.language,
        "active": True
    }

    return {
        "session_id": session_id,
        "status": "started"
    }


@app.post("/session/end")
def end_session(request: EndSessionRequest):
    if request.session_id in sessions:
        sessions[request.session_id]["active"] = False

    return {
        "status": "ended"
    }


@app.post("/gateway/chat")
def chat(request: ChatRequest):
    prompt = f"""
You are a professional legal AI assistant.

User language: {request.language}
Jurisdiction: {request.country}

Important:
- Explain clearly.
- Do not pretend to be a lawyer.
- Say this is general legal information, not official legal advice.

User question:
{request.message}
"""

    answer = ask_ollama(prompt)

    return {
        "answer": answer,
        "citations": []
    }


@app.websocket("/gateway/ws")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()

            session_id = data.get("session_id")
            message = data.get("message", "")
            language = data.get("language", "auto")
            country = data.get("country", "auto")

            if not session_id or session_id not in sessions:
                await websocket.send_json({
                    "type": "error",
                    "content": "Invalid or missing session. Please start a session first."
                })
                continue

            prompt = f"""
You are a professional cross-border legal AI assistant.

User language: {language}
Jurisdiction: {country}

Rules:
- Give clear, structured answers.
- Mention that this is general legal information, not official legal advice.
- If the question is about country law, mention the selected jurisdiction.
- If you do not know, say you do not know.

User question:
{message}
"""

            answer = ask_ollama(prompt)

            # Simple non-streaming response through WebSocket
            await websocket.send_json({
                "type": "token",
                "content": answer
            })

            await websocket.send_json({
                "type": "citation",
                "citations": []
            })

            await websocket.send_json({
                "type": "done"
            })

    except WebSocketDisconnect:
        print("WebSocket disconnected")