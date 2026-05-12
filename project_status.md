# Hire GCians! Project Status
**Last updated:** May 12, 2026

---

## 1. Executive Summary
Hire GCians! is a job matching platform connecting Gordon College CCS students with third-party employers. The platform features AI-powered resume parsing (Google Gemini), role-based portals (Student, Employer, Admin), and a complete job application workflow.

**Current Status:** Core functionality complete. 27 pages built. AI pipeline fully functional including cosine similarity matching. Platform deployed on Vercel. Final polish in progress.

---

## 2. Technical Stack
| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | Vue 3 + Vite + Tailwind CSS | ✅ Complete |
| Backend | Supabase (PostgreSQL) | ✅ Complete |
| Authentication | Supabase Auth | ✅ Complete |
| File Storage | Supabase Storage | ✅ Complete |
| AI Integration | Google Gemini API (`embedding-001`) | ✅ Working |
| PDF Processing | pdf.js | ✅ Working |
| Vector Search | pgvector + Cosine Similarity | ✅ Complete |
| Hosting | Vercel | ✅ Deployed |

---

## 3. Completed Pages (27 Total)
| Portal | Pages | Status |
|--------|-------|--------|
| Student Portal | 7 pages | ✅ Complete |
| Employer Portal | 6 pages | ✅ Complete |
| Admin Portal | 10 pages | ✅ Complete |
| Public Pages | 4 pages | ✅ Complete |

---

## 4. AI Pipeline Status
| Component | Status | Notes |
|-----------|--------|-------|
| Resume text extraction | ✅ Working | pdf.js with chunked mobile-optimized parsing |
| Gemini API connection | ✅ Working | Model: `embedding-001` via `v1beta` |
| Embedding generation | ✅ Working | Returns 768-dimension vectors |
| Resume embeddings saved | ✅ Working | Confirmed |
| Job embeddings saved | ✅ Working | Confirmed |
| Cosine similarity matching | ✅ Complete | `match-scores` Edge Function using pgvector `<=>` operator |

---

## 5. Database Row Counts
| Table | Count |
|-------|-------|
| `resume_embeddings` | 1 |
| `job_embeddings` | 1 |
| `match_scores` | 1 |

---

## 6. Resolved Issues
| Issue | Resolution |
|-------|------------|
| Wrong Gemini API version | Fixed — using `v1beta` |
| Wrong model name | Fixed — using `embedding-001` |
| pgvector dimension limit exceeded | Fixed — 768 dims within limit |
| Edge Function deploy parse error | Fixed — removed template literals |
| Student login separate from Employer/Admin | Fixed — split login with ID input |
| Student email auto-append | Fixed — `@gordoncollege.edu.ph` appended |
| Student ID 9-digit validation | Fixed — enforced on login and register |
| Vercel deploy conflict | Fixed — resolved dual-project issue |
| Cosine similarity match scores not generated | Fixed — `match-scores` Edge Function implemented |
| Avatar not shown in employer applicant view | Fixed — added RLS SELECT policy for employers on `student_profiles` |
| Admin users page not loading profiles | Fixed — replaced N+1 per-row queries with single joined query |
| Student info not visible when employer reviews applicant | Fixed — resolved by same RLS policy fix above |
| Mobile resume upload stuck on "Uploading" | Fixed — `file.arrayBuffer()` read before upload; explicit `contentType` + `cacheControl` passed to Supabase storage; PDF parsing chunked in groups of 3 pages with `setTimeout(0)` yields |
| Upload step order wrong (Reading PDF shown before Uploading) | Fixed — steps now correctly ordered: Upload → Read PDF → AI Analyze → Save → Compute Matches |
| Terms & Privacy back button not working | Fixed — `goBack()` uses `router.go(-1)` with fallback to `/` when no history |
| Sidebar avatar inconsistent across portals (mobile) | In Progress — `ResponsiveSidebar.vue` identified as fix point; pending portal files |

---

## 7. Pending Issues

### High Priority
| # | Issue | Status |
|---|-------|--------|
| 1 | Sidebar avatar inconsistent across Student / Employer / Admin on mobile | ⚠️ In Progress |

### Low Priority
| # | Issue | Status |
|---|-------|--------|
| 2 | Remove emojis | ⚠️ Pending |
| 3 | Font consistency | ⚠️ Pending |
| 4 | Add custom and school logos | ⚠️ Pending |

---

## 8. Next Steps
1. **Fix sidebar avatar consistency** — share Student, Employer, and Admin portal files so avatar display can be unified in `ResponsiveSidebar.vue`
2. **Remove emojis** — clean up emoji usage across all portals
3. **Font consistency** — audit and unify font usage across pages
4. **Add logos** — integrate custom and Gordon College logos
