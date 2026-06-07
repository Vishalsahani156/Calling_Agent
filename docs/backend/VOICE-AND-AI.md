# Voice and AI Architecture

Backend voice pipeline, AI conversation, knowledge base, and multi-language support.

## Outbound Call Flow

```mermaid
sequenceDiagram
  participant Admin as AdminDashboard
  participant API as ExpressAPI
  participant Queue as BullMQ
  participant Exotel as Exotel
  participant Voice as VoiceWorker
  participant STT as STT
  participant LLM as LLM
  participant TTS as TTS
  participant DB as PostgreSQL

  Admin->>API: POST /campaigns/:id/start
  API->>DB: Update campaign status=running
  API->>Queue: Enqueue dial jobs
  Queue->>DB: Fetch next pending contact
  Queue->>Exotel: Connect Voice AI Flow API
  Exotel->>Voice: WSS Connected/Start/Media frames
  Voice->>TTS: Stream greeting
  loop ConversationTurn
    Exotel->>Voice: User audio
    Voice->>STT: Transcribe
    Voice->>DB: RAG retrieve chunks
    Voice->>LLM: Prompt + context + KB
    LLM->>Voice: Response text
    Voice->>TTS: Synthesize
    Voice->>Exotel: Media frames
  end
  Exotel->>API: Status callback completed
  API->>Queue: Post-call summary job
```

## AI Conversation State Machine

```mermaid
stateDiagram-v2
  [*] --> Greeting
  Greeting --> Listening: TTS complete
  Listening --> Processing: Speech endpoint
  Processing --> Speaking: LLM response ready
  Processing --> Handoff: Escalation intent
  Speaking --> Listening: TTS complete
  Speaking --> Interrupted: Barge-in detected
  Interrupted --> Processing: Flush buffer + new utterance
  Listening --> Closing: Goodbye or max duration
  Handoff --> [*]: Connect to human agent
  Closing --> [*]: Close WSS
```

## Prompt Layers

1. `system` — immutable rules
2. `agent` — tenant config from `ai_agents`
3. `campaign` — offer context
4. `retrieved_kb` — dynamic RAG chunks
5. `conversation_history` — rolling window

## Knowledge Base (RAG)

```mermaid
flowchart TB
  Upload[Admin uploads document] --> Ingest[Ingestion Worker]
  Ingest --> Chunk[Chunker 500-800 tokens]
  Chunk --> Embed[Embedding API]
  Embed --> PG[(knowledge_chunks + faqs)]
  Query[User utterance] --> QEmbed[Query embedding]
  QEmbed --> Hybrid[Hybrid search]
  Hybrid --> Vector[pgvector similarity]
  Hybrid --> Keyword[Postgres full-text]
  Vector --> Rerank[Rerank top-K]
  Keyword --> Rerank
  Rerank --> Context[Inject into LLM prompt]
```

**Ingestion pipeline:**

1. Upload → S3 → queue job
2. Extract text (pdf-parse, mammoth)
3. Chunk with overlap
4. Embed via OpenAI text-embedding-3-small
5. Mark document `ready`

**FAQ fast path:** cosine similarity > 0.92 → return canned answer.

## Multi-Language Support

| Concern | Approach |
|---|---|
| Detection | STT auto-detect + LLM classifier on first utterance |
| Response | LLM replies in `detected_language` |
| TTS | Per-language voice map in `ai_agents.voice_profile` |
| KB | Tag chunks with language; fallback to English |
| Greetings | `greeting_script` JSONB: `{ "en": "...", "hi": "..." }` |

**Recommended providers (Indian languages):**

- STT: Deepgram nova-2 or Sarvam AI
- TTS: Google Cloud TTS, Azure Neural, or Sarvam
- LLM: GPT-4o mini or Claude with language-aware prompts

## Related Docs

- [AI Calling Phase 4](./AI-CALLING-PHASE-4.md) — detailed Phase 4 feature spec and implementation status
- [Backend Architecture](./ARCHITECTURE.md)
- [Database Schema](./database/SCHEMA-REFERENCE.md)
- [API Endpoints](./API-ENDPOINTS.md)
