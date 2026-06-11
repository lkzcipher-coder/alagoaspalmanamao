import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate, Link } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthLayout from './AuthLayout';

export const SignupComponent: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signup, loginWithGoogle, isLoading, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && !isLoading) {
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

    if (!name || !email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    const result = await signup(name, email, password);
    if (!result.success) {
      setError(result.message || 'Erro ao realizar cadastro.');
    }
  };

  const handleSocialLogin = async (provider: string) => {
    if (provider === 'google') {
      await loginWithGoogle();
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
          <h2 className="text-2xl font-extrabold text-[#003366] mb-6 text-center">Criar Conta</h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nome Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#003366]/10 transition-all text-gray-800"
                placeholder="Como quer ser chamado?"
              />
            </div>

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
                placeholder="Crie uma senha forte"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#003366] text-white font-bold rounded-full shadow-lg shadow-blue-900/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center mt-2"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Criar conta"}
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
            <span className="text-base font-bold text-gray-700">Criar conta com Google</span>
          </button>

          <p className="mt-8 text-center text-gray-500 text-sm">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-[#003366] font-extrabold hover:underline">
              Entrar agora
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
};