import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format, parseISO, getDay } from "date-fns";
import { Calendar, User, PawPrint, DollarSign, Loader2, Users, ShoppingCart } from "lucide-react";

export default function BookingSummary({ service, formData, pricing, onBack, onSubmit, isSubmitting, isFYOG, isGroupClass = false }) {
  const [leashAgreement, setLeashAgreement] = useState(false);
  const [refundAgreement, setRefundAgreement] = useState(false);
  const [behaviorAgreement, setBehaviorAgreement] = useState(false);
  const [modificationAgreement, setModificationAgreement] = useState(false);
  const [curriculumAgreement, setCurriculumAgreement] = useState(false);
  const [pottyAgreement, setPottyAgreement] = useState(false);
  const [puppyRefundAgreement, setPuppyRefundAgreement] = useState(false);
  const [agreementError, setAgreementError] = useState('');

  const isBasicManners = service.id === 'basic_manners_in_home' || service.id === 'basic_manners_fyog' || service.id === 'basic_manners_group_class';
  const isKinderPuppy = service.id === 'kinder_puppy_in_home' || service.id === 'kinder_puppy_fyog';
  const isBehaviouralModification = service.id === 'behavioural_modification';

  const handleSubmit = () => {
    if (isBasicManners) {
      if (!leashAgreement || !refundAgreement || !behaviorAgreement) {
        setAgreementError('Please acknowledge all agreements to proceed');
        return;
      }
    }
    
    if (isBehaviouralModification) {
      if (!modificationAgreement) {
        setAgreementError('Please acknowledge the agreement to proceed');
        return;
      }
    }
    
    if (isKinderPuppy) {
      if (!curriculumAgreement || !pottyAgreement || !puppyRefundAgreement) {
        setAgreementError('Please acknowledge all agreements to proceed');
        return;
      }
    }
    
    const agreements = {
      noRetractableLeash: leashAgreement,
      noRefunds: refundAgreement,
      dogBehavior: behaviorAgreement,
      behavioralModificationUnderstanding: modificationAgreement,
      kinderPuppyCurriculum: curriculumAgreement,
      kinderPuppyPottyTraining: pottyAgreement,
      kinderPuppyRefundPolicy: puppyRefundAgreement
    };
    
    onSubmit(agreements);
  };

  // Helper function to safely get client field value, checking common variations
  const getClientField = (client, field) => {
    const fieldWithoutPrefix = field.startsWith('client') ? field.substring(6) : field;
    const lowerCaseFieldWithoutPrefix = fieldWithoutPrefix.charAt(0).toLowerCase() + fieldWithoutPrefix.slice(1);

    return client?.[field] || 
           client?.[field.toLowerCase()] || 
           client?.[lowerCaseFieldWithoutPrefix] || 
           'N/A';
  };

  // Helper function to safely get furkid field value, checking common variations
  const getFurkidField = (furkid, field) => {
    const fieldWithoutPrefix = field.startsWith('furkid') ? field.substring(6) : field;
    const lowerCaseFieldWithoutPrefix = fieldWithoutPrefix.charAt(0).toLowerCase() + fieldWithoutPrefix.slice(1);

    return furkid?.[field] || 
           furkid?.[field.toLowerCase()] || 
           furkid?.[lowerCaseFieldWithoutPrefix] || 
           'N/A';
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>Review Your Booking</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Service Details
          </h3>
          <div className="space-y-2 text-sm">
            <p className="font-medium text-lg">{service.name}</p>
            <p className="text-slate-600">{service.sessions} sessions • {service.duration} hour per session</p>
            {(isFYOG || isGroupClass) && formData.numberOfFurkids && (
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">{formData.numberOfFurkids} {isKinderPuppy ? (formData.numberOfFurkids > 1 ? 'Puppies' : 'Puppy') : (formData.numberOfFurkids > 1 ? 'Dogs' : 'Dog')}</Badge>
                <Badge variant="secondary">{formData.numberOfClients} Client{formData.numberOfClients > 1 ? 's' : ''}</Badge>
              </div>
            )}
            {isGroupClass && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mt-2">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">📅 Fixed Schedule:</span> The training schedule will be provided by our team after booking confirmation.
                </p>
              </div>
            )}
          </div>
        </div>

        {!isGroupClass && formData.sessionDates && formData.sessionDates.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Session Schedule</h3>
            <div className="space-y-2">
              {formData.sessionDates.map((session, idx) => {
                const date = parseISO(session.date);
                const isWeekend = getDay(date) === 0 || getDay(date) === 6;
                
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Session {session.session_number}</p>
                      <p className="text-xs text-slate-600">
                        {format(date, 'EEEE, MMM d, yyyy')} • {session.start_time} - {session.end_time}
                      </p>
                    </div>
                    {isWeekend && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        Weekend
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {formData.productSelections && formData.productSelections.length > 0 && (
          <div className="border-t border-slate-200 pt-6 space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Selected Products
            </h3>
            <div className="space-y-2">
              {formData.productSelections.map((product, idx) => (
                <div key={idx} className="bg-blue-50 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-900">{product.product_name}</p>
                    <p className="text-sm text-slate-600">Quantity: {product.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">
                      ${(product.discounted_price * product.quantity).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 line-through">
                      ${(product.original_price * product.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(isFYOG || isGroupClass) && formData.clients && formData.clients.length > 0 ? (
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Clients Information
            </h3>
            <div className="space-y-3">
              {formData.clients.map((client, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-semibold text-sm text-slate-900 mb-2">Client {idx + 1}</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex">
                      <span className="font-medium text-slate-600 w-28">Name:</span>
                      <span className="text-slate-900">{getClientField(client, 'clientName')}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-slate-600 w-28">Email:</span>
                      <span className="text-slate-900">{getClientField(client, 'clientEmail')}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-slate-600 w-28">Mobile:</span>
                      <span className="text-slate-900">{getClientField(client, 'clientMobile')}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-slate-600 w-28">Address:</span>
                      <span className="text-slate-900">{getClientField(client, 'clientAddress')}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-slate-600 w-28">Postal Code:</span>
                      <span className="text-slate-900">{getClientField(client, 'clientPostalCode')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Your Information
            </h3>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="space-y-1.5 text-sm">
                <div className="flex">
                  <span className="font-medium text-slate-600 w-28">Name:</span>
                  <span className="text-slate-900">{formData.clientName || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-slate-600 w-28">Email:</span>
                  <span className="text-slate-900">{formData.clientEmail || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-slate-600 w-28">Mobile:</span>
                  <span className="text-slate-900">{formData.clientMobile || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-slate-600 w-28">Address:</span>
                  <span className="text-slate-900">{formData.clientAddress || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-slate-600 w-28">Postal Code:</span>
                  <span className="text-slate-900">{formData.clientPostalCode || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <PawPrint className="w-5 h-5" />
            {isKinderPuppy 
              ? ((isFYOG || isGroupClass) && formData.numberOfFurkids > 1 ? 'Puppies Information' : 'Puppy Information')
              : ((isFYOG || isGroupClass) && formData.numberOfFurkids > 1 ? 'Furkids Information' : 'Furkid Information')
            }
          </h3>

          {(isFYOG || isGroupClass) && formData.furkids && formData.furkids.length > 0 ? (
            <div className="space-y-3">
              {formData.furkids && formData.furkids.length > 0 ? (
                formData.furkids.map((furkid, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-semibold text-sm text-slate-900 mb-2">
                      {isKinderPuppy ? 'Puppy' : 'Dog'} {idx + 1}: {getFurkidField(furkid, 'furkidName')}
                    </p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex">
                        <span className="font-medium text-slate-600 w-28">Age:</span>
                        <span className="text-slate-900">{getFurkidField(furkid, 'furkidAge')}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-slate-600 w-28">Breed:</span>
                        <span className="text-slate-900">{getFurkidField(furkid, 'furkidBreed')}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-slate-600 w-28">Gender:</span>
                        <span className="text-slate-900 capitalize">{getFurkidField(furkid, 'furkidGender')}</span>
                      </div>
                      {furkid?.isAdopted && (
                        <div className="mt-2">
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            Singapore Special / Adopted (10% discount)
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-semibold">⚠️ No furkid information available</p>
                  <p className="text-xs text-red-600 mt-1">Expected {formData.numberOfFurkids} {isKinderPuppy ? (formData.numberOfFurkids > 1 ? 'puppies' : 'puppy') : (formData.numberOfFurkids > 1 ? 'dogs' : 'dog')}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="space-y-1.5 text-sm">
                <div className="flex">
                  <span className="font-medium text-slate-600 w-28">Name:</span>
                  <span className="text-slate-900">{formData.furkidName || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-slate-600 w-28">Age:</span>
                  <span className="text-slate-900">{formData.furkidAge || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-slate-600 w-28">Breed:</span>
                  <span className="text-slate-900">{formData.furkidBreed || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-slate-600 w-28">Gender:</span>
                  <span className="text-slate-900 capitalize">{formData.furkidGender || 'N/A'}</span>
                </div>
                {formData.isAdopted && (
                  <div className="mt-2">
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      Singapore Special / Adopted (10% discount)
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {(isFYOG || isGroupClass) && (
          <div className="border-t border-slate-200 pt-6">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Training Kit Provided
            </h3>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Treat Pouch (Clicker+Whistle)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Dog Mat
                  </li>
                  <li className="flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                   3m Leash
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="border-t border-slate-200 pt-6 space-y-3">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pricing Breakdown
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Base Price:</span>
              <span className="font-medium">${pricing.basePrice.toFixed(2)}</span>
            </div>
            
            {pricing.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Adoption Discount (10%):</span>
                <span className="font-medium">-${pricing.discount.toFixed(2)}</span>
              </div>
            )}
            
            {pricing.surcharge > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Weekend Surcharge (5% for {pricing.weekendSessionCount} session{pricing.weekendSessionCount > 1 ? 's' : ''}):</span>
                <span className="font-medium">+${pricing.surcharge.toFixed(2)}</span>
              </div>
            )}
            
            {pricing.sentosaSurcharge > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Sentosa Surcharge ($10 × {service.sessions} sessions):</span>
                <span className="font-medium">+${pricing.sentosaSurcharge.toFixed(2)}</span>
              </div>
            )}

            {formData.productSelections && formData.productSelections.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <p className="font-medium text-slate-700 mb-2">Products:</p>
                <div className="space-y-1.5 pl-4">
                  {formData.productSelections.map((product, idx) => (
                    <div key={idx} className="flex justify-between text-blue-600">
                      <span className="text-sm">
                        {product.product_name} × {product.quantity}
                      </span>
                      <span className="font-medium">
                        ${(product.discounted_price * product.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-blue-700 font-semibold mt-2 pt-2 border-t border-blue-200">
                  <span>Products Subtotal:</span>
                  <span>${pricing.productsTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
            
            <div className="border-t border-slate-200 pt-2 flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span className="text-blue-600 text-2xl">${pricing.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {isBasicManners && (
          <div className="border-t border-slate-200 pt-4">
            <h3 className="font-semibold text-slate-900 mb-3">Terms & Agreements</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreement1"
                  checked={leashAgreement}
                  onCheckedChange={(checked) => {
                    setLeashAgreement(checked);
                    if (agreementError) setAgreementError('');
                  }}
                />
                <Label 
                  htmlFor="agreement1" 
                  className="text-sm leading-relaxed cursor-pointer font-normal"
                >
                  I agree not to use retractable or slip leashes during training sessions.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreement2"
                  checked={refundAgreement}
                  onCheckedChange={(checked) => {
                    setRefundAgreement(checked);
                    if (agreementError) setAgreementError('');
                  }}
                />
                <Label 
                  htmlFor="agreement2" 
                  className="text-sm leading-relaxed cursor-pointer font-normal"
                >
                  I understand that HopeforDogs does not offer refunds, exchanges, or cancellations. Any refund provided will be at HopeforDogs discretion and as a gesture of goodwill.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreement3"
                  checked={behaviorAgreement}
                  onCheckedChange={(checked) => {
                    setBehaviorAgreement(checked);
                    if (agreementError) setAgreementError('');
                  }}
                />
                <Label 
                  htmlFor="agreement3" 
                  className="text-sm leading-relaxed cursor-pointer font-normal"
                >
                  I confirm that my dog is not fearful, anxious, and/or reactive towards people or other dogs. I understand that HopeforDogs may adjust the training programme if my dog is observed to be fearful or anxious.
                </Label>
              </div>

              {agreementError && (
                <p className="text-sm text-red-600 font-medium">{agreementError}</p>
              )}
            </div>
          </div>
        )}

        {isBehaviouralModification && (
          <div className="border-t border-slate-200 pt-4">
            <h3 className="font-semibold text-slate-900 mb-3">Terms & Agreements</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="behavioralModificationAgreement"
                  checked={modificationAgreement}
                  onCheckedChange={(checked) => {
                    setModificationAgreement(checked);
                    if (agreementError) setAgreementError('');
                  }}
                />
                <Label 
                  htmlFor="behavioralModificationAgreement" 
                  className="text-sm leading-relaxed cursor-pointer font-normal"
                >
                  I have read the FAQs and understand that behaviour change takes time and is influenced by many factors. I recognise that my dog's progress will rely on my consistency and commitment to following the trainer's guidance.
                </Label>
              </div>

              {agreementError && (
                <p className="text-sm text-red-600 font-medium">{agreementError}</p>
              )}
            </div>
          </div>
        )}

        {isKinderPuppy && (
          <div className="border-t border-slate-200 pt-4">
            <h3 className="font-semibold text-slate-900 mb-3">Terms & Agreements</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="kinderPuppyAgreement1"
                  checked={curriculumAgreement}
                  onCheckedChange={(checked) => {
                    setCurriculumAgreement(checked);
                    if (agreementError) setAgreementError('');
                  }}
                />
                <Label 
                  htmlFor="kinderPuppyAgreement1" 
                  className="text-sm leading-relaxed cursor-pointer font-normal"
                >
                  I have reviewed the curriculum and understand that puppy training goes beyond teaching basic cues like "sit" or "down," or addressing potty training alone. The curriculum supports my goals and includes a range of essential skills and knowledge vital for my puppy's long-term development and overall well-being.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="kinderPuppyAgreement2"
                  checked={pottyAgreement}
                  onCheckedChange={(checked) => {
                    setPottyAgreement(checked);
                    if (agreementError) setAgreementError('');
                  }}
                />
                <Label 
                  htmlFor="kinderPuppyAgreement2" 
                  className="text-sm leading-relaxed cursor-pointer font-normal"
                >
                  I understand that successful potty training requires a consistent routine of feeding, potty breaks, and playtime. I acknowledge that patience and consistency are key, and that there are no quick fixes. I recognise that limited supervision may affect my puppy's potty training progress.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="kinderPuppyAgreement3"
                  checked={puppyRefundAgreement}
                  onCheckedChange={(checked) => {
                    setPuppyRefundAgreement(checked);
                    if (agreementError) setAgreementError('');
                  }}
                />
                <Label 
                  htmlFor="kinderPuppyAgreement3" 
                  className="text-sm leading-relaxed cursor-pointer font-normal"
                >
                  I understand that HopeforDogs Canine Training's refund policy does not allow refunds, exchanges, or cancellations. Any refund provided will be entirely at HopeforDogs Canine Training's discretion and as a gesture of goodwill.
                </Label>
              </div>

              {agreementError && (
                <p className="text-sm text-red-600 font-medium">{agreementError}</p>
              )}
            </div>
          </div>
        )}


        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} disabled={isSubmitting} className="flex-1">
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-green-600 hover:bg-green-700">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Proceed to Payment'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}