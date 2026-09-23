import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Load Knowledge Base
KNOWLEDGE_FILE_PATH = os.path.join(os.path.dirname(__file__), '..', 'knowledge', 'road_rules.md')
try:
    with open(KNOWLEDGE_FILE_PATH, 'r', encoding='utf-8') as f:
        KNOWLEDGE_BASE_TEXT = f.read()
except Exception as e:
    KNOWLEDGE_BASE_TEXT = "Knowledge base not available."
    print(f"Error loading knowledge base: {e}")

def generate_rag_response(question: str) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "your_key_here":
        return "Assistant is not fully configured (missing API key)."
    
    prompt = f"""You are a helpful RoadGuard Road Safety Assistant. Use ONLY the following RoadGuard Knowledge Base to answer the user's question. 
If the knowledge base does not contain enough information to answer, clearly state that the available RoadGuard knowledge does not cover the question. 
Do not invent facts, laws, penalties, statistics, citations, or government rules. Keep answers concise and practical.

RoadGuard Knowledge Base:
{KNOWLEDGE_BASE_TEXT}

User's Question:
{question}
"""
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        # Do not expose raw API errors
        raise Exception("LLM generation failed.")
