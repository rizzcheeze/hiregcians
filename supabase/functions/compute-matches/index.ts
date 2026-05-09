import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { student_id, job_id } = await req.json()
    if (!student_id && !job_id) throw new Error('student_id or job_id is required')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const results = []

    if (student_id) {
      const { data: profile, error: profileErr } = await supabase
        .from('student_profiles')
        .select('user_id, skills')
        .eq('user_id', student_id)
        .maybeSingle()
      if (profileErr) throw profileErr
      if (!profile?.skills?.length) throw new Error('No extracted skills found for this student')

      const { data: jobs, error: jobsErr } = await supabase
        .from('jobs')
        .select('id, title, description, required_skills')
        .eq('status', 'active')
      if (jobsErr) throw jobsErr

      for (const job of jobs || []) {
        const jobSkills = getJobComparisonSkills(job)
        const match = calculateMatch(profile.skills, jobSkills)
        await saveMatch(supabase, profile.user_id, job.id, match)
        results.push({ job_id: job.id, score: match.score, rationale: match.rationale })
      }
    }

    if (job_id) {
      const { data: job, error: jobErr } = await supabase
        .from('jobs')
        .select('id, title, description, required_skills')
        .eq('id', job_id)
        .single()
      if (jobErr) throw jobErr

      const { data: profiles, error: profilesErr } = await supabase
        .from('student_profiles')
        .select('user_id, skills')
        .not('skills', 'is', null)
      if (profilesErr) throw profilesErr

      for (const profile of profiles || []) {
        if (!profile.skills?.length) continue
        const jobSkills = getJobComparisonSkills(job)
        const match = calculateMatch(profile.skills, jobSkills)
        await saveMatch(supabase, profile.user_id, job.id, match)
        results.push({ student_id: profile.user_id, job_id: job.id, score: match.score, rationale: match.rationale })
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: results.length, matches: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('compute-matches error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

uploadStep.value = 5
console.log('authStore.user.id:', authStore.user.id)
console.log('authStore.user:', JSON.stringify(authStore.user))
await computeMatchesForStudent(authStore.user.id:'5843f4ca-e017-462a-9a2e-f2ceb2a98d00')

function calculateMatch(studentSkills: string[], jobSkills: string[]) {
  const normalizedStudent = normalizeSkills(studentSkills)
  const normalizedJob = normalizeSkills(jobSkills)

  if (!normalizedStudent.length || !normalizedJob.length) {
    return {
      score: 0,
      rationale: 'No required skills were available to compare against the student resume.',
    }
  }

  const matched = normalizedJob.filter(jobSkill =>
    normalizedStudent.some(studentSkill =>
      studentSkill === jobSkill ||
      studentSkill.includes(jobSkill) ||
      jobSkill.includes(studentSkill)
    )
  )

  const coverage = matched.length / normalizedJob.length
  const breadthBonus = Math.min(0.15, normalizedStudent.length / 100)
  const score = Math.min(1, Math.max(0, coverage * 0.85 + breadthBonus))
  const percentage = Math.round(score * 100)

  return {
    score: Number(score.toFixed(4)),
    rationale: `${percentage}% match based on ${matched.length} of ${normalizedJob.length} required skills found in the student's AI-extracted resume skills.`,
  }
}

function getJobComparisonSkills(job: { title?: string; description?: string; required_skills?: string[] }) {
  if (job.required_skills?.length) return job.required_skills
  return extractKeywords(`${job.title || ''} ${job.description || ''}`)
}

function extractKeywords(text: string) {
  const stopWords = new Set([
    'and', 'are', 'for', 'the', 'with', 'you', 'your', 'this', 'that', 'from',
    'will', 'job', 'role', 'work', 'team', 'our', 'have', 'has', 'can', 'must',
    'need', 'needs', 'title', 'description', 'responsibilities', 'required',
  ])

  return [...new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s-]/g, ' ')
      .split(/\s+/)
      .map(word => word.trim())
      .filter(word => word.length >= 3 && !stopWords.has(word))
  )].slice(0, 12)
}

function normalizeSkills(skills: string[]) {
  return [...new Set(
    skills
      .filter(skill => typeof skill === 'string')
      .map(skill => skill.toLowerCase().trim())
      .filter(Boolean)
  )]
}

async function saveMatch(supabase: any, studentId: string, jobId: string, match: { score: number; rationale: string }) {
  const payload = {
    student_id: studentId,
    job_id: jobId,
    score: match.score,
    rationale: match.rationale,
    computed_at: new Date().toISOString(),
  }

  const { data: existing, error: selectErr } = await supabase
    .from('match_scores')
    .select('id')
    .eq('student_id', studentId)
    .eq('job_id', jobId)
    .maybeSingle()
  if (selectErr) throw selectErr

  if (existing?.id) {
    const { error } = await supabase
      .from('match_scores')
      .update(payload)
      .eq('id', existing.id)
    if (error) throw error
    return
  }

  const { error } = await supabase
    .from('match_scores')
    .insert(payload)
  if (error) throw error
}
