import React from 'react';
import { format, subHours, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ArrowDown, Star } from 'lucide-react';

export interface TideEntry {
  time: Date;        // exact datetime built from tide_date + tide_time
  timeLabel: string; // raw "HH:MM" from Supabase, rendered as-is
  height: number;    // raw height from Supabase
}

interface TideDayCardProps {
  date: Date;
  entry: TideEntry | null;
  isPremium?: boolean;
  isToday?: boolean;
  serverDate: Date;
}

const TideDayCard: React.FC<TideDayCardProps> = ({ date, entry, isToday = false }) => {
  const bestTimeRange = React.useMemo(() => {
    if (!entry) return null;
    const start = subHours(entry.time, 1.5);
    const end = addHours(entry.time, 1.5);
    return { label: `${format(start, 'HH:mm')} às ${format(end, 'HH:mm')}` };
  }, [entry]);

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black text-ocean uppercase">
            {isToday ? "MARÉ DE HOJE" : `MARÉ DE ${format(date, 'eeee', { locale: ptBR })}`}
          </h2>
          {isToday ? (
            <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider">GRÁTIS</span>
          ) : (
             <span className="bg-ocean text-white text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider">PREMIUM</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-gray-400">
          <Calendar size={14} />
          <span className="text-xs font-bold">{format(date, "dd/MM", { locale: ptBR })}</span>
        </div>
      </div>

      {entry ? (
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
              <ArrowDown size={24} strokeWidth={3} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Horário de Chegada</span>
              <span className="text-base font-black text-blue-600">Maré Baixa</span>
            </div>
          </div>
          <div className="flex items-end justify-center gap-4">
            <span className="text-5xl font-black text-ocean tracking-tight tabular-nums">
              {entry.timeLabel}
            </span>
            <span className="text-3xl font-black text-gray-300 pb-1">|</span>
            <span className="text-5xl font-black text-blue-600 tracking-tight tabular-nums pb-0">
              {String(entry.height).replace('.', ',')}m
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400 text-sm font-bold">
          Horários indisponíveis no momento.
        </div>
      )}

      <div className="mt-6 bg-[#0055FF] rounded-2xl p-4 flex items-center justify-between text-white shadow-lg shadow-blue-500/20">
        <div className="flex items-center gap-2">
          <Star size={18} fill="currentColor" className="text-white" />
          <span className="text-[13px] font-bold">Melhor horário para passeio:</span>
        </div>
        <div className="bg-white/20 px-4 py-1.5 rounded-xl font-black text-sm">
          {bestTimeRange?.label || "--:--"}
        </div>
      </div>
    </div>
  );
};

export default TideDayCard;