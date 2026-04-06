import { type FC, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const AuthInput: FC<AuthInputProps> = ({ 
  label, 
  error, 
  className, 
  id, 
  ...props 
}) => {
  return (
    <div className="space-y-2 w-full group">
      <label 
        htmlFor={id} 
        className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 group-focus-within:text-luxury-gold transition-colors ml-1"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className={cn(
            "w-full bg-white/5 border border-white/10 rounded-none px-4 py-4 text-white font-sans text-sm tracking-wide",
            "focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/30 transition-all",
            "placeholder:text-white/20",
            error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-[10px] text-red-500 tracking-wide font-medium ml-1">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
