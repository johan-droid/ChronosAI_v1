import re
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import List, Optional

class MeetingInfo(BaseModel):
    intent: str
    date: Optional[str] = None
    time: Optional[str] = None
    duration: Optional[str] = None
    participants: List[str] = []

def extract_entities(text: str) -> dict:
    """
    Upgraded Mock NLP Engine using Regex to catch emails, dynamic times, and dynamic durations.
    """
    text_lower = text.lower()
    info = MeetingInfo(intent="unknown")
    
    # 1. Intent Detection
    if any(word in text_lower for word in ["schedule", "book", "set up"]):
        info.intent = "schedule"
    elif any(word in text_lower for word in ["reschedule", "move", "change"]):
        info.intent = "reschedule"
    elif any(word in text_lower for word in ["cancel", "delete", "remove"]):
        info.intent = "cancel"
        
    # 2. Date Extraction (Simple mock)
    if "tomorrow" in text_lower:
        tomorrow = datetime.now() + timedelta(days=1)
        info.date = tomorrow.strftime("%Y-%m-%d")
        
    # 3. Dynamic Duration Extraction (e.g., "15 minute", "45 min")
    duration_match = re.search(r'(\d+)\s*(min|minute)', text_lower)
    if duration_match:
        info.duration = duration_match.group(1)
        
    # 4. Dynamic Time Extraction (e.g., "10:00", "3 pm")
    time_match = re.search(r'(\d{1,2}:\d{2})|(\d{1,2}\s*(am|pm))', text_lower)
    if time_match:
        info.time = time_match.group(0).replace(" ", "")
        
    # 5. Participant Extraction (Hardcoded names + Dynamic Emails)
    for name in ["john", "maria", "alex"]:
        if name in text_lower:
            info.participants.append(name.capitalize())
            
    # NEW: Find any standard email address in the text
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    for email in emails:
        if email not in info.participants:
            info.participants.append(email)
        
    return info.model_dump()