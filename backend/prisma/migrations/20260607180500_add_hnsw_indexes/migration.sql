-- HNSW indexes for pgvector cosine similarity search
CREATE INDEX IF NOT EXISTS "knowledge_chunks_embedding_idx" ON "knowledge_chunks" USING hnsw ("embedding" vector_cosine_ops);

CREATE INDEX IF NOT EXISTS "faqs_embedding_idx" ON "faqs" USING hnsw ("embedding" vector_cosine_ops);
