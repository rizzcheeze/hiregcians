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
    const { jobId, title, description, skills } = await req.json()
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('EMBEDDING_SERVICE_KEY')
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const jobText = `${title || ''} ${description || ''} ${skills?.join(' ') || ''}`
    
    if (!jobText.trim()) {
      throw new Error('No job text provided')
    }

    // Fixed: Correct model name for embeddings
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        model: 'text-embedding-004',  // Fixed: removed 'models/' prefix
        content: { parts: [{ text: jobText.substring(0, 2000) }] }
      })
    })

    const data = await response.json()
    
    console.log('Gemini embedding status:', response.status)
    
    if (!response.ok) {
      console.error('Gemini embedding error:', JSON.stringify(data))
      throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`)
    }

    if (!data.embedding?.values) {
      throw new Error('No embedding values returned')
    }

    const embedding = data.embedding.values
    
    if (supabaseUrl && supabaseServiceKey) {
      const checkResponse = await fetch(`${supabaseUrl}/rest/v1/job_embeddings?job_id=eq.${jobId}&select=id`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        }
      })
      
      const existing = await checkResponse.json()
      
      if (existing && existing.length > 0) {
        await fetch(`${supabaseUrl}/rest/v1/job_embeddings?job_id=eq.${jobId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ embedding: embedding })
        })
        console.log('Updated embedding for job:', jobId)
      } else {
        await fetch(`${supabaseUrl}/rest/v1/job_embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            job_id: jobId,
            embedding: embedding
          })
        })
        console.log('Inserted embedding for job:', jobId)
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, embeddingLength: embedding.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('embed-job error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})