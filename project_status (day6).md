# Hire GCians! Project Status

Last updated: `2026-05-04` (Day 5 complete)

## Stack (Final)

| Layer | Technology |
|---|---|
| Frontend | Vue 3 + Vite + Tailwind |
| Backend / Database | Supabase (PostgreSQL + Auth + Storage + pgvector) |
| Auth | Supabase Auth |
| File storage | Supabase Storage |
| PDF extraction | PyMuPDF |
| Resume parsing | Gemini 2.0 Flash API |
| Embeddings | Gemini text-embedding-004 |
| Match scoring | Cosine similarity via pgvector |
| Match rationale | Gemini 2.0 Flash API |
| Async jobs | Supabase Edge Functions |
| Frontend deploy | Vercel |

## Role Model
- `student` — Gordon College applicants
- `employer` — third-party companies
- `admin` — Gordon College oversight only

## Core Rule
Skills used for matching come exclusively from AI analysis of uploaded PDF resumes. Students never manually enter skills.

---

## Progress

### ✅ Pre-work — Stack decision + schema design
- [x] Stack finalized: Vue 3 + Supabase + Gemini
- [x] Full DB schema designed (profiles, jobs, applications, embeddings, match_scores)
- [x] CONTEXT.md written for AI handoff
- [x] Static HTML/CSS/JS prototype exists as UI reference (25+ pages)

### ✅ Day 1 — Supabase setup + Vue scaffold + auth
- [x] `supabase/schema.sql` — all tables, RLS policies, triggers, cosine similarity function
- [x] pgvector enabled via `create extension if not exists vector`
- [x] Auto-create profile trigger (`handle_new_user`) on signup
- [x] Cosine similarity SQL function (`match_jobs_for_student`)
- [x] Vue 3 + Vite + Tailwind scaffolded
- [x] `src/api/supabase.js` — Supabase client with env variable validation
- [x] `.env` — `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- [x] Vue Router (`src/router/index.js`) with role-based guards
- [x] Pinia auth store (`src/stores/auth.js`) — init, register, login, logout, role
- [x] `src/views/auth/Login.vue` — email/password login, role-aware redirect
- [x] `src/views/auth/Register.vue` — name, email, password, role selector (student/employer)
- [x] `src/App.vue` — calls `auth.init()`, shows loading state
- [x] Placeholder dashboards — `student/`, `employer/`, `admin/`

### ✅ Day 2 — Student + employer profiles
- [x] `src/views/student/Profile.vue` — course, year level, bio form with upsert
- [x] `src/views/employer/Profile.vue` — company name, industry, website, description with upsert
- [x] `src/views/student/Dashboard.vue` — real dashboard with profile completion banner
- [x] `src/views/employer/Dashboard.vue` — real dashboard with profile completion banner
- [x] Router updated with `/student/profile` and `/employer/profile` routes
### ⬜ Day 3 — Job listing + applications CRUD
### ⬜ Day 4 — Resume upload + PyMuPDF extraction
### ⬜ Day 5 — Gemini parsing → skills to Supabase
### ⬜ Day 6 — Gemini embeddings → pgvector → cosine similarity
### ⬜ Day 7 — Match rationale + AI pipeline end-to-end test
### ⬜ Day 8 — Student dashboard + job browser UI
### ⬜ Day 9 — Application tracker + saved jobs UI
### ⬜ Day 10 — Employer dashboard + job posting UI
### ⬜ Day 11 — Employer applicant review + match rationale UI
### ⬜ Day 12 — Admin oversight pages
### ⬜ Day 13 — Deploy Vercel + end-to-end testing
### ⬜ Day 14 — Bug fixes + real user testing + demo prep

---

## File Map (Day 2 Complete)

```
hiregcians/
├── .env                                        ✅
├── vite.config.js                              ✅
├── package.json                                ✅
├── supabase/
│   ├── schema.sql                              ✅ Day 1
│   └── functions/
│       ├── extract-resume/
│       │   └── index.ts                        ✅ Day 4
│       └── parse-resume/
│           └── index.ts                        ✅ Day 5
└── src/
    ├── main.js                                 ✅ Day 1
    ├── App.vue                                 ✅ Day 1
    ├── api/
    │   ├── supabase.js                         ✅ Day 1
    │   ├── jobs.js                             ✅ Day 3
    │   ├── applications.js                     ✅ Day 3
    │   └── resume.js                           ✅ Day 4–5
    ├── stores/
    │   ├── auth.js                             ✅ Day 1
    │   └── jobs.js                             ✅ Day 3
    ├── router/
    │   └── index.js                            ✅ updated Day 5
    └── views/
        ├── auth/
        │   ├── Login.vue                       ✅ Day 1
        │   └── Register.vue                    ✅ Day 1
        ├── student/
        │   ├── Dashboard.vue                   ✅ Day 2
        │   ├── Profile.vue                     ✅ Day 2
        │   ├── JobBrowse.vue                   ✅ Day 3
        │   └── Resume.vue                      ✅ Day 5
        ├── employer/
        │   ├── Dashboard.vue                   ✅ Day 2
        │   ├── Profile.vue                     ✅ Day 2
        │   ├── JobCreate.vue                   ✅ Day 3
        │   └── JobList.vue                     ✅ Day 3
        └── admin/
            └── Dashboard.vue                   ✅ Placeholder
```

---

## Known Issues
- None

## Next Session Handoff (Day 6)
Start with:
1. `supabase/functions/embed-resume/index.ts` — Edge Function: takes `parsed_skills` + `raw_text`, generates embedding via Gemini `text-embedding-004`, saves vector to `resume_embeddings` table
2. `supabase/functions/embed-jobs/index.ts` — same for job descriptions → `job_embeddings` table
3. `src/api/matching.js` — call `match_jobs_for_student()` SQL function (cosine similarity via pgvector)
4. Wire match scores into student dashboard
