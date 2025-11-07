import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Calendar, Clock, Users } from "lucide-react";

export default function ServiceSelection({ service, onNext }) {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>Service Details</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-slate-600">Price</p>
              <p className="font-semibold text-lg">${service.price} per dog</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-slate-600">Sessions</p>
              <p className="font-semibold">{service.sessions} session{service.sessions > 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-slate-600">Duration</p>
              <p className="font-semibold">{service.duration} hour{service.duration > 1 ? 's' : ''} per session</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-slate-600">Participants</p>
              <p className="font-semibold">Maximum {service.sessions} dog{service.sessions > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2 text-sm">
          <p className="font-semibold text-slate-900">Booking Information:</p>
          <ul className="space-y-1 text-slate-700">
            <li>• 10% discount for adopted dogs (proof required)</li>
            <li>• 5% weekend surcharge applies</li>
            <li>• Minimum 2 days advance booking</li>
          </ul>
        </div>

        <Button onClick={onNext} className="w-full">
          Continue to Schedule
        </Button>
      </CardContent>
    </Card>
  );
}