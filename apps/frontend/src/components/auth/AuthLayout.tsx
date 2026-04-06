import { type FC, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  subtitle?: string;
  title: string;
}

export const AuthLayout: FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-[100dvh] bg-luxury-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration - subtle editorial feel */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-luxury-gold/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-luxury-gold/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-12 relative z-10">
        {/* Branding */}
        <div className="text-center space-y-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-white/50 hover:text-luxury-gold transition-colors text-[10px] font-bold uppercase tracking-[0.2em] mb-4"
          >
            <ChevronLeft size={16} />
            Voltar ao Site
          </Link>
          <Link to="/" className="font-serif text-3xl font-bold tracking-[0.3em] uppercase text-white block">
            Carsena
          </Link>
          <div className="space-y-2">
            <h1 className="font-serif text-4xl text-white tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-white/60 text-sm font-light tracking-wide italic">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="animate-slide-up">
          {children}
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-white/30 uppercase tracking-[0.2em]">
          Carsena Photography &copy; 2026 • Premium Experience
        </p>
      </div>
    </div>
  );
};
