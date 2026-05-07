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
    const body = await req.json()
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    const GEMINI_API_KEY =
      Deno.env.get('GEMINI_API_KEY') || Deno.env.get('VITE_GEMINI_API_KEY')

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured in Supabase Edge Function secrets')
    }
    if (!text || text.length < 50) {
      throw new Error('Insufficient text extracted')
    }

    const prompt = `You are a professional resume parser. Extract the following from the resume. Return ONLY valid JSON, no other text.

Resume:
${text.substring(0, 3000)}

Return this JSON shape:
{
  "skills": ["skill1", "skill2", "skill3"],
  "achievements": ["achievement1", "achievement2"],
  "summary": "2-3 sentence summary",
  "recruiterTip": "One actionable tip"
}`

    const geminiData = await generateWithGemini(prompt, GEMINI_API_KEY)

    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    if (!resultText) {
      console.error('Unexpected Gemini response:', JSON.stringify(geminiData))
      throw new Error('Gemini returned no parseable text')
    }

    const parsed = parseJsonObject(resultText)

    const skills = Array.isArray(parsed.skills) ? parsed.skills : []
    const achievements = Array.isArray(parsed.achievements) ? parsed.achievements : []
    const summary = parsed.summary || ''
    const recruiterTip = parsed.recruiterTip || ''

    return new Response(
      JSON.stringify({ skills, achievements, summary, recruiterTip }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateWithGemini(prompt: string, apiKey: string) {
  const models = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
  ]
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
            maxOutputTokens: 800,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    const data = await response.json()
    if (response.ok) return data

    const message = data.error?.message || 'Unknown error'
    errors.push(`${model}: ${message}`)
    console.error(`Gemini error from ${model}:`, JSON.stringify(data))
  }

  throw new Error(`Gemini API error: ${errors.join(' | ')}`)
}

function parseJsonObject(value: string) {
  const cleaned = value
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .replace(/```/g, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch (_) {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('Gemini did not return valid JSON')
    }
    return JSON.parse(cleaned.slice(start, end + 1))
  }
}
