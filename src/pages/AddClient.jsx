
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save } from "lucide-react";

import ClientForm from "../components/forms/ClientForm";

const commonBreeds = [
  "Affenpinscher",
  "Akita Inu",
  "Alaskan Malamute",
  "American Bulldog",
  "American Cocker Spaniel",
  "American Eskimo Dog",
  "American Pit Bull Terrier* (restricted breed in Singapore)",
  "American Staffordshire Terrier* (restricted breed)",
  "Australian Cattle Dog",
  "Australian Shepherd",
  "Basset Hound",
  "Beagle",
  "Belgian Malinois",
  "Bernese Mountain Dog",
  "Bichon Frisé",
  "Border Collie",
  "Boston Terrier",
  "Boxer",
  "Bulldog (English Bulldog)",
  "Bullmastiff",
  "Cairn Terrier",
  "Cavalier King Charles Spaniel",
  "Cavapoo",
  "Chihuahua",
  "Chow Chow",
  "Chowsky",
  "Cocker Spaniel (English)",
  "Collie (Rough / Smooth)",
  "Coton de Tulear",
  "Dachshund",
  "Dalmatian",
  "Doberman Pinscher* (restricted breed)",
  "English Setter",
  "English Springer Spaniel",
  "French Bulldog",
  "German Shepherd Dog* (restricted breed)",
  "Golden Retriever",
  "Great Dane",
  "Greyhound",
  "Havanese",
  "Husky (Siberian Husky)",
  "Irish Setter",
  "Jack Russell Terrier",
  "Japanese Spitz",
  "Keeshond",
  "Labrador Retriever",
  "Lhasa Apso",
  "Maltese",
  "Maltipoo",
  "Mame Shiba",
  "Miniature Pinscher",
  "Miniature Schnauzer",
  "Papillon",
  "Pekingese",
  "Pembroke Welsh Corgi",
  "Pointer (German Shorthaired Pointer, English Pointer)",
  "Pomeranian",
  "Pomsky",
  "Poodle (Toy)",
  "Poodle (Mini)",
  "Poodle (Standard)",
  "Pug",
  "Rottweiler* (restricted breed)",
  "Samoyed",
  "Schnauzer (Standard, Giant)",
  "Scottish Terrier",
  "Shetland Sheepdog (Sheltie)",
  "Shiba Inu",
  "Shih Tzu",
  "Siberian Husky",
  "Silky Terrier",
  "Singapore Special",
  "Staffordshire Bull Terrier* (restricted breed)",
  "West Highland White Terrier (Westie)",
  "Whippet",
  "Yorkshire Terrier"
];

export default function AddClient() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      // Set status to 'initial' for Behavioural Modification, otherwise 'in_progress'
      const defaultStatus = formData.program === 'behavioural_modification' ? 'initial' : 'in_progress';
      
      // Prepare the client data
      const clientData = {
        ...formData,
        training_status: defaultStatus,
        training_notes: []
      };

      // Auto-populate weekly dates for Kinder Puppy Program
      if (formData.program === 'kinder_puppy' && formData.start_date) {
        // Create a new Date object to avoid modifying the original formData.start_date during multiple setDate calls
        const baseDate = new Date(formData.start_date); 
        const kinderPuppyProgress = {
          week1: { week_date: formData.start_date },
          week2: { week_date: new Date(baseDate.setDate(baseDate.getDate() + 7)).toISOString().split('T')[0] },
          week3: { week_date: new Date(baseDate.setDate(baseDate.getDate() + 7)).toISOString().split('T')[0] },
          week4: { week_date: new Date(baseDate.setDate(baseDate.getDate() + 7)).toISOString().split('T')[0] }
        };
        clientData.kinder_puppy_progress = kinderPuppyProgress;
      }

      // Auto-populate weekly dates for Basic Manners In-Home Program
      if (formData.program === 'basic_manners' && formData.start_date) {
        // Create a new Date object to avoid modifying the original formData.start_date during multiple setDate calls
        const baseDate = new Date(formData.start_date); 
        const basicMannersProgress = {
          week1: { week_date: formData.start_date },
          week2: { week_date: new Date(baseDate.setDate(baseDate.getDate() + 7)).toISOString().split('T')[0] },
          week3: { week_date: new Date(baseDate.setDate(baseDate.getDate() + 7)).toISOString().split('T')[0] },
          week4: { week_date: new Date(baseDate.setDate(baseDate.getDate() + 7)).toISOString().split('T')[0] },
          week5: { week_date: new Date(baseDate.setDate(baseDate.getDate() + 7)).toISOString().split('T')[0] },
          week6: { week_date: new Date(baseDate.setDate(baseDate.getDate() + 7)).toISOString().split('T')[0] }
        };
        clientData.basic_manners_progress = basicMannersProgress;
      }
      
      await base44.entities.Client.create(clientData);
      
      navigate(createPageUrl("Clients"));
    } catch (error) {
      console.error("Error creating client:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(createPageUrl("Clients"));
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={handleCancel}
          className="hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Add New Client</h1>
          <p className="text-slate-600 mt-1">Create a new client profile and schedule training sessions.</p>
        </div>
      </div>

      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-xl font-semibold text-slate-900">Client Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ClientForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            commonBreeds={commonBreeds}
          />
        </CardContent>
      </Card>
    </div>
  );
}
