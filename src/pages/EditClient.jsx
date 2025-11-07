
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";

import ClientForm from "../components/forms/ClientForm";

const commonBreeds = [
  "Affenpinscher", "Akita Inu", "Alaskan Malamute", "American Bulldog",
  "American Cocker Spaniel", "American Eskimo Dog",
  "American Pit Bull Terrier* (restricted breed in Singapore)",
  "American Staffordshire Terrier* (restricted breed)",
  "Australian Cattle Dog", "Australian Shepherd", "Basset Hound", "Beagle",
  "Belgian Malinois", "Bernese Mountain Dog", "Bichon Frisé", "Border Collie",
  "Boston Terrier", "Boxer", "Bulldog (English Bulldog)", "Bullmastiff",
  "Cairn Terrier", "Cavalier King Charles Spaniel", "Cavapoo", "Chihuahua",
  "Chow Chow", "Chowsky", "Cocker Spaniel (English)", "Collie (Rough / Smooth)",
  "Coton de Tulear",
  "Dachshund", "Dalmatian", "Doberman Pinscher* (restricted breed)",
  "English Setter", "English Springer Spaniel", "French Bulldog",
  "German Shepherd Dog* (restricted breed)", "Golden Retriever", "Great Dane",
  "Greyhound", "Havanese", "Husky (Siberian Husky)", "Irish Setter",
  "Jack Russell Terrier", "Japanese Spitz", "Keeshond", "Labrador Retriever",
  "Lhasa Apso", "Maltese", "Maltipoo", "Mame Shiba", "Miniature Pinscher",
  "Miniature Schnauzer", "Papillon", "Pekingese", "Pembroke Welsh Corgi",
  "Pointer (German Shorthaired Pointer, English Pointer)", "Pomeranian", "Pomsky",
  "Poodle (Toy)", "Poodle (Mini)", "Poodle (Standard)", "Pug",
  "Rottweiler* (restricted breed)", "Samoyed", "Schnauzer (Standard, Giant)",
  "Scottish Terrier", "Shetland Sheepdog (Sheltie)", "Shiba Inu", "Shih Tzu",
  "Siberian Husky", "Silky Terrier", "Singapore Special",
  "Staffordshire Bull Terrier* (restricted breed)",
  "West Highland White Terrier (Westie)", "Whippet", "Yorkshire Terrier"
];

export default function EditClient() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');

  const loadClient = useCallback(async () => {
    setLoading(true);
    try {
      const clients = await base44.entities.Client.list();
      const foundClient = clients.find(c => c.id === clientId);
      if (foundClient) {
        setClient(foundClient);
      } else {
        // Handle client not found
        navigate(createPageUrl("Clients"));
      }
    } catch (error) {
      console.error("Error loading client:", error);
    } finally {
      setLoading(false);
    }
  }, [clientId, navigate]);

  useEffect(() => {
    if (clientId) {
      loadClient();
    } else {
      navigate(createPageUrl("Clients"));
    }
  }, [clientId, navigate, loadClient]);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await base44.entities.Client.update(clientId, formData);
      navigate(createPageUrl(`ClientDetail?id=${clientId}`));
    } catch (error) {
      console.error("Error updating client:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(createPageUrl(`ClientDetail?id=${clientId}`));
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-64 mb-6"></div>
        <div className="h-96 bg-slate-200 rounded-lg"></div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-slate-900">Edit Client Profile</h1>
          <p className="text-slate-600 mt-1">Updating details for {client?.client_name}.</p>
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
            initialData={client}
          />
        </CardContent>
      </Card>
    </div>
  );
}
