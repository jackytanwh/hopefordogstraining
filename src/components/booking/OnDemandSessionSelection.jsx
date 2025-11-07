import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check } from "lucide-react";

export default function OnDemandSessionSelection({ formData, setFormData, onNext }) {
  const [selectedSessions, setSelectedSessions] = useState(formData.onDemandSessions || null);
  const [error, setError] = useState('');

  const sessionOptions = [
    {
      sessions: 1,
      price: 120,
      pricePerSession: 120,
      description: "Single session - perfect for quick training needs"
    },
    {
      sessions: 2,
      price: 220,
      pricePerSession: 110,
      description: "Two sessions - better value at $110 per session",
      popular: true
    },
    {
      sessions: 3,
      price: 315,
      pricePerSession: 105,
      description: "Three sessions - best value at $105 per session"
    }
  ];

  const handleContinue = () => {
    if (!selectedSessions) {
      setError('Please select the number of sessions');
      return;
    }

    const selectedOption = sessionOptions.find(opt => opt.sessions === selectedSessions);
    
    setFormData({
      ...formData,
      onDemandSessions: selectedSessions,
      onDemandPrice: selectedOption.price,
      serviceType: `on_demand_${selectedSessions}_session${selectedSessions > 1 ? 's' : ''}`
    });
    
    onNext();
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>Select Number of Sessions</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-slate-700">
          <p className="font-semibold mb-2">On-Demand Training</p>
          <p>Flexible training sessions tailored to your specific needs. Choose the number of sessions that works best for you.</p>
          {selectedSessions > 1 && (
            <p className="mt-2 text-blue-700">
              💡 Sessions will be scheduled 3 weeks apart by default, or you can choose your own dates.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Choose your package *</Label>
          <RadioGroup
            value={selectedSessions?.toString()}
            onValueChange={(value) => {
              setSelectedSessions(parseInt(value));
              if (error) setError('');
            }}
          >
            {sessionOptions.map((option) => (
              <div
                key={option.sessions}
                className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedSessions === option.sessions
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                {option.popular && (
                  <div className="absolute -top-2 right-4">
                    <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <RadioGroupItem 
                    value={option.sessions.toString()} 
                    id={`session-${option.sessions}`}
                    className="mt-1"
                  />
                  <Label 
                    htmlFor={`session-${option.sessions}`} 
                    className="flex-1 cursor-pointer"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg text-slate-900">
                          {option.sessions} Session{option.sessions > 1 ? 's' : ''}
                        </span>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            ${option.price}
                          </div>
                          {option.sessions > 1 && (
                            <div className="text-xs text-slate-500">
                              ${option.pricePerSession} per session
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">{option.description}</p>
                      
                      {selectedSessions === option.sessions && (
                        <div className="flex items-center gap-2 text-sm text-green-600 font-medium pt-2">
                          <Check className="w-4 h-4" />
                          Selected
                        </div>
                      )}
                    </div>
                  </Label>
                </div>
              </div>
            ))}
          </RadioGroup>
          
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        {selectedSessions && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-sm font-semibold text-green-900 mb-2">Package Summary:</p>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• {selectedSessions} training session{selectedSessions > 1 ? 's' : ''}</li>
              <li>• ${sessionOptions.find(opt => opt.sessions === selectedSessions)?.pricePerSession} per session</li>
              <li>• Total: ${sessionOptions.find(opt => opt.sessions === selectedSessions)?.price}</li>
              {selectedSessions > 1 && (
                <li>• Sessions scheduled 3 weeks apart (customizable)</li>
              )}
            </ul>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={handleContinue} 
            className="flex-1"
          >
            Continue to Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}