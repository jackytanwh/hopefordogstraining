import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const PUPPY_BASE_PRICE = 520;
const PUPPY_EXTRA_PRICE = 260; // half price

const puppyOptions = [
  {
    count: 1,
    label: '1 Puppy',
    price: PUPPY_BASE_PRICE,
    breakdown: `$${PUPPY_BASE_PRICE}`,
    description: 'Full program price'
  },
  {
    count: 2,
    label: '2 Puppies',
    price: PUPPY_BASE_PRICE + PUPPY_EXTRA_PRICE,
    breakdown: `$${PUPPY_BASE_PRICE} + $${PUPPY_EXTRA_PRICE}`,
    description: '2nd puppy at half price'
  },
  {
    count: 3,
    label: '3 Puppies',
    price: PUPPY_BASE_PRICE + PUPPY_EXTRA_PRICE * 2,
    breakdown: `$${PUPPY_BASE_PRICE} + $${PUPPY_EXTRA_PRICE} × 2`,
    description: '2nd & 3rd puppy at half price'
  }
];

export default function KinderPuppyCountSelection({ formData, setFormData, onNext, onBack }) {
  const [selected, setSelected] = useState(
    formData.kinderPuppyCount ? String(formData.kinderPuppyCount) : null
  );
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!selected) {
      setError('Please select the number of puppies');
      return;
    }
    const option = puppyOptions.find(o => o.count === Number(selected));
    setFormData({ ...formData, kinderPuppyCount: option.count, kinderPuppyPrice: option.price });
    onNext();
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>Number of Puppies</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <p className="text-slate-600 text-sm">
          How many puppies will be joining the Kinder Puppy Program? The 2nd and 3rd puppy are each at half price.
        </p>

        <RadioGroup value={selected} onValueChange={setSelected} className="space-y-3">
          {puppyOptions.map((option) => (
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
                <RadioGroupItem value={String(option.count)} id={`puppy-${option.count}`} />
                <Label htmlFor={`puppy-${option.count}`} className="cursor-pointer flex-1">
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
          <p className="font-semibold mb-1">🐾 Multi-Puppy Pricing</p>
          <p>Each additional puppy (2nd and 3rd) joins at 50% off — $260 per puppy.</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
          <Button onClick={handleContinue} className="flex-1">Continue to Schedule</Button>
        </div>
      </CardContent>
    </Card>
  );
}