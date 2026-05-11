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
    const { resumeId, text } = await req.json()  // Removed studentId - not needed
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('EMBEDDING_SERVICE_KEY')
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No text provided')
    }

    // Generate embedding using Gemini
    const embedding = await getGeminiEmbedding(text, GEMINI_API_KEY)
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Missing Supabase credentials - embedding not saved')
      return new Response(
        JSON.stringify({ embedding, warning: 'Embedding generated but not saved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Check if embedding already exists
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/resume_embeddings?resume_id=eq.${resumeId}&select=id`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      }
    })
    
    const existing = await checkResponse.json()
    
    if (existing && existing.length > 0) {
      // Update existing embedding
      await fetch(`${supabaseUrl}/rest/v1/resume_embeddings?resume_id=eq.${resumeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          embedding: embedding,
          updated_at: new Date().toISOString()
        })
      })
      console.log('Updated embedding for resume:', resumeId)
    } else {
      // Insert new embedding (no student_id column)
      await fetch(`${supabaseUrl}/rest/v1/resume_embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          resume_id: resumeId,
          embedding: embedding,
          created_at: new Date().toISOString()
        })
      })
      console.log('Inserted embedding for resume:', resumeId)
    }
    
    return new Response(
      JSON.stringify({ success: true, embeddingLength: embedding.length }),
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