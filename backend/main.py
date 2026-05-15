import json

import anthropic
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from config import settings
from identity import detect_person
from persona import build_system_prompt
from rag import retrieve_context

MAX_MESSAGES = 20
MAX_MESSAGE_LENGTH = 3000
MAX_HISTORY_MESSAGES = 50

limiter = Limiter(key_func=get_remote_address, default_limits=["15/minute"])

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.frontend_url == "*" else [settings.frontend_url, "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)


class Message(BaseModel):
    role: str
    content: str

    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, v):
        if v not in ("user", "assistant"):
            raise ValueError("role must be user or assistant")
        return v

    @field_validator("content")
    @classmethod
    def content_length(cls, v):
        if len(v) > MAX_MESSAGE_LENGTH:
            raise ValueError(f"message too long (max {MAX_MESSAGE_LENGTH} chars)")
        return v


class ChatRequest(BaseModel):
    messages: list[Message]

    @field_validator("messages")
    @classmethod
    def messages_not_empty(cls, v):
        if not v:
            raise ValueError("messages cannot be empty")
        if len(v) > MAX_HISTORY_MESSAGES:
            raise ValueError(f"too many messages (max {MAX_HISTORY_MESSAGES})")
        if v[-1].role != "user":
            raise ValueError("last message must be from user")
        return v


def trim_for_api(messages: list) -> list:
    trimmed = messages[-MAX_MESSAGES:]
    while trimmed and trimmed[0]["role"] != "user":
        trimmed = trimmed[1:]
    return trimmed


@app.exception_handler(422)
async def validation_exception_handler(request: Request, exc):
    return JSONResponse(status_code=422, content={"error": "Invalid request"})


@app.post("/chat")
@limiter.limit("15/minute")
async def chat(request: Request, body: ChatRequest):
    messages = [m.model_dump() for m in body.messages]
    user_message = body.messages[-1].content
    context = retrieve_context(user_message, conversation=messages)
    person, pronoun_style = detect_person(messages)
    system_prompt = build_system_prompt(context, person=person, pronoun_style=pronoun_style)
    api_messages = trim_for_api(messages)

    def generate():
        try:
            with client.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                system=[
                    {
                        "type": "text",
                        "text": system_prompt,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                messages=api_messages,
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'text': text})}\n\n"
        except anthropic.BadRequestError as e:
            msg = e.body.get("error", {}).get("message", str(e)) if e.body else str(e)
            yield f"data: {json.dumps({'error': msg})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.get("/health")
async def health():
    return {"status": "ok"}
