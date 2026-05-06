# Hire GCians! Project Status

Last updated: `2026-05-03`

## Stack (Final — Option B)

| Layer | Technology |
|---|---|
| Frontend | Vue 3 + Vite + Tailwind |
| Backend | Django 5 + DRF |
| Database | PostgreSQL + pgvector |
| Auth | SimpleJWT |
| PDF extraction | PyMuPDF |
| Resume parsing | Gemini 2.0 Flash API |
| Embeddings | Gemini text-embedding-004 |
| Match scoring | Cosine similarity via pgvector |
| Match rationale | Gemini 2.0 Flash API |
| Async jobs | Celery + Redis |
| Frontend deploy | Vercel |
| Backend deploy | Railway |

## Role Model
- `student` — Gordon College applicants
- `employer` — third-party companies
- `admin` — Gordon College oversight only

## Core Rule
Skills used for matching come exclusively from AI analysis of uploaded PDF resumes. Students never manually enter skills.

---

## Progress

### ✅ Day 1 — Django scaffold, models, auth
- [x] Django project created (`hiregcians/`)
- [x] Apps: `users`, `students`, `employers`, `jobs`, `applications`, `ai_pipeline`
- [x] Custom user model with role field (`student` / `employer` / `admin`)
- [x] JWT auth endpoints (`/api/auth/register/`, `/api/auth/login/`, `/api/auth/refresh/`)
- [x] PostgreSQL + pgvector configured in `settings.py`
- [x] `requirements.txt` complete
- [x] `.env.example` provided

### ⬜ Day 2 — Resume upload + student/employer profiles
### ⬜ Day 3 — Jobs + applications CRUD
### ⬜ Day 4 — PyMuPDF extraction → Gemini parsing → skills to DB
### ⬜ Day 5 — Gemini embeddings → pgvector → cosine similarity
### ⬜ Day 6 — Match rationale + Celery pipeline
### ⬜ Day 7 — API testing + seed data
### ⬜ Day 8 — Vue 3 scaffold + auth pages
### ⬜ Day 9 — Student dashboard + job browser
### ⬜ Day 10 — Employer dashboard + posting
### ⬜ Day 11 — Resume upload UI + AI pipeline trigger
### ⬜ Day 12 — Admin pages
### ⬜ Day 13 — Deploy Railway + Vercel
### ⬜ Day 14 — Bug fixes + demo prep

---

## Known Issues
- None yet

## Repo Structure
```
hiregcians/
├── hiregcians/         # Django project config
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── users/              # Custom user model + JWT auth
├── students/           # Student profiles + resume metadata
├── employers/          # Employer profiles
├── jobs/               # Job listings
├── applications/       # Student applications
├── ai_pipeline/        # PDF extraction, Gemini, embeddings, matching
├── frontend/           # Vue 3 (added Day 8)
├── requirements.txt
├── .env.example
└── manage.py
```
