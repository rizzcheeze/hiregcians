import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { type, id } = await req.json()
    if (!['student', 'company'].includes(type)) throw new Error('Invalid profile type')
    if (!id) throw new Error('Profile id is required')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase service credentials not configured')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const profile = type === 'student'
      ? await getStudentProfile(supabase, id)
      : await getCompanyProfile(supabase, id)

    return new Response(
      JSON.stringify({ success: true, profile }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load public profile'
    const status = message.includes('not public') || message.includes('not found') ? 404 : 500
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

async function getStudentProfile(supabase: any, id: string) {
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, is_active')
    .eq('id', id)
    .maybeSingle()
  if (userError) throw userError
  if (!user || user.role !== 'student' || user.is_active === false) throw new Error('Student profile not found')

  const { data: student, error: studentError } = await supabase
    .from('student_profiles')
    .select('program, section, about, skills, experience, settings')
    .eq('user_id', id)
    .maybeSingle()
  if (studentError) throw studentError
  if (!student) throw new Error('Student profile not found')
  if (student.settings?.publicProfile === false) throw new Error('Student profile is not public')

  const { data: resume } = await supabase
    .from('resumes')
    .select('ai_summary, recruiter_tip, parsed_experience')
    .eq('student_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    type: 'student',
    id,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    program: student.program || '',
    section: student.section || '',
    about: student.about || '',
    skills: Array.isArray(student.skills) ? student.skills : [],
    experience: Array.isArray(student.experience) ? student.experience : [],
    ai_summary: resume?.ai_summary || '',
    recruiter_tip: resume?.recruiter_tip || '',
    achievements: Array.isArray(resume?.parsed_experience) ? resume.parsed_experience : [],
  }
}

async function getCompanyProfile(supabase: any, id: string) {
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', id)
    .maybeSingle()
  if (userError) throw userError
  if (!user || user.role !== 'employer' || user.is_active === false) throw new Error('Company profile not found')

  const { data: company, error: companyError } = await supabase
    .from('employer_profiles')
    .select('company_name, industry, website, company_size, location, description, logo_url, settings')
    .eq('user_id', id)
    .maybeSingle()
  if (companyError) throw companyError
  if (!company) throw new Error('Company profile not found')

  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, title, description, job_type, work_setup, required_skills, posted_at, slots, status')
    .eq('employer_id', id)
    .eq('status', 'active')
    .order('posted_at', { ascending: false })
    .limit(12)
  if (jobsError) throw jobsError

  return {
    type: 'company',
    id,
    company_name: company.company_name || '',
    industry: company.industry || '',
    website: company.website || '',
    company_size: company.company_size || '',
    location: company.location || '',
    description: company.description || '',
    logo_url: company.logo_url || '',
    jobs: jobs || [],
  }
}
