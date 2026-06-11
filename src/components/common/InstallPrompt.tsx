import React, { useState, useEffect } from 'react';
import { Smartphone, X, Share, PlusSquare, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { usePWA } from '@/hooks/usePWA';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const InstallPrompt = () => {
  const { isInstallable, isStandalone, isIOS, install } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isIOSModalOpen, setIsIOSModalOpen] = useState(false);

  useEffect(() => {
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsVisible(false);
      setIsIOSModalOpen(false);
      toast.success("✅ Aplicativo instalado! Verifique a tela inicial do seu celular.", {
        duration: 5000,
        icon: <CheckCircle2 className="text-[#22c55e]" />
      });
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    if (isStandalone) {
      setIsVisible(false);
      return () => window.removeEventListener('appinstalled', handleAppInstalled);
    }

    const isDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
    
    if (!isDismissed && (isInstallable || isIOS)) {
      setIsVisible(true);
    }

    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, [isInstallable, isStandalone, isIOS]);

  const handleInstallClick = () => {
    if (isIOS) {
      setIsIOSModalOpen(true);
    } else {
      install();
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!isVisible) return (
    <Dialog open={isIOSModalOpen} onOpenChange={setIsIOSModalOpen}>
      <IOSInstallInstructions onClose={() => setIsIOSModalOpen(false)} />
    </Dialog>
  );

  return (
    <>
      <div className="fixed top-4 left-4 right-4 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-[#00112c] text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between backdrop-blur-md bg-opacity-95">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl">
              <Smartphone className="w-5 h-5 text-[#22c55e]" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none mb-1 uppercase tracking-tight">ALAGOAS NA PALMA DA MÃO</p>
              <p className="text-[10px] opacity-90 leading-tight">
                {isIOS 
                  ? 'Toque para ver como instalar no seu iPhone' 
                  : 'Instale para uma experiência completa'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleInstallClick}
              className="text-xs h-9 bg-[#22c55e] text-white hover:bg-[#16a34a] font-black px-4 rounded-xl shadow-lg shadow-[#22c55e]/20"
            >
              {isIOS ? 'Instalar' : 'Instalar 📱'}
            </Button>
            <button 
              onClick={handleDismiss} 
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors ml-1"
            >
              <X className="w-4 h-4 opacity-70" />
            </button>
          </div>
        </div>
      </div>

      <Dialog open={isIOSModalOpen} onOpenChange={setIsIOSModalOpen}>
        <IOSInstallInstructions onClose={() => setIsIOSModalOpen(false)} />
      </Dialog>
    </>
  );
};

const IOSInstallInstructions = ({ onClose }: { onClose: () => void }) => (
  <DialogContent className="bg-[#00112c] border-white/10 text-white rounded-[32px] max-w-[90vw] sm:max-w-[400px]">
    <DialogTitle className="sr-only">Instalar Aplicativo</DialogTitle>
    <DialogHeader>
      <DialogTitle className="text-xl font-black text-center mb-4">Instalar no iPhone / iPad 📱</DialogTitle>
    </DialogHeader>
    <div className="space-y-6 py-4">
      <div className="flex items-start gap-4">
        <div className="bg-[#22c55e] w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
        <p className="text-sm">
          Toque no ícone de <span className="font-bold flex inline-flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg">Compartilhar <Share size={14} /></span> na barra inferior do Safari.
        </p>
      </div>
      
      <div className="flex items-start gap-4">
        <div className="bg-[#22c55e] w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
        <p className="text-sm">
          Role a lista de opções para baixo e toque em <span className="font-bold flex inline-flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg">Adicionar à Tela de Início <PlusSquare size={14} /></span>.
        </p>
      </div>

      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
        <p className="text-[10px] text-center text-white/60 uppercase font-bold tracking-widest">
          Pronto! O Alagoas na Palma da Mão aparecerá na sua tela inicial como um aplicativo nativo.
        </p>
      </div>
    </div>
    <button 
      onClick={onClose}
      className="w-full bg-[#22c55e] text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all mt-2"
    >
      Entendido
    </button>
  </DialogContent>
);

export default InstallPrompt;
