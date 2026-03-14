import React from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export default function WhatsAppButton({ variant = "default", size = "default", className = "" }) {
  const whatsappUrl = base44.agents.getWhatsAppConnectURL('booking_assistant');

  return (
    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
      <Button variant={variant} size={size} className={className}>
        <MessageCircle className="w-4 h-4 mr-2" />
        Chat on WhatsApp
      </Button>
    </a>
  );
}