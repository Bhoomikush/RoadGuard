import os
import sys
from google import genai
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")
api_key = os.environ.get("GEMINI_API_KEY")

if not url or not key or not api_key:
    print("Missing environment variables.")
    sys.exit(1)

supabase: Client = create_client(url, key)
client = genai.Client(api_key=api_key)

KNOWLEDGE_FILE_PATH = os.path.join(os.path.dirname(__file__), 'road_rules.md')

def get_embedding(text: str):
    response = client.models.embed_content(
        model='gemini-embedding-2',
        contents=text,
        config={'output_dimensionality': 768}
    )
    return response.embeddings[0].values

def ingest():
    with open(KNOWLEDGE_FILE_PATH, 'r', encoding='utf-8') as f:
        text = f.read()

    # Simple paragraph chunking
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = []
    current_word_count = 0
    
    for p in paragraphs:
        words = len(p.split())
        if current_word_count + words > 400 and current_chunk:
            chunks.append('\n\n'.join(current_chunk))
            current_chunk = [p]
            current_word_count = words
        else:
            current_chunk.append(p)
            current_word_count += words
    
    if current_chunk:
        chunks.append('\n\n'.join(current_chunk))
        
    print(f"Total chunks created: {len(chunks)}")
    
    for i, chunk in enumerate(chunks):
        embedding = get_embedding(chunk)
        data = {
            "content": chunk,
            "embedding": embedding,
            "source": "road_rules.md",
            "chunk_index": i
        }
        res = supabase.table("document_chunks").insert(data).execute()
        print(f"Inserted chunk {i+1}/{len(chunks)}")
        
if __name__ == "__main__":
    ingest()
