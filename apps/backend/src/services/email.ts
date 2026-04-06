import { Resend } from 'resend';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM || 'Carsena <onboarding@resend.dev>';
const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO || 'carsena2007@gmail.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://carsena.com.br';

console.log('📧 Email Service Initialized:');
console.log(' - API Key:', process.env.RESEND_API_KEY ? 'Present (***' + process.env.RESEND_API_KEY.slice(-4) + ')' : 'Missing');
console.log(' - From:', FROM_EMAIL);
console.log(' - Reply-To:', REPLY_TO_EMAIL);

// --- Premium UI Helpers ---
const emailStyle = `
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
  padding: 40px;
  color: #1a1a1a;
  line-height: 1.6;
`;

const headerStyle = `
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 30px;
  margin-bottom: 30px;
`;

const titleStyle = `
  color: #1a1a1a;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
`;

const buttonStyle = `
  display: inline-block;
  background-color: #1a1a1a;
  color: #D4AF37;
  padding: 16px 32px;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 14px;
  letter-spacing: 1px;
  margin: 30px 0;
`;

const footerStyle = `
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
  font-size: 12px;
  color: #999;
`;

export const emailService = {
  /**
   * Envia e-mail de confirmação de pedido (com instruções de Pix se for o caso)
   */
  async sendOrderConfirmation(to: string, orderData: { 
    id: string, 
    total: number, 
    customerName: string,
    pixPayload?: string,
    pixImage?: string
  }) {
    const orderRef = orderData.id.slice(-6).toUpperCase();
    
    try {
      console.log(`📤 Sending Confirmation Email to ${to}...`);
      const response = await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        replyTo: REPLY_TO_EMAIL,
        subject: `Resumo do Pedido #${orderRef} | Carsena`,
        html: `
          <div style="${emailStyle}">
            <div style="${headerStyle}">
              <img src="https://carsena.com.br/logo-premium.png" alt="Carsena" style="height: 40px; margin-bottom: 15px;" />
              <h1 style="${titleStyle}">Pedido Recebido</h1>
            </div>
            
            <p>Olá, <strong>${orderData.customerName}</strong>.</p>
            <p>Seu pedido <strong>#${orderRef}</strong> foi processado e estamos aguardando a confirmação do pagamento.</p>
            
            <div style="background-color: #f8f8f8; padding: 25px; border-radius: 12px; margin: 30px 0;">
              <p style="margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Total do Pedido</p>
              <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">R$ ${orderData.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>

            ${orderData.pixPayload ? `
              <div style="text-align: center; padding: 30px; border: 2px solid #D4AF37; border-radius: 16px; background-color: #fffaf0;">
                <p style="margin-top: 0; font-weight: 600; color: #1a1a1a;">Pague com Pix para liberação instântanea:</p>
                <img src="data:image/png;base64,${orderData.pixImage}" style="width: 220px; height: 220px; margin: 15px 0;" />
                <p style="font-size: 12px; color: #666; margin-bottom: 8px;">Ou copie o código abaixo:</p>
                <div style="background: #fff; border: 1px solid #eee; padding: 12px; font-size: 11px; word-break: break-all; border-radius: 8px; font-family: monospace;">${orderData.pixPayload}</div>
              </div>
            ` : ''}

            <p style="margin-top: 30px; font-size: 14px; color: #444;">
              Assim que o pagamento for liquidado, você receberá um link exclusivo para acessar suas fotos ou ingressos na sua Área do Cliente.
            </p>
            
            <div style="${footerStyle}">
              <p>© ${new Date().getFullYear()} Carsena Photography & Events.<br/>Este é um e-mail automático, por favor não responda.</p>
            </div>
          </div>
        `
      });

      if (response.error) {
        console.error('❌ Resend API Error (Confirmation):', response.error);
        return { success: false, error: response.error };
      }

      console.log('✅ Confirmation Email Sent successfully:', response.data?.id);
      return { success: true };
    } catch (error) {
      console.error('💥 Unexpected Error sending confirmation email:', error);
      return { success: false, error };
    }
  },

  /**
   * Envia e-mail de entrega (quando o pagamento é confirmado)
   */
  async sendDeliveryEmail(to: string, orderData: {
    id: string,
    customerName: string,
    items: any[],
    ticketCodes?: string[]
  }) {
    const orderRef = orderData.id.slice(-6).toUpperCase();
    const photos = orderData.items.filter(i => i.resource_type === 'photo');
    const tickets = orderData.items.filter(i => i.resource_type === 'ticket');

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        replyTo: REPLY_TO_EMAIL,
        subject: `Seus itens Carsena chegaram! ✨`,
        html: `
          <div style="${emailStyle}">
            <div style="${headerStyle}">
              <h1 style="${titleStyle}">Seus itens estão prontos!</h1>
            </div>
            
            <p>Olá, <strong>${orderData.customerName}</strong>.</p>
            <p>O pagamento do pedido <strong>#${orderRef}</strong> foi confirmado com sucesso. Seus itens já foram liberados e estão te esperando.</p>
            
            <div style="margin: 30px 0; padding: 25px; border-left: 4px solid #D4AF37; background-color: #fcfcfc;">
              ${photos.length > 0 ? `
                <div style="margin-bottom: 20px;">
                  <strong style="color: #1a1a1a;">📸 Galerias de Fotos</strong><br />
                  As marcas d'água foram removidas e você já pode baixar suas memórias em alta resolução.
                </div>
              ` : ''}
              
              ${tickets.length > 0 ? `
                <div style="margin-bottom: 5px;">
                  <strong style="color: #1a1a1a;">🎫 Ingressos Confirmados</strong><br />
                  Apresente o QR Code abaixo diretamente na portaria do evento.
                  <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">
                    ${(orderData.ticketCodes || []).map(code => `
                      <div style="background-color: #fff; padding: 15px; border-radius: 8px; border: 1px solid #eee; text-align: center;">
                        <img src="https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${code}" alt="QR Code" width="150" height="150" style="margin-bottom: 10px;" />
                        <br/>
                        <span style="font-family: monospace; font-size: 14px; color: #1a1a1a; font-weight: bold; letter-spacing: 2px;">${code}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>

            <div style="text-align: center;">
              <a href="${FRONTEND_URL}/dashboard" style="${buttonStyle}">Acessar Meus Itens</a>
            </div>

            <p style="font-size: 14px; color: #666; text-align: center;">
              Se tiver qualquer dúvida sobre seu pedido, estamos à disposição.
            </p>
            
            <div style="${footerStyle}">
              <p>© ${new Date().getFullYear()} Carsena Photography & Events.<br/>Elevando suas experiências visuais.</p>
            </div>
          </div>
        `
      });
      return { success: true };
    } catch (error) {
      console.error('Error sending delivery email:', error);
      return { success: false, error };
    }
  },

  /**
   * Envia e-mail notificando que a galeria foi publicada
   */
  async sendGalleryPublishedEmail(to: string, data: {
    customerName: string,
    galleryTitle: string,
    accessCode: string,
  }) {
    const galleryUrl = `${FRONTEND_URL}/galeria/${data.accessCode}`;
    console.log(`📤 Sending Gallery Published Email to ${to}...`);
    try {
      const response = await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        replyTo: REPLY_TO_EMAIL,
        subject: `Sua Galeria "${data.galleryTitle}" está pronta! 📸 ✨`,
        html: `
          <div style="${emailStyle}">
            <div style="${headerStyle}">
              <img src="https://carsena.com.br/logo-premium.png" alt="Carsena" style="height: 40px; margin-bottom: 15px;" />
              <h1 style="${titleStyle}">Suas Memórias Estão Aqui</h1>
            </div>
            
            <p>Olá, <strong>${data.customerName}</strong>.</p>
            <p>Temos o prazer de informar que a galeria <strong>"${data.galleryTitle}"</strong> acaba de ser finalizada e já está disponível para visualização.</p>
            
            <div style="background-color: #f8f8f8; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
              <p style="margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Seu Código de Acesso Exclusivo</p>
              <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: 700; color: #D4AF37; letter-spacing: 4px;">${data.accessCode}</p>
            </div>

            <div style="text-align: center;">
              <a href="${galleryUrl}" style="${buttonStyle}">Acessar Minha Galeria</a>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #444; border-top: 1px solid #f0f0f0; padding-top: 20px;">
              <strong>Como funciona?</strong><br />
              1. Clique no botão acima ou acesse o site da Carsena.<br />
              2. Insira seu código de acesso quando solicitado.<br />
              3. Explore suas fotos, favorite as melhores e realize o download.
            </p>
            
            <div style="${footerStyle}">
              <p>© ${new Date().getFullYear()} Carsena Photography & Events.<br/>Transformando momentos em arte eterna.</p>
            </div>
          </div>
        `
      });

      if (response.error) {
        console.error('❌ Resend API Error (Gallery):', response.error);
        return { success: false, error: response.error };
      }

      console.log('✅ Gallery Email Sent successfully:', response.data?.id);
      return { success: true };
    } catch (error) {
      console.error('💥 Unexpected Error sending gallery email:', error);
      return { success: false, error };
    }
  },

  /**
   * Envia e-mail de recuperação de senha
   */
  async sendPasswordResetEmail(to: string, resetData: {
    customerName: string,
    resetLink: string
  }) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        replyTo: REPLY_TO_EMAIL,
        subject: `Recuperação de Senha | Carsena`,
        html: `
          <div style="${emailStyle}">
            <div style="${headerStyle}">
              <h1 style="${titleStyle}">Recuperar Acesso</h1>
            </div>
            
            <p>Olá, <strong>${resetData.customerName}</strong>.</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta Carsena. Se não foi você, sinta-se à vontade para ignorar este e-mail.</p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetData.resetLink}" style="${buttonStyle}">Redefinir Minha Senha</a>
              <p style="font-size: 12px; color: #999; margin-top: 15px;">Este link expira em 1 hora.</p>
            </div>
 
            <p style="font-size: 13px; color: #666; background: #f9f9f9; padding: 15px; border-radius: 8px;">
              Caso o botão não funcione, copie e cole o link abaixo no seu navegador:<br/>
              <span style="word-break: break-all; color: #D4AF37;">${resetData.resetLink}</span>
            </p>
            
            <div style="${footerStyle}">
              <p>© ${new Date().getFullYear()} Carsena Photography & Events.</p>
            </div>
          </div>
        `
      });
      return { success: true };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error };
    }
  },
  /**
   * Envia e-mail de notificação de contato (Lead da Landing Page)
   */
  async sendContactLeadEmail(contactData: {
    name: string,
    email: string,
    message: string
  }) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [REPLY_TO_EMAIL], // Envia para o fotógrafo
        replyTo: contactData.email, // Permite responder direto pro cliente
        subject: `Novo Contato/Orçamento: ${contactData.name} | Vitrine Carsena`,
        html: `
          <div style="${emailStyle}">
            <div style="${headerStyle}">
              <h1 style="${titleStyle}">Novo Lead Recebido</h1>
            </div>
            
            <p>Você recebeu uma nova mensagem através do formulário de contato do seu site.</p>
            
            <div style="background-color: #f8f8f8; padding: 25px; border-radius: 12px; margin: 30px 0;">
              <p style="margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Dados do Cliente</p>
              <p style="margin: 10px 0 0 0;"><strong>Nome:</strong> ${contactData.name}</p>
              <p style="margin: 5px 0 0 0;"><strong>E-mail:</strong> ${contactData.email}</p>
              
              <p style="margin: 20px 0 5px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Mensagem</p>
              <p style="margin: 0; font-style: italic; color: #1a1a1a;">"${contactData.message}"</p>
            </div>

            <div style="text-align: center;">
              <a href="mailto:${contactData.email}" style="${buttonStyle}">Responder Agora</a>
            </div>
            
            <div style="${footerStyle}">
              <p>© ${new Date().getFullYear()} Carsena Lead System.</p>
            </div>
          </div>
        `
      });
      return { success: true };
    } catch (error) {
      console.error('Error sending contact lead email:', error);
      return { success: false, error };
    }
  }
};
