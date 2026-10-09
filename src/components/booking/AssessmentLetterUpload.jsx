import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

export default function AssessmentLetterUpload({ booking }) {
  const [documents, setDocuments] = useState(booking?.canine_assessment_documents || []);
  const [uploading, setUploading] = useState(false);

  if (!booking) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newDoc = {
        file_name: file.name,
        file_url,
        uploaded_date: new Date().toISOString()
      };
      const updatedDocs = [...documents, newDoc];
      await base44.entities.Booking.update(booking.id, { canine_assessment_documents: updatedDocs });
      setDocuments(updatedDocs);
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Failed to upload PDF. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (idx) => {
    if (!confirm('Remove this document from the booking?')) return;
    try {
      const updatedDocs = documents.filter((_, i) => i !== idx);
      await base44.entities.Booking.update(booking.id, { canine_assessment_documents: updatedDocs });
      setDocuments(updatedDocs);
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  return (
    <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
      <h4 className="font-semibold text-slate-900 text-base flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Assessment Letter (PDF)
      </h4>
      <p className="text-sm text-slate-500">Upload the assessment letter for this booking. Files are stored against this booking.</p>
      <div className="space-y-2">
        {documents.length === 0 && !uploading && (
          <p className="text-sm text-slate-400 italic">No PDF uploaded yet.</p>
        )}
        {documents.map((doc, idx) => (
          <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3">
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline min-w-0 flex-1">
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">{doc.file_name}</span>
            </a>
            {doc.uploaded_date && (
              <span className="text-xs text-slate-400 shrink-0 ml-2">{format(new Date(doc.uploaded_date), 'MMM d, yyyy')}</span>
            )}
            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 ml-2" onClick={() => handleDeleteDocument(idx)} title="Delete document">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
      <label className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 text-sm font-medium transition-colors ${uploading ? 'opacity-60 cursor-wait' : ''}`}>
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? 'Uploading...' : 'Upload PDF'}
        <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
      </label>
    </div>
  );
}