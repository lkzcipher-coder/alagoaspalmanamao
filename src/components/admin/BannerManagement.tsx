import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, Trash2, Upload, Loader2, ExternalLink, Image as ImageIcon, Check, X, AlertCircle, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface PromotionalBanner {
  id: string;
  image_url: string;
  target_link: string | null;
  is_active: boolean;
  created_at: string;
}

const BannerManagement: React.FC = () => {
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBanner, setNewBanner] = useState({
    target_link: '',
    image_file: null as File | null,
    image_url: '',
    preview_url: '',
    uploadMode: 'file' as 'file' | 'link'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      console.error('Error fetching banners:', error);
      toast.error('Erro ao carregar banners: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewBanner(prev => ({
        ...prev,
        image_file: file,
        preview_url: URL.createObjectURL(file)
      }));
    }
  };

  const copyInstruction = () => {
    const text = "Crie a imagem no formato 1200x500, banner panorâmico horizontal com cantos arredondados.";
    navigator.clipboard.writeText(text);
    toast.success("Instrução copiada!");
  };

  const handleAddBanner = async () => {
    if (newBanner.uploadMode === 'file' && !newBanner.image_file) {
      toast.error('Selecione uma imagem para o banner');
      return;
    }

    if (newBanner.uploadMode === 'link' && !newBanner.image_url) {
      toast.error('Insira a URL da imagem');
      return;
    }

    setIsUploading(true);
    try {
      let finalImageUrl = newBanner.image_url;

      if (newBanner.uploadMode === 'file' && newBanner.image_file) {
        // 1. Upload image to storage
        const fileExt = newBanner.image_file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `banners/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('promotional-banners')
          .upload(filePath, newBanner.image_file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('promotional-banners')
          .getPublicUrl(filePath);
        
        finalImageUrl = publicUrl;
      }

      // 2. Save to database
      const { error: dbError } = await supabase
        .from('promotional_banners')
        .insert({
          image_url: finalImageUrl,
          target_link: newBanner.target_link || null,
          is_active: true
        });

      if (dbError) throw dbError;

      toast.success('Banner adicionado com sucesso!');
      setShowAddForm(false);
      setNewBanner({ 
        target_link: '', 
        image_file: null, 
        image_url: '', 
        preview_url: '', 
        uploadMode: 'file' 
      });
      fetchBanners();
    } catch (error: any) {
      console.error('Error adding banner:', error);
      toast.error('Erro ao adicionar banner: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleBannerStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promotional_banners')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      setBanners(banners.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
      toast.success(`Banner ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error: any) {
      console.error('Error toggling banner status:', error);
      toast.error('Erro ao alterar status do banner');
    }
  };

  const handleDeleteBanner = async (banner: PromotionalBanner) => {
    if (!window.confirm('Tem certeza que deseja excluir este banner?')) return;

    try {
      // 1. Delete from database
      const { error: dbError } = await supabase
        .from('promotional_banners')
        .delete()
        .eq('id', banner.id);

      if (dbError) throw dbError;

      // 2. Try to delete from storage if it's our bucket
      if (banner.image_url.includes('promotional-banners')) {
        const urlParts = banner.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await supabase.storage
          .from('promotional-banners')
          .remove([`banners/${fileName}`]);
      }

      setBanners(banners.filter(b => b.id !== banner.id));
      toast.success('Banner excluído com sucesso!');
    } catch (error: any) {
      console.error('Error deleting banner:', error);
      toast.error('Erro ao excluir banner');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-ocean">Gerenciar Banners</h2>
          <p className="text-sm text-gray-500">Adicione e gerencie os anúncios rotativos da tela inicial.</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-ocean hover:bg-ocean/90 text-white rounded-2xl px-6"
        >
          {showAddForm ? (
            <>
              <X className="mr-2 h-4 w-4" /> Cancelar
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" /> Novo Banner
            </>
          )}
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-2 border-dashed border-ocean/20 bg-ocean/5 rounded-[32px] overflow-hidden">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex bg-white/50 p-1 rounded-2xl border border-ocean/10">
                  <button
                    onClick={() => setNewBanner(prev => ({ ...prev, uploadMode: 'file' }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      newBanner.uploadMode === 'file' 
                        ? 'bg-ocean text-white shadow-lg' 
                        : 'text-ocean/60 hover:text-ocean'
                    }`}
                  >
                    Fazer Upload
                  </button>
                  <button
                    onClick={() => setNewBanner(prev => ({ ...prev, uploadMode: 'link' }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      newBanner.uploadMode === 'link' 
                        ? 'bg-ocean text-white shadow-lg' 
                        : 'text-ocean/60 hover:text-ocean'
                    }`}
                  >
                    Colar Link
                  </button>
                </div>

                {newBanner.uploadMode === 'file' ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-[21/9] bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-ocean/40 transition-all overflow-hidden relative group"
                  >
                    {newBanner.preview_url ? (
                      <>
                        <img src={newBanner.preview_url} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <Upload className="text-white h-8 w-8" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-gray-50 rounded-2xl mb-2">
                          <Upload className="text-gray-400 h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-500">Clique para carregar imagem</p>
                        <p className="text-[10px] text-gray-400 uppercase font-black mt-1">Recomendado: 1200x500px</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="image_url" className="text-sm font-bold text-ocean">URL da Imagem Externa</Label>
                      <Input 
                        id="image_url"
                        placeholder="https://images.unsplash.com/..."
                        value={newBanner.image_url}
                        onChange={(e) => setNewBanner(prev => ({ ...prev, image_url: e.target.value, preview_url: e.target.value }))}
                        className="rounded-2xl border-gray-200 focus:ring-ocean/20 h-12"
                      />
                    </div>
                    {newBanner.preview_url && (
                      <div className="aspect-[21/9] bg-white rounded-3xl border border-gray-100 overflow-hidden relative">
                        <img src={newBanner.preview_url} className="w-full h-full object-cover" alt="Preview" />
                        <button 
                          onClick={() => setNewBanner(prev => ({ ...prev, image_url: '', preview_url: '' }))}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-2 p-3 bg-white/50 rounded-2xl border border-ocean/10 group">
                  <p className="text-[11px] text-ocean/70 font-medium leading-tight">
                    Crie a imagem no formato 1200x500, banner panorâmico horizontal com cantos arredondados.
                  </p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={copyInstruction}
                    className="h-8 w-8 rounded-xl hover:bg-ocean/10 text-ocean shrink-0"
                    title="Copiar instrução"
                  >
                    <Copy size={14} />
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="target_link" className="text-sm font-bold text-ocean">Link de Destino (Opcional)</Label>
                  <Input 
                    id="target_link"
                    placeholder="https://exemplo.com/promocao"
                    value={newBanner.target_link}
                    onChange={(e) => setNewBanner(prev => ({ ...prev, target_link: e.target.value }))}
                    className="rounded-2xl border-gray-200 focus:ring-ocean/20 h-12"
                  />
                  <p className="text-[10px] text-gray-400">O usuário será redirecionado ao clicar no banner.</p>
                </div>

                <Button 
                  onClick={handleAddBanner}
                  disabled={isUploading || (newBanner.uploadMode === 'file' ? !newBanner.image_file : !newBanner.image_url)}
                  className="w-full bg-vibrant-green hover:bg-vibrant-green/90 text-white rounded-2xl h-14 font-black text-lg shadow-xl shadow-vibrant-green/20"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Salvando...
                    </>
                  ) : (
                    'Publicar Banner'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-ocean mb-4" />
          <p className="text-gray-500 font-medium">Carregando banners...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="text-gray-300 h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhum banner cadastrado</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mt-2">
            Comece adicionando seu primeiro banner promocional para exibir na tela inicial dos turistas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner) => (
            <div 
              key={banner.id}
              className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className="aspect-[21/9] relative group">
                <img src={banner.image_url} alt="Banner" className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg ${
                    banner.is_active ? 'bg-vibrant-green text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {banner.is_active ? (
                      <><Check size={12} strokeWidth={3} /> Ativo</>
                    ) : (
                      <><X size={12} strokeWidth={3} /> Inativo</>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                {banner.target_link && (
                  <div className="flex items-center gap-2 text-ocean mb-4 overflow-hidden">
                    <ExternalLink size={14} className="shrink-0" />
                    <span className="text-xs font-bold truncate">{banner.target_link}</span>
                  </div>
                )}
                
                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch 
                      checked={banner.is_active}
                      onCheckedChange={() => toggleBannerStatus(banner.id, banner.is_active)}
                    />
                    <span className="text-xs font-bold text-gray-500">
                      {banner.is_active ? 'Exibindo' : 'Oculto'}
                    </span>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteBanner(banner)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerManagement;