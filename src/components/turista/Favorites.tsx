import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { MapPin, Star, Heart, ChevronRight } from 'lucide-react';
import PartnerDetails from './PartnerDetails';
import { Partner } from '@/types';

const Favorites: React.FC = () => {
  const { favorites, partners } = useApp();
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const favoritePartners = partners.filter(p => favorites.includes(p.id));

  return (
    <div className="pb-24 min-h-screen bg-[#fcfcfc]">
      {/* Header */}
      <div className="bg-[#00112c] pt-12 pb-16 px-6 rounded-b-[40px] text-white shadow-2xl mb-8">
        <h1 className="text-3xl font-black leading-tight">Meus <br /><span className="text-[#22c55e]">Favoritos</span></h1>
        <p className="text-white/50 text-sm mt-2 font-medium">Todos os lugares que você amou em um só lugar.</p>
      </div>

      <div className="px-6 space-y-6">
        {favoritePartners.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 pb-12">
            {favoritePartners.map((partner) => (
              <div 
                key={partner.id} 
                onClick={() => setSelectedPartner(partner)}
                className="group bg-white rounded-[32px] overflow-hidden shadow-md border border-gray-50 flex gap-4 p-3 active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="w-28 h-28 rounded-2xl overflow-hidden shrink-0">
                  <img src={partner.image} alt={partner.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex flex-col justify-center flex-1 pr-2">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-900 line-clamp-1">{partner.name}</h4>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-[10px] mb-2">
                    <MapPin size={10} />
                    <span className="line-clamp-1">{partner.location} • {partner.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-bold text-gray-900">{partner.rating}</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-[#22c55e] transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-200">
              <Heart size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nada por aqui ainda</h3>
            <p className="text-gray-500 font-medium px-10">Você ainda não salvou nenhum local. Economize em passeios, shows e restaurantes em Alagoas sendo VIP!</p>
          </div>
        )}
      </div>

      {selectedPartner && (
        <PartnerDetails 
          partner={selectedPartner} 
          onBack={() => setSelectedPartner(null)} 
        />
      )}
    </div>
  );
};

export default Favorites;
