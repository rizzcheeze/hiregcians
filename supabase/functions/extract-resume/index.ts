
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { resumeId, filePath } = await req.json()

    if (!resumeId || !filePath) {
      return new Response(
        JSON.stringify({ error: 'resumeId and filePath are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Init Supabase client with service role key (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('https://svxxoiwiymxdfhazwkri.supabase.co')!,
      Deno.env.get('sb_publishable_eGbF8qfhFBU1wAVJCcaJPQ_5fWWIaF4')!
    )

    // 1. Download the PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(filePath)

    if (downloadError) throw new Error(`Storage download failed: ${downloadError.message}`)

    const arrayBuffer = await fileData.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // 2. Extract text from PDF
    // Deno doesn't have PyMuPDF, so we use a pure-JS PDF text extractor
    let rawText = ''
    try {
      rawText = await extractTextFromPdf(uint8Array)
    } catch (e) {
      console.error('PDF extraction failed, using fallback:', e)
      rawText = fallbackExtract(uint8Array)
    }

    // 3. Validate we got something meaningful
    if (rawText.trim().length < 50) {
      throw new Error(
        'Could not extract readable text from this PDF. ' +
        'Please ensure your resume is a text-based PDF, not a scanned image.'
      )
    }

    // 4. Save raw_text to resumes table
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        raw_text: rawText.trim(),
        parsed_at: new Date().toISOString(),
      })
      .eq('id', resumeId)

    if (updateError) throw new Error(`DB update failed: ${updateError.message}`)

    // 5. Return result
    return new Response(
      JSON.stringify({
        resumeId,
        charCount: rawText.length,
        preview: rawText.slice(0, 200) + '…',
        success: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('extract-resume error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


// ── PDF text extraction (pure JS/Deno) ───────────────────────
// Parses PDF content streams to extract text operators
async function extractTextFromPdf(uint8Array: Uint8Array): Promise<string> {
  const decoder = new TextDecoder('latin1')
  const content = decoder.decode(uint8Array)

  let text = ''

  // Extract text from content streams between BT/ET markers
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g
  let streamMatch

  while ((streamMatch = streamRegex.exec(content)) !== null) {
    const stream = streamMatch[1]

    // Extract text from Tj, TJ, and ' operators
    const tjRegex = /\(((?:[^\\)]|\\[\s\S])*)\)\s*(?:Tj|')/g
    const tjArrayRegex = /\[((?:[^\]])*)\]\s*TJ/g

    let match
    while ((match = tjRegex.exec(stream)) !== null) {
      text += decodePdfString(match[1]) + ' '
    }

    while ((match = tjArrayRegex.exec(stream)) !== null) {
      const parts = match[1].match(/\(([^)]*)\)/g) || []
      for (const part of parts) {
        text += decodePdfString(part.slice(1, -1)) + ' '
      }
    }
  }

  // Clean up: remove excessive whitespace, non-printable chars
  text = text
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text
}

function decodePdfString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
}

// Fallback: scan raw bytes for printable ASCII sequences
function fallbackExtract(uint8Array: Uint8Array): string {
  const decoder = new TextDecoder('ascii', { fatal: false })
  const raw = decoder.decode(uint8Array)
  const sequences = raw.match(/[ -~]{4,}/g) || []
  return sequences
    .filter(s => /[a-zA-Z]{2,}/.test(s)) // keep only sequences with actual words
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}
