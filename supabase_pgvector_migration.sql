-- ============================================================================
-- ROADGUARD — TARGETED RAG PGVECTOR SECURITY & RPC MIGRATION
-- File: supabase_pgvector_migration.sql
-- ============================================================================
-- Transaction safety note:
-- The migration is structured inside a single transaction block (BEGIN ... COMMIT).
-- When executed as a whole script in the Supabase SQL Editor or via psql, any
-- failure rolls back all table alterations, constraints, indexes, and function
-- definitions atomically. If executing statements individually, each statement
-- commits independently.
-- ============================================================================

BEGIN;

-- 1. Ensure the pgvector extension is active
-- In Supabase, extensions typically install into schema 'extensions' or 'public'.
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Verify Table Existence and Safe Base Definition
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id BIGSERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(768),
    source TEXT,
    chunk_index INTEGER
);

-- 3. In-Migration Compatibility & Vector Typmod Safety Guard
-- Halts safely if the column data type is incompatible, dimensions differ from 768,
-- or existing rows contain NULLs, wrong dimensions, or duplicate indices.
DO $$
DECLARE
    v_udt_name TEXT;
    v_atttypmod INT;
    v_null_count INT;
    v_bad_dim_count INT;
    v_dup_count INT;
BEGIN
    -- Verify that public.document_chunks.embedding is actually a pgvector column
    SELECT c.udt_name INTO v_udt_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' 
      AND c.table_name = 'document_chunks' 
      AND c.column_name = 'embedding';

    IF v_udt_name IS DISTINCT FROM 'vector' THEN
        RAISE EXCEPTION 'Migration halted: public.document_chunks.embedding column is not of type vector (found: %). Incompatible table schema.', COALESCE(v_udt_name, 'missing');
    END IF;

    -- Verify the column's typmod if explicitly defined with a dimension constraint
    -- In pgvector, vector(N) stores atttypmod = N. Unconstrained vector stores atttypmod = -1.
    SELECT a.atttypmod INTO v_atttypmod
    FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname = 'document_chunks'
      AND a.attname = 'embedding';

    IF v_atttypmod > 0 AND v_atttypmod <> 768 THEN
        RAISE EXCEPTION 'Migration halted: public.document_chunks.embedding column is defined with vector(%), expected vector(768). Aborting to prevent truncation or conversion.', v_atttypmod;
    END IF;

    -- Check for NULLs in existing rows
    SELECT COUNT(*) INTO v_null_count
    FROM public.document_chunks
    WHERE content IS NULL 
       OR embedding IS NULL 
       OR source IS NULL 
       OR chunk_index IS NULL;

    IF v_null_count > 0 THEN
        RAISE EXCEPTION 'Migration halted: % rows in public.document_chunks contain NULL fields. Please resolve before applying constraints.', v_null_count;
    END IF;

    -- Check that existing embedding dimensions strictly match 768
    SELECT COUNT(*) INTO v_bad_dim_count
    FROM public.document_chunks
    WHERE vector_dims(embedding) <> 768;

    IF v_bad_dim_count > 0 THEN
        RAISE EXCEPTION 'Migration halted: % rows in public.document_chunks have vector dimension <> 768. Do not alter column without re-embedding.', v_bad_dim_count;
    END IF;

    -- Check for duplicate (source, chunk_index) before creating unique index
    SELECT COUNT(*) INTO v_dup_count
    FROM (
        SELECT source, chunk_index
        FROM public.document_chunks
        GROUP BY source, chunk_index
        HAVING COUNT(*) > 1
    ) dups;

    IF v_dup_count > 0 THEN
        RAISE EXCEPTION 'Migration halted: % duplicate (source, chunk_index) groups exist. Please inspect and resolve duplicates manually.', v_dup_count;
    END IF;
END $$;

-- 4. Apply NOT NULL constraints & Unique Index
ALTER TABLE public.document_chunks 
    ALTER COLUMN content SET NOT NULL,
    ALTER COLUMN embedding SET NOT NULL,
    ALTER COLUMN source SET NOT NULL,
    ALTER COLUMN chunk_index SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_document_chunks_source_index 
    ON public.document_chunks (source, chunk_index);

-- 5. Row Level Security & Explicit Policy Cleanup
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Explicitly drop only known legacy/insecure policies
DROP POLICY IF EXISTS "Public can view document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Public users can insert document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Allow read access to document chunks" ON public.document_chunks;

-- Allow read access for authenticated users (AI assistant queries) and backend service role
CREATE POLICY "Allow read access to document chunks"
    ON public.document_chunks
    FOR SELECT
    TO authenticated, service_role
    USING (true);

-- 6. Table-Level Grants (Defense in Depth alongside RLS)
-- Revoke all direct privileges on public.document_chunks from PUBLIC and anon
REVOKE ALL ON TABLE public.document_chunks FROM PUBLIC, anon;

-- Revoke write privileges from authenticated users (they may only SELECT via RLS)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.document_chunks FROM authenticated;
GRANT SELECT ON TABLE public.document_chunks TO authenticated;

-- Service role and superuser retain administrative access
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.document_chunks TO service_role, postgres;

-- Sequences access: dynamically grant usage on whichever sequence generates IDs for document_chunks.id
DO $$
DECLARE
    v_seq_name TEXT;
BEGIN
    SELECT pg_get_serial_sequence('public.document_chunks', 'id') INTO v_seq_name;
    IF v_seq_name IS NOT NULL THEN
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO service_role, postgres;', v_seq_name);
    END IF;
END $$;

-- 7. Semantic Search RPC: match_document_chunks
-- Dynamically resolve pgvector extension schema to ensure exact type qualification and OPERATOR(schema.<=>) syntax
DO $$
DECLARE
    v_ext_schema TEXT;
    v_func_ident TEXT;
    v_conflict_sigs TEXT;
BEGIN
    SELECT n.nspname INTO v_ext_schema
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'vector';

    IF v_ext_schema IS NULL THEN
        RAISE EXCEPTION 'Migration halted: pgvector extension is not registered or its namespace cannot be resolved.';
    END IF;

    -- Fail-fast check: Detect any incompatible overloads of match_document_chunks
    SELECT string_agg(p.oid::regprocedure::text, ', ') INTO v_conflict_sigs
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'match_document_chunks'
      AND pg_get_function_identity_arguments(p.oid) NOT IN (
          format('%I.vector, integer', v_ext_schema),
          format('%I.vector, int', v_ext_schema),
          'vector, integer',
          'vector, int'
      );

    IF v_conflict_sigs IS NOT NULL THEN
        RAISE EXCEPTION 'Migration halted: Incompatible existing overload(s) for match_document_chunks detected: [%]. Automatic dropping is disabled. Please inspect and resolve manually.', v_conflict_sigs;
    END IF;

    -- Construct exact schema-qualified type identifier for matching routine grants
    v_func_ident := format('public.match_document_chunks(%I.vector, integer)', v_ext_schema);

    -- Notice: Schema-qualified operators in PostgreSQL MUST use OPERATOR(schema.<=>)
    EXECUTE format('
        CREATE OR REPLACE FUNCTION public.match_document_chunks (
            query_embedding %I.vector(768),
            match_count int DEFAULT 4
        ) RETURNS TABLE (
            id BIGINT,
            content TEXT,
            source TEXT,
            chunk_index INTEGER,
            similarity FLOAT
        )
        LANGUAGE plpgsql
        STABLE
        SET search_path = public, %I, pg_temp
        AS $func$
        BEGIN
            RETURN QUERY
            SELECT
                c.id,
                c.content,
                c.source,
                c.chunk_index,
                1 - (c.embedding OPERATOR(%I.<=>) query_embedding) AS similarity
            FROM public.document_chunks c
            ORDER BY c.embedding OPERATOR(%I.<=>) query_embedding
            LIMIT match_count;
        END;
        $func$;
    ', v_ext_schema, v_ext_schema, v_ext_schema, v_ext_schema);

    -- Explicitly assign ownership to postgres (the trusted administrative role in Supabase)
    EXECUTE format('ALTER FUNCTION %s OWNER TO postgres;', v_func_ident);

    -- Apply precise REVOKE and GRANT using the exact qualified function signature
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon;', v_func_ident);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role, postgres;', v_func_ident);
END $$;

-- 8. Atomic Transactional Ingestion RPC: replace_document_chunks
DO $$
DECLARE
    v_ext_schema TEXT;
    v_func_ident TEXT;
    v_conflict_sigs TEXT;
BEGIN
    SELECT n.nspname INTO v_ext_schema
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'vector';

    IF v_ext_schema IS NULL THEN
        RAISE EXCEPTION 'Migration halted: pgvector extension is not registered or its namespace cannot be resolved.';
    END IF;

    -- Fail-fast check: Detect any incompatible overloads of replace_document_chunks
    SELECT string_agg(p.oid::regprocedure::text, ', ') INTO v_conflict_sigs
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'replace_document_chunks'
      AND pg_get_function_identity_arguments(p.oid) NOT IN ('text, jsonb', 'character varying, jsonb');

    IF v_conflict_sigs IS NOT NULL THEN
        RAISE EXCEPTION 'Migration halted: Incompatible existing overload(s) for replace_document_chunks detected: [%]. Automatic dropping is disabled. Please inspect and resolve manually.', v_conflict_sigs;
    END IF;

    v_func_ident := 'public.replace_document_chunks(text, jsonb)';

    EXECUTE format('
        CREATE OR REPLACE FUNCTION public.replace_document_chunks(
            p_source TEXT,
            p_chunks JSONB
        )
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public, %I, pg_temp
        AS $func$
        DECLARE
            chunk JSONB;
            v_content TEXT;
            v_source TEXT;
            v_idx INT;
            v_embedding_arr JSONB;
            v_dim INT;
            v_seen_indices INT[] := ''{}'';
            v_inserted INT := 0;
            v_batch_len INT;
            v_jwt_claims JSONB;
            v_jwt_role TEXT;
            v_test_vec %I.vector(768);
        BEGIN
            -- [A] Strict PostgREST JWT Role Authorization Check
            -- Under SECURITY DEFINER, current_user resolves to function owner (postgres).
            -- Therefore, authorization MUST inspect the verified PostgREST JWT claims.
            -- This strictly blocks anon and authenticated callers while allowing service_role calls.
            BEGIN
                v_jwt_claims := NULLIF(current_setting(''request.jwt.claims'', true), '''')::jsonb;
            EXCEPTION WHEN OTHERS THEN
                v_jwt_claims := NULL;
            END;

            v_jwt_role := COALESCE(
                v_jwt_claims->>''role'',
                NULLIF(current_setting(''request.jwt.claim.role'', true), '''')
            );

            IF v_jwt_role IS DISTINCT FROM ''service_role'' THEN
                RAISE EXCEPTION ''Permission denied: replace_document_chunks requires service_role credentials. Caller role: %'', COALESCE(v_jwt_role, ''none'');
            END IF;

            -- [B] Parameter & Header Validation
            IF p_source IS NULL OR TRIM(p_source) = '''' THEN
                RAISE EXCEPTION ''Validation failed: p_source cannot be null or empty'';
            END IF;

            IF p_chunks IS NULL OR jsonb_typeof(p_chunks) <> ''array'' THEN
                RAISE EXCEPTION ''Validation failed: p_chunks must be a JSON array'';
            END IF;

            v_batch_len := jsonb_array_length(p_chunks);
            IF v_batch_len = 0 THEN
                RAISE EXCEPTION ''Validation failed: p_chunks array cannot be empty'';
            END IF;

            IF v_batch_len > 500 THEN
                RAISE EXCEPTION ''Validation failed: batch size (%%) exceeds maximum limit of 500 chunks'', v_batch_len;
            END IF;

            -- [C] Full In-Memory Batch Validation BEFORE Modifying Database Rows
            -- Strictly validates every chunk in the batch. If any check fails, aborts before DELETE.
            FOR chunk IN SELECT * FROM jsonb_array_elements(p_chunks)
            LOOP
                v_content := TRIM(COALESCE(chunk->>''content'', ''''));
                IF v_content = '''' THEN
                    RAISE EXCEPTION ''Chunk validation failed: content cannot be empty'';
                END IF;

                v_source := chunk->>''source'';
                IF v_source IS NULL OR v_source <> p_source THEN
                    RAISE EXCEPTION ''Chunk validation failed: chunk source (%%) does not match p_source (%%)'', v_source, p_source;
                END IF;

                IF chunk->>''chunk_index'' IS NULL OR (chunk->>''chunk_index'') !~ ''^\d+$'' THEN
                    RAISE EXCEPTION ''Chunk validation failed: chunk_index must be a non-negative integer'';
                END IF;
                v_idx := (chunk->>''chunk_index'')::integer;

                IF v_idx = ANY(v_seen_indices) THEN
                    RAISE EXCEPTION ''Chunk validation failed: duplicate chunk_index (%%) detected in batch'', v_idx;
                END IF;
                v_seen_indices := array_append(v_seen_indices, v_idx);

                v_embedding_arr := chunk->''embedding'';
                IF v_embedding_arr IS NULL OR jsonb_typeof(v_embedding_arr) <> ''array'' THEN
                    RAISE EXCEPTION ''Chunk validation failed: embedding must be a JSON array at chunk_index %%'', v_idx;
                END IF;

                v_dim := jsonb_array_length(v_embedding_arr);
                IF v_dim <> 768 THEN
                    RAISE EXCEPTION ''Chunk validation failed: expected 768-dim vector, got %% at chunk_index %%'', v_dim, v_idx;
                END IF;

                -- Test vector casting (rejects NaN, Infinity, strings, booleans, and non-numeric values)
                BEGIN
                    v_test_vec := (chunk->>''embedding'')::%I.vector(768);
                EXCEPTION WHEN OTHERS THEN
                    RAISE EXCEPTION ''Chunk validation failed: invalid numeric vector at chunk_index %%: %%'', v_idx, SQLERRM;
                END;
            END LOOP;

            -- [D] Transactional Atomic Replacement
            -- Deletes previous chunks for this source only and inserts the verified chunks
            DELETE FROM public.document_chunks WHERE source = p_source;

            FOR chunk IN SELECT * FROM jsonb_array_elements(p_chunks)
            LOOP
                INSERT INTO public.document_chunks (content, embedding, source, chunk_index)
                VALUES (
                    TRIM(chunk->>''content''),
                    (chunk->>''embedding'')::%I.vector(768),
                    p_source,
                    (chunk->>''chunk_index'')::integer
                );
                v_inserted := v_inserted + 1;
            END LOOP;

            RETURN jsonb_build_object(
                ''success'', true,
                ''source'', p_source,
                ''chunks_inserted'', v_inserted
            );
        END;
        $func$;
    ', v_ext_schema, v_ext_schema, v_ext_schema, v_ext_schema);

    -- Explicitly assign ownership to postgres (the trusted administrative role in Supabase)
    EXECUTE format('ALTER FUNCTION %s OWNER TO postgres;', v_func_ident);

    -- Apply precise REVOKE and GRANT using the exact function signature
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated;', v_func_ident);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role, postgres;', v_func_ident);
END $$;

COMMIT;
