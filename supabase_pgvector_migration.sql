-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table to store your documents
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id BIGSERIAL PRIMARY KEY,
  content TEXT,
  embedding vector(768), -- Gemini text-embedding-004 dimension
  source TEXT,
  chunk_index INTEGER
);

-- Enable RLS
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Allow public read access to document chunks
CREATE POLICY "Public can view document chunks"
    ON public.document_chunks
    FOR SELECT
    TO public
    USING (true);

-- Allow public to insert chunks if needed (usually one-time)
CREATE POLICY "Public users can insert document chunks"
    ON public.document_chunks
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Create a function to search for documents
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(768),
  match_count int DEFAULT 4
) RETURNS TABLE (
  id BIGINT,
  content TEXT,
  source TEXT,
  chunk_index INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.content,
    document_chunks.source,
    document_chunks.chunk_index,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
