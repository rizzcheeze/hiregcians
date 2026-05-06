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
      throw new Error('studentSkills and jobSkills are required')
    }

    const result = await callGeminiForMatch(studentSkills, jobSkills, jobTitle, GEMINI_API_KEY)

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

Return ONLY valid JSON, no other text:
{
  "score": 75,
  "rationale": "2-3 sentence explanation of why this student is or is not a good fit"
}`

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 300 }
      })
    }
  )

  const data = await response.json()

  console.log('Gemini match status:', response.status)

  if (!response.ok) {
    console.error('Gemini error:', JSON.stringify(data))
    throw new Error(`Gemini API error: ${data.error?.message || 'Unknown'}`)
  }

  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    const parsed = JSON.parse(text)
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      rationale: parsed.rationale || 'No rationale provided'
    }
  } catch {
    console.error('Failed to parse Gemini response:', text)
    return {
      score: calculateSimpleMatch(studentSkills, jobSkills),
      rationale: 'Score based on skill overlap analysis.'
    }
  }
}

function calculateSimpleMatch(studentSkills: string[], jobSkills: string[]): number {
  if (!jobSkills.length) return 50
  const matched = studentSkills.filter(s =>
    jobSkills.some(js => js.toLowerCase() === s.toLowerCase())
  )
  return Math.round((matched.length / jobSkills.length) * 100)
}