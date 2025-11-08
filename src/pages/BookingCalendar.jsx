import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar, ChevronLeft, ChevronRight, Eye, Ban, Trash2, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

const timeSlots = [
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"
];

const sundayTimeSlots = [
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"
];

export default function BookingCalendar() {
  const [bookings, setBookings] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateBookings, setSelectedDateBookings] = useState([]);
  const [selectedDateBlocks, setSelectedDateBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('view'); // 'view' or 'block'
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockForm, setBlockForm] = useState({
    date: '',
    is_full_day: false,
    start_time: '',
    end_time: '',
    reason: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsData, blocksData] = await Promise.all([
        base44.entities.Booking.list(),
        base44.entities.BlockedSlot.list()
      ]);
      setBookings(bookingsData.filter(b => b.booking_status !== 'cancelled'));
      setBlockedSlots(blocksData);
    } catch (error) {
      console.error("Error loading data:", error);
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

  const getBlockedSlotsForDate = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return blockedSlots.filter(block => block.date === dateString);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedDateBookings(getBookingsForDate(date));
    setSelectedDateBlocks(getBlockedSlotsForDate(date));

    if (viewMode === 'block') {
      setBlockForm({
        date: format(date, 'yyyy-MM-dd'),
        is_full_day: false,
        start_time: '',
        end_time: '',
        reason: ''
      });
      setShowBlockDialog(true);
    }
  };

  const handleBlockTimeSlot = async () => {
    setSaving(true);
    try {
      await base44.entities.BlockedSlot.create(blockForm);
      await loadData();
      setShowBlockDialog(false);
      setBlockForm({
        date: '',
        is_full_day: false,
        start_time: '',
        end_time: '',
        reason: ''
      });
    } catch (error) {
      console.error("Error blocking time slot:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlock = async (blockId) => {
    try {
      await base44.entities.BlockedSlot.delete(blockId);
      await loadData();
      setSelectedDateBlocks(prev => prev.filter(b => b.id !== blockId));
    } catch (error) {
      console.error("Error deleting blocked slot:", error);
    }
  };

  const getAvailableTimeSlots = () => {
    if (!selectedDate) return [];
    const dayOfWeek = selectedDate.getDay();
    return dayOfWeek === 0 ? sundayTimeSlots : timeSlots;
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Booking Calendar</h1>
          <p className="text-slate-600 mt-1">View and manage scheduled training sessions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant={viewMode === 'view' ? 'default' : 'outline'}
            onClick={() => setViewMode('view')}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Mode
          </Button>
          <Button
            variant={viewMode === 'block' ? 'default' : 'outline'}
            onClick={() => setViewMode('block')}
            className="flex items-center gap-2"
          >
            <Ban className="w-4 h-4" />
            Block Time
          </Button>
        </div>
      </div>

      {viewMode === 'block' && (
        <Card className="shadow-lg border-0 bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Ban className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Block Time Mode Active</p>
                <p className="text-sm text-amber-800 mt-1">Click on any date to block time slots or the entire day. Blocked times will not be available for client bookings.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  const dayBlocks = getBlockedSlotsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const hasFullDayBlock = dayBlocks.some(b => b.is_full_day);

                  return (
                    <button
                      key={day.toString()}
                      onClick={() => handleDateClick(day)}
                      className={`
                        min-h-[80px] p-2 border rounded-lg text-left transition-all relative
                        ${!isCurrentMonth ? 'bg-slate-50 text-slate-400' : 'bg-white'}
                        ${isToday ? 'border-blue-500 border-2' : 'border-slate-200'}
                        ${isSelected ? 'bg-blue-50 border-blue-400' : ''}
                        ${hasFullDayBlock ? 'bg-red-50 border-red-200' : ''}
                        ${viewMode === 'block' ? 'cursor-pointer hover:bg-amber-50' : ''}
                        ${dayBookings.length > 0 && !hasFullDayBlock ? 'hover:bg-blue-50' : 'hover:bg-slate-50'}
                      `}
                    >
                      {hasFullDayBlock && (
                        <div className="absolute top-1 right-1">
                          <Ban className="w-4 h-4 text-red-500" />
                        </div>
                      )}
                      <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      {dayBlocks.length > 0 && !hasFullDayBlock && (
                        <div className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded mb-1">
                          {dayBlocks.length} blocked
                        </div>
                      )}
                      {dayBookings.length > 0 && !hasFullDayBlock && (
                        <div className="space-y-1">
                          {dayBookings.slice(0, 2).map((booking, idx) => (
                            <div
                              key={idx}
                              className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate"
                            >
                              {booking.session.start_time} - {booking.furkid_name || 'N/A'}
                            </div>
                          ))}
                          {dayBookings.length > 2 && (
                            <div className="text-xs text-slate-500">
                              +{dayBookings.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                      {hasFullDayBlock && (
                        <div className="text-xs text-red-700 font-medium mt-1">
                          Fully Blocked
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
                  <p className="text-sm">Click on a date to view details</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Blocked Slots Section */}
                  {selectedDateBlocks.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm text-red-900 mb-2 flex items-center gap-2">
                        <Ban className="w-4 h-4" />
                        Blocked Time Slots
                      </h3>
                      <div className="space-y-2">
                        {selectedDateBlocks.map((block) => (
                          <div key={block.id} className="border border-red-200 bg-red-50 rounded-lg p-3 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {block.is_full_day ? (
                                  <p className="font-medium text-sm text-red-900">Full Day Blocked</p>
                                ) : (
                                  <p className="font-medium text-sm text-red-900">
                                    {block.start_time} - {block.end_time}
                                  </p>
                                )}
                                {block.reason && (
                                  <p className="text-xs text-red-700 mt-1">{block.reason}</p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteBlock(block.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bookings Section */}
                  {selectedDateBookings.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900 mb-2">Bookings</h3>
                      <div className="space-y-3">
                        {selectedDateBookings.map((booking, idx) => (
                          <div key={idx} className="border border-slate-200 rounded-lg p-3 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm text-slate-900">{booking.furkid_name || 'N/A'}</p>
                                <p className="text-xs text-slate-600">{booking.client_name || 'N/A'}</p>
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
                    </div>
                  )}

                  {selectedDateBookings.length === 0 && selectedDateBlocks.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <p className="text-sm">No bookings or blocks for this date</p>
                      {viewMode === 'block' && (
                        <Button
                          size="sm"
                          className="mt-4"
                          onClick={() => {
                            setBlockForm({
                              date: format(selectedDate, 'yyyy-MM-dd'),
                              is_full_day: false,
                              start_time: '',
                              end_time: '',
                              reason: ''
                            });
                            setShowBlockDialog(true);
                          }}
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Block This Date
                        </Button>
                      )}
                    </div>
                  )}
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
                <div className="w-4 h-4 bg-red-50 border border-red-200 rounded flex items-center justify-center">
                  <Ban className="w-3 h-3 text-red-500" />
                </div>
                <span>Blocked time/day</span>
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

      {/* Block Time Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Time Slot</DialogTitle>
            <DialogDescription>
              Block time slots to prevent bookings on {blockForm.date && format(parseISO(blockForm.date), 'EEEE, MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="full-day">Block Entire Day</Label>
                <p className="text-xs text-slate-500">No bookings will be allowed on this date</p>
              </div>
              <Switch
                id="full-day"
                checked={blockForm.is_full_day}
                onCheckedChange={(checked) => setBlockForm({ ...blockForm, is_full_day: checked })}
              />
            </div>

            {!blockForm.is_full_day && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Select
                    value={blockForm.start_time}
                    onValueChange={(value) => setBlockForm({ ...blockForm, start_time: value })}
                  >
                    <SelectTrigger id="start-time">
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTimeSlots().map(time => (
                        <SelectItem key={time} value={time}>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {time}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Select
                    value={blockForm.end_time}
                    onValueChange={(value) => setBlockForm({ ...blockForm, end_time: value })}
                  >
                    <SelectTrigger id="end-time">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTimeSlots().map(time => (
                        <SelectItem key={time} value={time}>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {time}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Holiday, Personal leave, Training workshop..."
                value={blockForm.reason}
                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                className="h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBlockTimeSlot}
              disabled={saving || (!blockForm.is_full_day && (!blockForm.start_time || !blockForm.end_time))}
              className="bg-red-600 hover:bg-red-700"
            >
              <Ban className="w-4 h-4 mr-2" />
              {saving ? 'Blocking...' : 'Block Time'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}