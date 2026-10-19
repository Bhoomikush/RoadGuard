import os
import sys
import math
from typing import List, Dict, Any, Optional
from google import genai
from dotenv import load_dotenv
from supabase import create_client, Client

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(env_path)

url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
# For write/ingestion operations, service role key is required to execute administrative RPCs
service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
api_key = os.environ.get("GEMINI_API_KEY")

KNOWLEDGE_FILE_PATH = os.path.join(os.path.dirname(__file__), 'road_rules.md')
SOURCE_IDENTIFIER = "road_rules.md"
EMBEDDING_MODEL = "gemini-embedding-2"
EMBEDDING_DIM = 768
MAX_BATCH_SIZE = 500


def get_embedding(client: Any, text: str) -> List[float]:
    """Generates 768-dimensional embedding for text chunk using gemini-embedding-2."""
    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config={'output_dimensionality': EMBEDDING_DIM}
    )
    return response.embeddings[0].values


def chunk_text(text: str, max_words: int = 400) -> List[str]:
    """Chunks text cleanly by paragraphs with a maximum word threshold."""
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = []
    current_word_count = 0

    for p in paragraphs:
        cleaned_p = p.strip()
        if not cleaned_p:
            continue
        words = len(cleaned_p.split())
        if current_word_count + words > max_words and current_chunk:
            chunks.append('\n\n'.join(current_chunk))
            current_chunk = [cleaned_p]
            current_word_count = words
        else:
            current_chunk.append(cleaned_p)
            current_word_count += words

    if current_chunk:
        chunks.append('\n\n'.join(current_chunk))

    return chunks


def prepare_chunks_with_embeddings(
    file_path: str,
    client: Any,
    source_name: str = SOURCE_IDENTIFIER
) -> List[Dict[str, Any]]:
    """
    Validates source file, chunks content, and computes all vector embeddings in memory.
    Validates content, chunk_index, and 768-dimensional float embedding per record.
    Rejects duplicate chunk indexes, empty text, or malformed vectors before database calls.
    """
    if not source_name or not source_name.strip():
        raise ValueError("Source identifier cannot be empty.")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Knowledge file not found at: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    if not text.strip():
        raise ValueError(f"Knowledge source file is empty: {file_path}")

    chunks = chunk_text(text)
    if not chunks:
        raise ValueError("No valid text chunks could be extracted.")

    if len(chunks) > MAX_BATCH_SIZE:
        raise ValueError(f"Batch size ({len(chunks)}) exceeds maximum limit of {MAX_BATCH_SIZE} chunks.")

    prepared_records = []
    seen_indices = set()

    for i, chunk in enumerate(chunks):
        cleaned_chunk = chunk.strip()
        if not cleaned_chunk:
            raise ValueError(f"Chunk at index {i} has empty content.")

        if i in seen_indices:
            raise ValueError(f"Duplicate chunk index detected: {i}")
        seen_indices.add(i)

        embedding = get_embedding(client, cleaned_chunk)
        if not embedding or not isinstance(embedding, list) or len(embedding) != EMBEDDING_DIM:
            raise ValueError(f"Invalid embedding dimension ({len(embedding) if isinstance(embedding, list) else 'non-list'}) for chunk {i}. Expected {EMBEDDING_DIM}.")

        # Validate finite numeric types in embedding (reject NaN, Inf, and booleans)
        if not all(isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) for v in embedding):
            raise ValueError(f"Non-numeric or non-finite values detected in embedding for chunk {i}.")

        prepared_records.append({
            "content": cleaned_chunk,
            "embedding": embedding,
            "source": source_name,
            "chunk_index": i
        })

    return prepared_records


def ingest(
    supabase_client: Optional[Client] = None,
    gemini_client: Optional[Any] = None,
    file_path: str = KNOWLEDGE_FILE_PATH,
    source_name: str = SOURCE_IDENTIFIER
) -> Dict[str, Any]:
    """
    Ingests knowledge chunks strictly and atomically via the replace_document_chunks RPC.
    
    Zero-fallback policy:
    1. Validates all inputs, chunk content, unique indices, and 768-dim embeddings in memory first.
    2. Executes the atomic transactional replace_document_chunks RPC.
    3. If the RPC call fails, raises an explicit RuntimeError and ABORTS.
       NEVER falls back to separate client-side DELETE and INSERT queries.
    
    Returns summary dict: { "source": str, "chunks_inserted": int, "success": bool, "method": "atomic_rpc" }
    """
    sb = supabase_client
    if sb is None:
        if not url:
            raise ValueError("Missing SUPABASE_URL in configuration.")
        # Atomic ingestion strictly requires administrative service role permissions
        if not service_role_key:
            raise ValueError("Missing SUPABASE_SERVICE_ROLE_KEY in configuration. Ingestion requires administrative privileges.")
        sb = create_client(url, service_role_key)

    ai = gemini_client
    if ai is None:
        if not api_key:
            raise ValueError("Missing GEMINI_API_KEY configuration.")
        ai = genai.Client(api_key=api_key)

    # Step 1: Pre-compute and strictly validate all chunks & embeddings in memory FIRST
    prepared_records = prepare_chunks_with_embeddings(file_path, ai, source_name)

    # Step 2: Atomic transactional replacement via RPC ONLY
    try:
        rpc_res = sb.rpc("replace_document_chunks", {
            "p_source": source_name,
            "p_chunks": prepared_records
        }).execute()

        if not rpc_res or not rpc_res.data:
            raise RuntimeError(f"Database returned empty response from replace_document_chunks RPC for source '{source_name}'.")

        res_data = rpc_res.data
        if isinstance(res_data, dict) and res_data.get("success") is False:
            raise RuntimeError(f"replace_document_chunks RPC reported failure: {res_data.get('error', 'Unknown database error')}")

        inserted_count = res_data.get("chunks_inserted", len(prepared_records)) if isinstance(res_data, dict) else len(prepared_records)
        return {
            "source": source_name,
            "chunks_inserted": inserted_count,
            "success": True,
            "method": "atomic_rpc"
        }

    except Exception as rpc_err:
        # STRICT ZERO-FALLBACK: Stop immediately and report the error.
        raise RuntimeError(
            f"Atomic knowledge ingestion failed via replace_document_chunks RPC for '{source_name}': {rpc_err}. "
            "Client-side deletion fallback is disabled to prevent data loss."
        )


if __name__ == "__main__":
    try:
        result = ingest()
        print(f"Ingestion successful for '{result['source']}': {result['chunks_inserted']} chunks inserted (via {result['method']}).")
    except Exception as e:
        print(f"Ingestion aborted: {e}")
        sys.exit(1)
