import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Waves, MapPin, Calendar, Lock, CheckCircle2, Star, Loader2, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, isAfter, isBefore, addHours, subHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TideDayCard, { TideEntry } from './TideDayCard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DayBucket {
  date: Date;
  dateKey: string; // yyyy-MM-dd
  entry: TideEntry | null;
}

interface TideTableProps {
  isEmbedded?: boolean;
}

const TideTable: React.FC<TideTableProps> = ({ isEmbedded = false }) => {
  const { isUserPremium, setShowUpsell, serverDate, financialConfig, appSettings } = useApp();
  const [allTideData, setAllTideData] = useState<DayBucket[]>([]);
  const [loading, setLoading] = useState(true);
  // Fallback imediato (caso RLS/erro bloqueie o fetch público)
  const FALLBACK_OPEN = '10:00';
  const FALLBACK_CLOSE = '23:00';
  const [accessWindow, setAccessWindow] = useState<{ open: string; close: string }>({
    open: appSettings?.tide_open_time || FALLBACK_OPEN,
    close: appSettings?.tide_close_time || FALLBACK_CLOSE,
  });
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const price = financialConfig?.vip_price ?? null;
  const loadingPrice = !financialConfig;
  const locationName = 'Paripueira - AL';

  // Sync from context when it loads/changes
  useEffect(() => {
    if (appSettings?.tide_open_time || appSettings?.tide_close_time) {
      setAccessWindow({
        open: appSettings.tide_open_time || FALLBACK_OPEN,
        close: appSettings.tide_close_time || FALLBACK_CLOSE,
      });
    }
  }, [appSettings?.tide_open_time, appSettings?.tide_close_time]);

  // Fetch direto do Supabase (cache-bust) para garantir frescor das regras
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('tide_open_time, tide_close_time')
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        // RLS/erro → mantém fallback frontend (10:00–23:00)
        console.warn('[TideTable] usando fallback de horários', error);
        return;
      }
      setAccessWindow({
        open: (data as any).tide_open_time || FALLBACK_OPEN,
        close: (data as any).tide_close_time || FALLBACK_CLOSE,
      });
    })();
    return () => { cancelled = true; };
  }, []);

  const openTime = accessWindow.open;
  const closeTime = accessWindow.close;

  // Normalização YYYY-MM-DD usando partes locais (timezone-safe)
  const toDayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const toMinutes = (hhmm: string): number => {
    const [h, m] = String(hhmm).split(':').map((n) => parseInt(n, 10) || 0);
    return h * 60 + m;
  };

  // Estado reativo: recalcula sempre que a janela ou a hora mudarem
  useEffect(() => {
    const todayKey = toDayKey(new Date());
    const serverKey = toDayKey(serverDate);
    const sameDay = todayKey === serverKey;
    const currentMin = serverDate.getHours() * 60 + serverDate.getMinutes();
    const openMin = toMinutes(openTime);
    const closeMin = toMinutes(closeTime);
    const withinWindow = currentMin >= openMin && currentMin <= closeMin;
    setIsLocked(!(sameDay && withinWindow));
  }, [openTime, closeTime, serverDate]);

  const isTodayReleased = !isLocked;

  const isVip = isUserPremium() || isEmbedded;


  const fetchTideData = useCallback(async () => {
    try {
      setLoading(true);
      // Build 7 day buckets starting from today (serverDate)
      const start = new Date(serverDate);
      start.setHours(0, 0, 0, 0);
      const buckets: DayBucket[] = [];
      for (let d = 0; d < 7; d++) {
        const dt = new Date(start);
        dt.setDate(start.getDate() + d);
        buckets.push({ date: dt, dateKey: format(dt, 'yyyy-MM-dd'), entry: null });
      }
      const startKey = buckets[0].dateKey;
      const endKey = buckets[buckets.length - 1].dateKey;

      const { data, error } = await supabase
        .from('tides_data')
        .select('tide_date, tide_time, height')
        .gte('tide_date', startKey)
        .lte('tide_date', endKey);

      if (error) {
        console.error(error);
        toast.error('Erro ao carregar marés.');
      } else if (data) {
        const byDate = new Map<string, { tide_time: string; height: number }>();
        data.forEach((row: any) => byDate.set(row.tide_date, { tide_time: row.tide_time, height: row.height }));
        buckets.forEach(b => {
          const row = byDate.get(b.dateKey);
          if (row) {
            const timeLabel = String(row.tide_time).slice(0, 5);
            const [hh, mm] = timeLabel.split(':').map(Number);
            const dt = new Date(b.date);
            dt.setHours(hh, mm, 0, 0);
            b.entry = { time: dt, timeLabel, height: Number(row.height) };
          }
        });
      }
      setAllTideData(buckets);
    } finally {
      setLoading(false);
    }
  }, [serverDate]);

  useEffect(() => { fetchTideData(); }, [fetchTideData]);

  const todayData = useMemo(() => allTideData[0], [allTideData]);

  const bestTimeRange = useMemo(() => {
    if (!todayData?.entry) return null;
    const start = subHours(todayData.entry.time, 1.5);
    const end = addHours(todayData.entry.time, 1.5);
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
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Horários indisponíveis no momento.</p>
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
          <h1 className="text-2xl font-black tracking-tight mb-4">Tabela de Marés - Paripueira</h1>
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
                entry={todayData?.entry ?? null}
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
              entry={todayData?.entry ?? null}
              isToday={true} 
              serverDate={serverDate} 
            />
            {nextDays.map((day, idx) => (
              <TideDayCard 
                key={idx}
                date={day.date}
                entry={day.entry}
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
