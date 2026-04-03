import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, DollarSign, Users, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WhatsAppButton from "../components/booking/WhatsAppButton";
import { format, addWeeks } from "date-fns";

const services = [
  {
    id: "kinder_puppy_in_home",
    name: "Kinder Puppy Program",
    price: 520,
    duration: 1,
    sessions: 4,
    minParticipants: 1,
    maxParticipants: 3,
    description: "In-home puppy training. Sessions 1-2 weekly, 1-week break, then sessions 3-4. 2nd & 3rd puppy at half price each."
  },
  {
    id: "basic_manners_fyog",
    name: "Basic Manners Program",
    price: 720,
    duration: 1,
    sessions: 6,
    minParticipants: 1,
    maxParticipants: 4,
    description: "Comprehensive in-home training. Sessions 1-4 weekly, 1-week break, then sessions 5-6. 2nd–4th dog at half price each."
  },
  {
    id: "adore_hdb_approval",
    name: "ADORE/HDB Approval Program",
    price: 520,
    duration: 0.75,
    sessions: 4,
    minParticipants: 1,
    maxParticipants: 1,
    description: "Suitable for dogs that require ADORE training or HDB approval but do not need the full comprehensive training programme."
  },
  {
    id: "canine_assessment",
    name: "Canine Assessment",
    price: 158,
    duration: 0.75,
    sessions: 1,
    minParticipants: 1,
    maxParticipants: 1,
    description: "Comprehensive behavioral assessment, single 45-minute session"
  },
  {
    id: "behavioural_modification",
    name: "Behavioural Modification (In-Home)",
    price: 358,
    duration: 1.5,
    sessions: 2,
    minParticipants: 1,
    maxParticipants: 1,
    description: "Specialized behavior modification, 2 sessions 3 weeks apart"
  },
  {
    id: "on_demand_training",
    name: "On-Demand Training",
    price: 120,
    duration: 1,
    sessions: "1-3",
    minParticipants: 1,
    maxParticipants: 1,
    description: "Flexible training sessions tailored to your needs - choose 1, 2, or 3 sessions"
  },
  {
    id: "basic_manners_group_class",
    name: "Basic Manners Program (Group)",
    price: 520,
    duration: 1,
    sessions: 7,
    minParticipants: 1,
    maxParticipants: 4,
    description: "Group class training. Sessions 1-4 weekly, 1-week break, then sessions 5-7 weekly with fixed schedule"
  }
];

export default function BookingSystem() {
  const [groupClassSchedule, setGroupClassSchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  useEffect(() => {
    const loadGroupClassSchedule = async () => {
      try {
        const settings = await base44.entities.Settings.filter({ 
          setting_key: 'basic_manners_group_schedule' 
        });
        
        if (settings && settings.length > 0) {
          setGroupClassSchedule(settings[0].setting_value);
        }
      } catch (error) {
        console.error('Error loading group class schedule:', error);
      } finally {
        setLoadingSchedule(false);
      }
    };

    loadGroupClassSchedule();
  }, []);

  const getParticipantLabel = (service) => {
    const isKinderPuppy = service.id === 'kinder_puppy_in_home';
    const label = isKinderPuppy ? 'puppy' : 'dog';
    const labelPlural = isKinderPuppy ? 'puppies' : 'dogs';
    
    if (service.minParticipants === service.maxParticipants) {
      return service.maxParticipants > 1 
        ? `${service.maxParticipants} ${labelPlural}`
        : `${service.maxParticipants} ${label}`;
    } else {
      return `${service.minParticipants}-${service.maxParticipants} ${labelPlural}`;
    }
  };

  const formatScheduleInfo = () => {
    if (!groupClassSchedule || !groupClassSchedule.start_date) {
      return null;
    }

    try {
      const startDate = new Date(groupClassSchedule.start_date);
      
      // Use the day_of_week string directly if provided, otherwise calculate from date
      let dayOfWeek;
      if (groupClassSchedule.day_of_week && typeof groupClassSchedule.day_of_week === 'string') {
        dayOfWeek = groupClassSchedule.day_of_week;
      } else {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        dayOfWeek = dayNames[startDate.getDay()];
      }
      
      return {
        date: format(startDate, 'MMM d, yyyy'),
        dayOfWeek,
        time: groupClassSchedule.start_time || 'TBD'
      };
    } catch (error) {
      console.error('Error formatting schedule:', error);
      return null;
    }
  };

  const formatDuration = (duration, serviceId) => {
    if (duration === 0.75) {
      return '45 mins';
    } else if (duration === 1 && serviceId === 'on_demand_training') {
      return '45mins to 1 hour';
    } else if (duration === 1 && serviceId === 'basic_manners_fyog') {
      return '45 mins to 1 hour';
    } else if (duration === 1) {
      return '1 hour';
    } else if (duration === 1.5) {
      return '1.5 hours';
    } else {
      return `${duration} hour${duration > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <div className="text-center space-y-3 md:space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Book Your Training Session</h1>
          <p className="text-base md:text-lg text-slate-600">Choose the perfect training program for your furry friend</p>
          
          <div className="flex justify-center">
            <WhatsAppButton 
              variant="outline" 
              className="border-green-500 text-green-700 hover:bg-green-50"
            />
          </div>
        </div>

        <Card className="shadow-lg border-0 bg-blue-50/50 backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <h3 className="font-semibold text-slate-900 mb-3 text-base md:text-lg">Booking Information</h3>
            <ul className="space-y-2 text-base md:text-lg text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Minimum 2 days advance booking required (7 days for Behavioural Modification)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>10% discount for adopted puppies/dogs (proof required)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>5% weekend surcharge applies to Saturday and Sunday bookings (except Group Class)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Available Monday-Saturday: 10am-7pm, Sunday: 10am-3:30pm</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {services.map((service) => {
            const isKinderPuppy = service.id === 'kinder_puppy_in_home';
            const perLabel = isKinderPuppy ? 'puppy' : 'dog';
            const isOnDemand = service.id === 'on_demand_training';
            const isGroupClass = service.id === 'basic_manners_group_class';
            const scheduleInfo = isGroupClass ? formatScheduleInfo() : null;
            
            return (
              <Card key={service.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200 flex flex-col">
                <CardHeader className="border-b border-slate-100 p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl text-slate-900">{service.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4 flex-grow flex flex-col">
                  <p className="text-slate-600 text-base md:text-lg flex-grow">{service.description}</p>
                  
                  {isGroupClass && scheduleInfo && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 md:p-3 space-y-1">
                      <p className="text-sm font-semibold text-purple-900 uppercase">Next Program Commence</p>
                          <div className="text-base md:text-lg text-purple-800">
                            <p className="font-semibold">{scheduleInfo.dayOfWeek}s at {scheduleInfo.time}</p>
                            <p className="text-sm">Starts: {scheduleInfo.date}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2.5 md:space-y-3">
                    {!isOnDemand && (
                      <div className="flex items-center gap-2 text-base md:text-lg text-slate-700">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        {(isKinderPuppy || service.id === 'basic_manners_fyog') ? (
                          <span className="font-semibold">from ${service.price}</span>
                        ) : (
                          <>
                            <span className="font-semibold">${service.price}</span>
                            <span className="text-slate-500">per {perLabel}</span>
                          </>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-base md:text-lg text-slate-700">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>{service.sessions} session{typeof service.sessions === 'string' || service.sessions > 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-base md:text-lg text-slate-700">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span>{formatDuration(service.duration, service.id)} per session</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-base md:text-lg text-slate-700">
                      <Users className="w-4 h-4 text-orange-600" />
                      <span>{getParticipantLabel(service)}</span>
                    </div>
                  </div>

                  <Link to={createPageUrl(`BookService?service=${service.id}`)} className="mt-auto">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-sm md:text-base">
                      Book Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </div>
  );
}