import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  customer: any | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  loginAsCustomer: (customerData: any) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for customer session in localStorage
    const savedCustomer = localStorage.getItem('carsena_customer');
    if (savedCustomer && savedCustomer !== "undefined" && savedCustomer !== "null") {
      try {
        setCustomer(JSON.parse(savedCustomer));
      } catch (e) {
        console.error("Failed to parse saved customer", e);
        localStorage.removeItem('carsena_customer');
      }
    }

    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      // Usando o schema app_carsena explicitamente (já configurado no lib/supabase.ts)
      const { data, error } = await supabase
        .from('photographers')
        .select('*')
        .eq('auth_id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const loginAsCustomer = (customerData: any) => {
    setCustomer(customerData);
    localStorage.setItem('carsena_customer', JSON.stringify(customerData));
  };

  const signOut = async () => {
    if (customer) {
      setCustomer(null);
      localStorage.removeItem('carsena_customer');
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, customer, profile, loading, signOut, loginAsCustomer, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
