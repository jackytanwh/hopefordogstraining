import React from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export default function WhatsAppButton({ variant = "default", size = "default", className = "" }) {
  const whatsappUrl = "https://wa.me/6582228376";

  return (
    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
      <Button variant={variant} size={size} className={className}>
        <MessageCircle className="w-4 h-4 mr-2" />
        Chat on WhatsApp
      </Button>
    </a>
  );
}