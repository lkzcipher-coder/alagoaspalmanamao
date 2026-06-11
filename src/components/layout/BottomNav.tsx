import React from 'react';
import { Home, Play, MapPin, Ticket, User, Heart, Waves, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { isUserPremium } = useApp();
  const isPremium = isUserPremium();
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'reels', icon: Play, label: 'Reels' },
    { id: 'map', icon: MapPin, label: 'Mapa' },
    { id: 'tide', icon: Waves, label: 'Marés' },
    { id: 'nightlife', icon: Music, label: 'Noite' },
    { id: 'coupons', icon: Ticket, label: 'VIP' },
    { id: 'favorites', icon: Heart, label: 'Favoritos' },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  const isReels = activeTab === 'reels';
  
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 px-6 py-3 flex justify-between items-center z-50 safe-area-bottom transition-all duration-300 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]",
      isReels ? "bg-[#00112c]/90 backdrop-blur-lg border-t border-white/10" : (isPremium ? "bg-black border-t border-white/10 shadow-[0_-4px_30px_rgba(251,191,36,0.1)]" : "bg-[#00112c] border-t border-white/5")
    )}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all active:scale-90",
              isActive 
                ? (isPremium ? "text-amber-400" : "text-[#22c55e]") 
                : "text-white/60 hover:text-white"
            )}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className={cn(
              "text-[10px] font-bold tracking-tight",
              isActive ? (isPremium ? "text-amber-400" : "text-[#22c55e]") : "text-white/60"
            )}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
