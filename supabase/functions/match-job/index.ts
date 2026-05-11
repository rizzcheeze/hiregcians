import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { studentId, jobId, studentSkills, jobSkills, jobTitle } = await req.json()
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    if (!studentSkills?.length || !jobSkills?.length) {
      // Fallback to simple matching
      return new Response(
        JSON.stringify({
          score: calculateSimpleMatch(studentSkills || [], jobSkills || []),
          rationale: 'Score based on skill overlap analysis.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await callGeminiForMatch(studentSkills, jobSkills, jobTitle || 'Job opening', GEMINI_API_KEY)
    
    // Save match score to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('EMBEDDING_SERVICE_KEY')
    
    if (supabaseUrl && supabaseServiceKey && studentId && jobId) {
      // Check if match already exists
      const checkResponse = await fetch(`${supabaseUrl}/rest/v1/match_scores?student_id=eq.${studentId}&job_id=eq.${jobId}&select=id`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        }
      })
      
      const existing = await checkResponse.json()
      
      const matchData = {
        student_id: studentId,
        job_id: jobId,
        score: result.score / 100,
        rationale: result.rationale,
        computed_at: new Date().toISOString()
      }
      
      if (existing && existing.length > 0) {
        await fetch(`${supabaseUrl}/rest/v1/match_scores?student_id=eq.${studentId}&job_id=eq.${jobId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify(matchData)
        })
      } else {
        await fetch(`${supabaseUrl}/rest/v1/match_scores`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify(matchData)
        })
      }
    }
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('match-job error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function calculateSimpleMatch(studentSkills: string[], jobSkills: string[]): number {
  if (!jobSkills.length) return 50
  const matched = studentSkills.filter(s =>
    jobSkills.some(js => js.toLowerCase() === s.toLowerCase())
  )
  return Math.round((matched.length / jobSkills.length) * 100)
}

async function callGeminiForMatch(
  studentSkills: string[],
  jobSkills: string[],
  jobTitle: string,
  apiKey: string
) {
  const prompt = `You are a recruitment AI. Calculate a match score for this student and job.

Student Skills: ${studentSkills.join(', ')}
Job Title: ${jobTitle}
Job Required Skills: ${jobSkills.join(', ')}

Return ONLY valid JSON:
{
  "score": <number between 0 and 100>,
  "rationale": "<2-3 sentence explanation>"
}`

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash']
  const errors: string[] = []

  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 300,
          }
        })
      }
    )

    const data = await response.json()
    if (response.ok) {
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      
      try {
        const parsed = JSON.parse(text)
        return {
          score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
          rationale: parsed.rationale || 'Score based on skill analysis.'
        }
      } catch {
        // Fall through to next model
      }
    }
    errors.push(`${model}: ${data.error?.message || 'Unknown'}`)
  }

  // Fallback to simple calculation
  return {
    score: calculateSimpleMatch(studentSkills, jobSkills),
    rationale: 'Score based on skill overlap analysis.'
  }
}