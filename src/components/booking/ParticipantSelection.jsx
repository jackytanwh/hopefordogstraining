import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, PawPrint, Calendar, Clock, Loader2 } from "lucide-react";

export default function ParticipantSelection({ service, formData, setFormData, onNext, onBack }) {
  const [errors, setErrors] = useState({});
  const [schedule, setSchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const isFYOG = service.id === 'kinder_puppy_fyog' || service.id === 'basic_manners_fyog';
  const isKinderPuppy = service.id === 'kinder_puppy_fyog';
  const isGroupClass = service.id === 'basic_manners_group_class';
  
  // Kinder Puppy FYOG: 2 puppies, 1-2 clients
  // Basic Manners FYOG: 2-3 dogs, 1-3 clients
  const minFurkids = service.minParticipants;
  const maxFurkids = service.maxParticipants;
  const minClients = 1;
  const maxClients = maxFurkids;

  const furkidLabel = isKinderPuppy ? 'puppy' : 'dog';
  const furkidLabelPlural = isKinderPuppy ? 'puppies' : 'dogs';

  useEffect(() => {
    if (isGroupClass) {
      loadSchedule();
    }
  }, [isGroupClass]);

  const loadSchedule = async () => {
    setLoadingSchedule(true);
    try {
      const settings = await base44.entities.Settings.filter({ setting_key: 'basic_manners_group_schedule' });
      
      if (settings && settings.length > 0) {
        setSchedule(settings[0].setting_value);
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const generateSessionDates = () => {
    if (!schedule || !schedule.start_date) return [];
    
    const sessions = [];
    const startDate = new Date(schedule.start_date);
    
    for (let i = 0; i < (schedule.weeks || 7); i++) {
      const sessionDate = new Date(startDate);
      
      if (i < 4) {
        sessionDate.setDate(startDate.getDate() + (i * 7));
      } else {
        sessionDate.setDate(startDate.getDate() + ((i + 1) * 7));
      }
      
      sessions.push({
        week: i + 1,
        date: sessionDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        isBreakWeek: false
      });
      
      if (i === 3) {
        const breakWeekDate = new Date(startDate);
        breakWeekDate.setDate(startDate.getDate() + (4 * 7));
        sessions.push({
          week: 'Break',
          date: breakWeekDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          isBreakWeek: true
        });
      }
    }
    
    return sessions;
  };

  const handleFurkidsChange = (value) => {
    const numFurkids = parseInt(value);
    
    const newFurkids = Array.from({ length: numFurkids }, (_, i) => formData.furkids?.[i] || {});
    
    setFormData({ 
      ...formData, 
      numberOfFurkids: numFurkids,
      furkids: newFurkids,
      numberOfClients: formData.numberOfClients > numFurkids ? numFurkids : formData.numberOfClients,
      clients: formData.clients || Array.from({ length: formData.numberOfClients || 1 }, (_, i) => formData.clients?.[i] || {})
    });
    if (errors.numberOfFurkids) {
      setErrors({ ...errors, numberOfFurkids: '' });
    }
  };

  const handleClientsChange = (value) => {
    const numClients = parseInt(value);
    
    // Initialize arrays with empty objects
    const newClients = Array.from({ length: numClients }, (_, i) => formData.clients?.[i] || {});
    
    setFormData({ 
      ...formData, 
      numberOfClients: numClients,
      clients: newClients
    });
    if (errors.numberOfClients) {
      setErrors({ ...errors, numberOfClients: '' });
    }
  };

  const validateAndContinue = () => {
    const newErrors = {};

    if (!formData.numberOfFurkids || formData.numberOfFurkids < minFurkids || formData.numberOfFurkids > maxFurkids) {
      newErrors.numberOfFurkids = `Please select ${minFurkids === maxFurkids ? minFurkids : `${minFurkids}-${maxFurkids}`} ${minFurkids === maxFurkids && minFurkids === 1 ? furkidLabel : furkidLabelPlural}`;
    }

    if (!formData.numberOfClients || formData.numberOfClients < minClients || formData.numberOfClients > maxClients) {
      newErrors.numberOfClients = `Please select ${minClients}-${maxClients} client(s)`;
    }

    if (formData.numberOfClients > formData.numberOfFurkids) {
      newErrors.numberOfClients = `Number of clients cannot exceed number of ${furkidLabelPlural}`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext();
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>How Many Participants?</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {isGroupClass && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Fixed 7-Week Schedule</h3>
            </div>
            
            {loadingSchedule ? (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading schedule...
              </div>
            ) : schedule && schedule.start_date ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-700 mb-3">
                  The program runs every {schedule.day_of_week} at {schedule.start_time} for 7 weeks:
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {generateSessionDates().map((session, index) => (
                    <div key={index} className={`flex items-center gap-3 p-2 rounded-lg border ${
                      session.isBreakWeek ? 'bg-amber-50 border-amber-200' : 'bg-white border-blue-100'
                    }`}>
                      <div className={`w-7 h-7 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                        session.isBreakWeek ? 'bg-amber-500' : 'bg-blue-600'
                      }`}>
                        {session.isBreakWeek ? '⏸' : session.week}
                      </div>
                      <div className="text-xs">
                        {session.isBreakWeek ? (
                          <>
                            <p className="font-medium text-amber-800">Break Week — No Session</p>
                            <p className="text-amber-700">{session.date}</p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-slate-900">Session {session.week}</p>
                            <p className="text-slate-600">{session.date} at {schedule.start_time}</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                ⚠️ Schedule not yet configured. Please contact admin to set up the class schedule.
              </p>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
          <p className="font-semibold text-slate-900 mb-2">Group Requirements:</p>
          <ul className="space-y-1 text-slate-700">
            <li>• This is a group training program</li>
            <li>• {isKinderPuppy ? '2 puppies required' : isGroupClass ? '1-4 dogs allowed' : '2-3 dogs allowed'}</li>
            <li>• Each {furkidLabel} must have at least one handler/client</li>
            <li>• ${service.price} per {furkidLabel}</li>
          </ul>
        </div>

        <div className="space-y-4">
          {/* Number of Furkids */}
          <div className="space-y-2">
            <Label htmlFor="numberOfFurkids" className="flex items-center gap-2">
              <PawPrint className="w-4 h-4" />
              Number of {isKinderPuppy ? 'Puppies' : 'Dogs'} *
            </Label>
            <Select
              value={formData.numberOfFurkids?.toString()}
              onValueChange={handleFurkidsChange}
            >
              <SelectTrigger className={errors.numberOfFurkids ? 'border-red-500' : ''}>
                <SelectValue placeholder={`Select ${minFurkids === maxFurkids ? minFurkids : `${minFurkids}-${maxFurkids}`} ${minFurkids === maxFurkids && minFurkids === 1 ? furkidLabel : furkidLabelPlural}`} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: maxFurkids - minFurkids + 1 }, (_, i) => minFurkids + i).map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num > 1 ? furkidLabelPlural : furkidLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.numberOfFurkids && (
              <p className="text-sm text-red-600">{errors.numberOfFurkids}</p>
            )}
          </div>

          {/* Number of Clients */}
          <div className="space-y-2">
            <Label htmlFor="numberOfClients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Number of Clients/Handlers *
            </Label>
            <Select
              value={formData.numberOfClients?.toString()}
              onValueChange={handleClientsChange}
              disabled={!formData.numberOfFurkids}
            >
              <SelectTrigger className={errors.numberOfClients ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select number of clients" />
              </SelectTrigger>
              <SelectContent>
                {formData.numberOfFurkids && Array.from({ length: Math.min(formData.numberOfFurkids, maxClients) }, (_, i) => i + 1).map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} Client{num > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.numberOfClients && (
              <p className="text-sm text-red-600">{errors.numberOfClients}</p>
            )}
            {formData.numberOfFurkids && (
              <p className="text-xs text-slate-500">
                Select 1-{Math.min(formData.numberOfFurkids, maxClients)} clients
              </p>
            )}
          </div>
        </div>

        {formData.numberOfFurkids && formData.numberOfClients && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-sm font-semibold text-green-900 mb-2">Summary:</p>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• {formData.numberOfFurkids} {formData.numberOfFurkids > 1 ? furkidLabelPlural : furkidLabel}</li>
              <li>• {formData.numberOfClients} Client{formData.numberOfClients > 1 ? 's' : ''}</li>
              <li>• Total Price: ${(service.price * formData.numberOfFurkids).toFixed(2)} (before discounts{!isGroupClass ? '/surcharges' : ''})</li>
            </ul>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={validateAndContinue} className="flex-1">
            Continue to Client Information
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}