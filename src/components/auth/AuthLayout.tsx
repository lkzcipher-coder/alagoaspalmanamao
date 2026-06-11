import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  showLogo?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col font-sans">
      {/* 1. FUNDO GLOBAL FIXO - NOVA IMAGEM INTEGRADA */}
      <img 
        src="https://fxkrpadnrdewpbfmawzo.supabase.co/storage/v1/object/public/imagem%20de%20fundo%20atualizacao/ChatGPT%20Image%205%20de%20jun.%20de%202026,%2010_05_28.png" 
        alt="Background" 
        className="absolute inset-0 w-full h-screen object-cover object-[center_top] -z-10"
      />
      
      {children}
    </div>
  );
};

export default AuthLayout;