import { Router } from 'express';
import { emailService } from '../services/email';
import { supabase } from '../lib/supabase';

const router = Router();

/**
 * POST /api/emails/publish-gallery
 * Notifica o cliente que sua galeria foi publicada
 */
router.post('/publish-gallery', async (req, res) => {
  const { galleryId } = req.body;

  if (!galleryId) {
    return res.status(400).json({ error: 'galleryId is required' });
  }

  try {
    // 1. Buscar dados da galeria e do cliente
    // O cliente supabase do backend já está no schema app_carsena
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('*, customers(*)')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      throw new Error('Galeria não encontrada');
    }

    if (!gallery.customers || !gallery.customers.email) {
      throw new Error('Cliente ou e-mail não encontrado para esta galeria');
    }

    // 2. Enviar e-mail
    const result = await emailService.sendGalleryPublishedEmail(
      gallery.customers.email,
      {
        customerName: gallery.customers.name,
        galleryTitle: gallery.title,
        accessCode: gallery.access_code
      }
    );

    if (!result.success) {
      throw new Error('Falha no serviço de e-mail');
    }

    res.json({ message: 'E-mail enviado com sucesso' });
  } catch (error: any) {
    console.error('Error publishing gallery notification:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/emails/contact
 * Recebe contato da landing page e notifica o fotógrafo
 */
router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const result = await emailService.sendContactLeadEmail({ name, email, message });
    
    if (!result.success) {
      throw new Error('Falha ao processar e-mail de contato');
    }

    res.json({ message: 'Mensagem enviada com sucesso!' });
  } catch (error: any) {
    console.error('Error in contact form submission:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
