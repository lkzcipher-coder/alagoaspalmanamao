import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, Crown } from 'lucide-react';
import { Coupon } from '@/types';

interface CouponModalProps {
  coupon: Coupon | null;
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  isPremiumUser: boolean;
}

const CouponModal: React.FC<CouponModalProps> = ({ coupon, isOpen, onClose, onUpgrade, isPremiumUser }) => {
  if (!coupon) return null;

  const isLocked = coupon.isPremium && !isPremiumUser;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#00112c]/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6">
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center text-center">
              {isLocked ? (
                <>
                  <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-600 mb-6 shadow-xl border-4 border-white">
                    <Crown size={40} fill="currentColor" />
                  </div>

                  <h3 className="text-2xl font-black text-gray-900 mb-4 leading-tight">Benefício Exclusivo VIP!</h3>
                  <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                    Assine o plano Premium para liberar este desconto e economizar agora mesmo.
                  </p>

                  <button
                    onClick={() => {
                      onClose();
                      if (onUpgrade) onUpgrade();
                    }}
                    className="w-full bg-[#22c55e] text-white font-black py-5 rounded-2xl shadow-xl shadow-[#22c55e]/20 active:scale-[0.98] transition-all"
                  >
                    Assinar Agora
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-[#22c55e]/10 rounded-3xl flex items-center justify-center text-[#22c55e] mb-6">
                    <Ticket size={40} />
                  </div>
                  
                  <h3 className="text-2xl font-black text-gray-900 mb-2">{coupon.discount} OFF</h3>
                  <p className="font-bold text-gray-500 mb-6">{coupon.title}</p>
                  
                  <div className="w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-6 mb-6">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Seu código exclusivo</p>
                    <div className="bg-white border border-gray-100 rounded-2xl py-4 px-6 shadow-inner">
                      <span className="text-2xl font-black text-[#00112c] tracking-widest">{coupon.code || 'VIPALAGOAS'}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed max-w-[200px]">
                    Apresente este código no estabelecimento para garantir seu benefício.
                  </p>
                  
                  <button
                    onClick={onClose}
                    className="mt-8 w-full bg-[#00112c] text-white font-black py-5 rounded-2xl shadow-xl shadow-[#00112c]/20 active:scale-[0.98] transition-all"
                  >
                    Entendi
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CouponModal;
