from fastapi import FastAPI
from pydantic import BaseModel
from nlp.entity_extractor import extract_entities  # Import our new engine

app = FastAPI(title="ChronosAI NLP Service", version="1.0.0")

class ChatRequest(BaseModel):
    message: str

@app.get("/health")
def health_check():
    return {"status": "success", "message": "AI Microservice is running!"}

@app.post("/parse-intent")
def parse_intent(request: ChatRequest):
    # Pass the user's message into our extraction engine
    extracted_data = extract_entities(request.message)
    
    return {
        "original_message": request.message,
        "extracted_data": extracted_data
    }

if __name__ == "__main__":
    import uvicorn
    import os

    # Explicit default AI service port. Change PORT env var to override.
    port = int(os.getenv("AI_SERVICE_PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
