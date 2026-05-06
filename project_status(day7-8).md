# Hire GCians! Project Status

Last updated: `2026-05-05` (Day 7 complete)

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
### ✅ Day 7 — Match rationale + AI pipeline end-to-end test
- [x] `supabase/functions/match-rationale/index.ts` — Gemini generates 3-sentence match rationale, saves to `match_scores.rationale`
- [x] `src/api/matching.js` — added `generateRationale()` and `getRationale()`
- [x] Edge function deployed
- [x] Fixed Vite errors — missing placeholder views created (`JobBrowse`, `Applications`, `Saved`, `Applicants`)
- [x] Fixed `App.vue` — was showing default Vite page, now uses router-view
- [x] Fixed `src/api/supabase.js` — was missing from api folder
- [x] Fixed `admin/Dashboard.vue` — renamed from lowercase to correct casing
- [x] Fixed registration flow — `profiles` table uses `first_name` + `last_name` separately
- [x] Updated `Register.vue` — separate First Name + Last Name fields
- [x] Updated `auth.js` store — register() now sends `first_name`, `last_name`, `role` as metadata
- [x] Updated `handle_new_user` trigger — inserts `first_name`, `last_name` from metadata
- [x] Updated dashboard welcome messages — use `first_name` instead of `full_name`
- [x] Dev server running, Login + Register pages confirmed working
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
│       ├── parse-resume/
│       │   └── index.ts                        ✅ Day 5
│       ├── embed-resume/
│       │   └── index.ts                        ✅ Day 6
│       └── embed-job/
│           └── index.ts                        ✅ Day 6
└── src/
    ├── main.js                                 ✅ Day 1
    ├── App.vue                                 ✅ Day 1
    ├── api/
    │   ├── supabase.js                         ✅ Day 1
    │   ├── jobs.js                             ✅ Day 3
    │   ├── applications.js                     ✅ Day 3
    │   ├── resume.js                           ✅ Day 4–5
    │   └── matching.js                         ✅ Day 6
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
        │   └── Resume.vue                      ✅ Day 5–6
        ├── employer/
        │   ├── Dashboard.vue                   ✅ Day 2
        │   ├── Profile.vue                     ✅ Day 2
        │   ├── JobCreate.vue                   ✅ Day 3–6
        │   └── JobList.vue                     ✅ Day 3
        └── admin/
            └── Dashboard.vue                   ✅ Placeholder
```

---

## Known Issues
- None

## Schema Notes
- `profiles` table uses `first_name` + `last_name` (not `full_name`) — all views and stores updated accordingly
- `profiles` table is missing `full_name` column by design

## Next Session Handoff (Day 8)
Start with:
1. `src/views/student/JobBrowse.vue` — real job browser with search/filter, apply + save buttons, AI match score badges
2. `src/views/student/Dashboard.vue` — wire in `getMatchedJobs()` to show top 3 AI matches
3. Update navbar/layout component for student pages
4. Note: `profiles` uses `first_name` + `last_name` — use `auth.profile?.first_name` in all new views
