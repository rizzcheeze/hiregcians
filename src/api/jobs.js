import { supabase } from './supabase'

// Get all active jobs (student view)
export async function getActiveJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      employer_profiles (
        company_name,
        industry,
        website
      )
    `)
    .eq('status', 'active')
    .order('posted_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getEmployerJobs(employerId) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('employer_id', employerId)
    .order('posted_at', { ascending: false })
  if (error) throw error
  return data
}

// Get single job by id
export async function getJob(jobId) {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      employer_profiles (
        company_name,
        industry,
        website
      )
    `)
    .eq('id', jobId)
    .single()
  if (error) throw error
  return data
}

// Create a new job
export async function createJob(employerId, jobData) {
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      employer_id: employerId,
      title: jobData.title,
      description: jobData.description,
      job_type: jobData.jobType,
      work_setup: jobData.workSetup,
      schedule: jobData.schedule,
      required_skills: jobData.requiredSkills || [],
      slots: jobData.slots || 1,
      status: 'active',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Update a job
export async function updateJob(jobId, updates) {
  const { data, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', jobId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Close / delete a job
export async function closeJob(jobId) {
  const { error } = await supabase
    .from('jobs')
    .update({ status: 'closed' })
    .eq('id', jobId)
  if (error) throw error
}

export async function deleteJob(jobId) {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId)
  if (error) throw error
}
