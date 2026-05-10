# ScalerbookLM

An AI-powered document assistant that lets you **upload documents and chat with them** using Retrieval-Augmented Generation (RAG). Get accurate, context-grounded answers — no hallucinations.

---

## Features

- **Document Upload** — Drag-and-drop or browse to upload PDFs, CSVs, text files, and more
- **Vector Embeddings** — Documents are chunked and embedded into Qdrant for semantic search
- **RAG Chat** — Ask questions and receive answers strictly grounded in your uploaded documents
- **Streaming Responses** — Real-time token-by-token response streaming for a smooth chat experience
- **Multi-Phase Upload Status** — Visual feedback for upload progress, embedding processing, and completion
- **Dark Mode** — Sleek dark-themed UI with a responsive sidebar layout

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────────┐
│   Frontend   │────▶│  Next.js API  │────▶│   OpenRouter LLM  │
│  (React/TSX) │     │   Routes      │     │  (gpt-oss-120b)   │
└─────────────┘     └──────┬───────┘     └───────────────────┘
                           │
                    ┌──────┴───────┐
                    │              │
              ┌─────▼─────┐ ┌─────▼──────┐
              │  Ingest    │ │  Retrieve  │
              │  Pipeline  │ │  Pipeline  │
              └─────┬─────┘ └─────┬──────┘
                    │             │
                    ▼             ▼
              ┌───────────────────────┐
              │   Qdrant Vector DB    │
              │   (Cloud / Managed)   │
              └───────────────────────┘
```

### RAG Pipeline

1. **Ingest** — Upload → Parse document (PDF/CSV/Text) → Split into chunks → Generate embeddings via OpenRouter → Store in Qdrant
2. **Retrieve** — User query → Embed query → Similarity search in Qdrant → Retrieve top-2 relevant chunks
3. **Generate** — Inject retrieved context into system prompt → Stream LLM response back to the user

---

## Tech Stack

| Layer         | Technology                                                          |
| ------------- | ------------------------------------------------------------------- |
| **Framework** | [Next.js 16](https://nextjs.org/) (Turbopack)                      |
| **Frontend**  | React 19, TailwindCSS 4, shadcn/ui, Radix UI                       |
| **LLM**       | [OpenRouter](https://openrouter.ai/) — `openai/gpt-oss-120b:free`  |
| **Embeddings**| OpenRouter — `nvidia/llama-nemotron-embed-vl-1b-v2:free`            |
| **Vector DB** | [Qdrant Cloud](https://qdrant.tech/)                                |
| **Orchestration** | [LangChain](https://js.langchain.com/) (TS)                   |
| **Icons**     | [Hugeicons](https://hugeicons.com/), Lucide React                   |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Bun** (recommended) or npm
- An [OpenRouter API key](https://openrouter.ai/keys)
- A [Qdrant Cloud](https://cloud.qdrant.io/) cluster (or local instance)

### Installation

```bash
# Clone the repository
git clone https://github.com/akshat-code21/ScalerbookLM.git
cd scalerbooklm

# Install dependencies
bun install
# or
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# Qdrant
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_URL=https://your-cluster.cloud.qdrant.io
```

### Run Development Server

```bash
bun run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat/route.ts        # Streaming chat endpoint
│   │   ├── upload/route.ts      # File upload + ingest endpoint
│   │   └── uploads/route.ts     # List & delete uploaded files
│   ├── globals.css              # Design tokens & theme
│   ├── layout.tsx               # Root layout with metadata & sidebar
│   └── page.tsx                 # Main page entry
├── components/
│   ├── Chat.tsx                 # Chat input with send button
│   ├── ChatHistory.tsx          # Message bubbles with avatars
│   ├── Hero.tsx                 # Landing hero section
│   ├── Home.tsx                 # Main layout orchestrator
│   ├── ThinkingIndicator.tsx    # Animated typing indicator
│   ├── app-sidebar.tsx          # Sidebar with file upload
│   ├── file-upload-dropzone-1.tsx # Upload dropzone with embedding status
│   ├── header.tsx               # Top header bar
│   └── ui/                     # shadcn/ui primitives
├── lib/
│   ├── chat.ts                  # Chat & streaming logic
│   ├── embedding.ts             # OpenRouter embedding config
│   ├── ingest.ts                # Document parsing & vector ingestion
│   ├── openrouter.ts            # OpenRouter client setup
│   ├── prompt.ts                # RAG system prompt template
│   ├── retrieve.ts              # Qdrant similarity search
│   └── uploads.ts               # Upload path utilities
└── package.json
```

---

## Supported File Types

| Type   | Extensions                                    |
| ------ | --------------------------------------------- |
| PDF    | `.pdf`                                        |
| CSV    | `.csv`                                        |
| Text   | `.txt`, `.md`, `.json`, `.html`, `.xml`       |
| Code   | `.js`, `.ts`, `.tsx`, `.jsx`                  |

---
