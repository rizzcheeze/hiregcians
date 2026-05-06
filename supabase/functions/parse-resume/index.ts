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
    const { text } = await req.json()
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured')
    }
    if (!text || text.length < 50) {
      throw new Error('Insufficient text extracted')
    }

    const prompt = `You are a professional resume parser. Extract the following from the resume. Return ONLY valid JSON, no other text.

Resume:
${text.substring(0, 3000)}

Required JSON format:
{
  "skills": ["skill1", "skill2", "skill3"],
  "achievements": ["achievement1", "achievement2"],
  "summary": "2-3 sentence summary",
  "recruiterTip": "One actionable tip"
}`

    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
      })
    })

    const geminiData = await geminiResponse.json()
    
    if (!geminiResponse.ok) {
      console.error('Gemini error:', JSON.stringify(geminiData))
      throw new Error(`Gemini API error: ${geminiData.error?.message || 'Unknown error'}`)
    }

    let resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').replace(/```/g, '').trim()
    
    const parsed = JSON.parse(resultText)
    
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