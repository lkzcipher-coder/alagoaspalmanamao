import React, { useState, useRef } from 'react';
import { LayoutDashboard, Users, Ticket, Play, Store, LogOut, Menu, Settings, MessageSquare, Bell, Lock, User, Camera, Loader2, Waves, DollarSign, Music, Image as ImageIcon, Compass, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PasswordChangeDialog } from '../common/PasswordChangeDialog';
import { ProfileEditDialog } from '../common/ProfileEditDialog';
import { ImageCropper } from '../common/ImageCropper';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';


interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  unreadNotificationsCount?: number;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, setActiveTab, unreadNotificationsCount }) => {
  const { user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const fileName = `${user.id}/${Math.random()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedImage, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('Foto de perfil atualizada!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao carregar imagem: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: Bell, label: 'Notificações', id: 'notifications', badge: unreadNotificationsCount },
    { icon: DollarSign, label: 'Financeiro', id: 'financial' },
    { icon: ImageIcon, label: 'Banners', id: 'banners' },
    { icon: Waves, label: 'Aparência', id: 'appearance' },
    { icon: Lock, label: 'Configuração Tábua de Marés', id: 'access-rules' },
    { icon: Waves, label: 'Tábua de Marés (Dados)', id: 'tides-data' },
    { icon: Store, label: 'Parceiros', id: 'partners' },
    { icon: Music, label: 'Vida Noturna', id: 'nightlife' },
    { icon: Ticket, label: 'Cupons', id: 'coupons' },
    { icon: Users, label: 'Usuários', id: 'users' },
    { icon: Compass, label: 'Roteiros VIP', id: 'roteiros' },
    { icon: Calendar, label: 'Eventos VIP', id: 'eventos' },
    { icon: Play, label: 'Vídeos', id: 'videos' },
    
    { icon: Settings, label: 'Configurações VIP', id: 'vip-settings' },
    { icon: MessageSquare, label: 'Contato e Suporte', id: 'general-settings' },
  ];

  const handleItemClick = (id: string) => {
    if (setActiveTab) {
      setActiveTab(id);
    } else {
      navigate({ to: '/admin' });
    }
    setOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-8 border-b border-gray-100">
        <h1 className="text-xl font-black text-ocean">Alagoas Admin</h1>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Gestão de Experiência</p>
      </div>

      <nav className="flex-1 p-6 flex flex-col gap-1.5 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all text-left",
              activeTab === item.id
                ? "bg-ocean text-white shadow-xl shadow-ocean/10"
                : "text-gray-500 hover:bg-gray-50 hover:text-ocean"
            )}
          >
            <item.icon size={18} className={cn(activeTab === item.id ? "text-white" : "text-gray-400")} />
            <span className="flex-1">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="bg-vibrant-green text-white text-[10px] font-black px-2 py-1 rounded-full min-w-[20px] text-center">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-gray-100 bg-gray-50/30">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="relative group shrink-0">
            <div className="w-12 h-12 rounded-xl bg-ocean flex items-center justify-center text-white font-black text-sm shadow-inner overflow-hidden border-2 border-white">
              {isUploading ? (
                <Loader2 className="animate-spin text-white w-4 h-4" />
              ) : user?.avatarUrl ? (
                <img src={user.avatarUrl} className="w-full h-full object-cover" alt="Admin" />
              ) : (
                user?.email?.charAt(0).toUpperCase() || 'A'
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-vibrant-green border-2 border-white rounded-lg flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
            >
              <Camera size={10} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
          </div>
          <div className="overflow-hidden flex-1">
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="text-sm font-black text-ocean truncate leading-none mb-1 hover:text-vibrant-green transition-colors text-left w-full"
            >
              {user?.name || user?.email?.split('@')[0]}
            </button>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Administrador</p>
          </div>
        </div>
        <button
          onClick={() => setIsPasswordModalOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-ocean hover:bg-ocean/5 transition-all text-left mb-1 group"
        >
          <Lock size={18} className="text-ocean/40 group-hover:text-ocean transition-colors" />
          Trocar Senha
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all text-left group"
        >
          <LogOut size={18} className="text-red-400 group-hover:text-red-500 transition-colors" />
          Sair do Painel
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-gray-200 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-3 bg-white rounded-2xl shadow-xl border border-gray-100 text-ocean active:scale-95 transition-all">
              <Menu size={24} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-none">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 lg:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <PasswordChangeDialog 
        open={isPasswordModalOpen} 
        onOpenChange={setIsPasswordModalOpen} 
      />
      <ProfileEditDialog 
        open={isProfileModalOpen} 
        onOpenChange={setIsProfileModalOpen} 
      />
      {selectedImage && (
        <ImageCropper
          image={selectedImage}
          onCropComplete={uploadAvatar}
          onCancel={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};


export default AdminLayout;
