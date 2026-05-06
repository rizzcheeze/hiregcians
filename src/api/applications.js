import { supabase } from './supabase'

// Apply for a job
export async function applyForJob(studentId, jobId) {
  // Check if already applied
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('student_id', studentId)
    .eq('job_id', jobId)
    .maybeSingle()

  if (existing) throw new Error('You have already applied for this job.')

  const { data, error } = await supabase
    .from('applications')
    .insert({
      student_id: studentId,
      job_id: jobId,
      status: 'pending',
      events: [{ label: 'Application submitted', at: new Date().toISOString() }],
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Get all applications for the current student
export async function getStudentApplications(studentId) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      jobs (
        id, title, job_type, work_setup, schedule,
        employer_profiles ( company_name )
      )
    `)
    .eq('student_id', studentId)
    .order('applied_at', { ascending: false })
  if (error) throw error
  return data
}

// Get all applications for a specific job (employer view)
export async function getJobApplications(jobId) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      profiles (
        id, first_name, last_name,
        student_profiles ( program, section, about )
      ),
      match_scores ( score, rationale )
    `)
    .eq('job_id', jobId)
    .order('applied_at', { ascending: false })
  if (error) throw error
  return data
}

// Get all applications across all employer's jobs
export async function getEmployerApplications(employerId) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      jobs!inner ( id, title, employer_id ),
      profiles (
        id, first_name, last_name,
        student_profiles ( program, section )
      ),
      match_scores ( score, rationale )
    `)
    .eq('jobs.employer_id', employerId)
    .order('applied_at', { ascending: false })
  if (error) throw error
  return data
}

// Update application status (employer only)
export async function updateApplicationStatus(appId, status, eventLabel) {
  // First get current events
  const { data: current } = await supabase
    .from('applications')
    .select('events')
    .eq('id', appId)
    .single()

  const events = [
    ...(current?.events || []),
    { label: eventLabel, at: new Date().toISOString() }
  ]

  const { data, error } = await supabase
    .from('applications')
    .update({ status, events })
    .eq('id', appId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Save / unsave a job
export async function saveJob(studentId, jobId) {
  const { error } = await supabase
    .from('saved_jobs')
    .insert({ student_id: studentId, job_id: jobId })
  if (error && error.code !== '23505') throw error // ignore duplicate
}

export async function unsaveJob(studentId, jobId) {
  const { error } = await supabase
    .from('saved_jobs')
    .delete()
    .eq('student_id', studentId)
    .eq('job_id', jobId)
  if (error) throw error
}

export async function getSavedJobs(studentId) {
  const { data, error } = await supabase
    .from('saved_jobs')
    .select(`
      job_id,
      jobs (
        id, title, job_type, work_setup, required_skills, posted_at,
        employer_profiles ( company_name )
      )
    `)
    .eq('student_id', studentId)
  if (error) throw error
  return data.map(row => row.jobs)
}