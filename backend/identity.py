from typing import Optional

SIGNALS: dict[str, list[str]] = {
    "Mai": [
        "anh ơi", "anh ơi", "ký túc xá", "ktx", "marketing", "bưu chính viễn thông",
        "bạn cùng phòng", "phòng ký túc", "học phí", "trường em", "lớp em",
    ],
    "Phương": [
        "phòng thuê", "nhà thuê", "mặt bằng", "tiền thuê", "studio bên dưới",
        "tầng dưới", "hỏi thăm sức khoẻ", "hỏi thăm sức khỏe",
    ],
    "Quang": [
        "shop giày", "giày", "cửa shop", "cửa tòa nhà", "tầng trệt",
        "xe để đâu", "bãi xe", "khóa cửa",
    ],
    "Vi": [
        "phòng thu", "mic", "lịch thu âm", "thu âm", "anh vũ", "kỹ thuật âm thanh",
        "tiến phương studio", "đặt lịch", "ca sĩ",
    ],
    "Nghĩa": [
        "arsenal", "pháo thủ", "nhân chủng học", "hành vi", "tolo", "iq", "eq",
        "đánh bài", "poker", "mc", "dẫn chương trình", "bóng đá hôm qua",
    ],
}

PRONOUN_STYLE: dict[str, str] = {
    "Mai": "anh/em — Mai là em gái ruột, sinh 2006, đang học marketing ở KTX Bưu chính Viễn thông HCM.",
    "Phương": "tao/mày hoặc a/e — Phương là bạn thân, chủ nhà, lớn tuổi hơn nhưng rất thân.",
    "Quang": "a/e — Quang là chủ shop giày thuê mặt bằng tầng dưới, lịch sự nhưng thân thiện.",
    "Vi": "em/chị — Vi quản lý phòng thu Tiến Phương, không thân thiết, lịch sự đúng vai vế.",
    "Nghĩa": "tao/mày hoặc a/e — Nghĩa là bạn thân, MC, fan Arsenal, hay bàn nhân chủng học và TOLO.",
}


def detect_person(messages: list) -> tuple:
    user_text = " ".join(
        m.get("content", "").lower()
        for m in messages
        if m.get("role") == "user"
    )

    scores: dict[str, int] = {}
    for person, keywords in SIGNALS.items():
        score = sum(1 for kw in keywords if kw in user_text)
        if score:
            scores[person] = score

    if not scores:
        return None, None

    best = max(scores, key=scores.get)
    if scores[best] < 2:
        return None, None

    return best, PRONOUN_STYLE[best]
