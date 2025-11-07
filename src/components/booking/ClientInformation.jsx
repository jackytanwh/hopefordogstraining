
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, MessageCircle } from "lucide-react";

export default function ClientInformation({ service, formData, setFormData, onNext, onBack, isFYOG }) {
  const [errors, setErrors] = useState({});
  const [showValidationMessage, setShowValidationMessage] = useState(false);

  const numberOfClients = isFYOG ? formData.numberOfClients : 1;

  const checkSentosaPostalCode = (postalCode) => {
    if (!postalCode) return false;
    const code = parseInt(postalCode);
    return code >= 90000 && code <= 99999;
  };

  const handleInputChange = (clientIndex, field, value) => {
    if (isFYOG) {
      const newClients = [...(formData.clients || [])];
      if (!newClients[clientIndex]) {
        newClients[clientIndex] = {};
      }
      newClients[clientIndex][field] = value;
      
      // Check if postal code changed and if any client is in Sentosa
      if (field === 'clientPostalCode') {
        const anySentosa = newClients.some(client => checkSentosaPostalCode(client.clientPostalCode));
        setFormData({ ...formData, clients: newClients, isSentosa: anySentosa });
      } else {
        setFormData({ ...formData, clients: newClients });
      }
    } else {
      const updatedFormData = { ...formData, [field]: value };
      
      // Check Sentosa postal code for single client
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
    
    // Hide validation message when user starts fixing errors
    if (showValidationMessage) {
      setShowValidationMessage(false);
    }
  };

  const validateAndContinue = () => {
    const newErrors = {};

    for (let i = 0; i < numberOfClients; i++) {
      const client = isFYOG ? formData.clients[i] || {} : formData;
      const prefix = isFYOG ? `${i}_` : '';

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

      if (!client.clientAddress?.trim()) {
        newErrors[`${prefix}clientAddress`] = 'Address is required';
      }

      if (!client.clientPostalCode?.trim()) {
        newErrors[`${prefix}clientPostalCode`] = 'Postal code is required';
      } else if (!/^\d{6}$/.test(client.clientPostalCode)) {
        newErrors[`${prefix}clientPostalCode`] = 'Invalid postal code (6 digits required)';
      }
    }

    // Validate WhatsApp consent - now mandatory
    if (!formData.whatsappConsent) {
      newErrors.whatsappConsent = 'Please provide consent to receive WhatsApp notifications';
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
          {isFYOG ? 'Clients Information' : 'Your Information'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {Array.from({ length: numberOfClients }, (_, index) => {
          const client = isFYOG ? formData.clients[index] || {} : formData;
          const prefix = isFYOG ? `${index}_` : '';
          const isSentosaClient = checkSentosaPostalCode(client.clientPostalCode);

          return (
            <div key={index} className={`space-y-4 ${isFYOG && index > 0 ? 'pt-6 border-t border-slate-200' : ''}`}>
              {isFYOG && (
                <h3 className="font-semibold text-slate-900 text-lg">
                  Client {index + 1}
                </h3>
              )}

              <div className="space-y-2">
                <Label htmlFor={`${prefix}clientName`}>Your Name *</Label>
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
            </div>
          );
        })}

        {/* WhatsApp Consent - now mandatory */}
        <div className="border-t border-slate-200 pt-6">
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">Stay Connected via WhatsApp</p>
                <p>Receive instant booking confirmations and session reminders directly on WhatsApp. You can also contact our team for any rescheduling needs.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="whatsappConsent"
                checked={formData.whatsappConsent || false}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, whatsappConsent: checked });
                  if (checked && errors.whatsappConsent) {
                    const newErrors = { ...errors };
                    delete newErrors.whatsappConsent;
                    setErrors(newErrors);
                  }
                  if (showValidationMessage) {
                    setShowValidationMessage(false);
                  }
                }}
                className={errors.whatsappConsent ? 'border-red-500' : ''}
              />
              <Label 
                htmlFor="whatsappConsent" 
                className="text-sm leading-relaxed cursor-pointer font-normal"
              >
                I consent to receive booking confirmations, session reminders, and training updates via WhatsApp on the mobile number provided above. *
              </Label>
            </div>
            {errors.whatsappConsent && (
              <p className="text-sm text-red-600 ml-8">{errors.whatsappConsent}</p>
            )}
          </div>
        </div>

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
            Continue to Furkid Info
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
