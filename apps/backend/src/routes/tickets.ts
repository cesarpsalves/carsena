import { Router } from "express";
import { GoogleWalletService } from "../services/googleWalletService";

const router = Router();

/**
 * GET /api/tickets/:id/google-wallet
 * Retorna o link assinado (JWT) para adicionar o ingresso ao Google Wallet
 */
router.get("/:id/google-wallet", async (req, res) => {
  const { id } = req.params;

  try {
    const url = await GoogleWalletService.generateSaveLink(id);
    res.json({ url });
  } catch (error: any) {
    console.error("Erro ao gerar link do Google Wallet:", error);
    res.status(500).json({ 
      error: "Falha ao gerar link do Google Wallet", 
      details: error.message 
    });
  }
});

export default router;
