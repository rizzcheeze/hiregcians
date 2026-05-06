import { supabase } from './supabase'

// Upload PDF to Supabase Storage and trigger extraction
export async function uploadResume(userId, file) {
  // 1. Deactivate any existing active resume
  await supabase
    .from('resumes')
    .update({ is_active: false })
    .eq('is_active', true)
    .in('student_id', [
      supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', userId)
    ])

  // 2. Upload PDF to storage
  const filePath = `${userId}/${Date.now()}_${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(filePath, file, { contentType: 'application/pdf', upsert: false })

  if (uploadError) throw uploadError

  // 3. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('resumes')
    .getPublicUrl(filePath)

  // 4. Get student_profile id
  const { data: sp } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!sp) throw new Error('Student profile not found. Please complete your profile first.')

  // 5. Insert resume row (raw_text will be filled by edge function)
  const { data: resume, error: insertError } = await supabase
    .from('resumes')
    .insert({
      student_id: sp.id,
      file_url: filePath,
      is_active: true,
    })
    .select()
    .single()

  if (insertError) throw insertError

  // 6. Trigger edge function to extract text
  const { data: fnData, error: fnError } = await supabase.functions.invoke(
    'extract-resume',
    { body: { resumeId: resume.id, filePath } }
  )

  if (fnError) throw fnError

  return { resume, extracted: fnData }
}

// Invoke Gemini parse-resume edge function
export async function parseResume(resumeId) {
  const { data, error } = await supabase.functions.invoke('parse-resume', {
    body: { resume_id: resumeId }
  })
  if (error) throw error
  return data // { success, skills, experience, education }
}

// Get the active resume for a student
export async function getActiveResume(userId) {
  const { data: sp } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!sp) return null

  const { data } = await supabase
    .from('resumes')
    .select(`
      *,
      skills ( id, name, source )
    `)
    .eq('student_id', sp.id)
    .eq('is_active', true)
    .maybeSingle()

  return data
}

// Get all resumes for a student (history)
export async function getResumeHistory(userId) {
  const { data: sp } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!sp) return []

  const { data } = await supabase
    .from('resumes')
    .select('id, file_url, parsed_at, is_active, created_at')
    .eq('student_id', sp.id)
    .order('created_at', { ascending: false })

  return data || []
}