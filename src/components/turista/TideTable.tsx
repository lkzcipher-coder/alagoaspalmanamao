import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Waves, MapPin, Calendar, ArrowUp, ArrowDown, Lock, CheckCircle2, Star, Loader2, Info, Search, X, TrendingDown, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, isAfter, isBefore, addHours, subHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TideDayCard from './TideDayCard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const processTideData = (hourly: { time: string[]; sea_level_height_msl: number[] }) => {
  const times = hourly.time.map(t => new Date(t));
  const heights = hourly.sea_level_height_msl;
  const offset = 0.7; // Offset to convert MSL to approx nautical datum

  const hours = times.map((time, i) => ({ time, height: heights[i] + offset }));
  
  // Find all extremes in the entire dataset
  const allExtremes: { time: Date; height: number; type: 'high' | 'low' }[] = [];
  for (let i = 1; i < hours.length - 1; i++) {
    const prev = hours[i-1].height;
    const curr = hours[i].height;
    const next = hours[i+1].height;
    
    if (curr > prev && curr > next) {
      allExtremes.push({ time: hours[i].time, type: 'high', height: parseFloat(curr.toFixed(1)) });
    } else if (curr < prev && curr < next) {
      allExtremes.push({ time: hours[i].time, type: 'low', height: parseFloat(curr.toFixed(1)) });
    }
  }

  const dailyData: { date: Date; items: { time: Date; height: number; type: 'high' | 'low' }[] }[] = [];
  const startDate = new Date(times[0]);
  startDate.setHours(0,0,0,0);

  // We want to process 7 days (Today + 6 next days)
  for (let d = 0; d < 7; d++) {
    const currentDayStart = new Date(startDate);
    currentDayStart.setDate(startDate.getDate() + d);

    // Get the first 4 extremes that occur at or after currentDayStart
    // This ensures every day always has exactly 4 tide events
    const selected = allExtremes
      .filter(e => e.time >= currentDayStart)
      .slice(0, 4);

    dailyData.push({
      date: currentDayStart,
      items: selected
    });
  }

  return dailyData;
};

interface TideTableProps {
  isEmbedded?: boolean;
}

const TideTable: React.FC<TideTableProps> = ({ isEmbedded = false }) => {
  const { isUserPremium, setShowUpsell, serverDate, financialConfig, appSettings } = useApp();
  const [selectedDestId, setSelectedDestId] = useState<string>('');
  const [allTideData, setAllTideData] = useState<{ date: Date; items: { time: Date; height: number; type: 'high' | 'low' }[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const price = financialConfig?.vip_price ?? null;
  const loadingPrice = !financialConfig;
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationName, setLocationName] = useState('Maragogi - AL');
  const [coords, setCoords] = useState({ lat: -9.0122, lng: -35.2225 });
  const geocodingCache = useRef<Record<string, any>>({});
  
  // Regra de liberação: Janela de disponibilidade (Abertura e Fechamento)
  const openTime = appSettings?.tide_open_time || '00:00';
  const closeTime = appSettings?.tide_close_time || '23:59';
  
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);
  
  const currentTotalMinutes = serverDate.getHours() * 60 + serverDate.getMinutes();
  const openTotalMinutes = openHour * 60 + openMinute;
  const closeTotalMinutes = closeHour * 60 + closeMinute;
  
  const isTodayReleased = currentTotalMinutes >= openTotalMinutes && currentTotalMinutes <= closeTotalMinutes;

  const isVip = isUserPremium() || isEmbedded; 

  
  const fetchTideData = useCallback(async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=sea_level_height_msl&timezone=auto&forecast_days=8`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.hourly) {
        const processed = processTideData(data.hourly);
        
        // Validação: garantir que cada dia tenha exatamente 4 entradas (2 altas e 2 baixas)
        const validated = processed.filter(day => {
          const highCount = day.items.filter(i => i.type === 'high').length;
          const lowCount = day.items.filter(i => i.type === 'low').length;
          return day.items.length === 4 && highCount === 2 && lowCount === 2;
        });

        if (validated.length > 0) {
          setAllTideData(validated);
        } else {
          console.error("Dados de maré não passaram na validação de 4 entradas por dia", processed);
          toast.error("Não foi possível obter dados completos da maré (4 ciclos) para este local.");
          setAllTideData([]);
        }
      } else {
        toast.error("Não há dados de maré disponíveis para esta localização.");
      }
    } catch (err) {
      console.error("Error fetching tide data:", err);
      toast.error("Erro ao carregar dados da maré.");
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchTideData(coords.lat, coords.lng);
  }, [coords]);

  const performSearch = useCallback(async (query: string) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery || normalizedQuery.length < 3) return;

    // Verificar cache
    if (geocodingCache.current[normalizedQuery]) {
      const result = geocodingCache.current[normalizedQuery];
      setCoords({ lat: result.latitude, lng: result.longitude });
      setLocationName(`${result.name}${result.admin1 ? `, ${result.admin1}` : ''}`);
      setSearchQuery('');
      return;
    }

    try {
      setIsSearching(true);
      // Otimização da API: language=pt e count=5
      let url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=pt&format=json`;
      let response = await fetch(url);
      let data = await response.json();

      // Lógica de Fallback Duplo: se vazio, tenta com " Alagoas"
      if (!data.results || data.results.length === 0) {
        const fallbackQuery = `${query} Alagoas`;
        url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(fallbackQuery)}&count=5&language=pt&format=json`;
        response = await fetch(url);
        data = await response.json();
      }

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        // Guardar no cache
        geocodingCache.current[normalizedQuery] = result;
        
        setCoords({ lat: result.latitude, lng: result.longitude });
        setLocationName(`${result.name}${result.admin1 ? `, ${result.admin1}` : ''}`);
        setSearchQuery('');
      } else {
        toast.error("Local não encontrado. Tente outro nome.");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      toast.error("Erro ao buscar localização.");
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const todayData = useMemo(() => allTideData[0], [allTideData]);

  const bestTimeRange = useMemo(() => {
    if (!todayData) return null;
    const lowTidesInSunlight = todayData.items.filter(item => {
      const hour = item.time.getHours();
      return item.type === 'low' && item.height < 0.6 && hour >= 6 && hour <= 17;
    });

    if (lowTidesInSunlight.length === 0) {
      const anyLowInSunlight = todayData.items.filter(item => {
        const hour = item.time.getHours();
        return item.type === 'low' && hour >= 6 && hour <= 17;
      });
      if (anyLowInSunlight.length === 0) return null;
      
      const lowest = anyLowInSunlight.sort((a, b) => a.height - b.height)[0];
      const start = subHours(lowest.time, 1.5);
      const end = addHours(lowest.time, 1.5);
      return { start, end, label: `${format(start, 'HH:mm')} às ${format(end, 'HH:mm')}` };
    }

    const lowest = lowTidesInSunlight.sort((a, b) => a.height - b.height)[0];
    const start = subHours(lowest.time, 1.5);
    const end = addHours(lowest.time, 1.5);
    return { start, end, label: `${format(start, 'HH:mm')} às ${format(end, 'HH:mm')}` };
  }, [todayData]);

  const isOpenNow = useMemo(() => {
    if (!bestTimeRange) return false;
    return isAfter(serverDate, bestTimeRange.start) && isBefore(serverDate, bestTimeRange.end);
  }, [bestTimeRange, serverDate]);

  const nextDays = useMemo(() => allTideData.slice(1, 6), [allTideData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 animate-spin text-ocean mb-4" />
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Carregando marés...</p>
      </div>
    );
  }

  if (allTideData.length === 0) {
    return (
      <div className="p-8 text-center mt-20">
        <Waves className="w-16 h-16 text-ocean/10 mx-auto mb-4" />
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhum dado disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className={cn(!isEmbedded && "pb-32", "bg-[#F8FAFC] min-h-screen font-sans")}>
      <div 
        className="relative h-64 bg-cover bg-center flex flex-col items-center justify-center text-white px-6 overflow-hidden"
        style={{ backgroundImage: `url('https://fxkrpadnrdewpbfmawzo.supabase.co/storage/v1/object/public/FUDO%20TABUA%20DA%20MARE/TALBA%20DA%20MARE.png')` }}
      >
        <div className="absolute inset-0 bg-black/30 z-0" />
        <div className="relative z-10 w-full max-w-xs mx-auto text-center mb-10">
          <h1 className="text-2xl font-black tracking-tight mb-4">TÁBUA DA MARÉ</h1>
          
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={16} className="text-white/60 group-focus-within:text-white transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite a cidade (ex: Maceió, Maragogi)..."
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-3 pl-11 pr-12 text-sm font-bold placeholder:text-white/50 focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all text-white"
            />
            <div className="absolute inset-y-0 right-2 flex items-center gap-2">
              {isSearching ? (
                <Loader2 size={18} className="animate-spin text-white/60 mr-2" />
              ) : (
                <button 
                  type="submit"
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
                  aria-label="Pesquisar"
                >
                  <Search size={18} />
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center justify-center gap-1 mt-3 opacity-90">
            <MapPin size={12} className="text-white" />
            <span className="text-[11px] font-black uppercase tracking-wider">{locationName}</span>
          </div>
        </div>

        <div className="absolute -bottom-8 left-6 right-6 z-20">
          <div className={cn("rounded-2xl p-4 flex items-center justify-between shadow-xl border-b-4", isOpenNow ? "bg-[#D4F7E6] border-[#22C55E]/20" : "bg-gray-100 border-gray-300")}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/50">
                <img src="https://cdn-icons-png.flaticon.com/512/616/616492.png" alt="Palm Tree" className="w-8 h-8 opacity-80" />
              </div>
              <div>
                <h3 className={cn("font-black text-sm uppercase leading-none mb-1", isOpenNow ? "text-[#15803D]" : "text-gray-600")}>
                  {isOpenNow ? "PISCINAS NATURAIS ABERTAS AGORA" : "PISCINAS NATURAIS ENCOBERTAS"}
                </h3>
                <p className="text-[11px] font-bold text-gray-500">{isOpenNow ? "Ótimo momento para aproveitar!" : "Aguarde a maré baixar."}</p>
              </div>
            </div>
            {isOpenNow && (
              <div className="w-8 h-8 bg-[#22C55E] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#22C55E]/30">
                <CheckCircle2 size={18} strokeWidth={3} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pt-12 space-y-6">
        {!isUserPremium() ? (
          <div className="space-y-6">
            {/* Maré de Hoje ou Bloqueio por Horário */}
            {isTodayReleased ? (
              <TideDayCard 
                date={serverDate} 
                items={todayData.items} 
                isToday={true} 
                serverDate={serverDate} 
              />
            ) : (
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-lg font-black text-ocean uppercase">MARÉ DE HOJE</h2>
                  <Lock size={16} className="text-ocean shrink-0" />
                  <span className="bg-ocean text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ml-1 whitespace-nowrap">
                    RESTRITO
                  </span>
                </div>
                
                <div className="mb-6 bg-ocean/5 border border-ocean/10 p-5 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500 relative z-10">
                  <Info size={18} className="text-ocean shrink-0 mt-0.5" />
                  <p className="text-[11px] text-ocean font-bold leading-relaxed">
                    A maré de hoje estará disponível gratuitamente das <span className="text-sm font-black text-ocean">{openTime}</span> às <span className="text-sm font-black text-ocean">{closeTime}</span>. Para visualizar agora ou acessar os próximos dias, assine o Plano VIP.
                  </p>
                </div>

                <div className="absolute -right-4 top-8 pointer-events-none opacity-[0.05]">
                  <Lock size={140} className="text-gray-400" />
                </div>
                
                <div className="py-12 flex flex-col items-center justify-center text-gray-200 border-2 border-dashed border-gray-50 rounded-2xl">
                   <Lock size={48} className="mb-3 opacity-20 text-gray-400" />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Conteúdo Bloqueado</p>
                </div>
              </div>
            )}

            {/* Próximos Dias - Sempre Bloqueados para Grátis */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-6 flex-wrap sm:flex-nowrap">
                <h2 className="text-lg font-black text-ocean uppercase whitespace-nowrap">PRÓXIMOS DIAS</h2>
                <Lock size={16} className="text-ocean shrink-0" />
                <span className="bg-ocean text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ml-1 whitespace-nowrap">
                  EXCLUSIVO VIP
                </span>
              </div>

              <div className="absolute -right-4 top-8 pointer-events-none opacity-[0.05]">
                <Lock size={140} className="text-gray-400" />
              </div>

              <div className="space-y-0 relative z-10">
                {nextDays.map((day, idx) => (
                  <div key={idx} className={cn(
                    "flex items-center justify-between py-4 gap-2",
                    idx !== nextDays.length - 1 && "border-b border-gray-50"
                  )}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Calendar size={16} className="text-gray-500 shrink-0" />
                      <span className="text-sm font-bold text-[#475569] capitalize truncate">
                        {format(day.date, 'eeee, dd/MM', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400/60">
                      <Lock size={12} />
                      <span className="text-[11px] font-bold">Disponível para VIP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Visão VIP - Tudo Liberado */
          <div className="space-y-6">
            <TideDayCard 
              date={serverDate} 
              items={todayData.items} 
              isToday={true} 
              serverDate={serverDate} 
            />
            {nextDays.map((day, idx) => (
              <TideDayCard 
                key={idx}
                date={day.date}
                items={day.items}
                isPremium={true}
                serverDate={serverDate}
              />
            ))}
          </div>
        )}

        {!isUserPremium() && (
          <div className="bg-[#003B71] rounded-t-[32px] p-6 text-white shadow-2xl mt-6">
            <div className="grid grid-cols-[1fr_1.3fr] gap-4 mb-6">
              {/* Coluna da Esquerda (Preço) */}
              <div className="flex items-center gap-2">
                <Star size={36} fill="#FFD700" className="text-[#FFD700] shrink-0" />
                <div className="flex flex-col">
                  <p className="text-[8px] font-bold uppercase tracking-tight text-white/90 leading-tight">ASSINE O VIP POR APENAS</p>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-black text-[#FFD700] whitespace-nowrap">
                      {loadingPrice || price === null 
                        ? "R$ ..." 
                        : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}
                    </span>
                    <span className="text-[8px] font-bold text-white/90">/mês</span>
                  </div>
                </div>
              </div>
              
              {/* Coluna da Direita (Benefícios) */}
              <div className="flex flex-col gap-1.5 justify-center">
                {[
                  "Tábua da maré dos próximos dias",
                  "Melhores horários para piscinas naturais",
                  "Alertas de maré baixa",
                  "Informações atualizadas diariamente"
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <div className="bg-[#22C55E] rounded-full p-0.5 shrink-0 mt-0.5">
                      <CheckCircle2 size={8} className="text-white" strokeWidth={5} />
                    </div>
                    <span className="text-[9px] font-bold text-white leading-none">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botão Inferior */}
            <button 
              onClick={() => setShowUpsell(true)} 
              className="w-full bg-[#22C55E] hover:bg-[#1eb054] transition-colors py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-black/20"
            >
              <Lock size={18} fill="currentColor" /> DESBLOQUEAR PRÓXIMOS DIAS
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TideTable;