import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, X } from "lucide-react";

export default function AddProgressNote({ isOpen, onClose, onSubmit }) {
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (note.trim()) {
      onSubmit({ note });
      setNote('');
    }
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Progress Note</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="note">Progress Note *</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Document training progress, milestones, challenges, or observations..."
              className="h-32"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Add Note
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}