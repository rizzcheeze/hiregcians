import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001'
const GEMINI_EMBEDDING_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { jobId, job_id, title, description, skills } = await req.json()
    const targetJobId = jobId || job_id

    if (!targetJobId) throw new Error('jobId is required')

    const jobText = `${title || ''} ${description || ''} ${(skills || []).join(' ')}`.trim()
    if (!jobText) throw new Error('No job text provided')

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('EMBEDDING_SERVICE_KEY')

    if (!geminiApiKey) throw new Error('GEMINI_API_KEY not configured')
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase service credentials not configured')

    const response = await fetch(GEMINI_EMBEDDING_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        model: GEMINI_EMBEDDING_MODEL,
        content: { parts: [{ text: jobText.substring(0, 8000) }] },
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('Gemini embedding error:', JSON.stringify(data))
      throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`)
    }

    const embedding = data.embedding?.values
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('No embedding values returned')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const embeddingText = `[${embedding.join(',')}]`
    const { error: rpcError } = await supabase.rpc('upsert_job_embedding', {
      job_id_param: targetJobId,
      embedding_param: embeddingText,
    })

    if (rpcError) {
      console.warn('upsert_job_embedding RPC failed, falling back to table write:', rpcError.message)
      await saveJobEmbedding(supabase, targetJobId, embeddingText)
    }

    return new Response(
      JSON.stringify({ success: true, jobId: targetJobId, embeddingLength: embedding.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('embed-job error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

async function saveJobEmbedding(supabase: any, jobId: string, embeddingText: string) {
  const payload = {
    job_id: jobId,
    embedding: embeddingText,
    created_at: new Date().toISOString(),
  }

  const { data: existing, error: selectError } = await supabase
    .from('job_embeddings')
    .select('id')
    .eq('job_id', jobId)
    .maybeSingle()

  if (selectError) throw new Error(`Failed to check job embedding: ${selectError.message}`)

  if (existing?.id) {
    const { error } = await supabase
      .from('job_embeddings')
      .update(payload)
      .eq('id', existing.id)
    if (error) throw new Error(`Failed to update job embedding: ${error.message}`)
    return
  }

  const { error } = await supabase
    .from('job_embeddings')
    .insert(payload)
  if (error) throw new Error(`Failed to insert job embedding: ${error.message}`)
}
