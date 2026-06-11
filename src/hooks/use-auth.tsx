import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { UserRole } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isPremium?: boolean;
  premiumExpiryDate?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; role?: UserRole }>;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string; role?: UserRole }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Restore from localStorage on initial load to prevent HMR/Strict Mode resets
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('auth_user_persistence');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });
  const userRef = useRef<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);
  const initialFetchDone = useRef(false);

  // Sync ref and localStorage with state
  useEffect(() => {
    userRef.current = user;
    if (user) {
      localStorage.setItem('auth_user_persistence', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user_persistence');
    }
  }, [user]);

  const fetchProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    console.log("[Auth] fetchProfile calling for:", supabaseUser.id, supabaseUser.email);
    try {
      // Robust timeout (10 seconds)
      const profilePromise = supabase.from('profiles').select('*').eq('id', supabaseUser.id).maybeSingle();
      const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 10000)
      );

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error) {
        console.error("[Auth] Profile fetch error:", error);
        throw error;
      }

      // EMERGENCY ADMIN FALLBACK: If email is the main admin email, force admin role
      const isAdminEmail = supabaseUser.email === 'helioalvesbsa@hotmail.com';
      
      // Priority: Database Role -> Metadata Role -> 'user'
      let role = (data?.role || supabaseUser.user_metadata?.role || 'user') as UserRole;
      
      // Forced override for the admin email
      if (isAdminEmail) {
        console.log("[Auth] Forcing admin role for verified admin email");
        role = 'admin';
      }
      
      const profile = {
        id: supabaseUser.id,
        email: supabaseUser.email || supabaseUser.user_metadata?.email || "",
        name: data?.full_name || supabaseUser.user_metadata?.name || "Usuário",
        role: role,
        isPremium: data?.is_premium || false,
        premiumExpiryDate: data?.premium_expiry_date || "",
        avatarUrl: data?.avatar_url || ""
      };
      
      console.log("[Auth] Profile resolved with role:", profile.role);
      return profile;
    } catch (err) {
      console.warn("[Auth] Profile fetch failed or timed out, activating persistence:", err);
      
      // CRITICAL PERSISTENCE: Never downgrade an existing session to 'user' due to a network glitch.
      if (userRef.current && userRef.current.id === supabaseUser.id) {
        console.log("[Auth] BLINDAGEM: Persisting existing role:", userRef.current.role);
        return userRef.current;
      }

      // EMERGENCY ADMIN FALLBACK: Even if fetch fails, if email matches, it's an admin
      const isAdminEmail = supabaseUser.email === 'helioalvesbsa@hotmail.com';
      const metadataRole = (supabaseUser.user_metadata?.role || (isAdminEmail ? 'admin' : 'user')) as UserRole;
      
      console.log("[Auth] Fallback to calculated role:", metadataRole);

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        name: supabaseUser.user_metadata?.name || "Usuário",
        role: metadataRole,
        isPremium: false
      };
    }
  };

  useEffect(() => {
    isMounted.current = true;

    const handleSession = async (session: any, event?: string) => {
      if (!isMounted.current) return;
      
      console.log(`[Auth] Handling session for event: ${event}`);

      if (session?.user) {
        const currentUser = userRef.current;
        
        // Skip fetch only if we already have a user AND it's not the initial load
        // This ensures we do at least one fresh fetch per page load
        if (currentUser && currentUser.id === session.user.id && initialFetchDone.current) {
          if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'MFA_CHALLENGE') {
            console.log("[Auth] Skipping redundant profile fetch (persistence active)");
            setIsLoading(false);
            return;
          }
        }

        const profile = await fetchProfile(session.user);
        initialFetchDone.current = true;
        
        if (isMounted.current) {
          // Compare objects carefully
          const profileChanged = JSON.stringify(profile) !== JSON.stringify(currentUser);
          
          if (profileChanged) {
            console.log("[Auth] Updating user state with new profile:", profile?.role);
            setUser(profile);
          } else {
            console.log("[Auth] Profile unchanged, keeping existing state");
          }
          setIsLoading(false);
        }
      } else {
        initialFetchDone.current = true;
        if (userRef.current !== null) {
          console.log("[Auth] Clearing user state (no session)");
          setUser(null);
        }
        setIsLoading(false);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[Auth] onAuthStateChange event: ${event}`);
      if (event === 'PASSWORD_RECOVERY') {
        // Special case: we are in a recovery flow, don't let standard routines redirect yet
        console.log("[Auth] PASSWORD_RECOVERY detected, session is ready for update-password");
        // We set initialFetchDone so standard routines don't block
        initialFetchDone.current = true;
      }
      handleSession(session, event);
    });

    // Run an initial session check immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted.current) {
        handleSession(session, 'INITIAL_SESSION');
      }
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        toast.error("Erro no login com Google: " + error.message);
      }
    } catch (err) {
      toast.error("Erro inesperado no login com Google");
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error("Erro: " + error.message);
        return { success: false, message: error.message };
      }

      if (data.user) {
        const profile = await fetchProfile(data.user);
        if (isMounted.current) setUser(profile);
        return { success: true, role: profile?.role };
      }
      return { success: true };
    } catch (err: any) {
      toast.error("Erro inesperado");
      return { success: false, message: "Erro inesperado" };
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });

      if (error) {
        toast.error(error.message);
        return { success: false, message: error.message };
      }

      if (data.user) {
        const profile = await fetchProfile(data.user);
        if (isMounted.current) setUser(profile);
        return { success: true, role: profile?.role };
      }
      return { success: true };
    } catch (err) {
      toast.error("Erro inesperado");
      return { success: false, message: "Erro inesperado" };
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      if (isMounted.current) setUser(null);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user);
      if (isMounted.current) setUser(profile);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, signup, logout, refreshProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth outside provider");
  return context;
}
