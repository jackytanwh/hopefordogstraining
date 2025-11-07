import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

export default function BookingCalendar() {
  const [bookings, setBookings] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateBookings, setSelectedDateBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Booking.list();
      setBookings(data.filter(b => b.booking_status !== 'cancelled'));
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBookingsForDate = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayBookings = [];

    bookings.forEach(booking => {
      booking.session_dates?.forEach(session => {
        if (session.date === dateString) {
          dayBookings.push({
            ...booking,
            session: session
          });
        }
      });
    });

    return dayBookings;
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedDateBookings(getBookingsForDate(date));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Booking Calendar</h1>
          <p className="text-slate-600 mt-1">View all scheduled training sessions</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {format(currentMonth, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {/* Week day headers */}
                {weekDays.map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map(day => {
                  const dayBookings = getBookingsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={day.toString()}
                      onClick={() => handleDateClick(day)}
                      className={`
                        min-h-[80px] p-2 border rounded-lg text-left transition-all
                        ${!isCurrentMonth ? 'bg-slate-50 text-slate-400' : 'bg-white'}
                        ${isToday ? 'border-blue-500 border-2' : 'border-slate-200'}
                        ${isSelected ? 'bg-blue-50 border-blue-400' : ''}
                        ${dayBookings.length > 0 ? 'hover:bg-blue-50' : 'hover:bg-slate-50'}
                      `}
                    >
                      <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      {dayBookings.length > 0 && (
                        <div className="space-y-1">
                          {dayBookings.slice(0, 2).map((booking, idx) => (
                            <div
                              key={idx}
                              className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate"
                            >
                              {booking.session.start_time} - {booking.furkid_name}
                            </div>
                          ))}
                          {dayBookings.length > 2 && (
                            <div className="text-xs text-slate-500">
                              +{dayBookings.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Details */}
        <div>
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {!selectedDate ? (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">Click on a date to view bookings</p>
                </div>
              ) : selectedDateBookings.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No bookings for this date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateBookings.map((booking, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-slate-900">{booking.furkid_name}</p>
                          <p className="text-xs text-slate-600">{booking.client_name}</p>
                        </div>
                        <Badge variant="secondary" className={`${statusColors[booking.booking_status]} border text-xs`}>
                          {booking.booking_status}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-slate-600 space-y-1">
                        <p className="font-medium">{booking.service_name}</p>
                        <p>Session {booking.session.session_number} of {booking.session_dates?.length}</p>
                        <p className="font-medium text-blue-600">
                          {booking.session.start_time} - {booking.session.end_time}
                        </p>
                      </div>

                      <Link to={createPageUrl(`BookingDetail?id=${booking.id}`)}>
                        <Button size="sm" variant="outline" className="w-full mt-2">
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mt-4">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
                <span>Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 rounded"></div>
                <span>Has bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`${statusColors.pending} border text-xs`}>Pending</Badge>
                <span>Awaiting confirmation</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`${statusColors.confirmed} border text-xs`}>Confirmed</Badge>
                <span>Confirmed booking</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}