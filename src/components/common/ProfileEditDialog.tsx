import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileEditDialog: React.FC<ProfileEditDialogProps> = ({ open, onOpenChange }) => {
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
  }, [user, open]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    if (!name.trim()) {
      toast.error('O nome não pode estar vazio');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Perfil atualizado com sucesso!');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogTitle className="sr-only">Editar Perfil</DialogTitle>
        <DialogHeader className="p-8 pb-4 bg-gray-50/50">
          <DialogTitle className="text-xl font-black text-ocean flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ocean/10 flex items-center justify-center text-ocean">
              <User size={20} />
            </div>
            Editar Perfil
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleUpdateProfile} className="p-8 pt-4 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="font-bold text-gray-700">Nome de Usuário</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="rounded-xl border-gray-100 py-6"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-gray-700 opacity-50">E-mail (não alterável)</Label>
              <Input
                value={user?.email || ''}
                disabled
                className="rounded-xl border-gray-100 py-6 bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="rounded-xl border-gray-100 font-bold py-6">
                Cancelar
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-ocean hover:bg-ocean-deep text-white font-black py-6 rounded-xl shadow-xl shadow-ocean/10 flex items-center justify-center gap-2 flex-1"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Check size={18} />
              )}
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
