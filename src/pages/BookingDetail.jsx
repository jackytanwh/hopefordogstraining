
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, User, PawPrint, Calendar, DollarSign, Save, Trash2, FileText, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

export default function BookingDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('id');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadBooking = useCallback(async () => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const bookings = await base44.entities.Booking.list();
      const foundBooking = bookings.find(b => b.id === bookingId);
      
      // Debug: Log session dates to check for was_rescheduled property
      if (foundBooking?.session_dates) {
        console.log('Session dates:', JSON.stringify(foundBooking.session_dates, null, 2));
      }
      
      setBooking(foundBooking);
      setAdminNotes(foundBooking?.admin_notes || '');
    } catch (error) {
      console.error("Error loading booking:", error);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      const oldBooking = { ...booking };
      
      const updateData = {
        booking_status: newStatus
      };
      
      // Set confirmation_date when status changes to confirmed
      if (newStatus === 'confirmed') {
        updateData.confirmation_date = new Date().toISOString();
      }
      
      await base44.entities.Booking.update(bookingId, updateData);
      
      // Reload to get updated booking
      await loadBooking();
      
      // Get the updated booking
      const bookings = await base44.entities.Booking.list();
      const updatedBooking = bookings.find(b => b.id === bookingId);
      
      // Send WhatsApp notification if consent was given (wrapped in try-catch)
      if (updatedBooking && updatedBooking.whatsapp_consent) {
        try {
          if (newStatus === 'cancelled') {
            const { sendBookingCancellation } = await import("@/functions/sendBookingCancellation");
            await sendBookingCancellation({ booking: updatedBooking });
            console.log('WhatsApp cancellation notification sent');
          } else {
            const { sendBookingUpdate } = await import("@/functions/sendBookingUpdate");
            await sendBookingUpdate({ 
              booking: updatedBooking, 
              oldBooking: oldBooking 
            });
            console.log('WhatsApp status update sent');
          }
        } catch (error) {
          console.error('Error sending WhatsApp notification:', error);
          // Don't block the status change if WhatsApp fails
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await base44.entities.Booking.update(bookingId, {
        admin_notes: adminNotes
      });
      await loadBooking();
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Send cancellation notification before deleting if consent was given (wrapped in try-catch)
      if (booking && booking.whatsapp_consent) {
        try {
          const { sendBookingCancellation } = await import("@/functions/sendBookingCancellation");
          await sendBookingCancellation({ booking });
          console.log('WhatsApp cancellation notification sent');
        } catch (error) {
          console.error('Error sending WhatsApp notification:', error);
          // Don't block deletion if WhatsApp fails
        }
      }
      
      await base44.entities.Booking.delete(bookingId);
      navigate(createPageUrl("AdminBookings"));
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  // Helper function to safely get client field value, checking common variations
  const getClientField = (client, field) => {
    if (!client) return 'N/A';
    
    // Try direct access with original field name
    if (client[field]) return client[field];
    
    // Try without 'client' prefix (e.g., 'clientName' -> 'name')
    const fieldWithoutPrefix = field.startsWith('client') ? 
      field.substring(6).charAt(0).toLowerCase() + field.substring(7) : field;
    if (client[fieldWithoutPrefix]) return client[fieldWithoutPrefix];
    
    // Try with underscore format (e.g., 'clientName' -> 'client_name')
    const underscoreField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (client[underscoreField]) return client[underscoreField];
    
    return 'N/A';
  };

  // Helper function to safely get furkid field value, checking common variations
  const getFurkidField = (furkid, field) => {
    if (!furkid) return 'N/A';
    
    // Try direct access with original field name
    if (furkid[field]) return furkid[field];
    
    // Try without 'furkid' prefix (e.g., 'furkidName' -> 'name')
    const fieldWithoutPrefix = field.startsWith('furkid') ? 
      field.substring(6).charAt(0).toLowerCase() + field.substring(7) : field;
    if (furkid[fieldWithoutPrefix]) return furkid[fieldWithoutPrefix];
    
    // Try with underscore format (e.g., 'furkidName' -> 'furkid_name')
    const underscoreField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (furkid[underscoreField]) return furkid[underscoreField];
    
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="h-96 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6 md:p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Booking Not Found</h1>
        <Button onClick={() => navigate(createPageUrl("AdminBookings"))}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bookings
        </Button>
      </div>
    );
  }

  // Check if this is a FYOG or Group Class booking
  const isFYOG = booking.service_type === 'kinder_puppy_fyog' || 
                 booking.service_type === 'basic_manners_fyog' || 
                 booking.service_type === 'basic_manners_group_class';

  return (
    <>
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("AdminBookings"))}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Booking Details</h1>
              <p className="text-slate-600 mt-1">{booking.service_name}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Booking
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Status */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center justify-between">
                  <span>Booking Status</span>
                  <Badge variant="secondary" className={`${statusColors[booking.booking_status]} border`}>
                    {booking.booking_status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-2">
                  <Select value={booking.booking_status} onValueChange={handleStatusChange} disabled={saving}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {booking.confirmation_date && (
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-sm text-slate-600">Confirmed on</p>
                    <p className="font-medium text-slate-900">
                      {format(new Date(booking.confirmation_date), 'EEEE, MMM d, yyyy')} at {format(new Date(booking.confirmation_date), 'h:mm a')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isFYOG && booking.clients && booking.clients.length > 0 ? (
                  <div className="space-y-4">
                    {booking.clients.map((client, idx) => (
                      <div key={idx} className={`${idx > 0 ? 'pt-4 border-t border-slate-200' : ''}`}>
                        <h4 className="font-semibold text-slate-900 mb-3">Client {idx + 1}</h4>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600">Name</p>
                            <p className="font-medium">{getClientField(client, 'clientName')}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Email</p>
                            <p className="font-medium">{getClientField(client, 'clientEmail')}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Mobile</p>
                            <p className="font-medium">{getClientField(client, 'clientMobile')}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Address</p>
                            <p className="font-medium">{getClientField(client, 'clientAddress')}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Postal Code</p>
                            <p className="font-medium">{getClientField(client, 'clientPostalCode')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Name</p>
                      <p className="font-medium">{booking.client_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Email</p>
                      <p className="font-medium">{booking.client_email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Mobile</p>
                      <p className="font-medium">{booking.client_mobile || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Address</p>
                      <p className="font-medium">{booking.client_address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Postal Code</p>
                      <p className="font-medium">{booking.client_postal_code || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Furkid Information */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <PawPrint className="w-5 h-5" />
                  Furkid's Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isFYOG && booking.furkids && booking.furkids.length > 0 ? (
                  <div className="space-y-4">
                    {booking.furkids.map((furkid, idx) => (
                      <div key={idx} className={`${idx > 0 ? 'pt-4 border-t border-slate-200' : ''}`}>
                        <h4 className="font-semibold text-slate-900 mb-3">
                          {booking.service_type === 'kinder_puppy_fyog' ? 'Puppy' : 'Dog'} {idx + 1}
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600">Name</p>
                            <p className="font-medium">{getFurkidField(furkid, 'furkidName')}</p>
                          </div>
                          {getFurkidField(furkid, 'furkidAge') !== 'N/A' && (
                            <div>
                              <p className="text-slate-600">Age</p>
                              <p className="font-medium">{getFurkidField(furkid, 'furkidAge')}</p>
                            </div>
                          )}
                          {getFurkidField(furkid, 'furkidBreed') !== 'N/A' && (
                            <div>
                              <p className="text-slate-600">Breed</p>
                              <p className="font-medium">{getFurkidField(furkid, 'furkidBreed')}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-slate-600">Gender</p>
                            <p className="font-medium capitalize">{getFurkidField(furkid, 'furkidGender')}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Sterilised</p>
                            <p className="font-medium">
                              {furkid.furkidSterilised || furkid.furkid_sterilised ? 'Yes' : 'No'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600">Adopted</p>
                            <p className="font-medium">
                              {furkid.isAdopted || furkid.is_adopted ? 'Yes' : 'No'}
                            </p>
                          </div>
                          {getFurkidField(furkid, 'furkidDiet') !== 'N/A' && (
                            <div className="md:col-span-2">
                              <p className="text-slate-600">Diet</p>
                              <p className="font-medium">{getFurkidField(furkid, 'furkidDiet')}</p>
                            </div>
                          )}
                          {getFurkidField(furkid, 'furkidSleepArea') !== 'N/A' && (
                            <div className="md:col-span-2">
                              <p className="text-slate-600">Sleep Area</p>
                              <p className="font-medium">{getFurkidField(furkid, 'furkidSleepArea')}</p>
                            </div>
                          )}
                          {getFurkidField(furkid, 'enrolmentReason') !== 'N/A' && (
                            <div className="md:col-span-2">
                              <p className="text-slate-600">Reason for Enrolment</p>
                              <p className="font-medium">{getFurkidField(furkid, 'enrolmentReason')}</p>
                            </div>
                          )}
                        </div>

                        {(furkid.furkidPhotoUrl || furkid.furkid_photo_url) && (
                          <div className="mt-4">
                            <p className="text-slate-600 text-sm mb-2">Photo</p>
                            <img 
                              src={furkid.furkidPhotoUrl || furkid.furkid_photo_url} 
                              alt={getFurkidField(furkid, 'furkidName')} 
                              className="rounded-lg max-w-xs" 
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Name</p>
                      <p className="font-medium">{booking.furkid_name || 'N/A'}</p>
                    </div>
                    {booking.furkid_age && (
                      <div>
                        <p className="text-slate-600">Age</p>
                        <p className="font-medium">{booking.furkid_age}</p>
                      </div>
                    )}
                    {booking.furkid_breed && (
                      <div>
                        <p className="text-slate-600">Breed</p>
                        <p className="font-medium">{booking.furkid_breed}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-600">Gender</p>
                      <p className="font-medium capitalize">{booking.furkid_gender || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Sterilised</p>
                      <p className="font-medium">{booking.furkid_sterilised ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Adopted</p>
                      <p className="font-medium">{booking.is_adopted ? 'Yes' : 'No'}</p>
                    </div>
                    {booking.furkid_diet && (
                      <div className="md:col-span-2">
                        <p className="text-slate-600">Diet</p>
                        <p className="font-medium">{booking.furkid_diet}</p>
                      </div>
                    )}
                    {booking.enrolment_reason && (
                      <div className="md:col-span-2">
                        <p className="text-slate-600">Reason for Enrolment</p>
                        <p className="font-medium">{booking.enrolment_reason}</p>
                      </div>
                    )}
                    {booking.furkid_photo_url && (
                      <div className="md:col-span-2">
                        <p className="text-slate-600 text-sm mb-2">Photo</p>
                        <img src={booking.furkid_photo_url} alt={booking.furkid_name} className="rounded-lg max-w-xs" />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Schedule */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Session Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {booking.session_dates?.map((session, idx) => {
                    // Check multiple possible property names for was_rescheduled
                    const wasRescheduled = Boolean(
                      session.was_rescheduled || 
                      session.wasRescheduled || 
                      session.rescheduled ||
                      session.auto_adjusted
                    );
                    
                    console.log(`Session ${idx + 1} rescheduled check:`, {
                      was_rescheduled: session.was_rescheduled,
                      wasRescheduled: session.wasRescheduled,
                      rescheduled: session.rescheduled,
                      auto_adjusted: session.auto_adjusted,
                      result: wasRescheduled,
                      fullSession: session
                    });
                    
                    return (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">Session {session.session_number}</p>
                            <p className="text-sm text-slate-600 mt-1">
                              {format(parseISO(session.date), 'EEEE, MMM d, yyyy')}
                            </p>
                            <p className="text-sm text-blue-600 font-medium mt-1">
                              {session.start_time} - {session.end_time}
                            </p>
                          </div>
                          {wasRescheduled && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 text-xs flex-shrink-0 whitespace-nowrap">
                              <RefreshCw className="w-3 h-3" />
                              Auto-adjusted
                            </Badge>
                          )}
                        </div>
                        {session.completed && (
                          <Badge className="mt-2 bg-green-100 text-green-800">Completed</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Base Price:</span>
                    <span className="font-medium">${booking.base_price?.toFixed(2)}</span>
                  </div>
                  {booking.adoption_discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Adoption Discount:</span>
                      <span className="font-medium">-${booking.adoption_discount?.toFixed(2)}</span>
                    </div>
                  )}
                  {booking.weekend_surcharge > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Weekend Surcharge:</span>
                      <span className="font-medium">+${booking.weekend_surcharge?.toFixed(2)}</span>
                    </div>
                  )}
                  {booking.total_sentosa_surcharge > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Sentosa Surcharge:</span>
                      <span className="font-medium">+${booking.total_sentosa_surcharge?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-xl text-blue-600">${booking.total_price?.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Notes - hidden on mobile, shown on desktop */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hidden lg:block">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-notes">Internal Notes</Label>
                  <Textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this booking..."
                    className="h-32"
                  />
                </div>
                <Button onClick={handleSaveNotes} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Notes'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Admin Notes - shown on mobile at the bottom, hidden on desktop */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm lg:hidden">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Admin Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-notes-mobile">Internal Notes</Label>
              <Textarea
                id="admin-notes-mobile"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this booking..."
                className="h-32"
              />
            </div>
            <Button onClick={handleSaveNotes} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Notes'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
