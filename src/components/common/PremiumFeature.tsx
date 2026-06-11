import React from 'react';
import { useApp } from '@/context/AppContext';
import { Lock, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumFeatureProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  isPremiumOnly?: boolean;
  blur?: boolean;
}

export const PremiumFeature: React.FC<PremiumFeatureProps> = ({ 
  children, 
  fallback, 
  className,
  isPremiumOnly = true,
  blur = true
}) => {
  const { isPremiumUser, setShowUpsell } = useApp();

  if (!isPremiumOnly || isPremiumUser) {
    return <div className={className}>{children}</div>;
  }

  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <div className={cn("relative group overflow-hidden", className)}>
      <div className={cn("transition-all", blur && "blur-[6px] pointer-events-none opacity-60")}>
        {children}
      </div>
      
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-white/30 backdrop-blur-[2px]">
        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-4 shadow-lg border border-white">
          <Crown size={24} fill="currentColor" />
        </div>
        <h3 className="text-sm font-black text-ocean mb-1">Exclusivo VIP</h3>
        <p className="text-[10px] text-gray-500 font-bold mb-4 uppercase tracking-tighter">Assine o VIP para liberar este recurso</p>
        <button 
          onClick={() => setShowUpsell(true)}
          className="bg-ocean text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-ocean/20 active:scale-95 transition-all"
        >
          Liberar Agora
        </button>
      </div>
    </div>
  );
};
