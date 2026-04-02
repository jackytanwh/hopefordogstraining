import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { Calendar, Search, Filter, Eye, X, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Booking.list();
      const now = new Date();
      const sortedData = data.sort((a, b) => {
        const dateA = a.session_dates?.length > 0 ? parseISO(a.session_dates[0].date) : null;
        const dateB = b.session_dates?.length > 0 ? parseISO(b.session_dates[0].date) : null;
        if (!dateA && dateB) return 1;
        if (dateA && !dateB) return -1;
        if (!dateA && !dateB) return 0;
        const isUpcomingA = dateA >= now;
        const isUpcomingB = dateB >= now;
        if (isUpcomingA && !isUpcomingB) return -1;
        if (!isUpcomingA && isUpcomingB) return 1;
        if (isUpcomingA && isUpcomingB) return dateA - dateB;
        return dateB - dateA;
      });
      setBookings(sortedData);
      setFilteredBookings(sortedData);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to get client and furkid names for both single and FYOG bookings
  const getClientName = (booking) => {
    if (booking.clients && booking.clients.length > 0) {
      const client = booking.clients[0];
      return client.client_name || client.clientName || 'N/A';
    }
    return booking.client_name || 'N/A';
  };

  const getClientEmail = (booking) => {
    if (booking.clients && booking.clients.length > 0) {
      const client = booking.clients[0];
      return client.client_email || client.clientEmail || 'N/A';
    }
    return booking.client_email || 'N/A';
  };

  const getClientMobile = (booking) => {
    if (booking.clients && booking.clients.length > 0) {
      const client = booking.clients[0];
      return client.client_mobile || client.clientMobile || 'N/A';
    }
    return booking.client_mobile || 'N/A';
  };

  const getFurkidName = (booking) => {
    if (booking.furkids && booking.furkids.length > 0) {
      const furkid = booking.furkids[0];
      return furkid.furkid_name || furkid.furkidName || 'N/A';
    }
    return booking.furkid_name || 'N/A';
  };

  const getFurkidBreed = (booking) => {
    if (booking.furkids && booking.furkids.length > 0) {
      const furkid = booking.furkids[0];
      return furkid.furkid_breed || furkid.furkidBreed || null;
    }
    return booking.furkid_breed || null;
  };

  const getFurkidGender = (booking) => {
    if (booking.furkids && booking.furkids.length > 0) {
      const furkid = booking.furkids[0];
      return furkid.furkid_gender || furkid.furkidGender || null;
    }
    return booking.furkid_gender || null;
  };

  useEffect(() => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking => {
        const clientName = getClientName(booking);
        const furkidName = getFurkidName(booking);
        const clientEmail = getClientEmail(booking);
        
        return clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               furkidName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               clientEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.booking_status === statusFilter);
    }

    setFilteredBookings(filtered);
  }, [searchTerm, statusFilter, bookings]);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const oldBooking = bookings.find(b => b.id === bookingId);
      
      const updateData = {
        booking_status: newStatus
      };
      
      // Set confirmation_date when status changes to confirmed
      if (newStatus === 'confirmed') {
        updateData.confirmation_date = new Date().toISOString();
      }
      
      await base44.entities.Booking.update(bookingId, updateData);
      
      await loadBookings();
      
      // Get the updated booking
      const updatedBookings = await base44.entities.Booking.list();
      const updatedBooking = updatedBookings.find(b => b.id === bookingId);
      
      // Send WhatsApp notification if consent was given (fire and forget)
      if (updatedBooking && updatedBooking.whatsapp_consent) {
        if (newStatus === 'confirmed') {
          base44.functions.invoke('sendWhatsappBookingConfirmation', { booking: updatedBooking })
            .then(() => console.log('✅ WhatsApp booking confirmation sent'))
            .catch((err) => console.log('⚠️ WhatsApp confirmation skipped:', err.message));
        } else if (newStatus === 'cancelled') {
          base44.functions.invoke('sendBookingCancellation', { booking: updatedBooking })
            .then(() => console.log('✅ WhatsApp cancellation notification sent'))
            .catch((err) => console.log('⚠️ WhatsApp notification skipped:', err.message));
        } else {
          base44.functions.invoke('sendBookingUpdate', { 
            booking: updatedBooking, 
            oldBooking: oldBooking 
          })
            .then(() => console.log('✅ WhatsApp status update sent'))
            .catch((err) => console.log('⚠️ WhatsApp notification skipped:', err.message));
        }
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  return (
    <div className="p-3 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Booking Management</h1>
          <p className="text-slate-600 mt-1">Manage all training session bookings</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by client name, furkid name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No bookings found</h3>
            <p className="text-slate-500">
              {searchTerm || statusFilter !== 'all' ? 
                "Try adjusting your search or filter criteria." : 
                "No bookings have been made yet."
              }
            </p>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const clientName = getClientName(booking);
            const clientEmail = getClientEmail(booking);
            const clientMobile = getClientMobile(booking);
            const furkidName = getFurkidName(booking);
            const furkidBreed = getFurkidBreed(booking);
            const furkidGender = getFurkidGender(booking);
            
            return (
              <Card key={booking.id} className="shadow-lg hover:shadow-xl transition-all">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{booking.service_name}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className={`${statusColors[booking.booking_status]} border`}>
                          {booking.booking_status}
                        </Badge>
                        {booking.is_adopted && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                            Adopted (10% discount)
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl text-blue-600">${booking.total_price?.toFixed(2)}</p>
                      <p className="text-sm text-slate-500">Total</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 mb-1">Client</p>
                        <p className="text-sm text-slate-700">{clientName}</p>
                        <p className="text-sm text-slate-600">{clientEmail}</p>
                        <p className="text-sm text-slate-600">{clientMobile}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 mb-1">Furkid</p>
                        <p className="text-sm text-slate-700">{furkidName}</p>
                        {furkidBreed && (
                          <p className="text-sm text-slate-600">{furkidBreed} • {furkidGender}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-900">Session Schedule</p>
                      <div className="space-y-1">
                        {booking.session_dates?.slice(0, 3).map((session, idx) => (
                          <p key={idx} className="text-sm text-slate-600">
                            Session {session.session_number}: {format(parseISO(session.date), 'MMM d, yyyy')} at {session.start_time}
                          </p>
                        ))}
                        {booking.session_dates?.length > 3 && (
                          <p className="text-sm text-slate-500 italic">
                            +{booking.session_dates.length - 3} more session{booking.session_dates.length - 3 > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                    <div className="flex gap-2">
                      {booking.booking_status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(booking.id, 'confirmed')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(booking.id, 'cancelled')}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}
                      {booking.booking_status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(booking.id, 'completed')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Mark as Completed
                        </Button>
                      )}
                    </div>
                    <Link to={createPageUrl(`BookingDetail?id=${booking.id}`)}>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}