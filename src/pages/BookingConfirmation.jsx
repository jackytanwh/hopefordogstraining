import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Home, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WhatsAppButton from "../components/booking/WhatsAppButton";

export default function BookingConfirmation() {
  const [whatsappConsent, setWhatsappConsent] = useState(false);

  useEffect(() => {
    const consent = sessionStorage.getItem('whatsappConsent') === 'true';
    setWhatsappConsent(consent);

    return () => {
      sessionStorage.removeItem('latestBookingId');
      sessionStorage.removeItem('whatsappConsent');
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardContent className="p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Booking Submitted!</h1>
            <p className="text-lg text-slate-600">
              Thank you for choosing Hopefordogs Training
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-left space-y-3">
            <h3 className="font-semibold text-slate-900">What's Next?</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">1.</span>
                <span>We've received your booking and will review it shortly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">2.</span>
                <span>Our team will contact you within 24 hours to confirm your booking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">3.</span>
                <span>Payment details will be provided upon confirmation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">4.</span>
                <span>Get ready for your training sessions!</span>
              </li>
            </ul>
          </div>

          {whatsappConsent ? (
            <div className="bg-green-50 border border-green-200 p-6 rounded-lg space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-800">
                <MessageCircle className="w-6 h-6" />
                <h3 className="font-semibold text-lg">Connect on WhatsApp</h3>
              </div>
              <p className="text-sm text-slate-700">
                Click the button below to connect with our WhatsApp assistant. You'll receive your booking confirmation and session reminders directly on WhatsApp!
              </p>
              <WhatsAppButton className="bg-green-600 hover:bg-green-700 w-full" />
              <p className="text-xs text-slate-500">
                Need to reschedule? Contact our admin team at{' '}
                <a 
                  href="https://wa.me/6582228376" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  +65 8222 8376
                </a>
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 p-6 rounded-lg space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-800">
                <MessageCircle className="w-6 h-6" />
                <h3 className="font-semibold text-lg">Stay Connected on WhatsApp</h3>
              </div>
              <p className="text-sm text-slate-700">
                Get instant updates, session reminders, and chat with our team directly on WhatsApp!
              </p>
              <WhatsAppButton className="bg-green-600 hover:bg-green-700 w-full" />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link to={createPageUrl("BookingSystem")} className="flex-1">
              <Button variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Back to Booking System
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}