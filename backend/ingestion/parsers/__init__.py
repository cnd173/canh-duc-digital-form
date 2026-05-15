from .chat_parser import ChatParser
from .email_parser import EmailParser
from .social_parser import SocialParser
from .text_parser import TextParser


def get_parser(source_type: str):
    return {
        "text": TextParser(),
        "chat": ChatParser(),
        "email": EmailParser(),
        "social": SocialParser(),
    }[source_type]
