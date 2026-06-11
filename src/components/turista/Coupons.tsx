import React, { useState, useEffect } from 'react';
import TideTable from './TideTable';
import { useApp } from '@/context/AppContext';
import { Lock, Crown, CheckCircle2, CreditCard, Map as MapIcon, Bell, Compass, Calendar, X, Ticket, Clock, Star, Navigation as NavigationIcon } from 'lucide-react';
import { PremiumFeature } from '../common/PremiumFeature';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import CouponModal from './CouponModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';


interface CouponsProps {
  initialCategory?: string;
}

const Coupons: React.FC<CouponsProps> = ({ initialCategory = 'Todos' }) => {
  const { coupons, partners, isPremiumUser, setIsPremiumUser, setShowUpsell, vipConfig, roteirosVip, eventosVip, financialConfig } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [modalType, setModalType] = useState<'roteiro' | 'evento' | null>(null);
  const [planType, setPlanType] = useState<'mensal' | 'anual'>('anual');


  // Update category if initialCategory changes (e.g. navigation from home)
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const filteredCoupons = React.useMemo(() => {
    // Filter by category first
    let result = coupons;
    if (selectedCategory !== 'Todos' && selectedCategory !== 'VIP') {
      result = coupons.filter(coupon => {
        const partner = partners.find(p => p.id === coupon.partnerId);
        return partner?.category === selectedCategory;
      });
    }

    // If initialCategory is "VIP" (or if we are in the VIP context), we only want premium coupons
    // Based on the user's request, when in the VIP area, only VIP coupons should show.
    if (initialCategory === 'VIP') {
      return result.filter(coupon => coupon.isPremium);
    }

    return result;
  }, [coupons, partners, selectedCategory, initialCategory]);

  const handleRedeem = (coupon: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = coupon.validUntil ? new Date(coupon.validUntil) : null;
    
    if (expiryDate && expiryDate < today) {
      toast.error("Este cupom expirou.");
      return;
    }


    if (coupon.status === 'inactive') {
      toast.error("Este cupom não está mais ativo.");
      return;
    }

    setSelectedCoupon(coupon);
    setShowRedeemModal(true);
  };



  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Você precisa estar logado para assinar.");
        setIsProcessing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-mp-preference', {
        body: { 
          userId: userData.user.id,
          planType: planType
        }
      });

      if (error) {
        console.error("Erro ao chamar create-mp-preference:", error);
        toast.error(error.message || "Erro ao iniciar pagamento.");
        setIsProcessing(false);
        return;
      }

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error("Não foi possível gerar o link de pagamento.");
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error("Erro inesperado no checkout:", err);
      toast.error("Erro ao processar pagamento.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="pb-24 pt-8 px-4 min-h-screen bg-gray-50">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Cupons & Benefícios</h1>
        <p className="text-gray-500 text-sm">Economize nos melhores lugares de Alagoas</p>
      </div>

      {!isPremiumUser && (
        <div className="mb-8 bg-[#00112c] rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Crown size={20} className="text-[#22c55e] fill-[#22c55e]" />
              <span className="font-bold uppercase tracking-widest text-[10px]">Alagoas VIP</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Seja Premium e economize até 50%</h2>
            <p className="text-white/80 text-sm mb-4">Acesso ilimitado a todos os cupons exclusivos e sorteios mensais.</p>
            <button 
              onClick={() => setShowCheckout(true)}
              className="bg-[#22c55e] text-white font-black px-6 py-4 rounded-2xl text-sm w-full active:scale-[0.98] transition-all shadow-xl shadow-[#22c55e]/20"
            >
              Assinar VIP Agora
            </button>
          </div>
          <Crown size={120} className="absolute -right-10 -bottom-10 text-white/10 rotate-12" />
        </div>
      )}

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 mb-8">
        {['Todos', 'Restaurantes', 'Praias', 'Passeios'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat 
                ? 'bg-[#22c55e] text-white shadow-lg shadow-[#22c55e]/20' 
                : 'bg-white text-gray-400 border border-gray-100 shadow-sm'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredCoupons.map((coupon) => {
          const partner = partners.find(p => p.id === coupon.partnerId);
          const isPremium = coupon.isPremium;
          const isLocked = isPremium && !isPremiumUser;

          return (
            <div 
              key={coupon.id} 
              className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm active:scale-[0.98] transition-all"
              onClick={() => handleRedeem(coupon)}

            >
              <div className="p-5 flex gap-5">
                {/* Discount Badge - Always 100% visible */}
                <div className="w-16 h-16 rounded-xl bg-[#22c55e]/10 flex items-center justify-center flex-shrink-0 relative">
                  <span className="text-[#22c55e] font-black text-xl">{coupon.discount}</span>
                  {isPremium && (
                    <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-1 rounded-full shadow-lg border border-white">
                      <Crown size={12} fill="currentColor" />
                    </div>
                  )}
                </div>

                <div className={cn("flex-1", isLocked && "blur-[1px] opacity-60")}>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900">{coupon.title}</h4>
                    {isLocked && <Lock size={14} className="text-gray-400" />}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{partner?.name}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase">Válido até: {new Date(coupon.validUntil).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRedeem(coupon);
                    }}
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl whitespace-nowrap transition-all shadow-lg",
                      isLocked 
                        ? "bg-gray-200 text-gray-500 shadow-gray-100" 
                        : "bg-[#22c55e] text-white shadow-[#22c55e]/10 active:scale-95"
                    )}
                  >
                    {isLocked ? (
                      <div className="flex items-center gap-1">
                        <Lock size={12} />
                        VIP
                      </div>
                    ) : (
                      "Resgatar Código"
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Roteiros Exclusivos Section */}
      <div className="mt-12 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-gray-900">Roteiros Exclusivos</h3>
          </div>
        </div>
        
        <PremiumFeature>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {roteirosVip.map((roteiro) => (
              <div 
                key={roteiro.id} 
                className="bg-white rounded-3xl border border-gray-100 shadow-sm cursor-pointer active:scale-95 transition-all overflow-hidden group"
                onClick={() => {
                  setSelectedContent(roteiro);
                  setModalType('roteiro');
                }}
              >
                <div className="aspect-video w-full bg-gray-100 relative">
                  {(roteiro.image_url || roteiro.icone_url) ? (
                    <img src={roteiro.image_url || roteiro.icone_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={roteiro.titulo} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-500">
                      <Compass size={24} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                    <Compass size={12} className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase text-ocean">Roteiro</span>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-black text-ocean mb-1 leading-tight">{roteiro.titulo}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{roteiro.subtitulo}</p>
                </div>
              </div>
            ))}
            {roteirosVip.length === 0 && (
              <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-200 text-center col-span-full">
                <p className="text-xs text-gray-400">Nenhum roteiro disponível no momento.</p>
              </div>
            )}
          </div>
        </PremiumFeature>
      </div>

      {/* Alertas de Eventos Section */}
      <div className="mb-24">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-gray-900">Alertas de Eventos</h3>
          </div>
        </div>
        
        <PremiumFeature>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {eventosVip.map((event) => (
              <div 
                key={event.id} 
                className="bg-white rounded-3xl border border-gray-100 shadow-sm cursor-pointer active:scale-95 transition-all overflow-hidden group"
                onClick={() => {
                  setSelectedContent(event);
                  setModalType('evento');
                }}
              >
                <div className="aspect-video w-full bg-gray-100 relative">
                  {(event.image_url || event.icone_url) ? (
                    <img src={event.image_url || event.icone_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={event.titulo} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-purple-500">
                      <Calendar size={24} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                    <Bell size={12} className="text-purple-500" />
                    <span className="text-[10px] font-black uppercase text-purple-600">Alerta de Evento</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={12} className="text-gray-400" />
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      {(() => {
                        try {
                          const date = new Date(event.data_categoria);
                          if (isNaN(date.getTime())) return event.data_categoria;
                          return new Intl.DateTimeFormat('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }).format(date).replace(',', ' às');
                        } catch (e) {
                          return event.data_categoria;
                        }
                      })()}
                    </p>
                  </div>
                  <h4 className="font-black text-ocean mb-2 leading-tight">{event.titulo}</h4>
                  {event.descricao_completa && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {event.descricao_completa}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {eventosVip.length === 0 && (
              <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-200 text-center col-span-full">
                <p className="text-xs text-gray-400">Nenhum evento agendado.</p>
              </div>
            )}
          </div>
        </PremiumFeature>
      </div>


      {/* Tábua da Maré Section */}
      <div className="mt-8 mb-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-gray-900">Tábua da Maré VIP</h3>
            <Crown size={16} className="text-[#22c55e] fill-[#22c55e]" />
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 overflow-hidden">
            <TideTable isEmbedded />
          </div>
        </div>
      </div>

      {/* Payment Modal Simulation */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckout(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-ocean/10 rounded-2xl flex items-center justify-center text-ocean">
                  <Crown size={30} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Plano VIP Alagoas</h3>
                  <p className="text-gray-500 text-sm">Escolha o melhor plano para você</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => setPlanType('mensal')}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all text-left",
                    planType === 'mensal' 
                      ? "border-vibrant-green bg-green-50 shadow-md" 
                      : "border-gray-100 bg-white"
                  )}
                >
                  <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", planType === 'mensal' ? "text-vibrant-green" : "text-gray-400")}>
                    {vipConfig?.vip_plan_duration_months && vipConfig.vip_plan_duration_months > 1 
                      ? `${vipConfig.vip_plan_duration_months} Meses` 
                      : "Mensal"}
                  </p>
                  <p className="text-lg font-black text-ocean">R$ {financialConfig?.vip_price || '...'}</p>
                  <p className="text-[10px] text-gray-500 font-bold">Vence em {vipConfig?.vip_plan_duration_months && vipConfig.vip_plan_duration_months > 1 ? `${vipConfig.vip_plan_duration_months * 30}` : '30'} dias</p>
                </button>
                <button
                  onClick={() => setPlanType('anual')}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden",
                    planType === 'anual' 
                      ? "border-vibrant-green bg-green-50 shadow-md" 
                      : "border-gray-100 bg-white"
                  )}
                >
                  {planType === 'anual' && (
                    <div className="absolute top-0 right-0 bg-vibrant-green text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-tighter">
                      Melhor Valor
                    </div>
                  )}
                  <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", planType === 'anual' ? "text-vibrant-green" : "text-gray-400")}>Anual</p>
                  <p className="text-lg font-black text-ocean">R$ {financialConfig?.vip_price_annual || '...'}</p>
                  <p className="text-[10px] text-gray-500 font-bold">Vence em 365 dias</p>
                </button>
              </div>

              <div className="flex flex-col gap-5 mb-10">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-green-500" />
                  <span className="text-sm font-medium text-gray-700">Todos os cupons liberados</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-green-500" />
                  <span className="text-sm font-medium text-gray-700">Passeios com desconto exclusivo</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-green-500" />
                  <span className="text-sm font-medium text-gray-700">Suporte prioritário via WhatsApp</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 mb-8 flex justify-between items-center border border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Valor total</p>
                  <p className="text-2xl font-extrabold text-gray-900">
                    R$ {planType === 'anual' ? (financialConfig?.vip_price_annual || '...') : (financialConfig?.vip_price || '...')}
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100">
                  <CreditCard size={16} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-600">•••• 4242</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-[#22c55e] text-white font-black py-5 rounded-2xl shadow-xl shadow-[#22c55e]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70"
              >
                {isProcessing ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Pagar Agora</>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Coupon Modal */}
      <CouponModal 
        coupon={selectedCoupon}
        isOpen={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
        onUpgrade={() => setShowCheckout(true)}
        isPremiumUser={isPremiumUser}
      />

      {/* VIP Content Details Modal */}
      <AnimatePresence>
        {selectedContent && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedContent(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-8 pb-4 flex justify-between items-start">
                <div className="flex-1">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-4",
                    modalType === 'roteiro' ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500"
                  )}>
                    {modalType === 'roteiro' ? <Compass size={24} /> : <Calendar size={24} />}
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 leading-tight mb-1">{selectedContent.titulo}</h3>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    {modalType === 'roteiro' ? selectedContent.subtitulo : (() => {
                      try {
                        const date = new Date(selectedContent.data_categoria);
                        if (isNaN(date.getTime())) return selectedContent.data_categoria;
                        return new Intl.DateTimeFormat('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(date).replace(',', ' às');
                      } catch (e) {
                        return selectedContent.data_categoria;
                      }
                    })()}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedContent(null)}
                  className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 active:scale-90 transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 pt-4">
                <div className="mb-8">
                  <p className="text-gray-500 leading-relaxed font-medium text-sm">
                    {selectedContent.descricao_completa}
                  </p>
                </div>

                {modalType === 'roteiro' && selectedContent.passos && selectedContent.passos.length > 0 && (
                  <div className="space-y-10 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                    <h4 className="font-black text-ocean uppercase tracking-widest text-[10px] mb-6 flex items-center gap-2">
                      <Clock size={14} className="text-vibrant-green" />
                      Programação do Dia
                    </h4>
                    
                    {selectedContent.passos.map((passo: any, idx: number) => (
                      <div key={passo.id} className="relative pl-12 group">
                        {/* Timeline Dot */}
                        <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-white border-4 border-gray-50 shadow-sm flex items-center justify-center z-10 group-hover:border-vibrant-green/20 transition-all">
                          <div className="w-2 h-2 rounded-full bg-vibrant-green" />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="bg-gray-100 text-ocean text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">
                              {passo.horario}
                            </span>
                            <h5 className="font-black text-ocean tracking-tight">{passo.titulo}</h5>
                          </div>

                          {passo.image_url && (
                            <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm aspect-video">
                              <img src={passo.image_url} alt={passo.titulo} className="w-full h-full object-cover" />
                            </div>
                          )}

                          {passo.descricao && (
                            <p className="text-sm text-gray-500 leading-relaxed font-medium bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                              {passo.descricao}
                            </p>
                          )}

                          {passo.google_maps_url && (
                            <div className="pt-1">
                              <a 
                                href={passo.google_maps_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 bg-white text-ocean text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm group/btn"
                              >
                                <NavigationIcon size={12} className="text-vibrant-green group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                Como Chegar
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {modalType === 'roteiro' && selectedContent.google_maps_link && (
                  <div className="mt-10">
                    <a 
                      href={selectedContent.google_maps_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-blue-50 text-blue-600 font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-blue-100 transition-all"
                    >
                      <MapIcon size={16} />
                      Ver Rota no Google Maps
                    </a>
                  </div>
                )}

                <div className="mt-10 bg-vibrant-green/5 p-6 rounded-[32px] border border-vibrant-green/10 flex items-center gap-4">
                  <div className="w-12 h-12 bg-vibrant-green rounded-2xl flex items-center justify-center text-white shadow-lg shadow-vibrant-green/20">
                    <Star size={24} fill="white" />
                  </div>
                  <div>
                    <p className="font-black text-ocean text-sm">Dica VIP Premium</p>
                    <p className="text-[10px] text-vibrant-green font-black uppercase tracking-widest">Aproveite cada parada!</p>
                  </div>
                </div>
              </div>

              <div className="p-8 pt-4 border-t border-gray-50 bg-gray-50/50">
                <button 
                  onClick={() => setSelectedContent(null)}
                  className="w-full bg-[#00112c] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#00112c]/20 active:scale-95 transition-all uppercase tracking-widest text-xs"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>

  );
};

export default Coupons;
