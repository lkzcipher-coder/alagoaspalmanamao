import React, { useState, useEffect } from 'react';
import PartnerDetails from './PartnerDetails';
import { Search, MapPin, Star, ChevronRight, MapPinned, Heart, Crown, Play, Loader2, Ticket, Lock, Music, Utensils, Compass } from 'lucide-react';
import { PremiumFeature } from '../common/PremiumFeature';
import { cn } from '@/lib/utils';
import VideoPlayer from '@/components/common/VideoPlayer';
import StoryViewer from './StoryViewer';
import CouponModal from './CouponModal';
import { useApp } from '@/context/AppContext';
import BannerCarousel from './BannerCarousel';

import { useAuth } from '@/hooks/use-auth';
import { Category, Partner, Coupon } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

const categories: Category[] = ['Praias', 'Restaurantes', 'Passeios', 'Hotéis', 'Vida Noturna'];
const locations = ['Maceió', 'Maragogi', 'Marechal Deodoro', 'São Miguel dos Milagres', 'Barra de São Miguel'];

interface HomeProps {
  onNavigateToCoupons?: (category: string) => void;
  onNavigateToNightlife?: () => void;
  onNavigateToReels?: () => void;
}

const Home: React.FC<HomeProps> = ({ onNavigateToCoupons, onNavigateToNightlife, onNavigateToReels }) => {
  const { partners, coupons, currentLocation, setCurrentLocation, toggleFavorite, isFavorite, videos, isLoading: isContextLoading, isUserPremium, setShowUpsell, appSettings } = useApp();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Todos'>('Todos');
  const [selectedCouponCategory, setSelectedCouponCategory] = useState<Category | 'Todos'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);


  
  const displayPartners = React.useMemo(() => {
    let filtered = [...partners];

    // Filter by Category
    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim().length > 0) {
      const term = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) || 
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.location && p.location.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [partners, selectedCategory, searchQuery]);

  const filteredCoupons = React.useMemo(() => {
    let filtered = [...coupons];
    
    if (selectedCouponCategory !== 'Todos') {
      filtered = filtered.filter(coupon => {
        const partner = partners.find(p => p.id === coupon.partnerId);
        return partner?.category === selectedCouponCategory;
      });
    }

    if (searchQuery.trim().length > 0) {
      const term = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(coupon => {
        const partner = partners.find(p => p.id === coupon.partnerId);
        return (
          coupon.title.toLowerCase().includes(term) ||
          partner?.name.toLowerCase().includes(term)
        );
      });
    }

    return searchQuery.trim().length > 0 ? filtered : filtered.slice(0, 5);
  }, [coupons, partners, selectedCouponCategory, searchQuery]);

  const filteredVIPPartners = React.useMemo(() => {
    let filtered = partners.filter(p => p.isPremium);
    if (searchQuery.trim().length > 0) {
      const term = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) || 
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.location && p.location.toLowerCase().includes(term))
      );
    }
    return filtered;
  }, [partners, searchQuery]);

  const isLoading = isContextLoading;


  return (
    <div className={cn("pb-24 min-h-screen", isUserPremium() ? "bg-black" : "bg-[#fcfcfc]")}>
      {/* Premium Header */}
      <div 
        className="pt-8 pb-16 px-6 rounded-b-[40px] shadow-2xl relative mb-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.6) ${appSettings?.hero_gradient_intensity || 80}%, rgba(0, 0, 0, 0) ${(appSettings?.hero_gradient_intensity || 80) + 50}%), url('${appSettings?.hero_bg_image || 'https://fxkrpadnrdewpbfmawzo.supabase.co/storage/v1/object/public/imagens/FOTO%20MACEIO%20A%20NOITE.jpg'}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="flex items-center justify-between mb-8">
          <div 
            className="flex items-center gap-3 cursor-pointer active:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#22c55e]/50 rounded-2xl"
            onClick={() => setShowLocationPicker(true)}
            role="button"
            aria-label="Selecionar localização"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowLocationPicker(true);
              }
            }}
          >
            <div className={cn("bg-white/5 backdrop-blur-md p-2.5 rounded-2xl border border-white/5", isUserPremium() ? "text-amber-400" : "text-[#22c55e]")}>
              <MapPin size={22} />
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-[0.15em]", isUserPremium() ? "text-amber-400" : "text-[#22c55e]")}>Sua Localização</p>
              <div className="flex items-center gap-1">
                <h2 className="text-base font-bold text-white">{currentLocation}, AL</h2>
                <ChevronRight size={16} className="text-white/30" />
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-white/10 p-0.5 border border-white/20 overflow-hidden shadow-lg">
              <img 
                src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=random`}
                alt="Avatar" 
                className="w-full h-full object-cover rounded-[14px]" 
              />
            </div>
            {isUserPremium() && (
              <div className="absolute -top-3 -right-2 z-10 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] animate-bounce-subtle">
                <Crown size={18} className="text-amber-400 fill-amber-400 rotate-[15deg]" />
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <div className="text-left mb-6">
            <h1 className="text-[40px] font-black text-white leading-none mb-1 tracking-tight">
              {appSettings?.hero_title || 'Descubra Alagoas.'}
            </h1>
            <p className="text-white text-[16px] font-bold mb-3">
              {appSettings?.hero_subtitle || 'Economize em cada saída.'}
            </p>
            
            <div className="flex flex-wrap items-center gap-x-1 gap-y-0 text-white/80 text-[10px] font-medium mb-4 max-w-[260px] leading-tight">
              <span>🎟️ Shows,</span>
              <span>🍴 restaurantes,</span>
              <span>🌴 passeios e experiências para membros VIP.</span>
            </div>

            <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl py-2 px-3 flex items-center gap-2 max-w-fit">
              <span className="text-base">🏷️</span>
              <p className="text-white text-[12px] font-medium">
                Economia de até <span className={cn("font-black text-sm", isUserPremium() ? "text-amber-400" : "text-[#22c55e]")}>50%</span> em parceiros selecionados.
              </p>
            </div>
          </div>

          {/* Search Bar Inside Header - Centralized */}
          <div className="relative z-50 max-w-md mx-auto">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40">
              <Search size={20} />
            </div>
            <label htmlFor="search-home" className="sr-only">Onde você quer ir hoje?</label>
            <input
              id="search-home"
              type="text"
              placeholder="Onde você quer ir hoje?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn("w-full bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl py-4 pl-16 pr-4 text-sm font-medium shadow-2xl transition-all outline-none text-white placeholder:text-gray-400", isUserPremium() ? "focus:ring-2 focus:ring-amber-400/30" : "focus:ring-2 focus:ring-[#22c55e]/30")}
            />
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Recomendações VIP */}
        <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className={cn("font-black", isUserPremium() ? "text-white" : "text-gray-900")}>Recomendações VIP</h3>
            <Crown size={16} className={cn(isUserPremium() ? "text-amber-400 fill-amber-400" : "text-[#22c55e] fill-[#22c55e]")} />
          </div>
          <button className={cn("text-sm font-bold", isUserPremium() ? "text-amber-400" : "text-[#22c55e]")}>Ver VIP</button>
        </div>
        <PremiumFeature>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-2">
            {filteredVIPPartners.map((partner: Partner) => (
              <div 
                key={partner.id}
                onClick={() => setSelectedPartner(partner)}
                className="flex-shrink-0 w-40 active:scale-95 transition-all"
              >
                <div className="relative aspect-square rounded-3xl overflow-hidden mb-2 shadow-md">
                  <img src={partner.image} alt={partner.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-[10px] font-bold">{partner.totalReviews > 0 ? partner.rating : 'Sem notas'}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(partner.id);
                    }}
                    className={`absolute bottom-2 right-2 p-1.5 rounded-lg backdrop-blur-md shadow-sm transition-all active:scale-90 ${
                      isFavorite(partner.id) ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-400'
                    }`}
                  >
                    <Heart size={12} className={isFavorite(partner.id) ? 'fill-current' : ''} />
                  </button>
                </div>
                <h4 className={cn("font-bold text-xs truncate", isUserPremium() ? "text-white" : "text-gray-900")}>{partner.name}</h4>
                <p className={cn("text-[10px] truncate", isUserPremium() ? "text-gray-400" : "text-gray-400")}>{partner.location}</p>
              </div>
            ))}
            {filteredVIPPartners.length === 0 && searchQuery.trim().length >= 2 && (
              <div className="py-4 text-center w-full">
                <p className="text-xs text-gray-400">Nenhum VIP encontrado.</p>
              </div>
            )}
          </div>
        </PremiumFeature>
        </div>
        
        {/* Banner Rotativo */}
        <div className="mb-10">
          <BannerCarousel />
        </div>

      {/* Descontos da Região */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn("font-black", isUserPremium() ? "text-white" : "text-gray-900")}>Descontos da Região</h3>
          <button 
            onClick={() => onNavigateToCoupons?.('Todos')}
            className={cn("text-sm font-bold", isUserPremium() ? "text-amber-400" : "text-[#22c55e]")}
          >
            Ver todos
          </button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 mb-6">
          {['Todos', 'Restaurantes', 'Praias', 'Passeios', 'Vida Noturna'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCouponCategory(cat as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCouponCategory === cat 
                  ? (isUserPremium() ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'bg-[#22c55e] text-white shadow-lg shadow-[#22c55e]/20')
                  : (isUserPremium() ? 'bg-white/5 text-gray-400 border border-white/10 shadow-sm' : 'bg-white text-gray-400 border border-gray-100 shadow-sm')
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-2">
          {filteredCoupons.map((coupon) => {
            const partner = partners.find(p => p.id === coupon.partnerId);
            const isPremium = coupon.isPremium;
            const isLocked = isPremium && !isUserPremium();

            return (
              <div 
                key={coupon.id}
                onClick={() => {
                  setSelectedCoupon(coupon);
                  setIsCouponModalOpen(true);
                }}

                className={cn("flex-shrink-0 w-72 rounded-3xl p-4 transition-all flex items-center gap-4 cursor-pointer focus:outline-none focus:ring-2", isUserPremium() ? "bg-white/5 border border-white/10 shadow-none focus:ring-amber-400/30" : "bg-white border border-gray-100 shadow-sm active:scale-95 focus:ring-[#22c55e]/30")}
                role="button"
                tabIndex={0}
                aria-label={`Ver detalhes do cupom: ${coupon.title} de ${partner?.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedCoupon(coupon);
                    setIsCouponModalOpen(true);
                  }
                }}
              >
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 relative", isUserPremium() ? "bg-amber-400/10" : "bg-[#22c55e]/10")}>
                  <span className={cn("font-black text-xl", isUserPremium() ? "text-amber-400" : "text-[#22c55e]")}>{coupon.discount}</span>
                  {isPremium && (
                    <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-1 rounded-full shadow-lg border border-white">
                      <Crown size={12} fill="currentColor" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h4 className={cn("font-bold text-sm truncate", isUserPremium() ? "text-white" : "text-gray-900")}>{coupon.title}</h4>
                    {isLocked && <Lock size={12} className="text-gray-400 flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">{partner?.name}</p>
                </div>
                <div className="flex-shrink-0">
                   <ChevronRight size={16} className="text-gray-300" />
                </div>
              </div>
            );
          })}
          {filteredCoupons.length === 0 && (
            <div className="py-8 text-center w-full">
              <p className="text-xs text-gray-400">Nenhum cupom nesta categoria ainda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn("font-bold", isUserPremium() ? "text-white" : "text-gray-900")}>Categorias</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4">
          <button
            onClick={() => setSelectedCategory('Todos')}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
              selectedCategory === 'Todos' ? 'bg-[#00112c] text-white shadow-xl shadow-[#00112c]/20' : (isUserPremium() ? 'bg-white/5 text-gray-400 border border-white/10 shadow-sm' : 'bg-white text-gray-400 border border-gray-100 shadow-sm')
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                if (cat === 'Vida Noturna') {
                  onNavigateToNightlife?.();
                } else {
                  setSelectedCategory(cat);
                }
              }}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat ? 'bg-[#00112c] text-white shadow-xl shadow-[#00112c]/20' : (isUserPremium() ? 'bg-white/5 text-gray-400 border border-white/10 shadow-sm' : 'bg-white text-gray-400 border border-gray-100 shadow-sm')
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Videos */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn("font-bold", isUserPremium() ? "text-white" : "text-gray-900")}>Vídeos & Reels</h3>
          <button 
            onClick={onNavigateToReels}
            className={cn("text-sm font-bold", isUserPremium() ? "text-amber-400" : "text-[#22c55e]")}
          >
            Ver todos
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-4 px-4">
          {videos.slice(0, 10).map((video, index) => {
            const isLocked = video.isPremium && !isUserPremium();
            return (
              <div key={video.id} className="flex-shrink-0 w-32 relative">
                <div 
                  className="aspect-[9/16] rounded-2xl overflow-hidden bg-black mb-2 shadow-sm relative group cursor-pointer"
                  onClick={() => setActiveStoryIndex(index)}
                >
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className={`w-full h-full object-cover transition-all duration-300 ${isLocked ? 'opacity-60 blur-[2px]' : 'opacity-80'}`} 
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isLocked ? (
                      <div className="bg-black/20 w-full h-full flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30 shadow-2xl">
                          <Lock size={24} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <Play size={20} className="text-white fill-current" />
                    )}
                  </div>
                  {video.isPremium && (
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[#22c55e] px-2 py-1 rounded-lg shadow-lg border border-white/20 z-10">
                      <Crown size={10} className="text-white fill-white" />
                      <span className="text-[9px] text-white font-black uppercase tracking-wider">VIP</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-bold text-gray-700 truncate px-1">{video.title}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Partners List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Parceiros em destaque</h3>
          <button className="text-[#22c55e] text-sm font-bold flex items-center">
            Ver tudo <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-8 min-h-[300px] relative">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 w-full col-span-full">
              <Loader2 className="w-10 h-10 animate-spin text-[#22c55e] mb-4" />
              <p className="text-gray-500 font-medium">Buscando parceiros...</p>
            </div>
          ) : (
            <>
              {displayPartners.map((partner: Partner) => (
                <div 
                  key={partner.id} 
                  onClick={() => setSelectedPartner(partner)}
                  className="group relative bg-white rounded-[32px] overflow-hidden shadow-md border border-gray-50 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    <img src={partner.image} alt={partner.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {partner.isPremium && (
                      <div className="absolute top-4 left-4 bg-[#22c55e] text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                        Premium
                      </div>
                    )}
                    {partner.isTest && (
                      <div className="absolute top-4 left-4 bg-orange-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                        Teste
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl flex items-center gap-1 shadow-sm">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-bold text-gray-900">{partner.totalReviews > 0 ? `${partner.rating} (${partner.totalReviews})` : 'Sem avaliações'}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(partner.id);
                        }}
                        className={`p-2 rounded-xl backdrop-blur-sm shadow-sm transition-all active:scale-90 ${
                          isFavorite(partner.id) ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-400'
                        }`}
                      >
                        <Heart size={16} className={isFavorite(partner.id) ? 'fill-current' : ''} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-lg text-gray-900">{partner.name}</h4>
                      {partner.price && <span className="text-[#00112c] font-black">{partner.price}</span>}
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                      <MapPin size={12} />
                      <span>{(partner.location || 'Localização não informada')} • {(partner.category || 'Sem categoria')}</span>
                    </div>
                  </div>
                </div>
              ))}
              {displayPartners.length === 0 && (
                <div className="text-center py-12 w-full col-span-full">
                  <p className="text-gray-500">
                    {searchQuery.trim().length >= 2 
                      ? "Nenhum parceiro encontrado com esse nome." 
                      : "Nenhum resultado encontrado."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Location Picker Modal */}
      <AnimatePresence>
        {showLocationPicker && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLocationPicker(false)}
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
              <h3 className="text-xl font-black text-gray-900 mb-6">Selecione sua localização</h3>
              <div className="flex flex-col gap-4">
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setCurrentLocation(loc);
                      setShowLocationPicker(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                      currentLocation === loc ? 'bg-[#22c55e]/5 border-2 border-[#22c55e]' : 'bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${currentLocation === loc ? 'bg-[#22c55e] text-white' : 'bg-white text-gray-400'}`}>
                        <MapPinned size={18} />
                      </div>
                      <span className={`font-bold ${currentLocation === loc ? 'text-[#00112c]' : 'text-gray-700'}`}>{loc}</span>
                    </div>
                    {currentLocation === loc && (
                      <div className="w-6 h-6 bg-[#22c55e] rounded-full flex items-center justify-center text-white">
                        <Star size={12} className="fill-current" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Story Viewer Modal */}
      {activeStoryIndex !== null && (
        <StoryViewer 
          videos={videos}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
        />
      )}

      {/* Partner Details Modal */}
      {selectedPartner && (
        <PartnerDetails 
          partner={selectedPartner} 
          onBack={() => setSelectedPartner(null)} 
        />
      )}

      {/* Coupon Modal */}
      <CouponModal 
        coupon={selectedCoupon}
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        onUpgrade={() => setShowUpsell(true)}
        isPremiumUser={isUserPremium()}
      />


      </div>
    </div>
  );
};

export default Home;