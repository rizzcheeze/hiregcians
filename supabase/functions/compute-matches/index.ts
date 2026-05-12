import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { student_id, job_id } = await req.json()
    if (!student_id && !job_id) throw new Error('student_id or job_id is required')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('EMBEDDING_SERVICE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase service credentials not configured')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const results = []

    if (student_id) results.push(...await computeMatchesForStudent(supabase, student_id))
    if (job_id) results.push(...await computeMatchesForJob(supabase, job_id))

    return new Response(
      JSON.stringify({ success: true, count: results.length, matches: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('compute-matches error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

async function computeMatchesForStudent(supabase: any, studentId: string) {
  const { data: resume, error: resumeError } = await supabase
    .from('resumes')
    .select('id, created_at, parsed_skills')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (resumeError) throw new Error(`Failed to load active resume: ${resumeError.message}`)
  if (!resume?.id) throw new Error('No active resume found for this student')

  const { data: resumeEmbedding, error: resumeEmbeddingError } = await supabase
    .from('resume_embeddings')
    .select('embedding')
    .eq('resume_id', resume.id)
    .limit(1)
    .maybeSingle()
  if (resumeEmbeddingError) throw new Error(`Failed to load resume embedding: ${resumeEmbeddingError.message}`)
  if (!resumeEmbedding?.embedding) throw new Error('No resume embedding found. Re-upload the resume after deploying embed-resume.')

  const { data: profile, error: profileError } = await supabase
    .from('student_profiles')
    .select('skills')
    .eq('user_id', studentId)
    .maybeSingle()
  if (profileError) throw new Error(`Failed to load student profile: ${profileError.message}`)

  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, title, description, required_skills')
    .eq('status', 'active')
  if (jobsError) throw new Error(`Failed to load job embeddings: ${jobsError.message}`)

  const jobIds = (jobs || []).map((job) => job.id)
  if (!jobIds.length) return []

  const { data: jobEmbeddings, error: jobEmbeddingsError } = await supabase
    .from('job_embeddings')
    .select('job_id, embedding')
    .in('job_id', jobIds)
  if (jobEmbeddingsError) throw new Error(`Failed to load job embeddings: ${jobEmbeddingsError.message}`)

  const resumeVector = parseVector(resumeEmbedding.embedding)
  const results = []
  const jobsById = new Map((jobs || []).map((job) => [job.id, job]))
  const studentSkills = normalizeSkills([
    ...arrayValue(resume.parsed_skills),
    ...arrayValue(profile?.skills),
  ])

  for (const jobEmbedding of jobEmbeddings || []) {
    if (!jobEmbedding?.embedding) continue
    const job = jobsById.get(jobEmbedding.job_id)
    const match = calculateMatchScore({
      embeddingScore: cosineSimilarity(resumeVector, parseVector(jobEmbedding.embedding)),
      studentSkills,
      jobSkills: getJobSkills(job),
    })
    await saveMatch(supabase, studentId, jobEmbedding.job_id, match)
    results.push({ job_id: jobEmbedding.job_id, score: match.score, rationale: match.rationale })
  }

  return results.sort((a, b) => b.score - a.score)
}

async function computeMatchesForJob(supabase: any, jobId: string) {
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, description, required_skills')
    .eq('id', jobId)
    .maybeSingle()
  if (jobError) throw new Error(`Failed to load job: ${jobError.message}`)
  if (!job?.id) throw new Error('Job not found')

  const { data: jobEmbedding, error: jobEmbeddingError } = await supabase
    .from('job_embeddings')
    .select('embedding')
    .eq('job_id', jobId)
    .limit(1)
    .maybeSingle()
  if (jobEmbeddingError) throw new Error(`Failed to load job embedding: ${jobEmbeddingError.message}`)
  if (!jobEmbedding?.embedding) throw new Error('No job embedding found. Re-save the job after deploying embed-job.')

  const { data: resumes, error: resumesError } = await supabase
    .from('resumes')
    .select('id, student_id, created_at, parsed_skills')
    .eq('is_active', true)
  if (resumesError) throw new Error(`Failed to load resume embeddings: ${resumesError.message}`)

  const resumeIds = (resumes || []).map((resume) => resume.id)
  if (!resumeIds.length) return []

  const { data: resumeEmbeddings, error: resumeEmbeddingsError } = await supabase
    .from('resume_embeddings')
    .select('resume_id, embedding')
    .in('resume_id', resumeIds)
  if (resumeEmbeddingsError) throw new Error(`Failed to load resume embeddings: ${resumeEmbeddingsError.message}`)

  const embeddingsByResumeId = new Map((resumeEmbeddings || []).map((embedding) => [embedding.resume_id, embedding.embedding]))
  const jobVector = parseVector(jobEmbedding.embedding)
  const jobSkills = getJobSkills(job)
  const newestByStudent = new Map<string, any>()
  for (const resume of resumes || []) {
    const previous = newestByStudent.get(resume.student_id)
    if (!previous || new Date(resume.created_at) > new Date(previous.created_at)) {
      newestByStudent.set(resume.student_id, resume)
    }
  }

  const results = []
  for (const resume of newestByStudent.values()) {
    const resumeEmbedding = embeddingsByResumeId.get(resume.id)
    if (!resumeEmbedding) continue
    const match = calculateMatchScore({
      embeddingScore: cosineSimilarity(parseVector(resumeEmbedding), jobVector),
      studentSkills: normalizeSkills(arrayValue(resume.parsed_skills)),
      jobSkills,
    })
    await saveMatch(supabase, resume.student_id, jobId, match)
    results.push({ student_id: resume.student_id, job_id: jobId, score: match.score, rationale: match.rationale })
  }

  return results.sort((a, b) => b.score - a.score)
}

async function saveMatch(supabase: any, studentId: string, jobId: string, match: { score: number; rationale: string }) {
  const payload = {
    student_id: studentId,
    job_id: jobId,
    score: match.score,
    rationale: match.rationale,
    computed_at: new Date().toISOString(),
  }

  const { error: upsertError } = await supabase
    .from('match_scores')
    .upsert(payload, { onConflict: 'student_id,job_id' })

  if (!upsertError) return
  console.warn('match_scores upsert failed, using select/update fallback:', upsertError.message)

  const { data: existing, error: selectError } = await supabase
    .from('match_scores')
    .select('id')
    .eq('student_id', studentId)
    .eq('job_id', jobId)
    .limit(1)
    .maybeSingle()
  if (selectError) throw new Error(`Failed to check match score: ${selectError.message}`)

  if (existing?.id) {
    const { error } = await supabase
      .from('match_scores')
      .update(payload)
      .eq('id', existing.id)
    if (error) throw new Error(`Failed to update match score: ${error.message}`)
    return
  }

  const { error } = await supabase
    .from('match_scores')
    .insert(payload)
  if (error) throw new Error(`Failed to insert match score: ${error.message}`)
}

function parseVector(value: unknown): number[] {
  if (Array.isArray(value)) return value.map(Number)
  if (typeof value !== 'string') throw new Error('Unexpected embedding format')
  return value
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((num) => Number.isFinite(num))
}

function cosineSimilarity(a: number[], b: number[]) {
  if (!a.length || a.length !== b.length) return 0

  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return 0
  const score = dot / (Math.sqrt(normA) * Math.sqrt(normB))
  return Math.max(0, Math.min(1, Number(score.toFixed(4))))
}

function calculateMatchScore({
  embeddingScore,
  studentSkills,
  jobSkills,
}: {
  embeddingScore: number
  studentSkills: string[]
  jobSkills: string[]
}) {
  const matchedSkills = jobSkills.filter((jobSkill) =>
    studentSkills.some((studentSkill) => skillsMatch(studentSkill, jobSkill)),
  )
  const skillCoverage = jobSkills.length ? matchedSkills.length / jobSkills.length : null
  const score = skillCoverage === null
    ? embeddingScore
    : (embeddingScore * 0.45) + (skillCoverage * 0.55)
  const roundedScore = Math.max(0, Math.min(1, Number(score.toFixed(4))))
  const percent = Math.round(roundedScore * 100)

  const rationale = skillCoverage === null
    ? `${percent}% match based on resume-to-job semantic similarity. Add required skills to the job for a stricter score.`
    : `${percent}% match from resume-to-job semantic similarity plus ${matchedSkills.length} of ${jobSkills.length} required skills found in the resume.`

  return { score: roundedScore, rationale }
}

function getJobSkills(job: any) {
  const requiredSkills = normalizeSkills(arrayValue(job?.required_skills))
  if (requiredSkills.length) return requiredSkills
  return extractKeywords(`${job?.title || ''} ${job?.description || ''}`)
}

function arrayValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string')
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean)
    }
  }
  return []
}

function normalizeSkills(skills: string[]) {
  return [...new Set(
    skills
      .map((skill) => skill.toLowerCase().trim())
      .filter(Boolean),
  )]
}

function skillsMatch(studentSkill: string, jobSkill: string) {
  if (studentSkill === jobSkill) return true
  if (studentSkill.includes(jobSkill) || jobSkill.includes(studentSkill)) return true
  return canonicalSkill(studentSkill) === canonicalSkill(jobSkill)
}

function canonicalSkill(skill: string) {
  return skill.replace(/[^a-z0-9+#]/g, '')
}

function extractKeywords(text: string) {
  const stopWords = new Set([
    'and', 'are', 'for', 'the', 'with', 'you', 'your', 'this', 'that', 'from',
    'will', 'job', 'role', 'work', 'team', 'our', 'have', 'has', 'can', 'must',
    'need', 'needs', 'title', 'description', 'responsibilities', 'required',
    'intern', 'internship', 'assistant',
  ])

  return [...new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s-]/g, ' ')
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 3 && !stopWords.has(word)),
  )].slice(0, 12)
}
