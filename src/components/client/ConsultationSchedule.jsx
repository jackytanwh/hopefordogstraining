import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

export default function ConsultationSchedule({ client }) {
  const consultations = [
    {
      type: 'Initial Consultation',
      date: client.initial_consultation_date,
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    client.follow_up_date && {
      type: 'Follow-up',
      date: client.follow_up_date,
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    client.second_consultation_date && {
      type: 'Second Consultation',
      date: client.second_consultation_date,
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    }
  ].filter(Boolean);

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <Calendar className="w-5 h-5" />
          Consultation Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {consultations.map((consultation, index) => {
            const isPastDate = isPast(parseISO(consultation.date));
            
            return (
              <div key={index} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  {isPastDate ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-blue-600" />
                  )}
                  <div>
                    <h4 className="font-medium text-slate-900">
                      {consultation.type}
                    </h4>
                    <p className="text-sm text-slate-600">
                      {format(parseISO(consultation.date), "EEEE, MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                
                <Badge 
                  variant="secondary"
                  className={`${consultation.color} border ${isPastDate ? 'opacity-70' : ''}`}
                >
                  {isPastDate ? 'Completed' : 'Scheduled'}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}