import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Loader2, Check } from 'lucide-react';

interface PasswordChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PasswordChangeDialog: React.FC<PasswordChangeDialogProps> = ({ open, onOpenChange }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error('Erro ao alterar senha: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogTitle className="sr-only">Alterar Senha</DialogTitle>
        <DialogHeader className="p-8 pb-4 bg-gray-50/50">
          <DialogTitle className="text-xl font-black text-ocean flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ocean/10 flex items-center justify-center text-ocean">
              <Lock size={20} />
            </div>
            Trocar Senha
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handlePasswordChange} className="p-8 pt-4 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="font-bold text-gray-700">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="No mínimo 6 caracteres"
                className="rounded-xl border-gray-100 py-6"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="font-bold text-gray-700">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite novamente"
                className="rounded-xl border-gray-100 py-6"
                required
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
              {isLoading ? 'Salvando...' : 'Alterar Senha'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
