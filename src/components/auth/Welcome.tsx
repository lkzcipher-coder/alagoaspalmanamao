import React from 'react';
import { Link } from '@tanstack/react-router';
import { User, LogIn, ChevronRight, Trees } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '@/hooks/use-auth';

export const WelcomeComponent: React.FC = () => {
  const { loginWithGoogle, user, isLoading } = useAuth();
  const navigate = React.useMemo(() => ({ to: '/' }), []);
  
  React.useEffect(() => {
    if (!isLoading && user) {
      if (window.location.pathname.includes('update-password') || window.location.hash.includes('type=recovery')) {
        return;
      }
    }
  }, [user, isLoading]);
  
  return (
    <AuthLayout>
      {/* Bloco de autenticação reposicionado para a área da areia (parte inferior) */}
      <div className="absolute bottom-4 w-full px-8 z-20 flex flex-col items-center">
        
        {/* Botão Criar conta - Azul Premium com Neon */}
        <Link 
          to="/signup"
          className="group relative w-full flex items-center justify-between py-1 px-1 bg-gradient-to-r from-[#003566] to-[#001D3D] text-white rounded-full shadow-[0_0_20px_rgba(0,201,255,0.4)] hover:shadow-[0_0_25px_rgba(0,201,255,0.6)] transition-all active:scale-[0.98] mb-4"
        >
          <div className="flex items-center w-full">
            <div className="bg-[#003566] p-3 rounded-full mr-4 shadow-inner border border-white/10">
              <User size={22} className="text-white fill-white/10" />
            </div>
            <span className="flex-1 text-center font-bold text-lg tracking-wide">Criar conta</span>
          </div>
          <div className="absolute right-4 p-1">
            <ChevronRight size={24} className="text-[#00C9FF]" />
          </div>
        </Link>

        {/* Botão Entrar - Laranja/Salmão Premium com Neon */}
        <Link 
          to="/login"
          className="group relative w-full flex items-center justify-between py-1 px-1 bg-gradient-to-r from-[#FFD1C9] to-[#FFB5A7] text-[#001D3D] rounded-full shadow-[0_0_20px_rgba(255,127,80,0.3)] hover:shadow-[0_0_25px_rgba(255,127,80,0.5)] transition-all active:scale-[0.98] mb-6"
        >
          <div className="flex items-center w-full">
            <div className="bg-[#FF9B85] p-3 rounded-full mr-4 shadow-inner border border-white/20">
              <LogIn size={22} className="text-[#001D3D]" />
            </div>
            <span className="flex-1 text-center font-bold text-lg tracking-wide">Entrar</span>
          </div>
          <div className="absolute right-4 p-1">
            <ChevronRight size={24} className="text-[#FF7F50]" />
          </div>
        </Link>

        {/* Separador com Palmeira */}
        <div className="w-full flex flex-col items-center mb-4 opacity-60">
          <Trees size={22} className="text-[#001D3D] mb-1" />
          <div className="flex items-center w-full">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[#001D3D]/30"></div>
            <span className="px-3 text-[9px] font-bold text-[#001D3D] uppercase tracking-[0.2em]">
              Ou continue com
            </span>
            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[#001D3D]/30"></div>
          </div>
        </div>

        {/* Botão Google - Arredondado */}
        <button 
          onClick={() => loginWithGoogle()}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/90 backdrop-blur-sm border border-white/20 rounded-full hover:bg-white transition-all shadow-lg active:scale-[0.98]"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          <span className="text-sm font-bold text-[#444]">Entrar com Google</span>
        </button>
      </div>
    </AuthLayout>
  );
};