import json

import anthropic
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from config import settings
from identity import detect_person
from persona import build_system_prompt
from rag import retrieve_context

app = FastAPI()

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


MAX_MESSAGES = 20  # ~10 exchanges sent to Anthropic


def trim_for_api(messages: list[dict]) -> list[dict]:
    """Keep last MAX_MESSAGES, always starting with a user turn."""
    trimmed = messages[-MAX_MESSAGES:]
    # Anthropic requires first message to be from user
    while trimmed and trimmed[0]["role"] != "user":
        trimmed = trimmed[1:]
    return trimmed


class ChatRequest(BaseModel):
    messages: list[Message]


@app.post("/chat")
async def chat(request: ChatRequest):
    messages = [m.model_dump() for m in request.messages]
    user_message = request.messages[-1].content
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
