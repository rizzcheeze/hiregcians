# Hire GCians! Project Status

**Last updated:** May 12, 2026

---

## 1. Executive Summary

Hire GCians! is a job matching platform connecting Gordon College CCS students with third-party employers. The platform features AI-powered resume parsing (Google Gemini), role-based portals (Student, Employer, Admin), and a complete job application workflow.

**Current Status:** Core functionality complete. 27 pages built. **AI embedding pipeline is functional but database insertion issue pending.**

---

## 2. Technical Stack

| Layer          | Technology                   | Status          |
| -------------- | ---------------------------- | --------------- |
| Frontend       | Vue 3 + Vite + Tailwind CSS  | ✅ Complete     |
| Backend        | Supabase (PostgreSQL)        | ✅ Complete     |
| Authentication | Supabase Auth                | ✅ Complete     |
| File Storage   | Supabase Storage             | ✅ Complete     |
| AI Integration | Google Gemini API            | ✅ Working      |
| PDF Processing | pdf.js                       | ✅ Working      |
| Vector Search  | pgvector + Cosine Similarity | ⚠️ Insert Issue |
| Hosting        | Vercel                       | ⏳ Pending      |

---

## 3. Completed Pages (27 Total)

| Portal          | Pages    | Status      |
| --------------- | -------- | ----------- |
| Student Portal  | 7 pages  | ✅ Complete |
| Employer Portal | 6 pages  | ✅ Complete |
| Admin Portal    | 10 pages | ✅ Complete |
| Public Pages    | 4 pages  | ✅ Complete |

---

## 4. AI Pipeline Status

| Component                  | Status     | Notes                              |
| -------------------------- | ---------- | ---------------------------------- |
| Resume text extraction     | ✅ Working | pdf.js extracts text successfully  |
| Gemini API connection      | ✅ Working | Model: gemini-embedding-001        |
| Embedding generation       | ✅ Working | Returns 3072-dimension vectors     |
| Database insert            | ⚠️ Pending | Vector format compatibility issue  |
| Cosine similarity matching | ⚠️ Blocked | Waiting for embeddings to populate |

### Current Issue

Edge Functions successfully generate embeddings and return `success: true`, but data is not being inserted into `resume_embeddings` and `job_embeddings` tables. The issue is related to PostgreSQL vector type formatting.

### Debugging Status

- ✅ Edge Functions deploy successfully
- ✅ Functions can be invoked from frontend
- ✅ Gemini API returns valid embeddings
- ✅ No 500 errors
- ❌ Database insert not persisting (tables remain at 0)

---

## 5. Database Schema

### this part is pretty much ok now prioritize the next section

### `resume_embeddings`

| Column     | Type      | Status          |
| ---------- | --------- | --------------- |
| id         | uuid      | ✅              |
| resume_id  | uuid      | ✅              |
| embedding  | vector    | ⚠️ Insert issue |
| created_at | timestamp | ✅              |

### `job_embeddings`

| Column    | Type   | Status          |
| --------- | ------ | --------------- |
| id        | uuid   | ✅              |
| job_id    | uuid   | ✅              |
| embedding | vector | ⚠️ Insert issue |

### Current Row Counts

| Table               | Count             |
| ------------------- | ----------------- |
| `resume_embeddings` | 0                 |
| `job_embeddings`    | 0                 |
| `match_scores`      | 3 (from fallback) |

---

## 6. Known Issues & Priorities

### do this first

| #   | Issue                                                         | Status     |
| --- | ------------------------------------------------------------- | ---------- |
| 3   | Mobile upload slow/order wrong                                | ⚠️ Pending |
| 4   | Profile picture upload                                        | ⚠️ Pending |
| 5   | Student email auto-append @gordoncollege.edu.ph               | ⚠️ Pending |
| 6   | Number only for student email registration (must be 9 digits) | ⚠️ Pending |

### Medium Priority

| #   | Issue                                                                 | Status     |
| --- | --------------------------------------------------------------------- | ---------- |
| 6   | Public profile pages                                                  | ⚠️ Pending |
| 7   | no dedicated Announcements section on dashboards (employer & student) | ⚠️ Pending |
| 8   | CCS students focused                                                  | ⚠️ Pending |

### Low Priority

| #   | Issue                           | Status     |
| --- | ------------------------------- | ---------- |
| 9   | Remove emojis                   | ⚠️ Pending |
| 10  | Font consistency                | ⚠️ Pending |
| 11  | Add the Custom and school logos | ⚠️ Pending |

**Status: mobile upload is top priority.** 🔧
