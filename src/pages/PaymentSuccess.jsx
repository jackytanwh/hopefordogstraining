import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Calendar, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, parseISO } from "date-fns";

export default function PaymentSuccess() {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('booking_id');

  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingId) {
        setLoading(false);
        return;
      }

      try {
        const bookings = await base44.entities.Booking.list();
        const foundBooking = bookings.find(b => b.id === bookingId);
        setBooking(foundBooking);
      } catch (error) {
        console.error("Error loading booking:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  const getClientName = () => {
    if (booking?.clients?.[0]?.clientName) return booking.clients[0].clientName;
    if (booking?.clients?.[0]?.client_name) return booking.clients[0].client_name;
    return booking?.client_name || 'Valued Customer';
  };

  const getClientEmail = () => {
    if (booking?.clients?.[0]?.clientEmail) return booking.clients[0].clientEmail;
    if (booking?.clients?.[0]?.client_email) return booking.clients[0].client_email;
    return booking?.client_email || '';
  };

  const status = booking?.booking_status;
  const isConfirmed = status === 'confirmed';
  const isFailed = status === 'failed' || status === 'cancelled';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
          <div className={`p-8 text-center text-white ${isConfirmed ? 'bg-gradient-to-r from-green-500 to-green-600' : isFailed ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}>
            {isConfirmed ? (
              <CheckCircle className="w-20 h-20 mx-auto mb-4" />
            ) : (
              <AlertTriangle className="w-20 h-20 mx-auto mb-4" />
            )}
            <h1 className="text-3xl font-bold mb-2">
              {isConfirmed ? "Payment Successful!" : isFailed ? "Payment Not Completed" : "Payment Processing"}
            </h1>
            <p className={isConfirmed ? "text-green-100" : isFailed ? "text-red-100" : "text-amber-100"}>
              {isConfirmed ? "Your booking has been confirmed" : isFailed ? "Your booking is currently marked as failed" : "We are still verifying your payment status"}
            </p>
          </div>

          <CardContent className="p-8 space-y-6">
            {booking ? (
              <>
                <div className="text-center mb-6">
                  <p className="text-lg text-slate-700">
                    Thank you, <span className="font-semibold">{getClientName()}</span>!
                  </p>
                  {isConfirmed && (
                    <p className="text-slate-600 mt-1">
                      A confirmation email has been sent to {getClientEmail()}
                    </p>
                  )}
                  {isFailed && (
                    <p className="text-slate-600 mt-1">
                      Your payment did not complete successfully. Please retry booking or contact support.
                    </p>
                  )}
                  {!isConfirmed && !isFailed && (
                    <p className="text-slate-600 mt-1">
                      Payment verification is still in progress. Please refresh this page in a moment.
                    </p>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-slate-900 text-lg">{booking.service_name}</h3>
                  
                  {booking.session_dates && booking.session_dates.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Your Sessions
                      </p>
                      <div className="space-y-1.5">
                        {booking.session_dates.slice(0, 3).map((session, idx) => (
                          <p key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Session {session.session_number}: {format(parseISO(session.date), 'MMM d, yyyy')} at {session.start_time}
                          </p>
                        ))}
                        {booking.session_dates.length > 3 && (
                          <p className="text-sm text-slate-500 italic">
                            +{booking.session_dates.length - 3} more session{booking.session_dates.length - 3 > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Total Paid</span>
                      <span className="text-2xl font-bold text-green-600">${booking.total_price?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">What's Next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    {isConfirmed ? (
                      <>
                        <li>You will receive a WhatsApp confirmation shortly</li>
                        <li>Our trainer will contact you before your first session</li>
                        <li>Please have treats ready for training</li>
                      </>
                    ) : isFailed ? (
                      <>
                        <li>Please retry payment from a new booking submission</li>
                        <li>If payment was deducted, contact support with your booking ID</li>
                        <li>Our team can help you restore your booking quickly</li>
                      </>
                    ) : (
                      <>
                        <li>We are waiting for final payment confirmation from HitPay</li>
                        <li>Refresh this page after 30-60 seconds</li>
                        <li>If status does not change, contact support with your booking ID</li>
                      </>
                    )}
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">
                  Thank you for choosing Hopefordogs Canine Training. Please refer to your email for more details.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Link to={createPageUrl("BookingSystem")} className="flex-1">
                <Button variant="outline" className="w-full">
                  Back to Services
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}