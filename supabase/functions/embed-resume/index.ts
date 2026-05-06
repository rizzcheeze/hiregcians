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
    const { text, type } = await req.json()
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No text provided')
    }

    const embedding = await getGeminiEmbedding(text, GEMINI_API_KEY)
    
    return new Response(
      JSON.stringify({ embedding }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('embed-resume error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getGeminiEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      model: 'models/text-embedding-004',
      content: { parts: [{ text: text.substring(0, 2000) }] }
    })
  })

  const data = await response.json()
  
  console.log('Gemini embedding status:', response.status)
  
  if (!response.ok) {
    console.error('Gemini embedding error:', JSON.stringify(data))
    throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`)
  }

  if (!data.embedding?.values) {
    console.error('Unexpected response shape:', JSON.stringify(data))
    throw new Error('No embedding values returned')
  }

  return data.embedding.values
}