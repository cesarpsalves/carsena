import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Html5Qrcode } from "html5-qrcode";
import { ticketService } from "../../lib/tickets";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Camera, RefreshCw, Ticket, ChevronLeft, Scan, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

export const AdminScanner = () => {
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<{ id: string, label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "reader";

  useEffect(() => {
    // Inicializa a instância do scanner uma única vez
    html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);

    // Detecta câmeras disponíveis
    detectCameras();

    return () => {
      stopScanner();
    };
  }, []);

  const detectCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices.map(d => ({ id: d.id, label: d.label })));
        
        // Se houver câmeras, tenta iniciar com a traseira ou a primeira disponível
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('traseira'));
        const initialCameraId = backCamera ? backCamera.id : devices[0].id;
        setSelectedCameraId(initialCameraId);
        startScannerWithId(initialCameraId);
      }
    } catch (err) {
      console.error("Erro ao detectar câmeras:", err);
    }
  };

  const startScannerWithId = async (cameraId: string) => {
    try {
      if (!html5QrCodeRef.current) return;
      
      // Se já estiver escaneando, para antes de trocar
      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      setIsScanning(true);
      setScanResult(null);

      await html5QrCodeRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanFailure
      );
      setHasPermission(true);
    } catch (err: any) {
      console.error("Erro ao iniciar câmera específica:", err);
      // Fallback para facingMode se o ID falhar
      startScanner();
    }
  };

  const startScanner = async () => {
    try {
      if (!html5QrCodeRef.current) return;

      setIsScanning(true);
      setScanResult(null);

      // Tenta iniciar com a câmera traseira ('environment')
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanFailure
      );
      setHasPermission(true);
    } catch (err: any) {
      console.error("Erro ao iniciar câmera:", err);
      setHasPermission(false);
      setIsScanning(false);
      toast.error("Não foi possível acessar a câmera traseira.");
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Erro ao parar scanner:", err);
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    try {
      // Para o scanner para processar a validação
      await stopScanner();
      setIsValidating(true);
      
      console.log("Ticket Scanned:", decodedText);

      // Chama a RPC de validação
      const response: any = await ticketService.validateTicket(decodedText);
      
      if (response.success) {
        setScanResult({
          status: 'success',
          message: response.message,
          ticket_code: response.ticket_code,
          customer_name: response.customer_name
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
        message: "Erro técnico na validação. Verifique sua conexão."
      });
    } finally {
      setIsValidating(false);
    }
  };

  const onScanFailure = (_error: any) => {
    // Ignora frames que falham na leitura
  };

  const resetScanner = () => {
    startScanner();
  };

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto space-y-8 pt-4 pb-20">
        {/* Header */}
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

        {/* Seleção de Câmera */}
        {cameras.length > 1 && isScanning && (
          <div className="flex flex-col gap-2">
            <label className="text-[9px] uppercase tracking-widest text-white/30 font-bold ml-2">Trocar Câmera</label>
            <select 
              value={selectedCameraId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedCameraId(id);
                startScannerWithId(id);
              }}
              className="w-full bg-white/5 border border-white/10 py-3 px-4 text-[10px] font-bold text-luxury-gold uppercase tracking-widest outline-none focus:border-luxury-gold transition-colors appearance-none"
            >
              {cameras.map(camera => (
                <option key={camera.id} value={camera.id} className="bg-luxury-black">
                  {camera.label || `Câmera ${camera.id.slice(0, 4)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Área Central: Scanner */}
        <div className="relative aspect-square w-full max-w-[400px] mx-auto overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl">
          <div id={scannerContainerId} className="w-full h-full" />
          
          {/* Overlay do Scanner (Visual Only) */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute inset-0 border-[40px] border-black/40" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border-2 border-luxury-gold/50 rounded-lg shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                <motion.div 
                  initial={{ top: 0 }}
                  animate={{ top: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-0.5 bg-luxury-gold shadow-[0_0_15px_#D4AF37]"
                />
              </div>
              <div className="absolute bottom-10 left-0 right-0 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 font-bold bg-black/60 py-2 px-4 rounded-full inline-block">Posicione o QR Code</p>
              </div>
            </div>
          )}

          {/* Permissão Negada */}
          {hasPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-black">
              <AlertTriangle className="text-amber-500 w-12 h-12" />
              <div className="space-y-2">
                <p className="text-white font-serif text-xl">Câmera Bloqueada</p>
                <p className="text-white/40 text-[10px] uppercase tracking-widest">Ative as permissões de câmera nas configurações do seu navegador.</p>
              </div>
              <button onClick={startScanner} className="px-6 py-3 bg-luxury-gold text-black text-[10px] font-bold uppercase tracking-widest rounded">Tentar Novamente</button>
            </div>
          )}

          {/* Resultado da Validação */}
          <AnimatePresence>
            {!isScanning && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-[#0D0D0D] p-8 flex flex-col items-center justify-center text-center space-y-8"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="w-16 h-16 text-luxury-gold animate-spin opacity-50" />
                    <div className="space-y-2">
                      <p className="text-luxury-gold font-bold uppercase tracking-[0.4em] text-[10px] animate-pulse">Validando Ingresso...</p>
                    </div>
                  </>
                ) : scanResult?.status === 'success' ? (
                  <div className="space-y-8">
                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                      <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-green-500 font-serif text-3xl italic">Acesso Liberado</p>
                      <p className="text-white text-lg font-serif">{scanResult.customer_name || 'Participante'}</p>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest">{scanResult.message}</p>
                    </div>
                    <button 
                      onClick={resetScanner}
                      className="w-full bg-luxury-gold text-black font-bold uppercase tracking-[0.3em] text-[10px] py-5 rounded shadow-xl"
                    >
                      Próximo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                      <XCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-red-500 font-serif text-3xl italic">Problema</p>
                      <p className="text-white/60 text-sm max-w-[250px] mx-auto leading-relaxed">{scanResult?.message}</p>
                    </div>
                    <button 
                      onClick={resetScanner}
                      className="w-full border border-red-500/20 text-red-500 font-bold uppercase tracking-[0.3em] text-[10px] py-5 rounded"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
             <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
             <div className="flex flex-col">
               <span className="text-[9px] uppercase tracking-widest text-white/30">Status</span>
               <span className="text-[10px] font-bold text-white uppercase tracking-widest">{isScanning ? "Pronto" : "Parado"}</span>
             </div>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 justify-end text-right">
             <div className="flex flex-col">
               <span className="text-[9px] uppercase tracking-widest text-white/30">Modo</span>
               <span className="text-[10px] font-bold text-white uppercase tracking-widest">Seguro</span>
             </div>
             <Scan size={16} className="text-luxury-gold" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
