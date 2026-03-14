import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Phone, PawPrint, Clock, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const consultationColors = {
  'Initial': 'bg-blue-100 text-blue-800 border-blue-200',
  'Follow-up': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Second': 'bg-purple-100 text-purple-800 border-purple-200'
};

export default function UpcomingConsultations({ consultations, loading }) {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100 p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <Calendar className="w-5 h-5" />
          Upcoming Consultations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {loading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 md:p-4 border border-slate-200 rounded-lg animate-pulse">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-24 md:w-32"></div>
                    <div className="h-3 bg-slate-200 rounded w-20 md:w-24"></div>
                  </div>
                </div>
                <div className="h-6 bg-slate-200 rounded w-16 md:w-20"></div>
              </div>
            ))}
          </div>
        ) : consultations.length === 0 ? (
          <div className="text-center py-8 px-2 md:px-4">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No upcoming consultations</h3>
            <p className="text-slate-500">Your calendar is clear for the next 7 days.</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {consultations.map((consultation) => (
              <div key={`${consultation.id}-${consultation.consultation_type}`} 
                   className="flex items-center justify-between p-3 md:p-4 border border-slate-200 rounded-lg hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200">
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <PawPrint className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-slate-900 truncate text-sm md:text-base">{consultation.client_name}</h4>
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-xs md:text-sm text-slate-600 mt-1">
                      <span className="truncate">{consultation.dog_name}</span>
                      <span className="hidden md:inline flex-shrink-0">•</span>
                      <div className="flex items-center gap-1 min-w-0">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{consultation.mobile_number}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-3 flex-shrink-0 ml-2 md:ml-4">
                  <div className="text-right">
                    <Badge 
                      variant="secondary"
                      className={`${consultationColors[consultation.consultation_type]} border mb-1 text-xs`}
                    >
                      {consultation.consultation_type}
                    </Badge>
                    <div className="text-xs md:text-sm text-slate-600 whitespace-nowrap">
                      {format(parseISO(consultation.date), "MMM d, yyyy")}
                    </div>
                  </div>
                  
                  <Link to={createPageUrl(`ClientDetail?id=${consultation.id}`)}>
                    <Button variant="outline" size="sm" className="flex-shrink-0 h-8 w-8 md:h-9 md:w-auto md:px-3">
                      <Eye className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}