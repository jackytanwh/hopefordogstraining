import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const BASE_PRICE = 720;
const EXTRA_PRICE = 360; // half price

const dogOptions = [
  {
    count: 1,
    label: '1 Dog',
    price: BASE_PRICE,
    breakdown: `$${BASE_PRICE}`,
    description: 'Full program price'
  },
  {
    count: 2,
    label: '2 Dogs',
    price: BASE_PRICE + EXTRA_PRICE,
    breakdown: `$${BASE_PRICE} + $${EXTRA_PRICE}`,
    description: '2nd dog at half price'
  },
  {
    count: 3,
    label: '3 Dogs',
    price: BASE_PRICE + EXTRA_PRICE * 2,
    breakdown: `$${BASE_PRICE} + $${EXTRA_PRICE} × 2`,
    description: '2nd & 3rd dog at half price'
  },
  {
    count: 4,
    label: '4 Dogs',
    price: BASE_PRICE + EXTRA_PRICE * 3,
    breakdown: `$${BASE_PRICE} + $${EXTRA_PRICE} × 3`,
    description: '2nd, 3rd & 4th dog at half price'
  }
];

export default function BasicMannersFYOGCountSelection({ formData, setFormData, onNext, onBack }) {
  const [selected, setSelected] = useState(
    formData.basicMannersFYOGCount ? String(formData.basicMannersFYOGCount) : null
  );
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!selected) {
      setError('Please select the number of dogs');
      return;
    }
    const option = dogOptions.find(o => o.count === Number(selected));
    setFormData({
      ...formData,
      basicMannersFYOGCount: option.count,
      basicMannersFYOGPrice: option.price,
      numberOfFurkids: option.count,
      numberOfClients: option.count
    });
    onNext();
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>Number of Dogs</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <p className="text-slate-600 text-sm">
          How many dogs will be joining the Basic Manners Program? The 2nd, 3rd and 4th dog each join at half price.
        </p>

        <RadioGroup value={selected} onValueChange={setSelected} className="space-y-3">
          {dogOptions.map((option) => (
            <div
              key={option.count}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selected === String(option.count)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
              onClick={() => setSelected(String(option.count))}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value={String(option.count)} id={`dog-${option.count}`} />
                <Label htmlFor={`dog-${option.count}`} className="cursor-pointer flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{option.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{option.description} ({option.breakdown})</p>
                    </div>
                    <p className="font-bold text-green-700 text-xl">${option.price}</p>
                  </div>
                </Label>
              </div>
            </div>
          ))}
        </RadioGroup>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-amber-800">
          <p className="font-semibold mb-1">🐾 Multi-Dog Pricing</p>
          <p>Each additional dog (2nd, 3rd and 4th) joins at 50% off — $360 per dog.</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
          <Button onClick={handleContinue} className="flex-1">Continue to Schedule</Button>
        </div>
      </CardContent>
    </Card>
  );
}