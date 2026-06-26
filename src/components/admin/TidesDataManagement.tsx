import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { Upload, Plus, Info, Trash2, Save, Loader2, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parse } from 'date-fns';

interface TideRow {
  tide_date: string; // YYYY-MM-DD
  tide_time: string; // HH:MM
  height: number;
}

interface DbTideRow extends TideRow {
  id: string;
}

const parseDate = (s: string): string | null => {
  const t = s.trim();
  // DD/MM/YYYY
  const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  return null;
};

const parseHeight = (s: string): number | null => {
  const cleaned = s.replace(/m/gi, '').replace(',', '.').trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
};

const TidesDataManagement: React.FC = () => {
  const [existing, setExisting] = useState<DbTideRow[]>([]);
  const [preview, setPreview] = useState<TideRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ tide_date: '', tide_time: '', height: '' });

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tides_data')
      .select('id, tide_date, tide_time, height')
      .order('tide_date', { ascending: true });
    if (error) toast.error('Erro ao carregar marés: ' + error.message);
    else setExisting((data || []) as DbTideRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const rows: TideRow[] = [];
        const errors: string[] = [];
        (results.data as string[][]).forEach((raw, idx) => {
          if (!raw || raw.length < 3) return;
          // Skip header
          if (idx === 0 && /data/i.test(raw[0])) return;
          const date = parseDate(raw[0] || '');
          const time = (raw[1] || '').trim().slice(0, 5);
          const height = parseHeight(raw[2] || '');
          if (!date || !/^\d{2}:\d{2}$/.test(time) || height === null) {
            errors.push(`Linha ${idx + 1} inválida: ${raw.join(', ')}`);
            return;
          }
          rows.push({ tide_date: date, tide_time: time, height });
        });
        if (errors.length) toast.warning(`${errors.length} linha(s) ignorada(s).`);
        if (rows.length === 0) toast.error('Nenhuma linha válida no CSV.');
        setPreview(rows);
      },
      error: (err) => toast.error('Erro lendo CSV: ' + err.message),
    });
    e.target.value = '';
  };

  const saveBatch = async () => {
    if (preview.length === 0) return;
    setSaving(true);
    // Dedup by tide_date — keep last occurrence
    const map = new Map<string, TideRow>();
    preview.forEach((r) => map.set(r.tide_date, r));
    const deduped = Array.from(map.values());
    const removed = preview.length - deduped.length;
    if (removed > 0) toast.warning(`${removed} data(s) duplicada(s) ignorada(s).`);
    const { error } = await supabase
      .from('tides_data')
      .upsert(deduped, { onConflict: 'tide_date' });
    setSaving(false);
    if (error) {
      console.error('Upsert tides error:', error);
      return toast.error('Erro ao salvar. Verifique se o formato da data está correto.');
    }
    toast.success(`${deduped.length} dia(s) salvos.`);
    setPreview([]);
    fetchData();
  };

  const saveManual = async () => {
    const height = parseHeight(manualForm.height);
    if (!manualForm.tide_date || !manualForm.tide_time || height === null) {
      return toast.error('Preencha todos os campos corretamente.');
    }
    setSaving(true);
    const { error } = await supabase
      .from('tides_data')
      .upsert(
        { tide_date: manualForm.tide_date, tide_time: manualForm.tide_time, height },
        { onConflict: 'tide_date' },
      );
    setSaving(false);
    if (error) return toast.error('Erro ao salvar: ' + error.message);
    toast.success('Maré salva.');
    setManualOpen(false);
    setManualForm({ tide_date: '', tide_time: '', height: '' });
    fetchData();
  };

  const deleteRow = async (id: string) => {
    if (!confirm('Excluir este registro?')) return;
    const { error } = await supabase.from('tides_data').delete().eq('id', id);
    if (error) return toast.error('Erro: ' + error.message);
    toast.success('Removido.');
    fetchData();
  };

  const fmtDate = (d: string) => {
    try { return format(parse(d, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy'); }
    catch { return d; }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#0F172A] tracking-tight">Tábua de Marés</h2>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">
            Cadastro do horário diário da maré baixa — Paripueira
          </p>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex gap-4 max-w-4xl">
        <Info size={22} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-sm font-black text-blue-900 uppercase tracking-tight">Como atualizar em lote</p>
          <p className="text-[13px] text-blue-800 font-medium leading-relaxed">
            Copie o texto do PDF oficial da agência, cole no ChatGPT e envie o comando:
          </p>
          <p className="text-[13px] text-blue-900 font-bold italic bg-white/70 rounded-lg p-3 border border-blue-100">
            “Transforme isso em uma planilha CSV estritamente com 3 colunas: Data (DD/MM/AAAA), Hora (HH:MM) e Altura (Ex: 0.3m).”
          </p>
        </div>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Upload size={20} />
            </div>
            <div>
              <h3 className="font-black text-[#0F172A]">Importar CSV</h3>
              <p className="text-xs text-gray-400 font-bold">3 colunas: Data, Hora, Altura</p>
            </div>
          </div>
          <label className="flex items-center justify-center gap-2 cursor-pointer bg-[#0F172A] hover:bg-[#1e293b] text-white font-black py-4 rounded-2xl transition-all">
            <Upload size={18} />
            ESCOLHER ARQUIVO .CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </label>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="font-black text-[#0F172A]">Inserção Manual</h3>
              <p className="text-xs text-gray-400 font-bold">Adicione um único dia</p>
            </div>
          </div>
          <Button
            onClick={() => setManualOpen(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-7 rounded-2xl"
          >
            <Plus size={18} className="mr-2" />
            ADICIONAR DIA MANUALMENTE
          </Button>
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-[#0F172A] text-lg">Pré-visualização ({preview.length})</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPreview([])}>Cancelar</Button>
              <Button onClick={saveBatch} disabled={saving} className="bg-[#0F172A] text-white font-black">
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} className="mr-2" />}
                SALVAR TUDO
              </Button>
            </div>
          </div>
          <div className="overflow-auto max-h-96 border border-gray-100 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-black">
                <tr><th className="p-3 text-left">Data</th><th className="p-3 text-left">Hora</th><th className="p-3 text-left">Altura</th></tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="p-3 font-bold">{fmtDate(r.tide_date)}</td>
                    <td className="p-3 font-bold text-ocean">{r.tide_time}</td>
                    <td className="p-3 font-bold text-blue-600">{r.height.toFixed(2)}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Existentes */}
      <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm max-w-4xl">
        <div className="flex items-center gap-3 mb-4">
          <Waves size={20} className="text-ocean" />
          <h3 className="font-black text-[#0F172A] text-lg">Marés cadastradas ({existing.length})</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-ocean" /></div>
        ) : existing.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8 font-bold">Nenhum dado cadastrado ainda.</p>
        ) : (
          <div className="overflow-auto max-h-[480px] border border-gray-100 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-black sticky top-0">
                <tr>
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-left">Hora</th>
                  <th className="p-3 text-left">Altura</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {existing.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="p-3 font-bold">{fmtDate(r.tide_date)}</td>
                    <td className="p-3 font-bold text-ocean">{r.tide_time.slice(0,5)}</td>
                    <td className="p-3 font-bold text-blue-600">{Number(r.height).toFixed(2)}m</td>
                    <td className="p-3 text-right">
                      <button onClick={() => deleteRow(r.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal manual */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-black">Adicionar Maré Baixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="font-black text-xs uppercase tracking-widest">Data</Label>
              <Input type="date" value={manualForm.tide_date}
                onChange={(e) => setManualForm({ ...manualForm, tide_date: e.target.value })} />
            </div>
            <div>
              <Label className="font-black text-xs uppercase tracking-widest">Hora</Label>
              <Input type="time" value={manualForm.tide_time}
                onChange={(e) => setManualForm({ ...manualForm, tide_time: e.target.value })} />
            </div>
            <div>
              <Label className="font-black text-xs uppercase tracking-widest">Altura (m)</Label>
              <Input type="text" placeholder="Ex: 0.3" value={manualForm.height}
                onChange={(e) => setManualForm({ ...manualForm, height: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualOpen(false)}>Cancelar</Button>
            <Button onClick={saveManual} disabled={saving} className="bg-[#0F172A] text-white font-black">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} className="mr-2" />}
              SALVAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TidesDataManagement;