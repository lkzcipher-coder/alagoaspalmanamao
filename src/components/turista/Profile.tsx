import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Settings, LogOut, ChevronRight, User, Heart, HelpCircle, LayoutDashboard, Star, MapPin, Smartphone, Camera, Loader2, Lock, Crown, Share, PlusSquare, X } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '@/hooks/usePWA';
import PartnerDetails from './PartnerDetails';
import { Partner } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ImageCropper } from '../common/ImageCropper';
import { PasswordChangeDialog } from '../common/PasswordChangeDialog';
import { ProfileEditDialog } from '../common/ProfileEditDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ProfileProps {
  setActiveTab?: (tab: string) => void;
}

const Profile: React.FC<ProfileProps> = ({ setActiveTab }) => {
  const { isPremiumUser, isUserPremium, favorites, partners } = useApp();
  const { user, logout, refreshProfile } = useAuth();
  const { isInstallable, isStandalone, isIOS, install } = usePWA();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isIOSModalOpen, setIsIOSModalOpen] = useState(false);

  const handleInstallClick = () => {
    if (isIOS) {
      setIsIOSModalOpen(true);
    } else {
      install();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setSelectedImage(reader.result as string);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const uploadAvatar = async (croppedImage: Blob) => {
    if (!user) return;
    
    setIsUploading(true);
    setSelectedImage(null);
    
    try {
      const fileExt = 'jpg';
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload image
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedImage, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('Foto de perfil atualizada com sucesso!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao carregar imagem: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const favoritePartners = partners.filter(p => favorites.includes(p.id));

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  const menuItems = [
    { icon: User, label: 'Meus Dados', action: () => setIsProfileModalOpen(true) },
    { icon: Settings, label: 'Configurações', action: () => setIsPasswordModalOpen(true) },
    { icon: Heart, label: 'Favoritos', action: () => setActiveTab?.('favorites') },
  ];

  return (
    <div className={cn("pb-24 min-h-screen", isUserPremium() ? "bg-black" : "bg-[#fcfcfc]")}>
      {/* Header */}
      <div className={cn("pt-12 pb-24 px-6 rounded-b-[40px] text-white shadow-2xl", isUserPremium() ? "bg-[#00112c]" : "bg-[#00112c]")}>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl border-4 border-white/20 overflow-hidden bg-white/10 relative shadow-xl">
                {isUploading ? (
                  <div className="w-full h-full flex items-center justify-center bg-black/20">
                    <Loader2 className="animate-spin text-white" />
                  </div>
                ) : (
                  <img 
                    src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=random`}
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                )}
              </div>
              {isUserPremium() && (
                <div className="absolute -top-6 -right-2 z-10 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] animate-bounce-subtle">
                  <Crown size={28} className="text-amber-400 fill-amber-400 rotate-[15deg]" />
                </div>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#22c55e] border-2 border-[#00112c] rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform hover:bg-[#1eb054]"
            >
              <Camera size={14} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageSelect} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold">{user?.name || 'Visitante'}</h2>
            <div className="flex items-center gap-2">
              {isUserPremium() ? (
                <span className={cn("text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg", isUserPremium() ? "bg-amber-500 shadow-amber-500/20" : "bg-[#22c55e] shadow-[#22c55e]/20")}>
                  Membro Premium
                </span>
              ) : (
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Conta Gratuita
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-12 space-y-4">
        {/* Menu Items */}
        <div className={cn("rounded-[32px] p-4 shadow-sm border flex flex-col", isUserPremium() ? "bg-white/5 border-white/10" : "bg-white border-gray-100")}>
          {menuItems.map((item, i) => (
            <button 
              key={i} 
              onClick={item.action}
              className={`w-full flex items-center justify-between py-4 ${i !== menuItems.length - 1 ? (isUserPremium() ? 'border-b border-white/5' : 'border-b border-gray-50') : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                  <item.icon size={20} />
                </div>
                <span className={cn("font-bold", isUserPremium() ? "text-white" : "text-gray-700")}>{item.label}</span>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </button>
          ))}
        </div>
        
        {/* PWA Install Button (Only if not installed) */}
        {!isStandalone && (
          <div className="bg-[#00112c] rounded-[32px] p-5 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#22c55e]/10 rounded-full blur-2xl" />
            <button 
              onClick={handleInstallClick}
              disabled={!isInstallable && !isIOS}
              className={`w-full flex items-center justify-between py-2 ${(!isInstallable && !isIOS) ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Smartphone size={20} className="text-[#22c55e]" />
                </div>
                <div className="text-left">
                  <span className="font-bold block">Instalar Aplicativo 📱</span>
                  <span className="text-[10px] text-white/70">Acesse Alagoas na Palma da Mão na sua tela inicial</span>
                </div>
              </div>
              {(isInstallable || isIOS) && (
                <div className="bg-[#22c55e] text-white font-black text-[10px] px-4 py-1.5 rounded-full uppercase shadow-lg shadow-[#22c55e]/20">
                  {isIOS ? 'Como Instalar' : 'Instalar'}
                </div>
              )}
            </button>
          </div>
        )}

        {/* Admin Section (only for admins) */}
        {user?.role === 'admin' && (
          <div className="bg-white rounded-[32px] p-4 shadow-sm border border-gray-100 mt-6">
            <button 
              onClick={() => navigate({ to: '/' })}
              className="w-full flex items-center justify-between py-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#00112c]/5 rounded-xl flex items-center justify-center text-[#00112c]">
                  <LayoutDashboard size={20} />
                </div>
                <div>
                  <span className="font-bold text-gray-700 block text-left">Painel Administrativo</span>
                  <span className="text-[10px] text-gray-400 font-medium">Gestão de parceiros e conteúdo</span>
                </div>
              </div>
              <div className="bg-[#22c55e]/10 px-3 py-1 rounded-full text-[#22c55e] font-black text-[10px] uppercase">
                Acessar
              </div>
            </button>
          </div>
        )}

        {/* Sign Out */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-5 text-red-500 font-bold active:scale-95 transition-transform"
        >
          <LogOut size={20} />
          Sair do Aplicativo
        </button>
      </div>


      {selectedImage && (
        <ImageCropper
          image={selectedImage}
          onCropComplete={uploadAvatar}
          onCancel={() => setSelectedImage(null)}
        />
      )}
      
      <PasswordChangeDialog 
        open={isPasswordModalOpen} 
        onOpenChange={setIsPasswordModalOpen} 
      />
      <ProfileEditDialog
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
      />

      <Dialog open={isIOSModalOpen} onOpenChange={setIsIOSModalOpen}>
        <DialogContent className="bg-[#00112c] border-white/10 text-white rounded-[32px] max-w-[90vw] sm:max-w-[400px]">
          <DialogTitle className="sr-only">Plano Premium</DialogTitle>
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
            onClick={() => setIsIOSModalOpen(false)}
            className="w-full bg-[#22c55e] text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all mt-2"
          >
            Entendido
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;

