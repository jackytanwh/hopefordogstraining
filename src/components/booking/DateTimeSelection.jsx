
import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Loader2, AlertCircle, X, Check, AlertTriangle } from "lucide-react";
import { format, addDays, addWeeks } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

const timeSlots = [
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"
];

const sundayTimeSlots = [
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"
];

export default function DateTimeSelection({ service, formData, setFormData, onNext }) {
  const [selectedDates, setSelectedDates] = useState(formData.sessionDates || []);
  const [errors, setErrors] = useState({});
  const [schedulingMode, setSchedulingMode] = useState('recurring');
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [dailyBookingCounts, setDailyBookingCounts] = useState({});
  const [rescheduledSessions, setRescheduledSessions] = useState([]);
  const [showRescheduleInfo, setShowRescheduleInfo] = useState(false);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoadingBookings(true);
        const allBookings = await base44.entities.Booking.list();
        const activeBookings = allBookings.filter(b => b.booking_status !== 'cancelled');
        setBookings(activeBookings);
        
        const counts = {};
        activeBookings.forEach(booking => {
          if (booking.session_dates && Array.isArray(booking.session_dates)) {
            booking.session_dates.forEach(session => {
              if (session.date) {
                counts[session.date] = (counts[session.date] || 0) + 1;
              }
            });
          }
        });
        setDailyBookingCounts(counts);
      } catch (error) {
        console.error("Error loading bookings:", error);
      } finally {
        setLoadingBookings(false);
      }
    };

    loadBookings();
  }, []);

  const minAdvanceDays = service.id === 'behavioural_modification' ? 7 : 2;
  const minDate = addDays(new Date(), minAdvanceDays);

  const isRecurringApplicable = service.id !== 'canine_assessment' && 
                                service.id !== 'behavioural_modification';

  const isWeekdaysOnly = service.id === 'canine_assessment' || 
                         service.id === 'behavioural_modification';

  const isAutoRecurring = service.id === 'behavioural_modification';

  const isBiweekly = service.id === 'kinder_puppy_in_home' || service.id === 'kinder_puppy_fyog';

  // Check if this is an on-demand training with multiple sessions
  const isOnDemandMultiSession = service.id === 'on_demand_training' && service.sessions > 1;
  
  // On-demand uses 3-week intervals
  const isThreeWeekly = isOnDemandMultiSession;

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const isTimeSlotBooked = (date, startTime) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const startMinutes = timeToMinutes(startTime);
    
    const sessionDurationMinutes = service.duration * 60;
    const endMinutes = startMinutes + sessionDurationMinutes + 60;

    for (const booking of bookings) {
      if (!booking.session_dates) continue;

      for (const session of booking.session_dates) {
        if (session.date === dateString && session.start_time && session.end_time) {
          const bookedStartMinutes = timeToMinutes(session.start_time);
          const bookedEndMinutes = timeToMinutes(session.end_time);
          
          const bookedEndWithBuffer = bookedEndMinutes + 60;

          if (
            (startMinutes >= bookedStartMinutes && startMinutes < bookedEndWithBuffer) ||
            (endMinutes > bookedStartMinutes && endMinutes <= bookedEndWithBuffer) ||
            (startMinutes <= bookedStartMinutes && endMinutes >= bookedEndWithBuffer)
          ) {
            return true;
          }
        }
      }
    }

    return false;
  };

  const getAvailableTimeSlots = (date) => {
    if (!date) return [];
    const dayOfWeek = date.getDay();
    
    const baseSlots = dayOfWeek === 0 ? sundayTimeSlots : timeSlots;
    
    return baseSlots.filter(timeSlot => !isTimeSlotBooked(date, timeSlot));
  };

  const isDateDisabled = (date) => {
    if (date < minDate) return true;
    
    if (isWeekdaysOnly) {
      const dayOfWeek = date.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6;
    }
    
    const dayOfWeek = date.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const dateString = format(date, 'yyyy-MM-dd');
      const bookingCount = dailyBookingCounts[dateString] || 0;
      if (bookingCount >= 3) {
        return true;
      }
    }
    
    return false;
  };

  const findNextAvailableSlot = (date, currentTime) => {
    // Try to find next available time on the same day
    const availableSlots = getAvailableTimeSlots(date);
    const currentTimeMinutes = timeToMinutes(currentTime);
    
    const laterSlots = availableSlots.filter(slot => timeToMinutes(slot) > currentTimeMinutes);
    
    if (laterSlots.length > 0) {
      return { date, time: laterSlots[0] };
    }
    
    // If no later slots on same day, try next 30 days
    for (let i = 1; i <= 30; i++) {
      const nextDate = addDays(date, i);
      
      if (isDateDisabled(nextDate)) continue;
      
      const nextDaySlots = getAvailableTimeSlots(nextDate);
      if (nextDaySlots.length > 0) {
        return { date: nextDate, time: nextDaySlots[0] };
      }
    }
    
    return null;
  };

  const autoFillWithRescheduling = (firstSession) => {
    if (!firstSession || !firstSession.date || !firstSession.start_time) {
      return;
    }

    const newDates = [firstSession];
    const rescheduled = [];
    
    try {
      let weeksApart = 1;
      
      if (isAutoRecurring) {
        weeksApart = 3;
      } else if (isBiweekly) {
        weeksApart = 2;
      } else if (isThreeWeekly) { // Added for on_demand_training with multiple sessions
        weeksApart = 3;
      }
      
      for (let i = 1; i < service.sessions; i++) {
        const baseDate = new Date(firstSession.date);
        const originalDate = addWeeks(baseDate, i * weeksApart);
        const startMinutes = timeToMinutes(firstSession.start_time);
        const durationMinutes = service.duration * 60;
        const endTime = minutesToTime(startMinutes + durationMinutes);
        
        let finalDate = originalDate;
        let finalTime = firstSession.start_time;
        let wasRescheduled = false;
        
        // Check if this slot is available
        if (isDateDisabled(originalDate) || isTimeSlotBooked(originalDate, firstSession.start_time)) {
          // Find next available slot
          const alternative = findNextAvailableSlot(originalDate, firstSession.start_time);
          
          if (alternative) {
            finalDate = alternative.date;
            finalTime = alternative.time;
            wasRescheduled = true;
            
            rescheduled.push({
              session_number: i + 1,
              original_date: format(originalDate, 'EEE, MMM d, yyyy'),
              original_time: firstSession.start_time,
              new_date: format(alternative.date, 'EEE, MMM d, yyyy'),
              new_time: alternative.time,
              reason: isDateDisabled(originalDate) 
                ? "Original date unavailable" 
                : "Time slot already booked"
            });
          }
        }
        
        const finalEndTime = minutesToTime(timeToMinutes(finalTime) + durationMinutes);
        
        newDates.push({
          session_number: i + 1,
          date: format(finalDate, 'yyyy-MM-dd'),
          start_time: finalTime,
          end_time: finalEndTime,
          was_rescheduled: wasRescheduled
        });
      }
      
      setSelectedDates(newDates);
      setRescheduledSessions(rescheduled);
      setShowRescheduleInfo(rescheduled.length > 0);
      setErrors({});
    } catch (error) {
      console.error('Error auto-filling sessions:', error);
    }
  };

  const handleDateSelect = (sessionNumber, date) => {
    if (!date) return;
    
    const newDates = [...selectedDates];
    const existingIndex = newDates.findIndex(s => s.session_number === sessionNumber);
    
    let updatedSession;
    if (existingIndex >= 0) {
      updatedSession = {
        ...newDates[existingIndex],
        date: format(date, 'yyyy-MM-dd')
      };
      newDates[existingIndex] = updatedSession;
    } else {
      updatedSession = {
        session_number: sessionNumber,
        date: format(date, 'yyyy-MM-dd'),
        start_time: '',
        end_time: ''
      };
      newDates.push(updatedSession);
    }
    
    setSelectedDates(newDates);
    setRescheduledSessions([]);
    setShowRescheduleInfo(false);

    if ((isAutoRecurring || isThreeWeekly || (schedulingMode === 'recurring' && isRecurringApplicable)) && sessionNumber === 1) {
      if (updatedSession.start_time) {
        autoFillWithRescheduling(updatedSession);
      }
    }
  };

  const handleTimeSelect = (sessionNumber, startTime) => {
    const newDates = [...selectedDates];
    const sessionIndex = newDates.findIndex(s => s.session_number === sessionNumber);
    
    if (sessionIndex !== -1) {
      const session = newDates[sessionIndex];
      const startMinutes = timeToMinutes(startTime);
      const durationMinutes = service.duration * 60;
      const endMinutes = startMinutes + durationMinutes;
      const endTime = minutesToTime(endMinutes);
      
      newDates[sessionIndex] = {
        ...session,
        start_time: startTime,
        end_time: endTime
      };
    }
    
    setSelectedDates(newDates);
    setRescheduledSessions([]);
    setShowRescheduleInfo(false);

    if ((isAutoRecurring || isThreeWeekly || (schedulingMode === 'recurring' && isRecurringApplicable)) && sessionNumber === 1) {
      const firstSession = newDates.find(s => s.session_number === 1);
      if (firstSession && firstSession.date) {
        autoFillWithRescheduling(firstSession);
      }
    }
  };

  const handleSwitchToManual = () => {
    setSchedulingMode('manual');
    setRescheduledSessions([]);
    setShowRescheduleInfo(false);
    
    const firstSession = selectedDates.find(s => s.session_number === 1);
    if (firstSession) {
      setSelectedDates([firstSession]);
    } else {
      setSelectedDates([]);
    }
  };

  const handleSchedulingModeChange = (mode) => {
    setSchedulingMode(mode);
    setRescheduledSessions([]);
    setShowRescheduleInfo(false);
    
    if (mode === 'recurring' && selectedDates[0]?.date && selectedDates[0]?.start_time && (isRecurringApplicable || isThreeWeekly)) {
      autoFillWithRescheduling(selectedDates[0]);
    }
    if (mode === 'manual') {
      const firstSession = selectedDates.find(s => s.session_number === 1);
      if (firstSession) {
        setSelectedDates([firstSession]);
      } else {
        setSelectedDates([]);
      }
    }
  };

  const validateAndContinue = () => {
    const newErrors = {};
    
    if (selectedDates.length !== service.sessions) {
      newErrors.general = `Please schedule all ${service.sessions} session${service.sessions > 1 ? 's' : ''}`;
    }
    
    selectedDates.forEach(session => {
      if (!session.date || !session.start_time) {
        newErrors.general = 'Please complete date and time for all sessions';
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setFormData({ ...formData, sessionDates: selectedDates });
    onNext();
  };

  const hasManualSelections = schedulingMode === 'manual' && selectedDates.some(s => s.date && s.start_time);

  if (loadingBookings) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
          <p className="text-slate-600">Checking available time slots...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>Schedule Your Session{service.sessions > 1 ? 's' : ''}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {errors.general}
          </div>
        )}

        {isWeekdaysOnly && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-slate-700">
            <p className="font-semibold">📅 Weekdays Only</p>
            <p className="text-xs mt-1">
              This service is only available Monday to Friday.
              {isAutoRecurring && ' Minimum 7 days advance booking required.'}
            </p>
          </div>
        )}

        {isAutoRecurring && (
          <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-sm text-slate-700">
            <p className="font-semibold">🔄 Auto-Recurring Sessions</p>
            <p className="text-xs mt-1">
              This program consists of 2 sessions scheduled 3 weeks apart. Select your first session date and time, and the second session will be automatically scheduled.
            </p>
          </div>
        )}

        {isThreeWeekly && schedulingMode === 'recurring' && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm text-slate-700">
            <p className="font-semibold">📆 Three-Weekly Sessions</p>
            <p className="text-xs mt-1">
              Sessions are scheduled every 3 weeks. Select the date and time for your first session, and we'll automatically schedule the rest on the same day and time every 3 weeks.
            </p>
          </div>
        )}

        {isBiweekly && schedulingMode === 'recurring' && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm text-slate-700">
            <p className="font-semibold">📆 Biweekly Sessions</p>
            <p className="text-xs mt-1">
              Sessions are scheduled every 2 weeks. Select the date and time for your first session, and we'll automatically schedule the rest on the same day and time every 2 weeks.
            </p>
          </div>
        )}

        {(isRecurringApplicable || isThreeWeekly) && (
          <div className="space-y-2">
            <Label>Scheduling Preference</Label>
            <Select value={schedulingMode} onValueChange={handleSchedulingModeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recurring">
                  Recurring sessions (same day/time {isThreeWeekly ? 'every 3 weeks' : isBiweekly ? 'every 2 weeks' : 'each week'})
                </SelectItem>
                <SelectItem value="manual">Choose my own date and time for each session</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {((schedulingMode === 'recurring' && (isRecurringApplicable || isThreeWeekly)) || isAutoRecurring) ? (
          <div className="border border-slate-200 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-slate-900">
              {isAutoRecurring 
                ? 'First Session (Second session will be auto-scheduled 3 weeks later)' 
                : isThreeWeekly
                ? 'First Session (Others will auto-fill every 3 weeks)'
                : isBiweekly
                ? 'First Session (Others will auto-fill every 2 weeks)'
                : 'First Session (Others will auto-fill weekly)'}
            </h3>
            
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Calendar
                mode="single"
                selected={selectedDates[0]?.date ? new Date(selectedDates[0].date) : null}
                onSelect={(date) => handleDateSelect(1, date)}
                disabled={isDateDisabled}
                weekStartsOn={1}
                className="rounded-md border"
              />
            </div>

            {selectedDates[0]?.date && (
              <div className="space-y-2">
                <Label>Select Time</Label>
                {getAvailableTimeSlots(new Date(selectedDates[0].date)).length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                    No available time slots for this date. Please select another date.
                  </div>
                ) : (
                  <>
                    <Select 
                      value={selectedDates[0]?.start_time || ''} 
                      onValueChange={(time) => handleTimeSelect(1, time)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableTimeSlots(new Date(selectedDates[0].date)).map(time => (
                          <SelectItem key={time} value={time}>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {time}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedDates[0]?.start_time && (
                      <p className="text-sm text-slate-600">
                        Session: {selectedDates[0].start_time} - {selectedDates[0].end_time}
                      </p>
                    )}

                    {showRescheduleInfo && rescheduledSessions.length > 0 && (
                      <Alert className="bg-amber-50 border-amber-300 mt-4">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <AlertDescription>
                          <div className="space-y-3">
                            <p className="font-semibold text-amber-900">
                              📅 Schedule Adjusted
                            </p>
                            <p className="text-sm text-amber-800">
                              Some sessions were automatically rescheduled to the next available time slots:
                            </p>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {rescheduledSessions.map((reschedule, idx) => (
                                <div key={idx} className="bg-white p-3 rounded border border-amber-200 text-sm">
                                  <p className="font-medium text-amber-900 mb-1">
                                    Session {reschedule.session_number}
                                  </p>
                                  <div className="text-amber-700 text-xs space-y-1">
                                    <p><span className="line-through">{reschedule.original_date} at {reschedule.original_time}</span></p>
                                    <p className="flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      <span className="font-semibold">Rescheduled to:</span> {reschedule.new_date} at {reschedule.new_time}
                                    </p>
                                    <p className="text-amber-600 italic">{reschedule.reason}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="bg-white border border-amber-200 p-3 rounded-lg mt-3">
                              <p className="text-xs text-slate-700">
                                💬 <span className="font-medium">Note:</span> Our admin team can help adjust these sessions if needed. 
                                Contact us at <span className="font-semibold">+65 8222 8376</span> after booking.
                              </p>
                            </div>
                            {!isAutoRecurring && (
                              <div className="pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleSwitchToManual}
                                  className="w-full"
                                >
                                  Schedule Each Session Manually Instead
                                </Button>
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </div>
            )}

            {selectedDates.length === service.sessions && !showRescheduleInfo && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="font-medium text-sm text-slate-900 mb-2">✅ Your Schedule Preview:</p>
                <div className="space-y-1">
                  {selectedDates.map((session, idx) => (
                    <div key={idx} className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                      Session {session.session_number}: {format(new Date(session.date), 'EEE, MMM d, yyyy')} at {session.start_time}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDates.length === service.sessions && showRescheduleInfo && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="font-medium text-sm text-slate-900 mb-2">📅 Final Schedule:</p>
                <div className="space-y-2">
                  {selectedDates.map((session, idx) => (
                    <div 
                      key={idx} 
                      className={`text-sm p-3 rounded-lg border ${
                        session.was_rescheduled 
                          ? 'bg-amber-50 border-amber-200 text-amber-900' 
                          : 'bg-green-50 border-green-200 text-green-900'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">Session {session.session_number}</p>
                          <p className="text-xs mt-0.5">
                            {format(new Date(session.date), 'EEEE, MMM d, yyyy')} at {session.start_time} - {session.end_time}
                          </p>
                        </div>
                        {session.was_rescheduled && (
                          <span className="text-xs bg-amber-200 text-amber-900 px-2 py-1 rounded-full font-medium">
                            Rescheduled
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {Array.from({ length: service.sessions }, (_, i) => i + 1).map(sessionNumber => {
              const session = selectedDates.find(s => s.session_number === sessionNumber);
              const selectedDate = session?.date ? new Date(session.date) : null;
              
              return (
                <div key={sessionNumber} className="border border-slate-200 rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-slate-900">
                    {service.sessions === 1 ? 'Select Date & Time' : `Session ${sessionNumber}`}
                  </h3>
                  
                  <div className="space-y-2">
                    <Label>Select Date</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => handleDateSelect(sessionNumber, date)}
                      disabled={isDateDisabled}
                      weekStartsOn={1}
                      className="rounded-md border"
                    />
                  </div>

                  {session?.date && (
                    <div className="space-y-2">
                      <Label>Select Time</Label>
                      {getAvailableTimeSlots(new Date(session.date)).length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                          No available time slots for this date. Please select another date.
                        </div>
                      ) : (
                        <>
                          <Select 
                            value={session.start_time || ''} 
                            onValueChange={(time) => handleTimeSelect(sessionNumber, time)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose time slot" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableTimeSlots(new Date(session.date)).map(time => (
                                <SelectItem key={time} value={time}>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {time}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {session.start_time && (
                            <p className="text-sm text-slate-600">
                              Session: {session.start_time} - {session.end_time}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {hasManualSelections && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="font-medium text-sm text-slate-900 mb-3">📅 Your Schedule Summary:</p>
            <div className="space-y-2">
              {selectedDates
                .filter(s => s.date && s.start_time)
                .sort((a, b) => a.session_number - b.session_number)
                .map((session, idx) => (
                  <div key={idx} className="text-sm text-slate-700 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <span className="font-semibold">Session {session.session_number}:</span>{' '}
                    {format(new Date(session.date), 'EEEE, MMM d, yyyy')} at {session.start_time} - {session.end_time}
                  </div>
                ))}
            </div>
            {selectedDates.filter(s => s.date && s.start_time).length < service.sessions && (
              <p className="text-xs text-slate-500 mt-2">
                {service.sessions - selectedDates.filter(s => s.date && s.start_time).length} more session{service.sessions - selectedDates.filter(s => s.date && s.start_time).length > 1 ? 's' : ''} to schedule
              </p>
            )}
          </div>
        )}

        <Button 
          onClick={validateAndContinue} 
          className="w-full" 
        >
          Continue to Your Information
        </Button>
      </CardContent>
    </Card>
  );
}
