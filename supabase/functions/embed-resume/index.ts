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
    const { resumeId, resume_id, text } = await req.json()
    const targetResumeId = resumeId || resume_id

    if (!targetResumeId) throw new Error('resumeId is required')
    if (!text || text.trim().length === 0) throw new Error('No text provided')

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
        content: { parts: [{ text: text.substring(0, 8000) }] },
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
    const { error: rpcError } = await supabase.rpc('upsert_resume_embedding', {
      resume_id_param: targetResumeId,
      embedding_param: embeddingText,
    })

    if (rpcError) {
      console.warn('upsert_resume_embedding RPC failed, falling back to table write:', rpcError.message)
      await saveResumeEmbedding(supabase, targetResumeId, embeddingText)
    }

    return new Response(
      JSON.stringify({ success: true, resumeId: targetResumeId, embeddingLength: embedding.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('embed-resume error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

async function saveResumeEmbedding(supabase: any, resumeId: string, embeddingText: string) {
  const payload = {
    resume_id: resumeId,
    embedding: embeddingText,
    created_at: new Date().toISOString(),
  }

  const { data: existing, error: selectError } = await supabase
    .from('resume_embeddings')
    .select('id')
    .eq('resume_id', resumeId)
    .maybeSingle()

  if (selectError) throw new Error(`Failed to check resume embedding: ${selectError.message}`)

  if (existing?.id) {
    const { error } = await supabase
      .from('resume_embeddings')
      .update(payload)
      .eq('id', existing.id)
    if (error) throw new Error(`Failed to update resume embedding: ${error.message}`)
    return
  }

  const { error } = await supabase
    .from('resume_embeddings')
    .insert(payload)
  if (error) throw new Error(`Failed to insert resume embedding: ${error.message}`)
}
