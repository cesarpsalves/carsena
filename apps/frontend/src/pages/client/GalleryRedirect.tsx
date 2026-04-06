import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle, Camera } from "lucide-react";

export const GalleryRedirect = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveCode = async () => {
      try {
        if (!code) throw new Error("Código não fornecido");

        const { data, error: sbError } = await supabase
          .from('galleries')
          .select('id')
          .eq('access_code', code.toUpperCase())
          .single();

        if (sbError || !data) {
          throw new Error("Este código de acesso é inválido ou a galeria foi removida.");
        }

        // Redireciona para a rota oficial da galeria
        navigate(`/cliente/galeria/${data.id}`, { replace: true });
      } catch (err: any) {
        setError(err.message);
      }
    };

    resolveCode();
  }, [code, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="relative inline-block">
            <Camera size={64} className="text-luxury-cream/10 mx-auto" />
            <AlertCircle size={24} className="text-red-500 absolute -bottom-2 -right-2" />
          </div>
          <div className="space-y-4">
            <h1 className="text-serif text-3xl text-luxury-cream">Acesso Negado</h1>
            <p className="text-luxury-cream/40 font-sans text-sm tracking-wide lowercase italic px-8">
              "{error}"
            </p>
          </div>
          <div className="pt-8">
            <button 
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-luxury-cream/5 border border-luxury-cream/10 text-luxury-gold text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-luxury-gold hover:text-black transition-all"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black flex flex-col items-center justify-center p-6 space-y-8">
      <Loader2 size={32} className="text-luxury-gold animate-spin" />
      <div className="text-center space-y-2">
        <p className="text-serif text-2xl text-luxury-cream italic">Autenticando seu acesso...</p>
        <p className="text-[10px] uppercase tracking-[0.4em] text-luxury-cream/30">Prepare-se para reviver momentos únicos</p>
      </div>
    </div>
  );
};
