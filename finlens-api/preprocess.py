import re

def preprocess_line(line: str) -> str:
    """
    Lowercase and remove unwanted characters except letters, digits,
    space, dots, commas, hyphens, and common currency symbols.
    """
    return re.sub(r'[^a-zA-Z0-9\s₹$€.,\-]', '', line).lower().strip()
