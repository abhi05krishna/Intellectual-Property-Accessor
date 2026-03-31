# OriginAI Backend

Research Originality & Similarity Platform — Node.js + Express + MongoDB Atlas Vector Search

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB Atlas (M10+) |
| Vector Search | MongoDB Atlas Vector Search |
| Embeddings | OpenAI `text-embedding-3-small` (1536-dim) |
| AI Recommendations | Anthropic Claude claude-sonnet-4-20250514 |
| Auth | JWT (access + refresh tokens) |
| File Parsing | pdf-parse, multer |
| Logging | Winston |

---

## Project Structure

```
src/
├── server.js                    # Express app + middleware setup
├── config/
│   ├── database.js              # MongoDB connection + vector index creation
│   └── logger.js                # Winston logger
├── models/
│   ├── user.model.js            # User schema (auth, stats)
│   ├── analysis.model.js        # Submission + results schema
│   ├── paper.model.js           # Research paper corpus (vector indexed)
│   └── patent.model.js          # Patent corpus
├── controllers/
│   ├── auth.controller.js       # Register, login, refresh, me
│   ├── analysis.controller.js   # Submit, poll, fetch, export
│   ├── paper.controller.js      # Search corpus, ingestion triggers
│   ├── patent.controller.js     # Patent listing + ingestion
│   ├── user.controller.js       # Profile management
│   └── dashboard.controller.js  # Aggregated stats
├── routes/
│   ├── auth.routes.js
│   ├── analysis.routes.js
│   ├── paper.routes.js
│   ├── patent.routes.js
│   ├── user.routes.js
│   └── dashboard.routes.js
├── services/
│   ├── embedding.service.js      # OpenAI embedding generation
│   ├── vectorSearch.service.js   # Atlas Vector Search ANN queries
│   ├── analysis.service.js       # Full analysis pipeline orchestrator
│   ├── aiRecommendations.service.js  # Claude-powered recommendations
│   └── ingestion.service.js      # ArXiv / Semantic Scholar / USPTO ingestion
├── middleware/
│   ├── auth.middleware.js        # JWT protect + restrictTo
│   ├── upload.middleware.js      # Multer file upload
│   ├── validate.middleware.js    # express-validator handler
│   └── errorHandler.js          # Global error handler
└── utils/
    ├── appError.js               # Custom error class
    └── seedDatabase.js           # Dev data seeder
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in MONGO_URI, OPENAI_API_KEY, ANTHROPIC_API_KEY, JWT_SECRET
```

### 3. Seed database (development)
```bash
npm run seed
# Creates: 5 sample papers, 2 patents, 1 admin user
# Admin: admin@originai.dev / AdminPass123!
```

### 4. Run server
```bash
npm run dev      # Development (nodemon)
npm start        # Production
```

---

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, receive JWT |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |
| PATCH | `/api/auth/change-password` | Change password |

### Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/submit` | Submit abstract/file for analysis |
| GET | `/api/analysis` | List user's analyses |
| GET | `/api/analysis/:id` | Get full analysis result |
| GET | `/api/analysis/:id/status` | Poll processing status |
| GET | `/api/analysis/:id/export` | Export as JSON report |
| DELETE | `/api/analysis/:id` | Delete analysis |

**Submit body (multipart/form-data or JSON):**
```json
{
  "abstract": "Your abstract text here...",
  "title": "Optional paper title",
  "domain": "Computer Science & AI",
  "documentType": "abstract",
  "comparisonDatabase": "all"
}
```
Or attach a `document` file (PDF, DOCX, TXT, MD).

**Status values:** `pending` → `processing` → `completed` | `failed`

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Full dashboard stats + trend data |

### Patents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patents` | List patents (filter: domain, office, q) |
| GET | `/api/patents/:id` | Single patent |
| POST | `/api/patents/ingest` | Trigger USPTO ingestion (admin) |

### Papers (Corpus)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/papers` | Search corpus |
| GET | `/api/papers/stats` | Corpus statistics |
| POST | `/api/papers/ingest/arxiv` | Ingest from ArXiv (admin) |
| POST | `/api/papers/ingest/semantic-scholar` | Ingest from Semantic Scholar (admin) |

---

## Analysis Pipeline

```
User submits abstract
        ↓
Generate embedding (OpenAI text-embedding-3-small, 1536-dim)
        ↓
Atlas Vector Search — ANN cosine similarity against 4M+ paper corpus
        ↓
Compute scores (originality, similarity, novelty potential)
        ↓
Claude claude-sonnet-4-20250514 generates recommendations
        ↓
Results saved to MongoDB, returned to client
```

---

## Data Ingestion

Populate the corpus by running ingestion from admin endpoints:

```bash
# Ingest 500 CS/AI papers from ArXiv
POST /api/papers/ingest/arxiv
{ "domain": "Computer Science & AI", "maxResults": 500 }

# Ingest from Semantic Scholar
POST /api/papers/ingest/semantic-scholar
{ "query": "federated learning privacy", "domain": "Computer Science & AI", "limit": 100 }

# Ingest patents from USPTO
POST /api/patents/ingest
{ "keyword": "machine learning", "domain": "Computer Science & AI", "limit": 50 }
```

---

## MongoDB Atlas Vector Search Index

The index is auto-created on startup (see `config/database.js`).

Manual creation in Atlas UI:
```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 1536, "similarity": "cosine" },
    { "type": "filter", "path": "domain" },
    { "type": "filter", "path": "year" },
    { "type": "filter", "path": "source" }
  ]
}
```

> **Requires MongoDB Atlas M10+ cluster** with Vector Search enabled.
> Free tier falls back to text search automatically.

---

## Environment Variables

See `.env.example` for the full list.

Key variables:
- `MONGO_URI` — MongoDB Atlas connection string
- `OPENAI_API_KEY` — For embeddings
- `ANTHROPIC_API_KEY` — For AI recommendations
- `JWT_SECRET` — Must be long, random string in production
