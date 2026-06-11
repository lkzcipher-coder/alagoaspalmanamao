import React from 'react';
import { format, subHours, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ArrowDown, ArrowUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TideItem {
  time: Date;
  height: number;
  type: 'high' | 'low';
}

interface TideDayCardProps {
  date: Date;
  items: TideItem[];
  isPremium?: boolean;
  isToday?: boolean;
  serverDate: Date;
}

const TideDayCard: React.FC<TideDayCardProps> = ({ date, items, isPremium = false, isToday = false, serverDate }) => {
  const bestTimeRange = React.useMemo(() => {
    const lowTidesInSunlight = items.filter(item => {
      const hour = item.time.getHours();
      return item.type === 'low' && item.height < 0.6 && hour >= 6 && hour <= 17;
    });

    let lowest;
    if (lowTidesInSunlight.length === 0) {
      const anyLowInSunlight = items.filter(item => {
        const hour = item.time.getHours();
        return item.type === 'low' && hour >= 6 && hour <= 17;
      });
      if (anyLowInSunlight.length === 0) return null;
      lowest = anyLowInSunlight.sort((a, b) => a.height - b.height)[0];
    } else {
      lowest = lowTidesInSunlight.sort((a, b) => a.height - b.height)[0];
    }

    const start = subHours(lowest.time, 1.5);
    const end = addHours(lowest.time, 1.5);
    return { start, end, label: `${format(start, 'HH:mm')} às ${format(end, 'HH:mm')}` };
  }, [items]);

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

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", item.type === 'low' ? "bg-blue-600 text-white" : "bg-green-600 text-white")}>
                {item.type === 'low' ? <ArrowDown size={16} strokeWidth={3} /> : <ArrowUp size={16} strokeWidth={3} />}
              </div>
              <span className={cn("font-bold", item.type === 'low' ? "text-blue-600" : "text-green-600")}>
                Maré {item.type === 'low' ? 'Baixa' : 'Alta'}
              </span>
            </div>
            <div className="flex items-center gap-8">
              <span className="text-lg font-black text-ocean">{format(item.time, 'HH:mm')}</span>
              <span className={cn("text-lg font-black min-w-[45px] text-right", item.type === 'low' ? "text-blue-600" : "text-green-600")}>
                {item.height.toFixed(1).replace('.', ',')}m
              </span>
            </div>
          </div>
        ))}
      </div>

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