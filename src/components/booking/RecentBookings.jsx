import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Clock } from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

export default function RecentBookings({ bookings }) {
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  const getClientName = (booking) => {
    if (booking.clients?.length > 0) {
      return booking.clients[0].client_name || booking.clients[0].clientName || "N/A";
    }
    return booking.client_name || "N/A";
  };

  const getFurkidName = (booking) => {
    if (booking.furkids?.length > 0) {
      return booking.furkids[0].furkid_name || booking.furkids[0].furkidName || "N/A";
    }
    return booking.furkid_name || "N/A";
  };

  if (recentBookings.length === 0) return null;

  return (
    <Card className="border-2 border-purple-200 bg-purple-50/60 shadow-md">
      <CardHeader className="pb-3 border-b border-purple-100">
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Clock className="w-5 h-5" />
          Recent Bookings
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {recentBookings.map((booking) => {
            const firstSession = booking.session_dates?.[0];
            return (
              <div
                key={booking.id}
                className="flex items-center justify-between bg-white rounded-lg px-4 py-3 shadow-sm border border-purple-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {getClientName(booking)}{" "}
                    <span className="text-slate-400 font-normal">·</span>{" "}
                    {getFurkidName(booking)}
                  </p>
                  <p className="text-sm text-slate-600 truncate">{booking.service_name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {firstSession && (
                      <span className="text-xs text-slate-500">
                        Starts {format(parseISO(firstSession.date), "MMM d, yyyy")}
                      </span>
                    )}
                    <span className="text-xs text-purple-600 font-medium">
                      Booked {formatDistanceToNow(new Date(booking.created_date.endsWith('Z') ? booking.created_date : booking.created_date + 'Z'), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <Badge className={`${statusColors[booking.booking_status]} border text-xs`}>
                    {booking.booking_status}
                  </Badge>
                  <Link to={createPageUrl(`BookingDetail?id=${booking.id}`)}>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}