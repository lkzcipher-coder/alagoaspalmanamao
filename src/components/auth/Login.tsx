import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Link, useNavigate } from '@tanstack/react-router';
import { Loader2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthLayout from './AuthLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const LoginComponent: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const { login, loginWithGoogle, isLoading, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && !isLoading) {
      // BYPASS: Se houver um usuário (sessão temporária de recuperação), mas estivermos na página de update-password, não redirecione
      if (window.location.pathname.includes('update-password') || window.location.hash.includes('type=recovery')) {
        return;
      }

      if (user.role === 'admin') {
        navigate({ to: '/admin' });
      } else {
        navigate({ to: '/' });
      }
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    const result = await login(email, password);
    if (!result.success) {
      setError(result.message || 'Erro ao fazer login.');
    }
  };

  const handleSocialLogin = async (provider: string) => {
    if (provider === 'google') {
      await loginWithGoogle();
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Por favor, digite seu e-mail.");
      return;
    }

    setIsForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/update-password?type=recovery`,
      });

      if (error) {
        toast.error("Erro ao enviar link: " + error.message);
      } else {
        toast.success("Se o e-mail estiver cadastrado, você receberá um link em instantes.");
        setIsForgotModalOpen(false);
        setForgotEmail('');
      }
    } catch (err) {
      toast.error("Erro inesperado.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* 4. CORREÇÃO DO CARD BRANCO (BOTTOM SHEET) */}
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className="absolute bottom-0 w-full bg-white px-6 pt-8 pb-10 rounded-t-[40px] z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
      >
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-extrabold text-[#003366] mb-6 text-center">Entrar</h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#003366]/10 transition-all text-gray-800"
                placeholder="Seu melhor e-mail"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#003366]/10 transition-all text-gray-800"
                placeholder="********"
              />
            </div>

            <div className="text-right">
              <button 
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-sm text-[#003366] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                Esqueceu a senha?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#003366] text-white font-bold rounded-full shadow-lg shadow-blue-900/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center mt-2"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Entrar"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="px-4 bg-white text-gray-400">Ou continue com</span>
            </div>
          </div>

          <button 
            onClick={() => handleSocialLogin('google')}
            className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98]"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
            <span className="text-base font-bold text-gray-700">Entrar com Google</span>
          </button>

          <p className="mt-8 text-center text-gray-500 text-sm">
            Não tem uma conta?{' '}
            <Link to="/signup" className="text-[#003366] font-extrabold hover:underline">
              Cadastre-se grátis
            </Link>
          </p>
        </div>
      </motion.div>
      <Dialog open={isForgotModalOpen} onOpenChange={setIsForgotModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none">
          <DialogTitle className="sr-only">Login ou Cadastro</DialogTitle>
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-extrabold text-[#003366] text-center">Recuperar Senha</DialogTitle>
            <DialogDescription className="text-center text-gray-500">
              Digite o e-mail cadastrado e enviaremos as instruções de recuperação.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4 pt-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#003366]/10 transition-all text-gray-800"
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isForgotLoading}
              className="w-full py-4 bg-[#003366] text-white font-bold rounded-full shadow-lg shadow-blue-900/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center"
            >
              {isForgotLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Enviar link de recuperação"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
};
