import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, MessageCircle } from "lucide-react";

export default function ClientInformation({ service, formData, setFormData, onNext, onBack, isFYOG, isFYOGMulti, fyogCount, isKinderPuppy, kinderPuppyCount }) {
  const [errors, setErrors] = useState({});
  const [showValidationMessage, setShowValidationMessage] = useState(false);

  const isKinderPuppyMulti = isKinderPuppy && kinderPuppyCount > 1;
  const isMultiClient = isKinderPuppyMulti || isFYOGMulti;
  const numberOfClients = isFYOGMulti ? (fyogCount || 1) : isKinderPuppyMulti ? kinderPuppyCount : isFYOG ? (formData.numberOfClients || 1) : 1;
  const isBehaviouralModification = service.id === 'behavioural_modification';
  const isGroupClass = service.id === 'basic_manners_group_class';
  const isFYOGProgram = service.id === 'basic_manners_fyog';
  const isHowDidYouKnowRequired = isBehaviouralModification;

  const checkSentosaPostalCode = (postalCode) => {
    if (!postalCode) return false;
    const code = parseInt(postalCode);
    return code >= 90000 && code <= 99999;
  };

  // Handle shared address/postal code for FYOG programs
  const handleSharedLocationChange = (field, value) => {
    const updatedFormData = { ...formData, [field]: value };
    
    if (field === 'sharedPostalCode') {
      updatedFormData.isSentosa = checkSentosaPostalCode(value);
    }
    
    setFormData(updatedFormData);
    
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
    
    if (showValidationMessage) {
      setShowValidationMessage(false);
    }
  };

  const handleInputChange = (clientIndex, field, value) => {
    if (isMultiClient) {
      const newClients = [...(formData.clients || [])];
      if (!newClients[clientIndex]) {
        newClients[clientIndex] = {};
      }
      newClients[clientIndex][field] = value;
      setFormData({ ...formData, clients: newClients });
    } else {
      const updatedFormData = { ...formData, [field]: value };
      
      if (field === 'clientPostalCode') {
        updatedFormData.isSentosa = checkSentosaPostalCode(value);
      }
      
      setFormData(updatedFormData);
    }
    
    if (errors[`${clientIndex}_${field}`] || errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[`${clientIndex}_${field}`];
      delete newErrors[field];
      setErrors(newErrors);
    }
    
    if (showValidationMessage) {
      setShowValidationMessage(false);
    }
  };

  const validateAndContinue = () => {
    const newErrors = {};

    for (let i = 0; i < numberOfClients; i++) {
      const client = isMultiClient ? formData.clients[i] || {} : formData;
      const prefix = isMultiClient ? `${i}_` : '';

      if (!client.clientName?.trim()) {
        newErrors[`${prefix}clientName`] = 'Name is required';
      }

      if (!client.clientEmail?.trim()) {
        newErrors[`${prefix}clientEmail`] = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.clientEmail)) {
        newErrors[`${prefix}clientEmail`] = 'Invalid email format';
      }

      if (!client.clientMobile?.trim()) {
        newErrors[`${prefix}clientMobile`] = 'Mobile number is required';
      }

      // For non-multi, non-Group Class, non-FYOG-multi: validate address per client
      if (!(isFYOGProgram && isFYOGMulti) && !isGroupClass && !isMultiClient) {
        if (!client.clientAddress?.trim()) {
          newErrors[`${prefix}clientAddress`] = 'Address is required';
        }

        if (!client.clientPostalCode?.trim()) {
          newErrors[`${prefix}clientPostalCode`] = 'Postal code is required';
        } else if (!/^\d{6}$/.test(client.clientPostalCode)) {
          newErrors[`${prefix}clientPostalCode`] = 'Invalid postal code (6 digits required)';
        }
      }
    }

    // For multi-dog FYOG programs and other multi-client flows, validate shared address/postal code
    if ((isFYOGProgram && isFYOGMulti) || isMultiClient) {
      if (!formData.sharedAddress?.trim()) {
        newErrors.sharedAddress = 'Training location address is required';
      }
      if (!formData.sharedPostalCode?.trim()) {
        newErrors.sharedPostalCode = 'Postal code is required';
      } else if (!/^\d{6}$/.test(formData.sharedPostalCode)) {
        newErrors.sharedPostalCode = 'Invalid postal code (6 digits required)';
      }
    }

    if (isBehaviouralModification && !formData.howDidYouKnow) {
      newErrors.howDidYouKnow = 'Please let us know how you heard about us';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShowValidationMessage(true);
      return;
    }

    onNext();
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>
          {isMultiClient ? 'Clients Information' : 'Your Information'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Group Class default location notice */}
        {isGroupClass && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">📍 Training Location:</span> 73 Redhill Rd, Singapore
            </p>
          </div>
        )}

        {Array.from({ length: numberOfClients }, (_, index) => {
          const client = isMultiClient ? formData.clients[index] || {} : formData;
          const prefix = isMultiClient ? `${index}_` : '';
          const isSentosaClient = !isFYOGProgram && !isGroupClass && !isMultiClient && checkSentosaPostalCode(client.clientPostalCode);

          return (
            <div key={index} className={`space-y-4 ${isMultiClient && index > 0 ? 'pt-6 border-t border-slate-200' : ''}`}>
              {isMultiClient && (
                <h3 className="font-semibold text-slate-900 text-lg">
                  Client {index + 1}
                </h3>
              )}

              <div className="space-y-2">
                <Label htmlFor={`${prefix}clientName`}>{isMultiClient ? 'Name' : 'Your Name'} *</Label>
                <Input
                  id={`${prefix}clientName`}
                  value={client.clientName || ''}
                  onChange={(e) => handleInputChange(index, 'clientName', e.target.value)}
                  placeholder="Enter your name"
                  className={errors[`${prefix}clientName`] ? 'border-red-500' : ''}
                />
                {errors[`${prefix}clientName`] && (
                  <p className="text-sm text-red-600">{errors[`${prefix}clientName`]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${prefix}clientEmail`}>Email Address *</Label>
                <Input
                  id={`${prefix}clientEmail`}
                  type="email"
                  value={client.clientEmail || ''}
                  onChange={(e) => handleInputChange(index, 'clientEmail', e.target.value)}
                  placeholder="your.email@example.com"
                  className={errors[`${prefix}clientEmail`] ? 'border-red-500' : ''}
                />
                {errors[`${prefix}clientEmail`] && (
                  <p className="text-sm text-red-600">{errors[`${prefix}clientEmail`]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${prefix}clientMobile`}>Mobile Number (WhatsApp) *</Label>
                <Input
                  id={`${prefix}clientMobile`}
                  value={client.clientMobile || ''}
                  onChange={(e) => handleInputChange(index, 'clientMobile', e.target.value)}
                  placeholder="+65 9123 4567"
                  className={errors[`${prefix}clientMobile`] ? 'border-red-500' : ''}
                />
                {errors[`${prefix}clientMobile`] && (
                  <p className="text-sm text-red-600">{errors[`${prefix}clientMobile`]}</p>
                )}
                <p className="text-xs text-slate-500">This number will be used for booking confirmations and reminders via WhatsApp</p>
              </div>

              {/* Show address/postal per client only for single-client flows */}
              {!isFYOGProgram && !isGroupClass && !isMultiClient && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`${prefix}clientAddress`}>Address *</Label>
                    <Textarea
                      id={`${prefix}clientAddress`}
                      value={client.clientAddress || ''}
                      onChange={(e) => handleInputChange(index, 'clientAddress', e.target.value)}
                      placeholder="Enter full address"
                      className={errors[`${prefix}clientAddress`] ? 'border-red-500' : ''}
                      rows={1}
                    />
                    {errors[`${prefix}clientAddress`] && (
                      <p className="text-sm text-red-600">{errors[`${prefix}clientAddress`]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${prefix}clientPostalCode`}>Postal Code *</Label>
                    <Input
                      id={`${prefix}clientPostalCode`}
                      value={client.clientPostalCode || ''}
                      onChange={(e) => handleInputChange(index, 'clientPostalCode', e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className={errors[`${prefix}clientPostalCode`] ? 'border-red-500' : ''}
                    />
                    {errors[`${prefix}clientPostalCode`] && (
                      <p className="text-sm text-red-600">{errors[`${prefix}clientPostalCode`]}</p>
                    )}
                    {isSentosaClient && (
                      <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-orange-800">
                          <p className="font-semibold">Sentosa Island Surcharge</p>
                          <p>An additional $10 per session surcharge will apply to your booking. Thank you for the understanding.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Shared Training Location for multi-client flows */}
        {(isFYOGProgram || isMultiClient) && (
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <h3 className="font-semibold text-slate-900 text-lg">Training Location</h3>
            <p className="text-sm text-slate-600">Please provide the address where the training sessions will take place.</p>
            
            <div className="space-y-2">
              <Label htmlFor="sharedAddress">Training Address *</Label>
              <Textarea
                id="sharedAddress"
                value={formData.sharedAddress || ''}
                onChange={(e) => handleSharedLocationChange('sharedAddress', e.target.value)}
                placeholder="Enter full address for training sessions"
                className={errors.sharedAddress ? 'border-red-500' : ''}
                rows={1}
              />
              {errors.sharedAddress && (
                <p className="text-sm text-red-600">{errors.sharedAddress}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sharedPostalCode">Postal Code *</Label>
              <Input
                id="sharedPostalCode"
                value={formData.sharedPostalCode || ''}
                onChange={(e) => handleSharedLocationChange('sharedPostalCode', e.target.value)}
                placeholder="123456"
                maxLength={6}
                className={errors.sharedPostalCode ? 'border-red-500' : ''}
              />
              {errors.sharedPostalCode && (
                <p className="text-sm text-red-600">{errors.sharedPostalCode}</p>
              )}
              {formData.isSentosa && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-semibold">Sentosa Island Surcharge</p>
                    <p>An additional $10 per session surcharge will apply to your booking. Thank you for the understanding.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* How did you know - Only for Kinder Puppy FYOG and Behavioural Modification */}
        {isHowDidYouKnowRequired && (
          <div className="border-t border-slate-200 pt-6 space-y-2">
            <Label>How did you know about us? *</Label>
            <RadioGroup
              value={formData.howDidYouKnow}
              onValueChange={(value) => {
                setFormData({ ...formData, howDidYouKnow: value });
                if (errors.howDidYouKnow) {
                  const newErrors = { ...errors };
                  delete newErrors.howDidYouKnow;
                  setErrors(newErrors);
                }
                if (showValidationMessage) {
                  setShowValidationMessage(false);
                }
              }}
            >
              {['Google', 'Facebook', 'Instagram', 'AVS website', 'Recommendation'].map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`know-${option}`} />
                  <Label htmlFor={`know-${option}`} className="font-normal cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {errors.howDidYouKnow && (
              <p className="text-sm text-red-600">{errors.howDidYouKnow}</p>
            )}
          </div>
        )}

        {showValidationMessage && Object.keys(errors).length > 0 && (
          <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>Please fill in all required fields marked with an asterisk (*) before continuing.</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={validateAndContinue} className="flex-1">
            {isBehaviouralModification ? 'Continue to Furkid Form' : 'Continue to Furkid Info'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}