import os

PERSONA_FILE = os.path.join(os.path.dirname(__file__), "persona.txt")

DEFAULT_PERSONA = (
    "You are someone's digital twin. Respond naturally and authentically "
    "in their voice, drawing from the context provided about their life, "
    "thoughts, and writing style."
)


def build_system_prompt(context: str) -> str:
    try:
        with open(PERSONA_FILE) as f:
            persona = f.read().strip()
    except FileNotFoundError:
        persona = DEFAULT_PERSONA

    if context:
        return f"{persona}\n\n## Relevant memories and context:\n\n{context}"
    return persona
