import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Tag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const emptyForm = { code: '', discount_type: 'percentage', discount_value: '', description: '', active: true, max_uses: '' };

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.PromoCode.list('-created_date');
    setPromoCodes(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (p) => {
    setForm({ code: p.code, discount_type: p.discount_type, discount_value: p.discount_value, description: p.description || '', active: p.active ?? true, max_uses: p.max_uses || '' });
    setEditId(p.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      description: form.description,
      active: form.active,
      ...(form.max_uses ? { max_uses: parseInt(form.max_uses) } : {}),
    };
    if (editId) {
      await base44.entities.PromoCode.update(editId, payload);
    } else {
      await base44.entities.PromoCode.create({ ...payload, usage_count: 0 });
    }
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this promo code?')) return;
    await base44.entities.PromoCode.delete(id);
    load();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Tag className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Promo Codes</h1>
            <p className="text-sm text-slate-500">Manage discount codes for bookings</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> New Promo Code
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : promoCodes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No promo codes yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {promoCodes.map((p) => (
            <Card key={p.id} className="border border-slate-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 rounded-lg px-3 py-2 font-mono font-bold text-slate-800 text-sm">
                    {p.code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">
                        {p.discount_type === 'percentage' ? `${p.discount_value}% off` : `$${p.discount_value} off`}
                      </span>
                      <Badge variant={p.active ? 'default' : 'secondary'} className={p.active ? 'bg-green-100 text-green-800 border-green-200' : ''}>
                        {p.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {p.description && <p className="text-sm text-slate-500 mt-0.5">{p.description}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">
                      Used {p.usage_count || 0} time{(p.usage_count || 0) !== 1 ? 's' : ''}
                      {p.max_uses ? ` / ${p.max_uses} max` : ' (unlimited)'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEdit(p)}><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Promo Code' : 'New Promo Code'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Code</Label>
              <input className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm mt-1 font-mono uppercase" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Discount Type</Label>
                <select className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm mt-1" value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div>
                <Label>Value</Label>
                <input type="number" min="0" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm mt-1" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} placeholder={form.discount_type === 'percentage' ? 'e.g. 10' : 'e.g. 20'} />
              </div>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <input className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm mt-1" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. New client discount" />
            </div>
            <div>
              <Label>Max Uses (leave empty for unlimited)</Label>
              <input type="number" min="1" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm mt-1" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4" />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.code || !form.discount_value}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}