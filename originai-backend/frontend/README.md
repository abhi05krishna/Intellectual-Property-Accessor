# OriginAI Frontend

React frontend for the OriginAI Research Originality & Similarity Platform.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Routing | React Router v6 |
| HTTP | Axios (with JWT interceptors + auto-refresh) |
| Charts | Recharts |
| File Upload | react-dropzone |
| Notifications | react-hot-toast |
| Animations | framer-motion |
| Icons | lucide-react |
| Date Utils | date-fns |
| Fonts | Sora + DM Mono (Google Fonts) |

---

## Project Structure

```
src/
├── api/
│   ├── client.js           # Axios instance, JWT interceptor, token refresh
│   └── services.js         # All API calls (auth, analysis, patents, dashboard, users)
├── context/
│   └── AuthContext.jsx     # Global auth state, login/register/logout
├── hooks/
│   └── index.js            # useAnalysisList, useAnalysisPoller, useDashboard, usePatents
├── components/
│   ├── common/
│   │   └── index.jsx       # Button, Card, Badge, ScoreRing, ProgressPipeline, Skeleton, etc.
│   └── layout/
│       ├── AppLayout.jsx   # Topbar + sidebar + <Outlet />
│       └── AppLayout.module.css
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── AnalyzePage.jsx     # Main submission + live polling + results
│   ├── HistoryPage.jsx     # Paginated analysis history
│   ├── AnalysisDetailPage.jsx
│   ├── PatentsPage.jsx
│   ├── DashboardPage.jsx   # Stats + trend chart + domain breakdown
│   └── ProfilePage.jsx     # Profile edit, password change, danger zone
├── styles/
│   └── global.css          # CSS variables, base styles, animations
└── App.jsx                 # Router, protected/public routes, Toaster
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
# For local dev, leave REACT_APP_API_URL blank — CRA proxy forwards /api → localhost:5000
```

### 3. Make sure the backend is running
```bash
# In the originai-backend folder:
npm run dev   # Starts on http://localhost:5000
```

### 4. Start the frontend
```bash
npm start     # Starts on http://localhost:3000
```

### 5. Login with seeded admin account
```
Email:    admin@originai.dev
Password: AdminPass123!
```
(Run `npm run seed` in the backend first)

---

## Key Features

### Analysis Flow
1. User pastes abstract or drops a file (PDF, TXT, MD)
2. `useAnalysisPoller` hook submits to `POST /api/analysis/submit`
3. Backend returns `analysisId` immediately (async pipeline)
4. Hook polls `GET /api/analysis/:id/status` every 2.2s
5. Fake progress bar advances through named pipeline steps
6. On `completed`, fetches full result and renders score rings + similar works + recommendations

### Auth
- JWT stored in `localStorage`
- Axios request interceptor attaches `Authorization: Bearer <token>` to every request
- On 401, response interceptor attempts silent token refresh via `/auth/refresh`
- If refresh fails, clears tokens and redirects to `/login`
- `AuthContext` hydrates from `localStorage` on mount and validates with `GET /auth/me`

### Score Rings
- SVG-based animated rings (CSS stroke-dashoffset transition)
- Color: green ≥ 75%, amber ≥ 50%, red < 50%
- Three rings per result: Originality, Uniqueness (inverse similarity), Novelty Potential

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | `` (empty) | Backend API base URL. Empty = use CRA proxy |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server on :3000 |
| `npm run build` | Production build to `/build` |
| `npm test` | Run tests |

---

## Connecting to Production Backend

In `.env`:
```
REACT_APP_API_URL=https://api.yourbackend.com/api
```

Then rebuild:
```bash
npm run build
```
Serve the `/build` folder with nginx, Vercel, Netlify, or any static host.

---

## Deployment Notes

- The `proxy` field in `package.json` only works in development
- For production, set `REACT_APP_API_URL` and configure CORS on the backend accordingly
- Recommended: deploy frontend on Vercel/Netlify, backend on Railway/Render/AWS
