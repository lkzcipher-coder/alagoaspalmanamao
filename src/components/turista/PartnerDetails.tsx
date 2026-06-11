import React, { useState, useRef, useEffect } from 'react';
import { Partner, Review, ReservationOption } from '@/types';
import { ChevronLeft, Star, MapPin, Share2, Heart, MessageCircle, Send, Play, Trash2, Edit2, X, Check, Music, Calendar, Clock, Users, ArrowRight, Navigation as NavigationIcon, Loader2, MessageSquare, Lock, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import VideoPlayer from '@/components/common/VideoPlayer';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';


import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { isPartnerOpen } from '@/lib/operating-hours';

// Fix for default marker icon in Leaflet + Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG Marker Icon Creator with Name Label
const createCustomIcon = (name: string) => L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div class="marker-pin"></div>
    <div class="marker-dot"></div>
    <div class="marker-label">${name}</div>
  `,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -40]
});

// Component to handle map center updates and size validation
const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    // Initial invalidation and set view
    map.invalidateSize();
    map.setView(center, 15);
    
    // Delayed invalidation to handle mobile layout stabilization
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);

    // Handle window resize
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    // Robust resize tracking with ResizeObserver
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    const container = map.getContainer();
    if (container) {
      observer.observe(container);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [center, map]);

  return null;
};



interface PartnerDetailsProps {
  partner: Partner;
  onBack: () => void;
}

const PartnerDetails: React.FC<PartnerDetailsProps> = ({ partner, onBack }) => {
  const { toggleFavorite, isFavorite, addReview, deleteReview, updateReview, videos, isUserPremium, setShowUpsell } = useApp();
  const { user } = useAuth();
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingRating, setEditingRating] = useState(0);
  const [editingComment, setEditingComment] = useState('');
  const [mapKey, setMapKey] = useState(0);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const [reservationForm, setReservationForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '20:00',
    people: '2',
    name: user?.name || '',
    whatsapp: '',
    option: ''
  });

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!showReviewForm) {
      setShowReviewForm(true);
    }
  };

  const handleConfirmReservation = () => {
    if (!reservationForm.date || !reservationForm.time || !reservationForm.name) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const formattedDate = format(new Date(reservationForm.date), 'dd/MM/yyyy', { locale: ptBR });
    const message = `Olá! Gostaria de fazer uma reserva:${reservationForm.option ? `\n*Opção:* ${reservationForm.option}` : ''}\n*Nome:* ${reservationForm.name}\n*Data:* ${formattedDate}\n*Horário:* ${reservationForm.time}\n*Pessoas:* ${reservationForm.people}${reservationForm.whatsapp ? `\n*WhatsApp:* ${reservationForm.whatsapp}` : ''}\n\nVim pelo App Alagoas na Palma da Mão!`;
    
    const encodedMessage = encodeURIComponent(message);
    
    // Support both full URL and just number in partner.whatsapp
    let whatsappUrl = "";
    if (partner.whatsapp.startsWith('https://')) {
      // If it's a full URL, we need to append the text parameter correctly
      const baseUrl = partner.whatsapp.split('?')[0];
      whatsappUrl = `${baseUrl}?text=${encodedMessage}`;
    } else {
      whatsappUrl = `https://wa.me/${partner.whatsapp.replace(/\D/g, '')}?text=${encodedMessage}`;
    }
    
    window.open(whatsappUrl, '_blank');
    setShowReservationModal(false);
    toast.success("Redirecionando para o WhatsApp do parceiro...");
  };

  React.useEffect(() => {
    // Reset map key when partner changes to force a fresh render of the map
    setMapKey(prev => prev + 1);
    
    const timer = setTimeout(() => {
      setMapKey(prev => prev + 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [partner.id]);

  
  const partnerVideos = videos.filter(v => v.partnerId === partner.id);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRating === 0) return;
    
    setIsSubmitting(true);
    await addReview(partner.id, {
      userId: '', // Handled by AppContext
      userName: '', // Handled by AppContext
      rating: userRating,
      comment: comment
    });

    setIsSubmitting(false);
    setUserRating(0);
    setComment('');
    setShowReviewForm(false);
  };

  const images = partner.images && partner.images.length > 0 ? partner.images : [partner.image];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const hasCoordinates = partner.latitude !== undefined && 
                         partner.longitude !== undefined && 
                         !isNaN(Number(partner.latitude)) && 
                         !isNaN(Number(partner.longitude)) &&
                         (Number(partner.latitude) !== 0 || Number(partner.longitude) !== 0);


  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto hide-scrollbar pb-48 ${partner.category === 'Vida Noturna' ? 'bg-[#0F172A]' : 'bg-white'}`}>
      {/* Hero / Carousel */}
      <div className="relative h-[450px] w-full">
        <AnimatePresence mode="wait">
          <motion.img 
            key={activeImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            src={images[activeImageIndex]} 
            className="w-full h-full object-cover" 
            alt={partner.name} 
          />
        </AnimatePresence>
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-black/30" />
        
        {/* Top Actions */}
        <div className="absolute top-12 left-6 right-6 flex justify-between items-center z-10">
          <button 
            onClick={onBack}
            className="w-12 h-12 bg-black/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/20 shadow-2xl active:scale-90 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-3">
            <button className="w-12 h-12 bg-black/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/20 shadow-2xl active:scale-90 transition-all">
              <Share2 size={20} />
            </button>
            <button 
              onClick={() => toggleFavorite(partner.id)}
              className={`w-12 h-12 bg-black/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-2xl transition-all active:scale-90 ${
                isFavorite(partner.id) ? 'text-red-500 fill-red-500' : 'text-white'
              }`}
            >
              <Heart size={20} />
            </button>
          </div>
        </div>

        {/* Gallery Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-10 left-6 right-6 flex gap-2 overflow-x-auto hide-scrollbar py-2">
            {images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                  activeImageIndex === idx ? 'border-[#22c55e] scale-110 shadow-lg' : 'border-white/20 opacity-60'
                }`}
              >
                <img src={img} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        )}

        {/* Indicator dots (fallback for fewer images) */}
        {images.length > 1 && images.length < 5 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === activeImageIndex ? 'w-6 bg-[#22c55e]' : 'w-1.5 bg-white/40'}`} />
            ))}
          </div>
        )}
      </div>

      <div className="px-6 pt-8 -mt-6 relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-[#22c55e] text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-[#22c55e]/20">
                {partner.category}
              </span>
              {partner.nightlife_type && (
                <span className="bg-white/10 text-white/60 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/5">
                  {partner.nightlife_type}
                </span>
              )}
            </div>
            <h1 className={`text-3xl font-black leading-tight ${partner.category === 'Vida Noturna' ? 'text-white' : 'text-gray-900'}`}>
              {partner.name}
            </h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            {partner.totalReviews > 0 && (
              <button 
                onClick={scrollToReviews}
                className="flex items-center gap-1 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-xl active:scale-95 transition-all hover:bg-black/30"
              >
                <Star size={18} className="fill-yellow-400 text-yellow-400" />
                <span className={`font-black ${partner.category === 'Vida Noturna' ? 'text-white' : 'text-gray-900'}`}>
                  {partner.rating}
                </span>
              </button>
            )}
            {partner.price && (
              <span className="text-[#22c55e] font-black text-xl">{partner.price}</span>
            )}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-10">
          {partner.whatsapp && (
            <a 
              href={partner.whatsapp.startsWith('http') ? partner.whatsapp : `https://wa.me/${partner.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-[24px] bg-[#22c55e]/10 border border-[#22c55e]/20 group active:scale-95 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-[#22c55e] flex items-center justify-center text-white shadow-lg shadow-[#22c55e]/20 group-hover:scale-110 transition-transform">
                <MessageCircle size={20} />
              </div>
            </a>
          )}
          

          {(partner.google_maps_link || hasCoordinates) && (
            <a 
              href={partner.google_maps_link 
                ? (partner.google_maps_link.startsWith('http') ? partner.google_maps_link : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partner.google_maps_link)}`)
                : `https://www.google.com/maps/dir/?api=1&destination=${partner.latitude},${partner.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-[24px] bg-blue-500/10 border border-blue-500/20 group active:scale-95 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <MapPin size={18} />
              </div>
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest text-center">Como chegar</span>
            </a>
          )}

          <button 
            onClick={scrollToReviews}
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-[24px] bg-yellow-500/10 border border-yellow-500/20 group active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-full bg-yellow-500 flex items-center justify-center text-white shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
              <Star size={18} className="fill-current" />
            </div>
            <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest text-center">Avaliar</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-white/40 text-xs mb-10 font-medium">
          <MapPin size={16} className="text-[#22c55e]" />
          <span>{partner.location || 'Localização não informada'}</span>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 bg-[#22c55e] rounded-full" />
            <h3 className={`font-black text-xl tracking-tight ${partner.category === 'Vida Noturna' ? 'text-white' : 'text-gray-900'}`}>Sobre este lugar</h3>
          </div>
          <p className={`leading-relaxed text-sm font-medium ${partner.category === 'Vida Noturna' ? 'text-white/60' : 'text-gray-500'}`}>
            {partner.description}
          </p>
        </div>

        {partner.operating_hours && (
          <div className="mb-12 p-6 bg-white/5 rounded-[32px] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${isPartnerOpen(partner.operating_hours) ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-red-500/20 text-red-500'} flex items-center justify-center`}>
                <Clock size={24} />
              </div>
              <div>
                <h4 className="text-white font-black text-sm uppercase tracking-widest">Funcionamento</h4>
                <p className="text-white/40 text-xs font-bold">{partner.operating_hours}</p>
              </div>
            </div>
            <div className={`px-3 py-1 ${isPartnerOpen(partner.operating_hours) ? 'bg-[#22c55e]' : 'bg-red-500'} text-white text-[8px] font-black rounded-full uppercase tracking-tighter`}>
              {isPartnerOpen(partner.operating_hours) ? 'Aberto Agora' : 'Fechado Agora'}
            </div>
          </div>
        )}

        {/* Map Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-[#22c55e] rounded-full" />
            <h3 className={`font-black text-xl tracking-tight ${partner.category === 'Vida Noturna' ? 'text-white' : 'text-gray-900'}`}>Como chegar</h3>
          </div>
          {hasCoordinates ? (
            <div className="h-64 bg-gray-100 rounded-[32px] overflow-hidden relative border border-gray-100 shadow-2xl z-0 group">
              <MapContainer 
                key={`${partner.id}-${mapKey}`}
                center={[Number(partner.latitude), Number(partner.longitude)]} 
                zoom={15} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                />
                <Marker 
                  position={[Number(partner.latitude), Number(partner.longitude)]}
                  icon={createCustomIcon(partner.name)}
                />
                <MapUpdater center={[Number(partner.latitude), Number(partner.longitude)]} />
              </MapContainer>
              <div className="absolute inset-0 bg-black/20 pointer-events-none group-hover:bg-transparent transition-colors" />

              {(partner.google_maps_link || hasCoordinates) && (
                <button 
                  onClick={() => {
                    let url = "";
                    if (partner.google_maps_link) {
                      url = partner.google_maps_link.startsWith('http') 
                        ? partner.google_maps_link 
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partner.google_maps_link)}`;
                    } else {
                      url = `https://www.google.com/maps/dir/?api=1&destination=${partner.latitude},${partner.longitude}`;
                    }
                    window.open(url, '_blank');
                  }}
                  className="absolute bottom-6 right-6 z-[1001] bg-[#22c55e] text-white text-[10px] font-black px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 active:scale-95 transition-all uppercase tracking-widest"
                >
                  <NavigationIcon size={14} className="text-white" />
                  Como chegar
                </button>
              )}
            </div>
          ) : (
            <div className="h-48 bg-white/5 rounded-[32px] overflow-hidden relative flex items-center justify-center border border-white/5">
              <div className="text-center p-6">
                <MapPin size={32} className="text-white/20 mx-auto mb-2" />
                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Localização em breve</p>
              </div>
            </div>
          )}
        </div>

        {/* Videos Section */}
        {partnerVideos.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-6 bg-[#22c55e] rounded-full" />
              <h3 className={`font-black text-xl tracking-tight ${partner.category === 'Vida Noturna' ? 'text-white' : 'text-gray-900'}`}>Vídeos e Reels</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-6 px-6 pb-2">
              {partnerVideos.map((video) => {
                const isLocked = video.isPremium && !isUserPremium();
                return (
                  <div key={video.id} className="flex-shrink-0 w-48 group">
                    <div 
                      className="relative aspect-[9/16] rounded-[32px] overflow-hidden bg-black mb-3 shadow-2xl cursor-pointer"
                      onClick={() => {
                        if (isLocked) {
                          setShowUpsell(true);
                          return;
                        }
                        setPlayingVideoId(playingVideoId === video.id ? null : video.id);
                      }}
                    >
                      {playingVideoId === video.id && !isLocked ? (
                        <VideoPlayer 
                          url={video.url} 
                          className="w-full h-full" 
                        />
                      ) : (
                        <>
                          <img src={video.thumbnail} alt={video.title} className={`w-full h-full object-cover transition-all duration-300 ${isLocked ? 'opacity-40 blur-[2px]' : 'opacity-60'}`} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            {isLocked ? (
                              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-2xl">
                                <Lock size={28} />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 group-hover:scale-110 transition-transform">
                                <Play size={24} fill="currentColor" />
                              </div>
                            )}
                          </div>
                          {video.isPremium && (
                            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                              <Crown size={12} className="text-[#22c55e] fill-[#22c55e]" />
                              {isLocked && <span className="text-[10px] text-white font-black uppercase tracking-widest">VIP</span>}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <h4 className={`font-bold text-sm truncate px-1 ${partner.category === 'Vida Noturna' ? 'text-white' : 'text-gray-900'}`}>{video.title}</h4>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mb-12" ref={reviewsRef}>
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-[#22c55e] rounded-full" />
              <h3 className={`font-black text-xl tracking-tight ${partner.category === 'Vida Noturna' ? 'text-white' : 'text-gray-900'}`}>Avaliações</h3>
            </div>
            <button 
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="text-[#22c55e] text-[10px] font-black uppercase tracking-widest bg-[#22c55e]/10 px-4 py-2 rounded-full border border-[#22c55e]/20 flex items-center gap-2 active:scale-95 transition-all"
            >
              {showReviewForm ? <X size={12} /> : <Star size={12} className="fill-current" />}
              {showReviewForm ? 'Cancelar' : 'Avaliar agora'}
            </button>
          </div>

          <AnimatePresence>
            {showReviewForm && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleSubmitReview}
                className={`mb-10 rounded-[32px] p-8 border overflow-hidden flex flex-col gap-6 ${partner.category === 'Vida Noturna' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}
              >
                <p className={`text-xs font-black text-center uppercase tracking-widest ${partner.category === 'Vida Noturna' ? 'text-white/40' : 'text-gray-400'}`}>Sua experiência importa</p>
                <div className="flex justify-center gap-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className="transition-transform active:scale-125"
                    >
                      <Star 
                        size={32} 
                        className={`${star <= userRating ? 'fill-yellow-400 text-yellow-400' : 'text-white/10'}`} 
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte-nos o que achou..."
                  className={`w-full border rounded-2xl p-5 text-sm focus:ring-4 transition-all outline-none resize-none font-medium ${
                    partner.category === 'Vida Noturna' 
                      ? 'bg-white/5 border-white/10 text-white focus:ring-[#22c55e]/10' 
                      : 'bg-white border-gray-100 text-gray-900 focus:ring-[#22c55e]/20'
                  }`}
                  rows={4}
                />
                <button
                  type="submit"
                  disabled={userRating === 0 || isSubmitting}
                  className="w-full bg-[#22c55e] text-white font-black py-5 rounded-2xl shadow-xl shadow-[#22c55e]/20 flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-[0.2em] text-xs"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {isSubmitting ? 'Enviando...' : 'Publicar Avaliação'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {partner.totalReviews > 0 && (
            <div className={`rounded-[32px] p-8 border mb-10 ${partner.category === 'Vida Noturna' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-6">
                <div className={`text-5xl font-black ${partner.category === 'Vida Noturna' ? 'text-white' : 'text-gray-900'}`}>
                  {partner.rating}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={16} className={s <= Math.floor(partner.rating) ? "fill-yellow-400 text-yellow-400" : "text-white/10"} />
                    ))}
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${partner.category === 'Vida Noturna' ? 'text-white/30' : 'text-gray-400'}`}>
                    Baseado em {partner.totalReviews} {partner.totalReviews === 1 ? 'avaliação' : 'avaliações'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Individual Reviews */}
          <div className="flex flex-col gap-6">
            {partner.reviews?.map((review) => (
              <div key={review.id} className={`p-6 border rounded-[24px] flex flex-col gap-4 relative shadow-sm ${
                partner.category === 'Vida Noturna' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-50'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#22c55e] flex items-center justify-center text-white text-xs font-black shadow-lg shadow-[#22c55e]/20">
                      {review.userName.charAt(0)}
                    </div>
                    <div>
                      <span className={`text-sm font-black block leading-none mb-1 ${partner.category === 'Vida Noturna' ? 'text-white' : 'text-gray-900'}`}>{review.userName}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${partner.category === 'Vida Noturna' ? 'text-white/20' : 'text-gray-400'}`}>Turista</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingReviewId === review.id ? (
                      <div className="flex items-center gap-1 mr-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} onClick={() => setEditingRating(s)}>
                            <Star size={14} className={s <= editingRating ? "fill-yellow-400 text-yellow-400" : "text-white/10"} />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={10} className={s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-white/10"} />
                        ))}
                      </div>
                    )}
                    
                    {user && user.id === review.userId && editingReviewId !== review.id && (
                      <div className="flex gap-1 ml-2">
                        <button 
                          onClick={() => {
                            setEditingReviewId(review.id);
                            setEditingRating(review.rating);
                            setEditingComment(review.comment);
                          }}
                          className="text-white/20 hover:text-[#22c55e] p-1 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm("Deseja excluir sua avaliação?")) {
                              deleteReview(review.id, partner.id);
                            }
                          }}
                          className="text-white/20 hover:text-red-500 p-1 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {editingReviewId === review.id ? (
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={editingComment}
                      onChange={(e) => setEditingComment(e.target.value)}
                      className={`w-full border rounded-xl p-3 text-xs outline-none focus:ring-1 transition-all ${
                        partner.category === 'Vida Noturna' ? 'bg-white/5 border-white/10 text-white focus:ring-[#22c55e]/30' : 'bg-gray-50 border-gray-100 text-gray-900'
                      }`}
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setEditingReviewId(null)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => {
                          updateReview(review.id, partner.id, editingRating, editingComment);
                          setEditingReviewId(null);
                        }}
                        className="px-4 py-1.5 rounded-lg bg-[#22c55e] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#22c55e]/20"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={`text-sm font-medium leading-relaxed ${partner.category === 'Vida Noturna' ? 'text-white/60' : 'text-gray-500'}`}>
                    {review.comment || <span className="italic opacity-30">Sem comentário</span>}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 right-6 flex flex-col items-end gap-3 z-50">
        {partner.show_reservation_button && (
          <button 
            onClick={() => setShowReservationModal(true)}
            className="bg-[#22c55e] text-white font-black px-6 py-4 rounded-full shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest text-[10px] border-4 border-white"
          >
            <Calendar size={18} />
            Reservar
          </button>
        )}
        
        <button 
          onClick={() => {
            const url = partner.whatsapp.startsWith('https://') ? partner.whatsapp : `https://wa.me/${partner.whatsapp.replace(/\D/g, '')}`;
            window.open(url, '_blank');
          }}
          className="w-14 h-14 bg-[#22c55e] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all border-4 border-white"
        >
          <MessageCircle size={28} />
        </button>
      </div>

      {/* Reservation Modal */}
      <AnimatePresence>
        {showReservationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#1E293B] w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="p-8 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-white leading-tight">Reservar Mesa</h3>
                  <p className="text-[#22c55e] text-[10px] font-black uppercase tracking-widest mt-1">Confirme seus dados</p>
                </div>
                <button 
                  onClick={() => setShowReservationModal(false)}
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 pt-4 space-y-5">
                {partner.reservation_options && partner.reservation_options.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-white/40 text-[10px] font-black uppercase tracking-widest pl-1">Escolha a Opção</label>
                    <select 
                      value={reservationForm.option}
                      onChange={(e) => setReservationForm({...reservationForm, option: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-[#22c55e]/20 transition-all outline-none"
                    >
                      <option value="" className="bg-[#1E293B]">Selecione uma opção</option>
                      {partner.reservation_options.map((opt, i) => (
                        <option key={i} value={`${opt.name} (${opt.price})`} className="bg-[#1E293B]">
                          {opt.name} - {opt.price}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-white/40 text-[10px] font-black uppercase tracking-widest pl-1">Data</label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22c55e]" />
                      <input 
                        type="date" 
                        value={reservationForm.date}
                        onChange={(e) => setReservationForm({...reservationForm, date: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-11 text-white text-xs focus:ring-2 focus:ring-[#22c55e]/20 transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-white/40 text-[10px] font-black uppercase tracking-widest pl-1">Horário</label>
                    <div className="relative">
                      <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22c55e]" />
                      <input 
                        type="time" 
                        value={reservationForm.time}
                        onChange={(e) => setReservationForm({...reservationForm, time: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-11 text-white text-xs focus:ring-2 focus:ring-[#22c55e]/20 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white/40 text-[10px] font-black uppercase tracking-widest pl-1">Número de Pessoas</label>
                  <div className="relative">
                    <Users size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22c55e]" />
                    <input 
                      type="number" 
                      min="1"
                      value={reservationForm.people}
                      onChange={(e) => setReservationForm({...reservationForm, people: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-11 text-white text-xs focus:ring-2 focus:ring-[#22c55e]/20 transition-all outline-none"
                      placeholder="Ex: 4"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white/40 text-[10px] font-black uppercase tracking-widest pl-1">Seu Nome</label>
                  <input 
                    type="text" 
                    value={reservationForm.name}
                    onChange={(e) => setReservationForm({...reservationForm, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs focus:ring-2 focus:ring-[#22c55e]/20 transition-all outline-none"
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white/40 text-[10px] font-black uppercase tracking-widest pl-1">Seu WhatsApp (opcional)</label>
                  <input 
                    type="tel" 
                    value={reservationForm.whatsapp}
                    onChange={(e) => setReservationForm({...reservationForm, whatsapp: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs focus:ring-2 focus:ring-[#22c55e]/20 transition-all outline-none"
                    placeholder="82 99999-9999"
                  />
                </div>

                <button 
                  onClick={handleConfirmReservation}
                  className="w-full bg-[#22c55e] text-white font-black py-5 rounded-[24px] shadow-2xl shadow-[#22c55e]/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-xs mt-4"
                >
                  Confirmar Reserva
                  <ArrowRight size={18} className="opacity-40" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PartnerDetails;