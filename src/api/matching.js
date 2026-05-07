import { supabase } from './supabase'

// Embed a resume after upload+parse — call this after parseResume()
export async function embedResume(resumeId) {
  const { data, error } = await supabase.functions.invoke('embed-resume', {
    body: { resume_id: resumeId }
  })
  if (error) throw error
  return data
}

// Embed a job after it's created/updated — call this after job upsert
export async function embedJob(jobId) {
  const { data, error } = await supabase.functions.invoke('embed-job', {
    body: { job_id: jobId }
  })
  if (error) throw error
  return data
}

// Get top matched jobs for the current student using pgvector cosine similarity
export async function getMatchedJobs(userId, limit = 10) {
  // 1. Get student_id from student_profiles
  const { data: sp } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()
  if (!sp) throw new Error('Student profile not found')

  // 2. Get student's embedding
  const { data: embRow } = await supabase
    .from('resume_embeddings')
    .select('embedding')
    .eq('student_id', sp.id)
    .single()
  if (!embRow) throw new Error('No resume embedding found. Please upload your resume first.')

  // 3. Call pgvector cosine similarity function
  const { data: matches, error } = await supabase.rpc('match_jobs_for_student', {
    student_embedding: embRow.embedding,
    match_count: limit,
  })
  if (error) throw error

  if (!matches?.length) return []

  // 4. Fetch full job details for matched job IDs
  const jobIds = matches.map(m => m.job_id)
  const { data: jobs, error: jobsErr } = await supabase
    .from('jobs')
    .select(`
      id, title, description, location, job_type,
      employer_profiles ( company_name, industry )
    `)
    .in('id', jobIds)
    .eq('is_active', true)
  if (jobsErr) throw jobsErr

  // 5. Merge score into each job
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
export async function computeMatchesForStudent(studentId) {
  const { data, error } = await supabase.functions.invoke('compute-matches', {
    body: { student_id: studentId }
  })
  if (error || data?.success === false) {
    throw new Error(data?.error || error?.message || 'Failed to compute match scores')
  }
  return data
}

// Compute and store percentage match scores for one job across all students with skills.
export async function computeMatchesForJob(jobId) {
  const { data, error } = await supabase.functions.invoke('compute-matches', {
    body: { job_id: jobId }
  })
  if (error || data?.success === false) {
    throw new Error(data?.error || error?.message || 'Failed to compute match scores')
  }
  return data
}
