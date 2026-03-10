import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, Calendar } from "lucide-react";

const SESSION_PACKAGES = [
  {
    sessions: 1,
    price: 120,
    description: "Perfect for a quick tune-up or addressing a specific behavior"
  },
  {
    sessions: 2,
    price: 230,
    savings: 10,
    description: "Great for building on basic skills or tackling multiple issues"
  },
  {
    sessions: 3,
    price: 330,
    savings: 30,
    description: "Comprehensive training with consistent follow-up"
  },
  {
    sessions: 4,
    price: 400,
    savings: 80,
    description: "Best value! In-depth training for lasting behavioural change"
  }
];

export default function OnDemandSessionSelection({ formData, setFormData, onNext, onBack }) {
  const [selectedPackage, setSelectedPackage] = useState(
    formData.onDemandSessions || null
  );
  const [error, setError] = useState('');

  const handlePackageSelect = (sessions) => {
    setSelectedPackage(sessions);
    setError('');
  };

  const handleContinue = () => {
    if (!selectedPackage) {
      setError('Please select a session package to continue');
      return;
    }

    const packageData = SESSION_PACKAGES.find(p => p.sessions === selectedPackage);
    setFormData({
      ...formData,
      onDemandSessions: selectedPackage,
      onDemandPrice: packageData.price
    });
    
    onNext();
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>Choose Your Training Package</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <RadioGroup value={selectedPackage?.toString()} onValueChange={(value) => handlePackageSelect(parseInt(value))}>
          <div className="space-y-4">
            {SESSION_PACKAGES.map((pkg) => {
              const isSelected = selectedPackage === pkg.sessions;
              
              return (
                <div
                  key={pkg.sessions}
                  className={`border rounded-lg p-4 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                  onClick={() => handlePackageSelect(pkg.sessions)}
                >
                  <div className="flex items-start gap-4">
                    <RadioGroupItem 
                      value={pkg.sessions.toString()} 
                      id={`package-${pkg.sessions}`}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={`package-${pkg.sessions}`}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <span className="text-lg font-semibold text-slate-900">
                              {pkg.sessions} Session{pkg.sessions > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-blue-600">
                              ${pkg.price}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-slate-600 mb-2">
                          {pkg.description}
                        </p>

                        {pkg.savings && (
                          <div className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-green-700 font-medium">
                              Save ${pkg.savings}! (${(pkg.price / pkg.sessions).toFixed(2)} per session)
                            </span>
                          </div>
                        )}

                        {!pkg.savings && (
                          <p className="text-sm text-slate-500">
                            ${pkg.price} per session
                          </p>
                        )}
                      </Label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </RadioGroup>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-slate-700">
          <p className="font-semibold mb-2">📅 Flexible Scheduling</p>
          <p>Sessions can be scheduled every 3 weeks to give you time to practice between sessions.</p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            Back to Services
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1"
            disabled={!selectedPackage}
          >
            Continue to Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}