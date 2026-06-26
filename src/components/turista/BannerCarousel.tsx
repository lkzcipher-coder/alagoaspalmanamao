import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface PromotionalBanner {
  id: string;
  image_url: string;
  target_link: string | null;
}

const BannerCarousel: React.FC = () => {
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showControls, setShowControls] = useState<null | 'left' | 'right'>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPausedRef = useRef(false);

  const revealControl = (side: 'left' | 'right') => {
    setShowControls(side);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(null), 2500);
  };

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('promotional_banners')
          .select('id, image_url, target_link')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBanners(data || []);
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = banners.length - 1;
      if (nextIndex >= banners.length) nextIndex = 0;
      return nextIndex;
    });
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = setInterval(() => {
      if (!isPausedRef.current) paginate(1);
    }, 4000);

    return () => clearInterval(timer);
  }, [banners.length, paginate]);

  if (isLoading) {
    return (
      <div className="w-full aspect-[4/3] bg-gray-100 animate-pulse rounded-3xl flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
      </div>
    );
  }

  if (banners.length === 0) return null;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const handleBannerClick = (link: string | null) => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="relative w-full aspect-[4/3] overflow-hidden rounded-[32px] shadow-lg bg-gray-100 group select-none"
      style={{ WebkitTouchCallout: 'none' }}
      onPointerDown={() => { isPausedRef.current = true; }}
      onPointerUp={() => { isPausedRef.current = false; }}
      onPointerLeave={() => { isPausedRef.current = false; }}
      onPointerCancel={() => { isPausedRef.current = false; }}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="absolute inset-0 cursor-pointer select-none"
          onClick={() => handleBannerClick(banners[currentIndex].target_link)}
        >
          <img
            src={banners[currentIndex].image_url}
            alt={`Promo ${currentIndex + 1}`}
            className="w-full h-full object-cover select-none"
            draggable={false}
            style={{ WebkitTouchCallout: 'none' }}
          />
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <div
            className="absolute left-0 top-0 h-full w-1/5 z-[5] md:hidden"
            onClick={(e) => {
              e.stopPropagation();
              revealControl('left');
            }}
          />
          <div
            className="absolute right-0 top-0 h-full w-1/5 z-[5] md:hidden"
            onClick={(e) => {
              e.stopPropagation();
              revealControl('right');
            }}
          />
          <button
            aria-label="Banner anterior"
            className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/30 md:bg-white/20 backdrop-blur-md text-white transition-opacity md:opacity-0 md:group-hover:opacity-100 hover:bg-white/40 ${showControls === 'left' ? 'opacity-100' : 'opacity-0'}`}
            onClick={(e) => {
              e.stopPropagation();
              paginate(-1);
              revealControl('left');
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            aria-label="Próximo banner"
            className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/30 md:bg-white/20 backdrop-blur-md text-white transition-opacity md:opacity-0 md:group-hover:opacity-100 hover:bg-white/40 ${showControls === 'right' ? 'opacity-100' : 'opacity-0'}`}
            onClick={(e) => {
              e.stopPropagation();
              paginate(1);
              revealControl('right');
            }}
          >
            <ChevronRight size={20} />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {banners.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "bg-white w-4" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BannerCarousel;