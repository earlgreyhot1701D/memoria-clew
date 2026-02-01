# MEMORIA CLEW

**Remember everything. Find anything. Understand your trajectory.**  
*"Let's separate signal from hype with a cool head and a sharp knife."*

---

You save a link while debugging a feature.  
You skim a newsletter while researching a tool.  
You copy a snippet from a thread you *swear* you'll remember.

In the moment, it matters.

Later, the link is still there – but the reason you saved it is gone.  
The context evaporates.

Bookmarks don't remember **why**.  
Feeds only show what's **new**, not what's relevant **now**.

This isn't a search problem.  
It's a **memory + timing + understanding** problem.

---

## What Memoria Clew Does

Memoria Clew is a **local-first research memory for developers** that does two things:

**1. Smart Recall**  
It captures the external technical information you already consume – **URLs, newsletters, headlines, tools, docs, snippets** – and then **resurfaces** what you saved when it becomes relevant again, with transparent reasoning and conservative confidence scoring.

**2. Pattern Intelligence**  
It analyzes your complete research history to detect **themes** (what you consistently learn), **gaps** (what you haven't explored), and **recommendations** (what to learn next). All analysis is transparent and deterministic – you can see exactly what it matched and why.

This follows the "Clew Suite" philosophy: **analyze patterns across your work, then guide you forward**.

No black-box magic. No hidden autonomy. Just useful recall at the right moment, plus intelligent guidance on your learning trajectory.

---

![Memoria Clew Homepage](./assets/memoriaclewhomepage1.png)

A local-first, memory-augmented research assistant.

Memoria Clew is designed to help you capture, recall, and synthesize information for your projects.

![How It Works](./assets/howitworks.png)

## Knowledge Archive

Explore your captured knowledge with auto-generated tags and smart filters.

![Knowledge Archive](./assets/memoriaclewknowledgearchive.png)

---

## Core Workflow

1. **Seed context** (optional but powerful)  
   Point Memoria Clew at a GitHub username → it ingests high-level repo context (including READMEs) to establish "what you build."

2. **Quick Capture**  
   Paste a URL or snippet → Memoria Clew summarizes + tags it → stores it in your archive.

3. **Recall**  
   Ask a question or capture something new → Memoria Clew scores your archive against your current context and returns the best matches, with reasons.

4. **Analyze Your Patterns**  
   View your research dashboard → Memoria Clew analyzes themes, gaps, and recommendations based on what you've captured → understand your learning trajectory.

5. **Proactive Scan** (manual, MVP)  
   Trigger a single-source scan (e.g., HN RSS) → Memoria Clew produces a small set of context-matched items (top 3) instead of a firehose.

6. **System Log**  
   Every meaningful action is logged (capture, tagging, recall triggers, pattern analysis, rate limit decisions).

---

## Architecture

Memoria Clew is intentionally inspectable: **simple services, explicit boundaries, transparent intelligence**.

```text
┌──────────────────────────┐
│   Frontend (Vite)        │  React UI
│  - capture input         │  - archive/search
│  - context panel         │  - recall cards
│  - pattern dashboard     │  - recommendations
│  - system log            │
└──────────────┬───────────┘
               │ HTTP
               ▼
┌────────────────────────────────────────┐
│ Server (Node/Express + MCP)            │
│                                        │
│  /api/context/sync ──── GitHub context
│  /api/capture ────────── summarize + tag
│  /api/recall ──────────── deterministic scoring
│  /api/patterns ────────── theme + gap analysis
│                                        │
│  LeanMCP HTTP server ──── tool exposure
│  - memoria_recall (for agents)         │
│  - memoria_patterns (for agents)       │
└──────────────┬─────────────────────────┘
               ▼
        Firestore (user-scoped)
```

### Intelligence Layer

The pattern analysis service adds reasoning about your research trajectory:

```text
Archive Items (all research)
         ↓
  Pattern Analyzer (LLM-powered)
         ↓
  ├─ Theme Detection (what you focus on)
  ├─ Gap Analysis (what's missing)
  └─ Recommendations (what to learn next)
         ↓
  MCP Tool (memoria_patterns) + API Endpoint (/api/patterns)
         ↓
  Available to: UI Dashboard + Agent Invocation
```

This layer is **separate from recall** (which is deterministic matching) and focuses on **understanding your learning trajectory**.

---

## Features

### ✅ Capture + Archive
- Paste **URL or text snippet**
- LLM **summary + tag extraction** (Claude or Gemini, with automatic fallback)
- Archive persisted via **Firestore** (user-scoped collections)
- Inspectable structured records (title, summary, tags, source, timestamps)

### ✅ Context Seeding (GitHub)
- GitHub context sync endpoint
- Pulls lightweight signals from public repo metadata and READMEs
- Treated as **weak signal** (biasing recall, not pretending to "understand your whole codebase")
- GitHub repos automatically indexed in archive for discovery

### ✅ Recall Engine (Deterministic + Explainable)
- Transparent scoring (tag overlap, query match, tool/tech match, recency boost)
- Confidence thresholding to reduce noise
- Explanations like: "Matches tags: REACT, TYPESCRIPT"
- Fallback behavior to avoid empty UX
- Case-insensitive matching with multi-factor scoring

### ✅ Pattern Analysis (Agent-Powered Intelligence)
- Analyzes your complete research archive
- Detects **learning themes** (what technologies/patterns you focus on)
- Identifies **knowledge gaps** (what you haven't explored yet)
- Generates **recommendations** (what to learn next based on your trajectory)
- Exposed via **MCP tool** (`memoria_patterns`) for agent integration
- All reasoning is logged and inspectable (no black-box decisions)

### ✅ Manual "Proactive" Scan (MVP)
- One manual scan of a single source (HN RSS)
- Produces a small set of context-matched items (top 3)
- No background agents, no always-on crawlers

### ✅ Trust & Safety Guardrails
- Rate limiting service + tests
- Security middleware + tests
- Explicit "suggestive not authoritative" posture
- Per-IP rate limiting to prevent abuse

### ✅ Docker for Local Dev + Deployment Readiness
- `docker-compose.yml` included (frontend + MCP server)
- `server/Dockerfile` included (containerizable backend)
- `frontend/Dockerfile.dev` included (dev container)

---

## LeanMCP Integration & Agent Capabilities

Memoria Clew includes a real MCP server powered by **`@leanmcp/core`**.

### Tools Exposed

1. **`memoria_recall`** - Surface relevant research based on current project context
   - Input: userId, projectTags, projectDescription, query
   - Output: Matched items with relevance scores and explanations
   - Use case: Agent helping you build asks "what have I researched about this?"

2. **`memoria_patterns`** - Analyze research patterns and get learning recommendations
   - Input: userId
   - Output: Detected themes, gaps, recommendations
   - Use case: Agent asks "what should this developer learn next?"

### Why This Approach

- Agent capabilities are **explicit, not hidden** - you can see exactly what tools agents can invoke
- Reasoning is **transparent** - every recall and every pattern analysis logs its scoring and reasoning
- Integration is **clean** - tools use the same service layer as the UI
- Audit trail is **complete** - all tool invocations are logged
- **No background autonomy** - agents only act on explicit invocation, never silently

### How It's Used

- The backend boots **REST endpoints** (for the UI) and an **MCP server** (for tool invocation)
- Agents can invoke tools to:
  - Recall relevant research: "What have I learned about Docker?"
  - Understand patterns: "What should I learn next?"
- Example agent workflow: *"I see you're building with React. You've researched async patterns heavily. You're ready for performance optimization. Here's what you captured about it..."*

This keeps agent behavior auditable and user-controlled—no background autonomy, only structured tool calls with visible reasoning.

---

## Quickstart

### Option A: Docker (recommended for "it just runs")

1) Copy env file and fill it in:
```bash
cp .env.example .env
```

2) Start everything:
```bash
docker compose up --build
```

3) Open:
- Frontend: http://localhost:3000  
- MCP server: http://localhost:3001  

> Note: the backend also starts an internal REST listener; in Docker, the MCP port is what's exposed for tool invocation.

### Option B: Run locally (no Docker)

**Backend**
```bash
cd server
npm install
npm run dev
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Open:
- Frontend: http://localhost:3000

---

## Configuration (No Secrets in Git)

All config is via `.env` (see `.env.example`).

You'll typically set:
- `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` (LLM provider for summarization)
- `GITHUB_TOKEN` (optional but recommended for higher GitHub rate limits)
- Firebase/Firestore values for persistence

⚠️ Never commit real keys. Use `.env` locally and secret managers in deployment.

---

## Testing & QA

Hackathon reality: we ship a working core loop first, then harden.

### What's in the repo
- **Backend:** Jest tests (coverage enabled)
  - Recall engine tests
  - Pattern analysis tests
  - Service layer tests
  - Rate limiting and security tests
- **Frontend:** Vitest tests
  - Component tests
  - Hook tests
- GitHub Actions workflows:
  - backend test workflow
  - frontend test workflow

### How to run tests

**Backend**
```bash
cd server
npm test
```

**Frontend**
```bash
cd frontend
npm test
```

### QA posture (honest)
- The "happy path" demo is strong: capture → archive → recall → understand patterns
- Tests cover core functionality (recall scoring, pattern analysis, error handling)
- If you're demoing: rehearse the happy path, avoid untested edge cases

---

## Accessibility (WCAG 2.1 target)

This project is built with an explicit goal of **WCAG 2.1 AA-friendly UI**:
- keyboard-navigable controls
- visible focus states
- semantic labels for inputs/buttons
- readable contrast (minimalist "Nothing Tech" aesthetic)

Hackathon scope note: this is a target and design constraint; a full audit (axe + manual SR testing) is a planned hardening step.

---

## Philosophy: Intelligence Without Autonomy

Memoria Clew is built around a specific idea: **agents should have tools, not autonomy**.

- **Tools**: Explicit, inspectable, logged (memoria_recall, memoria_patterns)
- **Not Autonomy**: No background crawlers, no hidden decisions, no "magic" that runs without you knowing

Pattern analysis exists to serve this: an agent can ask your memory "what should I learn next?" but the analysis itself is transparent—you can see the patterns it detected and the reasoning behind recommendations.

This is the "Clew" philosophy: give builders tools to understand their own trajectory, then let them decide what to do with that understanding.

---

## Risks & Mitigations

- **Rate limiting / API costs** → rate limit service + conservative calls; avoid background agents in MVP  
- **Secrets leakage** → `.env.example`, never commit keys, sanitize logs  
- **Cold start (empty archive)** → manual scan + explicit "no relevant past research yet" UI  
- **Overclaiming intelligence** → deterministic scoring + visible reasons + conservative language  
- **GitHub context inaccuracies** → treated as weak signal, not truth  
- **LLM variability** → store summaries/tags; deterministic recall reduces drift  
- **Pattern analysis hallucination** → Claude/Gemini prompts explicitly forbid inference, ask only for extraction

---

## Attribution & Vibe Coding

Built for the **AI Vibe Coding Hackathon (Jan 30 – Feb 2, 2026)** using AI-assisted workflows.

Tools used during development:
- **Google Gemini** (prompt iteration, summarization/tagging experimentation)
- **Anthropic Claude** (refactors, test triage, copy/README editing, pattern analysis implementation)
- **Google Antigravity** (UI scaffolding + wiring verification)
- **Dr. Kahlo** (custom ChatGPT) (QA review, product narrative, README hardening)

Used for:
- speeding up scaffolding + iteration
- drafting prompts and documentation
- QA checklists and refactor guidance
- pattern analysis service implementation

Not used for:
- background autonomous crawling without user action
- training on user data
- hidden decision-making without logs

---

## License

MIT