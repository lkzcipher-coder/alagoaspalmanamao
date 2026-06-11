import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from '@tanstack/react-router';
import { Loader2, Lock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import AuthLayout from './AuthLayout';

export const UpdatePasswordComponent: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("[UpdatePassword] Page mounted, location:", window.location.href, "hash:", window.location.hash);
    
    // Check if we have a session or if we need to exchange a code
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[UpdatePassword] Initial session check:", !!session);
        
        // If no session, check for a recovery code in the URL (PKCE) or Hash
        if (!session) {
          const params = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          
          const code = params.get('code');
          const type = params.get('type') || hashParams.get('type');
          const accessToken = hashParams.get('access_token');
          
          console.log("[UpdatePassword] Params - code:", !!code, "type:", type, "accessToken:", !!accessToken);

          if (code && type === 'recovery') {
            console.log("[UpdatePassword] Exchanging code for session...");
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error("[UpdatePassword] Code exchange error:", error);
              toast.error('Link de recuperação inválido ou expirado.');
              navigate({ to: '/login' });
              return;
            }
          } else if (accessToken || type === 'recovery') {
             console.log("[UpdatePassword] Recovery hash/token detected, waiting for background processing...");
             // No immediate redirect, give time to onAuthStateChange
             // We wait up to 5 seconds for onAuthStateChange to fire or session to be available
             let attempts = 0;
             while (attempts < 5) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const { data: { session: finalCheck } } = await supabase.auth.getSession();
                if (finalCheck) {
                   console.log("[UpdatePassword] Session established successfully via hash");
                   setIsVerifying(false);
                   return;
                }
                attempts++;
             }
             console.log("[UpdatePassword] Recovery flow failed to establish session after waiting.");
          } else {
            console.log("[UpdatePassword] No recovery indicators found, redirecting to login");
            navigate({ to: '/login' });
          }
        }
      } catch (err) {
        console.error('[UpdatePassword] Error checking session:', err);
      } finally {
        setIsVerifying(false);
      }
    };

    checkSession();

    // Listen for auth state changes (like PASSWORD_RECOVERY)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[UpdatePassword] onAuthStateChange: ${event}`, !!session);
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setIsVerifying(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        toast.error('Erro ao atualizar senha: ' + error.message);
      } else {
        setIsSuccess(true);
        toast.success('Senha atualizada com sucesso!');
        setTimeout(() => {
          navigate({ to: '/login' });
        }, 2000);
      }
    } catch (err) {
      toast.error('Erro inesperado ao atualizar senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className="absolute bottom-0 w-full bg-white px-6 pt-8 pb-10 rounded-t-[40px] z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
      >
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-extrabold text-[#003366] mb-2 text-center">Nova Senha</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Digite sua nova senha de acesso abaixo.</p>

          {isVerifying ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 text-[#003366] animate-spin" />
              <p className="text-sm text-gray-500 font-medium">Verificando link de segurança...</p>
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-lg font-bold text-gray-800">Senha Alterada!</p>
              <p className="text-sm text-gray-500 text-center">Redirecionando você para o login...</p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#003366]/10 transition-all text-gray-800"
                    placeholder="********"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#003366]/10 transition-all text-gray-800"
                    placeholder="********"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#003366] text-white font-bold rounded-full shadow-lg shadow-blue-900/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center mt-6"
              >
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Salvar"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </AuthLayout>
  );
};