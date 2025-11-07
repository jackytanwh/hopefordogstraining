
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TrendingUp, MessageSquare, Calendar, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

const statusColors = {
  initial: "bg-blue-100 text-blue-800 border-blue-200",
  follow_up: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-purple-100 text-purple-800 border-purple-200",
  paused: "bg-gray-100 text-gray-800 border-gray-200"
};

const statusOptions = [
  { value: 'initial', label: 'Initial' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' }
];

export default function TrainingProgress({ client, onStatusUpdate, onDeleteNote }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteIndexToDelete, setNoteIndexToDelete] = useState(null);

  const handleDeleteClick = (index) => {
    setNoteIndexToDelete(index);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (noteIndexToDelete !== null) {
      onDeleteNote(noteIndexToDelete);
    }
    setNoteIndexToDelete(null);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <TrendingUp className="w-5 h-5" />
              Training Progress
            </CardTitle>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Status:</span>
              <Select
                value={client.training_status}
                onValueChange={onStatusUpdate}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {client.training_notes && client.training_notes.length > 0 ? (
            <div className="space-y-4">
              {client.training_notes.map((note, index) => (
                <div key={index} className="p-4 border border-slate-200 rounded-lg group">
                  <div className="flex items-center justify-between mb-2">
                    {/* Removed trainer information as per outline */}
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>{format(parseISO(note.date), "MMM d, yyyy")}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteClick(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <p className="text-slate-600 whitespace-pre-wrap">{note.note}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No progress notes yet</h3>
              <p className="text-slate-500 mb-4">Start documenting training progress and milestones.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the progress note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNoteIndexToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
