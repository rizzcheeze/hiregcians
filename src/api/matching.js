import { supabase } from './supabase'

// Embed a resume after upload+parse — call this after parseResume()
export async function embedResume(resumeId) {
  const { data, error } = await supabase.functions.invoke('embed-resume', {
    body: { resumeId }
  })
  if (error) throw error
  return data
}

// Embed a job after it's created/updated — call this after job upsert
export async function embedJob(jobId) {
  const { data, error } = await supabase.functions.invoke('embed-job', {
    body: { jobId }
  })
  if (error) throw error
  return data
}

// Get top matched jobs for the current student using pgvector cosine similarity
export async function getMatchedJobs(userId, limit = 10) {
  const { data: matches, error } = await supabase.rpc('match_jobs_for_student', {
    student_id_param: userId,
    match_count: limit,
  })
  if (error) throw error

  if (!matches?.length) return []

  const jobIds = matches.map(m => m.job_id)
  const { data: jobs, error: jobsErr } = await supabase
    .from('jobs')
    .select(`
      id, title, description, location, job_type,
      employer_profiles ( company_name, industry )
    `)
    .in('id', jobIds)
    .eq('status', 'active')
  if (jobsErr) throw jobsErr

  return jobs.map(job => ({
    ...job,
    score: matches.find(m => m.job_id === job.id)?.score ?? 0,
  })).sort((a, b) => b.score - a.score)
}

// Generate and save Gemini rationale for a student-job match
export async function generateRationale(studentId, jobId) {
  const { data, error } = await supabase.functions.invoke('match-rationale', {
    body: { student_id: studentId, job_id: jobId }
  })
  if (error) throw error
  return data // { success, rationale }
}

// Get saved rationale for a student-job pair (avoids re-generating)
export async function getRationale(studentId, jobId) {
  const { data, error } = await supabase
    .from('match_scores')
    .select('score, rationale, computed_at')
    .eq('student_id', studentId)
    .eq('job_id', jobId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

// Compute and store percentage match scores for one student across all active jobs.
// Embeds the resume first to ensure the embedding exists before computing.
export async function computeMatchesForStudent(studentId) {
  // Step 1: get the student's active resume and embed it
  const { data: resume, error: resumeErr } = await supabase
    .from('resumes')
    .select('id')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .maybeSingle()

  if (resumeErr) throw resumeErr

  if (resume?.id) {
    const { error: embedError } = await supabase.functions.invoke('embed-resume', {
      body: { resumeId: resume.id }
    })
    if (embedError) throw embedError
  }

  // Step 2: compute matches
  const { data, error } = await supabase.functions.invoke('compute-matches', {
    body: { student_id: studentId }
  })
  if (error || data?.success === false) {
    throw new Error(data?.error || error?.message || 'Failed to compute match scores')
  }
  return data
}

// Compute and store percentage match scores for one job across all students with skills.
// Embeds the job first to ensure the embedding exists before computing.
export async function computeMatchesForJob(jobId) {
  // Step 1: embed the job
  const { error: embedError } = await supabase.functions.invoke('embed-job', {
    body: { jobId }
  })
  if (embedError) throw embedError

  // Step 2: compute matches
  const { data, error } = await supabase.functions.invoke('compute-matches', {
    body: { job_id: jobId }
  })
  if (error || data?.success === false) {
    throw new Error(data?.error || error?.message || 'Failed to compute match scores')
  }
  return data
}