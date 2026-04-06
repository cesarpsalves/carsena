import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Html5QrcodeScanner } from "html5-qrcode";
import { ticketService } from "../../lib/tickets";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Camera, RefreshCw, Ticket, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

export const AdminScanner = () => {
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!isScanning) return;

    // Inicializa o scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
      },
      /* verbose= */ false
    );

    scannerRef.current = scanner;

    const onScanSuccess = async (decodedText: string) => {
      try {
        // Para o scanner assim que achar um código
        await scanner.clear();
        setIsScanning(false);
        setIsValidating(true);
        
        console.log("Ticket Scanned:", decodedText);

        // Chama a RPC de validação
        const response: any = await ticketService.validateTicket(decodedText);
        
        if (response.success) {
          setScanResult({
            status: 'success',
            message: response.message,
            ticket_code: response.ticket_code
          });
          toast.success("Check-in realizado!");
        } else {
          setScanResult({
            status: 'error',
            message: response.message || "Ingresso inválido ou já utilizado."
          });
          toast.error(response.message || "Acesso Negado");
        }
      } catch (err: any) {
        console.error("Validation Error:", err);
        setScanResult({
          status: 'error',
          message: "Este código não parece ser um ingresso Carsena válido ou ocorreu um erro de conexão."
        });
        toast.error("Erro técnico na validação");
      } finally {
        setIsValidating(false);
      }
    };

    const onScanFailure = (_error: any) => {
      // Ignora erros de leitura de frames (muito comuns enquanto move a câmera)
    };

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Scanner clean error:", e));
      }
    };
  }, [isScanning]);

  const resetScanner = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto space-y-8 pt-4 pb-20">
        {/* Header da Portaria */}
        <div className="flex flex-col gap-4">
          <Link 
            to="/admin/bilheteria" 
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-luxury-gold hover:text-white transition-colors w-fit"
          >
            <ChevronLeft size={14} />
            Voltar para Bilheteria
          </Link>
          <div className="text-center space-y-2">
            <h2 className="font-serif text-4xl text-luxury-cream">Portaria Digital</h2>
            <p className="text-[10px] uppercase tracking-[0.4em] text-luxury-gold font-bold">Validação Online 24h</p>
          </div>
        </div>

        {/* Área Central: Scanner ou Resultado */}
        <div className="relative">
          <div 
            id="reader" 
            className={`overflow-hidden border border-white/5 bg-black/40 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-500 rounded-lg ${!isScanning ? 'opacity-0 h-0 hidden' : 'opacity-100'}`}
          />

          <AnimatePresence>
            {!isScanning && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0D0D0D] border border-white/10 p-10 text-center rounded-lg shadow-2xl relative overflow-hidden"
              >
                {isValidating ? (
                  <div className="py-16 space-y-8">
                    <RefreshCw className="w-20 h-20 text-luxury-gold animate-spin mx-auto opacity-50" />
                    <div className="space-y-2">
                      <p className="text-luxury-gold font-black uppercase tracking-[0.5em] text-[12px] animate-pulse">Sincronizando...</p>
                      <p className="text-luxury-cream/20 text-[9px] uppercase tracking-widest">Verificando banco de dados</p>
                    </div>
                  </div>
                ) : scanResult?.status === 'success' ? (
                  <div className="space-y-10">
                    <div className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                      <CheckCircle2 className="w-16 h-16 text-green-500" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-4xl text-green-500 font-serif lowercase italic">Acesso Liberado</h3>
                      <p className="text-luxury-cream/60 text-base max-w-xs mx-auto leading-relaxed">{scanResult.message}</p>
                      {scanResult.ticket_code && (
                        <div className="pt-6 border-t border-white/5 mt-8 inline-block w-full">
                           <span className="text-luxury-gold font-mono text-xs uppercase tracking-[0.4em] px-4 py-2 bg-white/5 rounded">
                            {scanResult.ticket_code}
                           </span>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={resetScanner}
                      className="w-full bg-luxury-gold text-black font-black uppercase tracking-[0.3em] text-[11px] py-6 px-8 hover:bg-white transition-all shadow-[0_10px_30px_rgba(212,175,55,0.2)] rounded"
                    >
                      Próximo Cliente
                    </button>
                  </div>
                ) : (
                  <div className="space-y-10">
                    <div className="w-32 h-32 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                      <XCircle className="w-16 h-16 text-red-500" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-4xl text-red-500 font-serif lowercase italic">Houve um Problema</h3>
                      <p className="text-luxury-cream/60 text-base max-w-xs mx-auto leading-relaxed">{scanResult?.message}</p>
                    </div>
                    
                    <button 
                      onClick={resetScanner}
                      className="w-full border border-red-500/20 text-red-500 font-black uppercase tracking-[0.3em] text-[11px] py-6 px-8 hover:bg-red-500/10 transition-all font-sans rounded"
                    >
                      Tentar Novamente
                    </button>
                    <p className="text-[10px] text-white/10 uppercase tracking-widest font-bold">Verifique se o e-mail do cliente é o mesmo da compra</p>
                  </div>
                )}
                
                {/* Visual Accent Decoration */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-luxury-gold/5 blur-[40px]" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-luxury-gold/5 blur-[40px]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Rodapé Informativo */}
        <div className="grid grid-cols-2 gap-6 pt-4">
          <div className="flex items-center gap-3 p-4 bg-white/2 rounded-lg border border-white/5">
            <Camera size={14} className="text-luxury-gold" />
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-luxury-cream/40">Câmera Ativa</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white/2 rounded-lg border border-white/5 justify-end">
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-luxury-cream/40 text-right">Lote Integrado</span>
            <Ticket size={14} className="text-luxury-gold" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
