import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { emailService } from '../services/email';

const router = Router();

/**
 * POST /api/auth/forgot-password
 * Triggers a custom premium password reset email
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'E-mail é obrigatório' });
  }

  try {
    // 1. Ask Supabase to generate a reset link
    // We use the admin api or the standard auth.resetPasswordForEmail
    // Note: In a real production setup, we might want to use Supabase's built-in redirect
    // but here we want to trigger our PREMIUM email template.
    
    const { data: user, error: userError } = await supabase.auth.admin.listUsers();
    const targetUser = user?.users.find(u => u.email === email);

    if (!targetUser) {
      // Security best practice: don't reveal if user exists
      return res.json({ success: true, message: 'Se o e-mail existir, você receberá um link em breve.' });
    }

    // Generate link via Supabase Auth
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.FRONTEND_URL || 'https://carsena.com.br'}/reset-password`
      }
    });

    if (error) throw error;

    // 2. Send our Premium Email
    await emailService.sendPasswordResetEmail(email, {
      customerName: targetUser.user_metadata?.name || 'Cliente Carsena',
      resetLink: data.properties.action_link
    });

    res.json({ success: true, message: 'E-mail de recuperação enviado com sucesso.' });
  } catch (error: any) {
    console.error('❌ Forgot password error:', error.message);
    res.status(500).json({ error: 'Falha ao processar recuperação de senha' });
  }
});

export default router;
