import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Partner } from '@/types';
import { Search, MapPin, Star, Music, ChevronRight, Loader2 } from 'lucide-react';
import PartnerDetails from './PartnerDetails';
import { isPartnerOpen } from '@/lib/operating-hours';

const Nightlife: React.FC = () => {
  const { partners, isLoading } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const [activeCategory, setActiveCategory] = useState('Todos');
  const nightlifePartners = partners.filter(p => p.category === 'Vida Noturna');

  const categories = ['Todos', 'Bares', 'Restaurantes', 'Shows'];

  const filteredPartners = nightlifePartners.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = activeCategory === 'Todos' || 
      (p.nightlife_type && p.nightlife_type.toLowerCase() === activeCategory.toLowerCase()) ||
      (activeCategory === 'Shows' && p.nightlife_type === 'Show');

    return matchesSearch && matchesCategory;
  });

  if (selectedPartner) {
    return <PartnerDetails partner={selectedPartner} onBack={() => setSelectedPartner(null)} />;
  }

  return (
    <div className="pb-24 bg-[#0F172A] min-h-screen text-white">
      {/* Header */}
      <div className="bg-[#1E293B] pt-12 pb-16 px-6 rounded-b-[40px] shadow-2xl relative mb-8 border-b border-white/5">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-white leading-tight mb-2">
            Shows & <span className="text-[#22c55e]">Vida Noturna</span>
          </h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Os melhores picos de Alagoas</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto z-10">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 bg-white/5 p-1.5 rounded-xl">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Buscar bar, show ou evento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F172A]/60 backdrop-blur-xl border border-white/10 rounded-3xl py-5 pl-14 pr-4 text-sm font-medium shadow-2xl focus:ring-4 focus:ring-[#22c55e]/20 transition-all outline-none text-white placeholder:text-white/20"
          />
        </div>
      </div>

      <div className="px-6">
        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-10 pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                activeCategory === cat 
                  ? 'bg-[#22c55e] border-[#22c55e] text-white shadow-lg shadow-[#22c55e]/20 scale-105' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#22c55e] mb-4" />
            <p className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Buscando picos...</p>
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
              <Music size={32} className="text-white/20" />
            </div>
            <p className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Nenhum pico encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {filteredPartners.map((partner) => (
              <div 
                key={partner.id} 
                onClick={() => setSelectedPartner(partner)}
                className="group relative bg-[#1E293B] rounded-[32px] overflow-hidden shadow-2xl border border-white/5 transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="aspect-[16/9] overflow-hidden relative">
                  <img src={partner.image} alt={partner.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] via-transparent to-transparent opacity-60" />

                  {partner.nightlife_type && (
                    <div className="absolute top-4 left-4 bg-[#22c55e] text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                      {partner.nightlife_type}
                    </div>
                  )}

                  {partner.totalReviews > 0 && (
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-xl flex items-center gap-1 border border-white/20 shadow-xl">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-black text-white">{partner.rating}</span>
                    </div>
                  )}
                  
                  {partner.isPremium && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150 opacity-10 pointer-events-none">
                      <Music size={120} />
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-black text-xl text-white leading-tight mb-1">{partner.name}</h4>
                      <div className="flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest">
                        <MapPin size={10} className="text-[#22c55e]" />
                        <span>{partner.location}</span>
                      </div>
                    </div>
                    {partner.price && (
                      <span className="text-[#22c55e] font-black text-lg">{partner.price}</span>
                    )}
                  </div>
                  
                  <p className="text-white/60 text-xs leading-relaxed mb-6 line-clamp-2 font-medium">
                    {partner.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      {partner.operating_hours && (
                        <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-black uppercase tracking-widest">
                          <span className={`w-1.5 h-1.5 rounded-full ${isPartnerOpen(partner.operating_hours) ? 'bg-[#22c55e]' : 'bg-red-500'}`} />
                          {partner.operating_hours}
                          <span className={`ml-2 ${isPartnerOpen(partner.operating_hours) ? 'text-[#22c55e]' : 'text-red-500'}`}>
                            ({isPartnerOpen(partner.operating_hours) ? 'Aberto' : 'Fechado'})
                          </span>
                        </div>
                      )}
                    </div>
                    <button className="bg-[#22c55e] hover:bg-[#1eb054] text-white text-[10px] font-black px-6 py-2.5 rounded-full uppercase tracking-widest shadow-lg shadow-[#22c55e]/20 transition-all flex items-center gap-2">
                      Ver Mais
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Nightlife;
