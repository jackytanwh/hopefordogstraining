import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { Users, Trash2, Edit2 } from "lucide-react";

export default function ClientContacts() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.LeadInquiry.list('-created_date').then(data => {
      setLeads(data);
      setLoading(false);
    });
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    await base44.entities.LeadInquiry.delete(deleteId);
    setLeads(prev => prev.filter(l => l.id !== deleteId));
    setDeleteId(null);
  };

  const handleEditOpen = (lead) => {
    setEditingLead(lead);
    setEditForm({
      client_name: lead.client_name || '',
      email_address: lead.email_address || '',
      mobile_number: lead.mobile_number || '',
      furkid_name: lead.furkid_name || '',
      dog_dob: lead.dog_dob || '',
      dog_age: lead.dog_age || '',
      last_program: lead.last_program || '',
    });
  };

  const handleEditSave = async () => {
    setSaving(true);
    const updated = await base44.entities.LeadInquiry.update(editingLead.id, editForm);
    setLeads(prev => prev.map(l => l.id === editingLead.id ? { ...l, ...editForm } : l));
    setEditingLead(null);
    setSaving(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Client Contacts</h1>
        <p className="text-slate-600 mt-1">Automatically collected from bookings</p>
      </div>

      <Card className="shadow-lg border-0 bg-white/80">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Contacts ({leads.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No leads yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-slate-700">Client Name</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-700">Email</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-700">Mobile</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-700">Furkid's Name</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-700">Furkid's DOB</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-700">Dog Age</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-700">Last Program</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-700">Submitted</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{lead.client_name}</td>
                    <td className="px-6 py-4 text-slate-600">{lead.email_address}</td>
                    <td className="px-6 py-4 text-slate-600">{lead.mobile_number || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{lead.furkid_name || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {lead.dog_dob ? format(parseISO(lead.dog_dob), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{lead.dog_age || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{lead.last_program ? lead.last_program.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—'}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {lead.created_date ? format(new Date(lead.created_date), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="text-slate-600 hover:text-slate-800 hover:bg-slate-100" onClick={() => handleEditOpen(lead)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteId(lead.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingLead} onOpenChange={(open) => !open && setEditingLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {[
              { field: 'client_name', label: 'Client Name' },
              { field: 'email_address', label: 'Email' },
              { field: 'mobile_number', label: 'Mobile' },
              { field: 'furkid_name', label: "Furkid's Name" },
              { field: 'dog_dob', label: "Furkid's DOB", type: 'date' },
              { field: 'dog_age', label: 'Dog Age' },
              { field: 'last_program', label: 'Last Program' },
            ].map(({ field, label, type }) => (
              <div key={field} className={field === 'email_address' || field === 'last_program' ? 'col-span-2' : ''}>
                <Label className="text-sm text-slate-600 mb-1">{label}</Label>
                <Input
                  type={type || 'text'}
                  value={editForm[field] || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLead(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this contact? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}