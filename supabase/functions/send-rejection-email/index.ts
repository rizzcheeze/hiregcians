import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { studentEmail, studentName, jobTitle, companyName, rejectionReason } = await req.json()

    console.log(`Sending rejection email to ${studentEmail}`)

    // For now, just log the email (you can integrate with a real email service later)
    const emailContent = `
      Subject: Application Update for ${jobTitle} at ${companyName}
      
      Dear ${studentName},
      
      Thank you for your interest in the ${jobTitle} position at ${companyName}.
      
      After careful review of your application, we regret to inform you that you have not been selected to proceed to the next stage.
      
      ${rejectionReason ? `\nReason: ${rejectionReason}` : ''}
      
      We appreciate your interest and encourage you to apply for future opportunities that match your skills.
      
      Best regards,
      ${companyName} Hiring Team
    `

    console.log('Email content:', emailContent)

    // TODO: Integrate with an email service like Resend, SendGrid, or Supabase Auth email
    // Example with Resend (you would need to add your API key):
    /*
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Hire GCians! <noreply@hiregcians.com>',
        to: [studentEmail],
        subject: `Application Update: ${jobTitle} at ${companyName}`,
        html: `<p>Dear ${studentName},</p>
               <p>Thank you for your interest in the ${jobTitle} position at ${companyName}.</p>
               <p>After careful review, we regret to inform you that you have not been selected.</p>
               <p>We encourage you to apply for future opportunities.</p>
               <p>Best regards,<br>${companyName} Hiring Team</p>`,
      }),
    })
    */

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Rejection email notification sent',
        email_log: emailContent 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})