import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, text, html }: EmailRequest = await req.json();

    // Validar datos requeridos
    if (!to || !subject || !text) {
      return new Response(
        JSON.stringify({
          error: 'Faltan campos requeridos: to, subject, text',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Obtener configuración del servicio de email
    const emailProvider = Deno.env.get('EMAIL_PROVIDER') || 'ses';
    
    let result;
    
    if (emailProvider === 'ses' || emailProvider === 'amazon-ses') {
      // Usar Amazon SES con SMTP
      const smtpUser = Deno.env.get('SMTP_USER');
      const smtpPass = Deno.env.get('SMTP_PASS');
      const smtpEndpoint = Deno.env.get('SMTP_ENDPOINT') || 'email-smtp.us-east-1.amazonaws.com';
      const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
      
      if (!smtpUser || !smtpPass) {
        console.warn('SMTP_USER o SMTP_PASS no configurados, email no enviado');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Email simulado (configura SMTP_USER y SMTP_PASS para enviar emails reales)',
            provider: 'none',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const fromEmail = Deno.env.get('EMAIL_FROM') || 'noreply@veltlix.com';
      
      // Usar SMTP para enviar email vía Amazon SES con nodemailer
      try {
        console.log(`📧 Conectando a Amazon SES (${smtpEndpoint}:${smtpPort})`);
        console.log(`   De: ${fromEmail}`);
        console.log(`   Para: ${to}`);
        console.log(`   Asunto: ${subject}`);
        
        // Crear transporter de nodemailer
        const transporter = nodemailer.createTransport({
          host: smtpEndpoint,
          port: smtpPort,
          secure: false, // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        // Enviar email
        const info = await transporter.sendMail({
          from: fromEmail,
          to: to,
          subject: subject,
          text: text,
          html: html || text.replace(/\n/g, '<br>'),
        });

        result = {
          messageId: info.messageId || `ses-${Date.now()}`,
          success: true,
          timestamp: new Date().toISOString(),
          response: info.response,
        };
        
        console.log('✅ Email enviado exitosamente vía Amazon SES');
        console.log(`   Message ID: ${info.messageId}`);
      } catch (sesError) {
        console.error('❌ Error enviando email via SES:', sesError);
        throw new Error(`Amazon SES error: ${sesError instanceof Error ? sesError.message : 'Unknown error'}`);
      }
      
    } else if (emailProvider === 'resend') {
      // Usar Resend (https://resend.com)
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      
      if (!resendApiKey) {
        console.warn('RESEND_API_KEY no configurada, email no enviado');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Email simulado (configura RESEND_API_KEY para enviar emails reales)',
            provider: 'none',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const fromEmail = Deno.env.get('EMAIL_FROM') || 'noreply@tiquetera.com';
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject: subject,
          text: text,
          html: html || text.replace(/\n/g, '<br>'),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
      }

      result = await response.json();
      
    } else if (emailProvider === 'sendgrid') {
      // Usar SendGrid (https://sendgrid.com)
      const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
      
      if (!sendgridApiKey) {
        console.warn('SENDGRID_API_KEY no configurada, email no enviado');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Email simulado (configura SENDGRID_API_KEY para enviar emails reales)',
            provider: 'none',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const fromEmail = Deno.env.get('EMAIL_FROM') || 'noreply@tiquetera.com';
      
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sendgridApiKey}`,
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }],
              subject: subject,
            },
          ],
          from: { email: fromEmail },
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html || text.replace(/\n/g, '<br>') },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SendGrid API error: ${error}`);
      }

      result = { success: true };
      
    } else {
      // Modo desarrollo/test - solo registrar
      console.log('📧 Email a enviar (modo desarrollo):');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Text:', text);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email simulado (configura EMAIL_PROVIDER y las claves API para enviar emails reales)',
          provider: 'none',
          preview: { to, subject, text },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email enviado exitosamente',
        provider: emailProvider,
        result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error enviando email:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error desconocido',
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});


