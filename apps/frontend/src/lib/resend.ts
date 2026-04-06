const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendAccessCodeEmail(email: string, name: string, code: string) {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY || ''; // Assume VITE prefix for frontend

  if (!apiKey) {
    console.error('RESEND_API_KEY not found in environment');
    return { error: 'Missing API key' };
  }

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Times New Roman', serif; background-color: #000; color: #fff; margin: 0; padding: 40px; }
        .container { max-width: 600px; margin: auto; border: 1px solid #D4AF37; padding: 40px; }
        .logo { font-size: 24px; letter-spacing: 4px; color: #D4AF37; text-align: center; margin-bottom: 40px; text-transform: uppercase; }
        .content { text-align: center; line-height: 1.6; }
        .code { font-size: 32px; letter-spacing: 8px; color: #D4AF37; margin: 30px 0; font-weight: bold; }
        .footer { font-size: 12px; color: #666; margin-top: 40px; text-align: center; border-top: 1px solid #222; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">Carsena</div>
        <div class="content">
          <p>Olá, ${name.split(' ')[0]},</p>
          <p>Para acessar sua central de experiências exclusivas, utilize o código abaixo:</p>
          <div class="code">${code}</div>
          <p>Este código é de uso pessoal e garante que apenas você veja suas memórias.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CARSENA. Todos os direitos reservados.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'Carsena <onboarding@resend.dev>',
        to: email,
        subject: `Bem-vinda de volta ao Carsena: Seu código ${code}`,
        html: html
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
