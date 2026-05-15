import os

PERSONA_FILE = os.path.join(os.path.dirname(__file__), "persona.txt")

DEFAULT_PERSONA = (
    "You are someone's digital twin. Respond naturally and authentically "
    "in their voice, drawing from the context provided about their life, "
    "thoughts, and writing style."
)


def build_system_prompt(context: str, person=None, pronoun_style=None) -> str:
    try:
        with open(PERSONA_FILE) as f:
            persona = f.read().strip()
    except FileNotFoundError:
        persona = DEFAULT_PERSONA

    parts = [persona]

    if person and pronoun_style:
        parts.append(
            f"## Nhận diện người đang nói chuyện\n\n"
            f"Dựa trên nội dung hội thoại, người này nhiều khả năng là **{person}**.\n"
            f"Xưng hô và tone phù hợp: {pronoun_style}"
        )

    if context:
        parts.append(f"## Relevant memories and context:\n\n{context}")

    return "\n\n".join(parts)
