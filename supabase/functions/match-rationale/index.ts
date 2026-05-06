import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
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
    if (!student_id || !job_id) throw new Error('student_id and job_id are required')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // 1. Fetch student skills
    const { data: sp, error: spErr } = await supabase
      .from('student_profiles')
      .select('skills, course, year_level')
      .eq('id', student_id)
      .single()
    if (spErr) throw spErr

    // 2. Fetch job details
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('title, description, requirements')
      .eq('id', job_id)
      .single()
    if (jobErr) throw jobErr

    // 3. Fetch match score
    const { data: match } = await supabase
      .from('match_scores')
      .select('score')
      .eq('student_id', student_id)
      .eq('job_id', job_id)
      .single()

    const scorePercent = match?.score ? Math.round(match.score * 100) : null

    // 4. Ask Gemini to generate rationale
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a career advisor for Gordon College students. Analyze how well this student matches the job.

Student:
- Course: ${sp.course ?? 'Not specified'}
- Year Level: ${sp.year_level ?? 'Not specified'}
- Skills: ${(sp.skills ?? []).join(', ') || 'None listed'}

Job:
- Title: ${job.title}
- Description: ${job.description ?? ''}
- Requirements: ${job.requirements ?? ''}
${scorePercent !== null ? `- AI Match Score: ${scorePercent}%` : ''}

Write a short 3-sentence match rationale:
1. What makes this student a good fit
2. Any skill gaps to be aware of
3. One actionable tip for the student

Be specific, encouraging, and concise. Do not use bullet points or headers — write in plain paragraph form.`
            }]
          }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 300 }
        })
      }
    )

    const geminiData = await geminiRes.json()
    const rationale = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!rationale) throw new Error('Gemini did not return a rationale')

    // 5. Save rationale to match_scores
    const { error: upsertErr } = await supabase
      .from('match_scores')
      .upsert({
        student_id,
        job_id,
        score: match?.score ?? null,
        rationale,
        computed_at: new Date().toISOString(),
      })
    if (upsertErr) throw upsertErr

    return new Response(
      JSON.stringify({ success: true, rationale }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('match-rationale error:', err)
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})