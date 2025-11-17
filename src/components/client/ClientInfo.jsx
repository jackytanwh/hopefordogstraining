import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Phone, PawPrint, Calendar, FileText, Copy, Check, MessageSquare, Edit3, Save, X, Utensils, Home } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function ClientInfo({ client, onUpdate }) {
  const [copied, setCopied] = useState(false);
  const [editingRemarks, setEditingRemarks] = useState(false);
  const [remarksValue, setRemarksValue] = useState(client.remarks || '');
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [instructionsValue, setInstructionsValue] = useState(client.instructions_for_clients || '');
  const [editingAdditionalInstructions, setEditingAdditionalInstructions] = useState(false);
  const [additionalInstructionsValue, setAdditionalInstructionsValue] = useState(client.additional_instructions || '');
  const [saving, setSaving] = useState(false);

  const handleCopy = () => {
    if (client.mobile_number) {
      navigator.clipboard.writeText(client.mobile_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveRemarks = async () => {
    setSaving(true);
    try {
      await base44.entities.Client.update(client.id, { remarks: remarksValue });
      setEditingRemarks(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error saving remarks:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelRemarks = () => {
    setRemarksValue(client.remarks || '');
    setEditingRemarks(false);
  };

  const handleSaveInstructions = async () => {
    setSaving(true);
    try {
      await base44.entities.Client.update(client.id, { instructions_for_clients: instructionsValue });
      setEditingInstructions(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error saving instructions:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelInstructions = () => {
    setInstructionsValue(client.instructions_for_clients || '');
    setEditingInstructions(false);
  };

  const handleSaveAdditionalInstructions = async () => {
    setSaving(true);
    try {
      await base44.entities.Client.update(client.id, { additional_instructions: additionalInstructionsValue });
      setEditingAdditionalInstructions(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error saving additional instructions:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAdditionalInstructions = () => {
    setAdditionalInstructionsValue(client.additional_instructions || '');
    setEditingAdditionalInstructions(false);
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <FileText className="w-5 h-5" />
          Client Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-slate-900">Contact</h4>
                <div className="flex items-center gap-2">
                  <p className="text-slate-600">{client.mobile_number}</p>
                  {client.mobile_number && (
                    <>
                      <a
                        href={`https://wa.me/${client.mobile_number.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                      >
                        <Button variant="ghost" size="icon" className="w-7 h-7">
                          <MessageSquare className="w-4 h-4 text-green-500" />
                        </Button>
                      </a>
                      <Button variant="ghost" size="icon" className="w-7 h-7 flex-shrink-0" onClick={handleCopy}>
                        {copied ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-500" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <PawPrint className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-slate-900">{client.program === 'basic_manners' || client.program === 'basic_manners_group' || client.program === 'basic_manners_fyog' || client.program === 'behavioural_modification' ? 'Dog Details' : 'Puppy Details'}</h4>
                <p className="text-slate-600">
                  {client.dog_name}
                  {client.dog_age && (
                    <span className="text-slate-500"> • {client.dog_age}</span>
                  )}
                  {client.breed && (
                    <span className="text-slate-500"> • {client.breed}</span>
                  )}
                  {client.gender && (
                    <span className="text-slate-500"> • {client.gender}</span>
                  )}
                  {(client.program === 'basic_manners' || client.program === 'basic_manners_group' || client.program === 'basic_manners_fyog') && client.food_allergy !== undefined && (
                    <span className="text-slate-500"> • Food Allergy: {client.food_allergy ? 'Yes' : 'No'}</span>
                  )}
                </p>
              </div>
            </div>

            {(client.program === 'kinder_puppy' || client.program === 'basic_manners') && client.diet && (
              <div className="flex items-start gap-3">
                <Utensils className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900">Diet</h4>
                  <p className="text-slate-600">{client.diet}</p>
                </div>
              </div>
            )}
            
            {(client.program === 'basic_manners_group' || client.program === 'basic_manners_fyog') && client.sleep_area && (
              <div className="flex items-start gap-3">
                <Home className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900">Sleep Area</h4>
                  <p className="text-slate-600">{client.sleep_area}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {(client.program === 'kinder_puppy' || client.program === 'basic_manners') && client.start_date && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900">Start Date (Week 1)</h4>
                  <p className="text-slate-600">
                    {format(parseISO(client.start_date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}
            
            {client.initial_consultation_date && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900">Initial Consultation</h4>
                  <p className="text-slate-600">
                    {format(parseISO(client.initial_consultation_date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}
            
            {(client.follow_up_date || client.second_consultation_date) && (
              <div className="space-y-2">
                <h4 className="font-medium text-slate-900">Upcoming Dates</h4>
                {client.follow_up_date && (
                  <p className="text-slate-600 text-sm">
                    Follow-up: {format(parseISO(client.follow_up_date), "MMM d, yyyy")}
                  </p>
                )}
                {client.second_consultation_date && (
                  <p className="text-slate-600 text-sm">
                    Second consultation: {format(parseISO(client.second_consultation_date), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Items Given to Client - For Kinder Puppy */}
        {client.program === 'kinder_puppy' && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="font-medium text-slate-900 mb-3">Items Given to Client</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'treat_pouch', label: 'Treat Pouch' },
                { key: 'mat', label: 'Mat' },
                { key: 'lick_mat', label: 'Lick Mat' },
                { key: 'cup', label: 'Cup' },
                { key: 'dropper', label: 'Dropper' }
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`item-${item.key}`}
                    checked={client.kinder_puppy_items_given?.[item.key] || false}
                    onChange={async (e) => {
                      const updatedItems = {
                        ...(client.kinder_puppy_items_given || {}),
                        [item.key]: e.target.checked
                      };
                      await base44.entities.Client.update(client.id, { kinder_puppy_items_given: updatedItems });
                      if (onUpdate) onUpdate();
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label 
                    htmlFor={`item-${item.key}`}
                    className="text-sm text-slate-700 cursor-pointer"
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items Given to Client - For Basic Manners In-Home */}
        {client.program === 'basic_manners' && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="font-medium text-slate-900 mb-3">Items Given to Client</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'treat_pouch', label: 'Treat Pouch' },
                { key: 'clicker', label: 'Clicker' },
                { key: 'whistle', label: 'Whistle' },
                { key: 'mat', label: 'Mat' },
                { key: 'leash', label: 'Leash' }
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`basic-item-${item.key}`}
                    checked={client.basic_manners_items_given?.[item.key] || false}
                    onChange={async (e) => {
                      const updatedItems = {
                        ...(client.basic_manners_items_given || {}),
                        [item.key]: e.target.checked
                      };
                      await base44.entities.Client.update(client.id, { basic_manners_items_given: updatedItems });
                      if (onUpdate) onUpdate();
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label 
                    htmlFor={`basic-item-${item.key}`}
                    className="text-sm text-slate-700 cursor-pointer"
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items Given to Client - For Basic Manners FYOG */}
        {client.program === 'basic_manners_fyog' && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="font-medium text-slate-900 mb-3">Items Given to Client</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'treat_pouch', label: 'Treat Pouch (Clicker+Whistle)' },
                { key: 'mat', label: 'Mat' },
                { key: 'leash', label: 'Leash' }
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`fyog-item-${item.key}`}
                    checked={client.basic_manners_items_given?.[item.key] || false}
                    onChange={async (e) => {
                      const updatedItems = {
                        ...(client.basic_manners_items_given || {}),
                        [item.key]: e.target.checked
                      };
                      await base44.entities.Client.update(client.id, { basic_manners_items_given: updatedItems });
                      if (onUpdate) onUpdate();
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label 
                    htmlFor={`fyog-item-${item.key}`}
                    className="text-sm text-slate-700 cursor-pointer"
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-900">Remarks</h4>
            {!editingRemarks && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingRemarks(true)}
                className="text-slate-500 hover:text-slate-700"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                {client.remarks ? 'Edit' : 'Add'}
              </Button>
            )}
          </div>
          
          {editingRemarks ? (
            <div className="space-y-3">
              <Textarea
                value={remarksValue}
                onChange={(e) => setRemarksValue(e.target.value)}
                placeholder="Add any remarks about the client, training progress, or special considerations..."
                className="h-24"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveRemarks}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelRemarks}
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {client.remarks ? (
                <p className="text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">
                  {client.remarks}
                </p>
              ) : (
                <p className="text-slate-400 italic">No remarks added yet.</p>
              )}
            </div>
          )}
        </div>
        
        {client.program === 'behavioural_modification' && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-slate-900">Training Instructions</h4>
              {!editingInstructions && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingInstructions(true)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  {client.instructions_for_clients ? 'Edit' : 'Add'}
                </Button>
              )}
            </div>
            
            {editingInstructions ? (
              <div className="space-y-3">
                <Textarea
                  value={instructionsValue}
                  onChange={(e) => setInstructionsValue(e.target.value)}
                  placeholder="Enter training instructions and exercises for the client..."
                  className="h-32"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveInstructions}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelInstructions}
                    disabled={saving}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {client.instructions_for_clients ? (
                  <p className="text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">
                    {client.instructions_for_clients}
                  </p>
                ) : (
                  <p className="text-slate-400 italic">No training instructions added yet.</p>
                )}
              </div>
            )}
          </div>
        )}

        {client.program === 'behavioural_modification' && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-slate-900">Additional Instructions</h4>
              {!editingAdditionalInstructions && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingAdditionalInstructions(true)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  {client.additional_instructions ? 'Edit' : 'Add'}
                </Button>
              )}
            </div>
            
            {editingAdditionalInstructions ? (
              <div className="space-y-3">
                <Textarea
                  value={additionalInstructionsValue}
                  onChange={(e) => setAdditionalInstructionsValue(e.target.value)}
                  placeholder="Any additional notes or special considerations..."
                  className="h-32"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveAdditionalInstructions}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelAdditionalInstructions}
                    disabled={saving}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {client.additional_instructions ? (
                  <p className="text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">
                    {client.additional_instructions}
                  </p>
                ) : (
                  <p className="text-slate-400 italic">No additional instructions added yet.</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}