import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { Users } from "lucide-react";

export default function LeadInquiries() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.LeadInquiry.list('-created_date').then(data => {
      setLeads(data);
      setLoading(false);
    });
  }, []);

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
                  <th className="text-left px-6 py-3 font-semibold text-slate-700">Dog / Puppy DOB</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-700">Dog Age</th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-700">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{lead.client_name}</td>
                    <td className="px-6 py-4 text-slate-600">{lead.email_address}</td>
                    <td className="px-6 py-4 text-slate-600">{lead.mobile_number || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {lead.dog_dob ? format(parseISO(lead.dog_dob), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{lead.dog_age || '—'}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {lead.created_date ? format(new Date(lead.created_date), 'dd MMM yyyy') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}