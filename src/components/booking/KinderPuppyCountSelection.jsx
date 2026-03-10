import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PawPrint, Users } from "lucide-react";

export default function KinderPuppyCountSelection({ formData, setFormData, onNext, onBack }) {
  const [numberOfPuppies, setNumberOfPuppies] = useState(formData.numberOfFurkids || null);
  const [numberOfClients, setNumberOfClients] = useState(formData.numberOfClients || null);
  const [errors, setErrors] = useState({});

  const handlePuppiesChange = (num) => {
    setNumberOfPuppies(num);
    if (num === 1) setNumberOfClients(null);
    setErrors({});
  };

  const handleContinue = () => {
    const newErrors = {};
    if (!numberOfPuppies) newErrors.puppies = 'Please select the number of puppies';
    if (numberOfPuppies === 2 && !numberOfClients) newErrors.clients = 'Please select the number of clients';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setFormData({
      ...formData,
      numberOfFurkids: numberOfPuppies,
      numberOfClients: numberOfPuppies === 1 ? null : numberOfClients,
      furkids: numberOfPuppies === 2 ? Array.from({ length: 2 }, (_, i) => formData.furkids?.[i] || {}) : formData.furkids,
      clients: numberOfPuppies === 2 && numberOfClients ? Array.from({ length: numberOfClients }, (_, i) => formData.clients?.[i] || {}) : formData.clients,
    });
    onNext();
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>How Many Puppies?</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-base font-medium">
            <PawPrint className="w-4 h-4" />
            Number of Puppies *
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(num => (
              <button
                key={num}
                onClick={() => handlePuppiesChange(num)}
                className={`p-5 rounded-lg border-2 text-center transition-all ${
                  numberOfPuppies === num
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <p className="text-3xl font-bold">{num}</p>
                <p className="text-sm font-medium mt-1">{num === 1 ? 'Puppy' : 'Puppies'}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {num === 1 ? '$520 total' : '$298/puppy — $596 total'}
                </p>
              </button>
            ))}
          </div>
          {errors.puppies && <p className="text-sm text-red-600">{errors.puppies}</p>}
        </div>

        {numberOfPuppies === 2 && (
          <>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
              <p className="font-semibold text-slate-900 mb-1">Group (FYOG) Program</p>
              <p className="text-slate-700">2 puppies train together at a discounted group rate of $298 per puppy ($596 total). Sessions run on the same schedule.</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Number of Clients/Handlers *
              </Label>
              <Select value={numberOfClients?.toString()} onValueChange={(v) => { setNumberOfClients(parseInt(v)); setErrors({ ...errors, clients: '' }); }}>
                <SelectTrigger className={errors.clients ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select number of clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Client</SelectItem>
                  <SelectItem value="2">2 Clients</SelectItem>
                </SelectContent>
              </Select>
              {errors.clients && <p className="text-sm text-red-600">{errors.clients}</p>}
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
          <Button onClick={handleContinue} className="flex-1">Continue to Schedule</Button>
        </div>
      </CardContent>
    </Card>
  );
}