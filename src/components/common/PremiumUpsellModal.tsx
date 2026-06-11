import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Crown, CheckCircle2, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

const PremiumUpsellModal: React.FC = () => {
  const { showUpsell, setShowUpsell, setIsPremiumUser, vipConfig, financialConfig } = useApp();
  const { user } = useAuth();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [planType, setPlanType] = useState<'mensal' | 'anual'>('anual');

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para assinar o VIP");
      return;
    }

    setIsSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-mp-preference', {
        body: { 
          userId: user.id,
          planType: planType
        }
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("URL de checkout não recebida");
      }
    } catch (error: any) {
      console.error("Erro ao iniciar pagamento:", error);
      toast.error("Erro ao iniciar pagamento: " + (error.message || "Tente novamente mais tarde"));
      
      // Fallback para ativação direta apenas em ambiente de desenvolvimento se desejado, 
      // mas aqui seguiremos o fluxo oficial de erro
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <AnimatePresence>
      {showUpsell && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center px-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUpsell(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl max-w-md"
          >
            <button 
              onClick={() => setShowUpsell(false)}
              className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400"
            >
              <X size={20} />
            </button>
            
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
            
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[#00112c]/5 rounded-3xl flex items-center justify-center text-[#22c55e] mx-auto mb-4">
                <Crown size={40} className="fill-current" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Seja Alagoas VIP</h3>
              <p className="text-gray-500 text-sm">
                Limite de favoritos atingido. Assine o VIP para salvar locais ilimitados e desbloquear conteúdos exclusivos.
              </p>
            </div>

            <div className="flex flex-col gap-4 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
                  <CheckCircle2 size={14} />
                </div>
                <span className="text-sm font-medium text-gray-700">Favoritos ilimitados</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
                  <CheckCircle2 size={14} />
                </div>
                <span className="text-sm font-medium text-gray-700">Vídeos e Reels exclusivos</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
                  <CheckCircle2 size={14} />
                </div>
                <span className="text-sm font-medium text-gray-700">Roteiros personalizados</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setPlanType('mensal')}
                className={`p-4 rounded-2xl border-2 transition-all text-left ${
                  planType === 'mensal' 
                    ? "border-[#22c55e] bg-green-50 shadow-md" 
                    : "border-gray-100 bg-white"
                }`}
              >
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${planType === 'mensal' ? "text-[#22c55e]" : "text-gray-400"}`}>
                  {vipConfig?.vip_plan_duration_months && vipConfig.vip_plan_duration_months > 1 
                    ? `Plano ${vipConfig.vip_plan_duration_months} Meses` 
                    : "Mensal"}
                </p>
                <p className="text-lg font-black text-gray-900">R$ {financialConfig?.vip_price || '...'}</p>
                <p className="text-[10px] text-gray-500 font-bold">
                  {vipConfig?.vip_plan_duration_months && vipConfig.vip_plan_duration_months > 1 
                    ? `${vipConfig.vip_plan_duration_months * 30} dias` 
                    : "30 dias"}
                </p>
              </button>
              <button
                onClick={() => setPlanType('anual')}
                className={`p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${
                  planType === 'anual' 
                    ? "border-[#22c55e] bg-green-50 shadow-md" 
                    : "border-gray-100 bg-white"
                }`}
              >
                {planType === 'anual' && (
                  <div className="absolute top-0 right-0 bg-[#22c55e] text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-tighter">
                    Vantagem
                  </div>
                )}
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${planType === 'anual' ? "text-[#22c55e]" : "text-gray-400"}`}>Anual</p>
                <p className="text-lg font-black text-gray-900">R$ {financialConfig?.vip_price_annual || '...'}</p>
                <p className="text-[10px] text-gray-500 font-bold">365 dias</p>
              </button>
            </div>

            <button
              onClick={handleSubscribe}
              className="w-full bg-[#22c55e] text-white font-black py-5 rounded-2xl shadow-xl shadow-[#22c55e]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70"
              disabled={isSubscribing}
            >
              {isSubscribing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                `Assinar VIP ${planType === 'anual' ? 'Anual' : (vipConfig?.vip_plan_duration_months && vipConfig.vip_plan_duration_months > 1 ? `${vipConfig.vip_plan_duration_months} Meses` : 'Mensal')}`
              )}
            </button>
            
            <button
              onClick={() => setShowUpsell(false)}
              className="w-full mt-4 text-gray-400 text-sm font-bold py-2"
            >
              Talvez mais tarde
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PremiumUpsellModal;