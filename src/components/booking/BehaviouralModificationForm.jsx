
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle, Clock } from "lucide-react";
import { differenceInYears, differenceInMonths } from "date-fns";

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
  "Coton de Tulear", "Dachshund", "Dalmatian", "Doberman Pinscher* (restricted breed)",
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
  "West Highland White Terrier (Westie)", "Whippet", "Yorkshire Terrier",
  "Others"
];

export default function BehaviouralModificationForm({ service, formData, setFormData, onNext, onBack }) {
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [showCustomBreed, setShowCustomBreed] = useState(false);

  const isCanineAssessment = service.id === 'canine_assessment';

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleBreedSelect = (value) => {
    if (value === 'Others') {
      setShowCustomBreed(true);
      handleInputChange('furkidBreed', '');
    } else {
      setShowCustomBreed(false);
      handleInputChange('furkidBreed', value);
    }
  };

  const handleCheckboxToggle = (field, value) => {
    const currentValues = formData[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    handleInputChange(field, newValues);
  };

  const handleEnrichmentToggle = (value) => {
    const currentTools = formData.enrichment_tools || '';
    const toolsArray = currentTools.split(',').map(t => t.trim()).filter(t => t);
    
    if (toolsArray.includes(value)) {
      const newTools = toolsArray.filter(t => t !== value);
      handleInputChange('enrichment_tools', newTools.join(', '));
    } else {
      const newTools = [...toolsArray, value];
      handleInputChange('enrichment_tools', newTools.join(', '));
    }
  };

  useEffect(() => {
    if (formData.dobMonth && formData.dobDay && formData.dobYear) {
      try {
        const now = new Date();
        const dobDate = new Date(parseInt(formData.dobYear), parseInt(formData.dobMonth) - 1, parseInt(formData.dobDay));
        const years = differenceInYears(now, dobDate);
        const months = differenceInMonths(now, dobDate) % 12;
        
        let ageString = '';
        if (years > 0) {
          ageString = `${years} year${years > 1 ? 's' : ''}`;
          if (months > 0) {
            ageString += ` ${months} month${months > 1 ? 's' : ''}`;
          }
        } else if (months > 0) {
          ageString = `${months} month${months > 1 ? 's' : ''}`;
        } else {
          ageString = 'Less than a month'; // Or other suitable text for very young
        }
        
        handleInputChange('furkidAge', ageString);
      } catch (e) {
        console.error('Error calculating age:', e);
      }
    } else {
      handleInputChange('furkidAge', ''); // Clear age if dob is incomplete
    }
  }, [formData.dobMonth, formData.dobDay, formData.dobYear]);

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrors({ ...errors, adoptionProofUrl: 'File size must be less than 10MB' });
      return;
    }

    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleInputChange('adoptionProofUrl', file_url);
    } catch (error) {
      console.error('Upload error:', error);
      setErrors({ ...errors, adoptionProofUrl: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const validateAndContinue = () => {
    const newErrors = {};
    
    // Validate all required fields
    if (formData.isAdopted === undefined) newErrors.isAdopted = 'Required';
    if (formData.isAdopted && !formData.adoptionProofUrl) newErrors.adoptionProofUrl = 'Required';
    if (!formData.furkidName?.trim()) newErrors.furkidName = 'Required';
    if (!formData.furkidBreed?.trim()) newErrors.furkidBreed = 'Required';
    if (!formData.dobMonth || !formData.dobDay || !formData.dobYear) newErrors.dobMonth = 'Required'; // Keep dobMonth as key for date error
    if (!formData.furkidGender) newErrors.furkidGender = 'Required';
    if (formData.furkidSterilised === undefined) newErrors.furkidSterilised = 'Required';
    if (formData.furkidSterilised && !formData.furkid_sterilisation_age?.trim()) newErrors.furkid_sterilisation_age = 'Required';
    if (formData.furkidSterilised && !formData.furkid_sterilisation_method) newErrors.furkid_sterilisation_method = 'Required';
    if (!formData.furkid_acquired_from?.trim()) newErrors.furkid_acquired_from = 'Required';
    if (!formData.furkid_joined_family_age?.trim()) newErrors.furkid_joined_family_age = 'Required';
    if (formData.has_previous_guardian === undefined) newErrors.has_previous_guardian = 'Required';
    if (formData.has_previous_guardian && !formData.previous_guardian_reason?.trim()) newErrors.previous_guardian_reason = 'Required';
    if (!formData.behaviour_first_noticed?.trim()) newErrors.behaviour_first_noticed = 'Required';
    if (!formData.is_aggression_issue) newErrors.is_aggression_issue = 'Required';
    if (formData.is_aggression_issue === 'yes' && formData.has_bitten === undefined) newErrors.has_bitten = 'Required';
    if (formData.has_bitten && !formData.bite_count?.trim()) newErrors.bite_count = 'Required';
    if (formData.has_bitten && !formData.bite_triggers?.trim()) newErrors.bite_triggers = 'Required';
    if (formData.has_bitten && !formData.bite_severity) newErrors.bite_severity = 'Required';
    if (!formData.behaviour_symptoms?.trim()) newErrors.behaviour_symptoms = 'Required';
    if (!formData.past_trauma?.trim()) newErrors.past_trauma = 'Required';
    if (!formData.immediate_reaction?.trim()) newErrors.immediate_reaction = 'Required';
    if (!formData.methods_tried?.trim()) newErrors.methods_tried = 'Required';
    if (!formData.methods_effectiveness?.trim()) newErrors.methods_effectiveness = 'Required';
    if (!formData.reaction_to_strangers?.trim()) newErrors.reaction_to_strangers = 'Required';
    if (!formData.behaviour_severity_change) newErrors.behaviour_severity_change = 'Required';
    if (!formData.behaviour_seriousness_scale) newErrors.behaviour_seriousness_scale = 'Required';
    if (!formData.program_goals?.trim()) newErrors.program_goals = 'Required';
    if (!formData.daily_training_time) newErrors.daily_training_time = 'Required';
    if (!formData.main_caregivers?.trim()) newErrors.main_caregivers = 'Required';
    if (!formData.purpose_of_getting_furkid?.trim()) newErrors.purpose_of_getting_furkid = 'Required';
    if (!formData.why_chose_furkid?.trim()) newErrors.why_chose_furkid = 'Required';
    if (formData.other_pets === undefined) newErrors.other_pets = 'Required';
    if (formData.other_pets && !formData.other_pets_list?.trim()) newErrors.other_pets_list = 'Required';
    if (formData.previous_furkids_owned === undefined) newErrors.previous_furkids_owned = 'Required';
    if (formData.previous_furkids_owned && !formData.previous_furkids?.trim()) newErrors.previous_furkids = 'Required';
    if (!formData.hangout_location?.trim()) newErrors.hangout_location = 'Required';
    if (!formData.sleep_location?.trim()) newErrors.sleep_location = 'Required';
    if (!formData.alone_duration?.trim()) newErrors.alone_duration = 'Required';
    if (!formData.anxiety_when_alone?.trim()) newErrors.anxiety_when_alone = 'Required';
    if (!formData.walk_frequency?.trim()) newErrors.walk_frequency = 'Required';
    if (!formData.walk_duration?.trim()) newErrors.walk_duration = 'Required';
    if (!formData.potty_training?.trim()) newErrors.potty_training = 'Required';
    if (!formData.walking_equipment || formData.walking_equipment.length === 0) newErrors.walking_equipment = 'Required';
    if (!formData.enrichment_tools?.trim()) newErrors.enrichment_tools = 'Required';
    if (formData.previous_training === undefined) newErrors.previous_training = 'Required';
    if (formData.previous_training && !formData.previous_training_type?.trim()) newErrors.previous_training_type = 'Required';
    if (formData.previous_training && !formData.previous_training_school?.trim()) newErrors.previous_training_school = 'Required';
    if (formData.known_cues_reliable === undefined) newErrors.known_cues_reliable = 'Required';
    if (formData.known_cues_reliable && !formData.known_cues_list?.trim()) newErrors.known_cues_list = 'Required';
    if (!formData.feeding_frequency?.trim()) newErrors.feeding_frequency = 'Required';
    if (!formData.diet_type?.trim()) newErrors.diet_type = 'Required';
    if (!formData.feeding_method || formData.feeding_method.length === 0) newErrors.feeding_method = 'Required';
    if (!formData.eating_speed) newErrors.eating_speed = 'Required';
    if (!formData.chews_frequency?.trim()) newErrors.chews_frequency = 'Required';
    if (formData.chews_frequency?.trim() && !formData.chews_type?.trim()) newErrors.chews_type = 'Required';
    if (formData.loves_treats === undefined) newErrors.loves_treats = 'Required';
    if (formData.loves_treats && !formData.treats_type?.trim()) newErrors.treats_type = 'Required';
    if (formData.food_allergies === undefined) newErrors.food_allergies = 'Required';
    if (formData.food_allergies && !formData.food_allergies_details?.trim()) newErrors.food_allergies_details = 'Required';
    if (!formData.handling_reaction?.trim()) newErrors.handling_reaction = 'Required';
    if (!formData.equipment_resistance?.trim()) newErrors.equipment_resistance = 'Required';
    if (formData.touch_discomfort === undefined) newErrors.touch_discomfort = 'Required';
    if (formData.touch_discomfort && !formData.touch_discomfort_details?.trim()) newErrors.touch_discomfort_details = 'Required';
    if (!formData.last_health_check?.trim()) newErrors.last_health_check = 'Required';
    if (formData.medical_conditions === undefined) newErrors.medical_conditions = 'Required';
    if (formData.medical_conditions && !formData.medical_conditions_details?.trim()) newErrors.medical_conditions_details = 'Required';
    if (formData.pain_history === undefined) newErrors.pain_history = 'Required';
    if (formData.pain_history && !formData.pain_history_details?.trim()) newErrors.pain_history_details = 'Required';
    if (formData.discomfort_signs === undefined) newErrors.discomfort_signs = 'Required';
    if (formData.discomfort_signs && !formData.discomfort_signs_details?.trim()) newErrors.discomfort_signs_details = 'Required';
    if (formData.on_medication === undefined) newErrors.on_medication = 'Required';
    if (formData.on_medication && !formData.medication_details?.trim()) newErrors.medication_details = 'Required';
    
    // Different validation for Canine Assessment vs Behavioural Modification
    if (isCanineAssessment) {
      if (formData.requires_assessment_report === undefined) newErrors.requires_assessment_report = 'Required';
    } else {
      if (!formData.understanding_confirmed) newErrors.understanding_confirmed = 'Required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    onNext();
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);
  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString()); // Ensure day values are strings

  const enrichmentTools = formData.enrichment_tools || '';
  const hasSnuffleMat = enrichmentTools.includes('Snuffle mat');
  const hasLickMat = enrichmentTools.includes('Lick mat');

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <div>
          <CardTitle>{isCanineAssessment ? 'Canine Assessment History Form' : "Furkid's Behaviour Consultation History Form"}</CardTitle>
          <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            This form will take approximately 5-10 minutes to complete
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Basic Information */}
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 text-lg">Basic Information</h3>
          
          <div className="space-y-2">
            <Label>Is your furkid a Singapore Special or adopted from a shelter? *</Label>
            <RadioGroup value={formData.isAdopted?.toString()} onValueChange={(v) => handleInputChange('isAdopted', v === 'true')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="adopted-yes" />
                <Label htmlFor="adopted-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="adopted-no" />
                <Label htmlFor="adopted-no" className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>
            {errors.isAdopted && <p className="text-sm text-red-600">{errors.isAdopted}</p>}
          </div>

          {formData.isAdopted && (
            <div className="space-y-2">
              <Label>Upload Proof of Adoption * (Max 10MB)</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e.target.files?.[0])} disabled={uploading} />
              {uploading && <p className="text-sm text-blue-600">Uploading...</p>}
              {formData.adoptionProofUrl && <p className="text-sm text-green-600">✓ Uploaded</p>}
              {errors.adoptionProofUrl && <p className="text-sm text-red-600">{errors.adoptionProofUrl}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>Furkid's Name *</Label>
            <Input value={formData.furkidName || ''} onChange={(e) => handleInputChange('furkidName', e.target.value)} />
            {errors.furkidName && <p className="text-sm text-red-600">{errors.furkidName}</p>}
          </div>

          <div className="space-y-2">
            <Label>Breed *</Label>
            <Select value={showCustomBreed ? 'Others' : formData.furkidBreed} onValueChange={handleBreedSelect}>
              <SelectTrigger className={errors.furkidBreed ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select breed" />
              </SelectTrigger>
              <SelectContent>
                {commonBreeds.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            {showCustomBreed && <Input value={formData.furkidBreed || ''} onChange={(e) => handleInputChange('furkidBreed', e.target.value)} placeholder="Enter breed" className="mt-2" />}
            {errors.furkidBreed && <p className="text-sm text-red-600">{errors.furkidBreed}</p>}
          </div>

          <div className="space-y-2">
            <Label>Date of Birth *</Label>
            <div className="grid grid-cols-3 gap-2">
              <Select value={formData.dobDay} onValueChange={(v) => handleInputChange('dobDay', v)}>
                <SelectTrigger className={errors.dobMonth ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {days.map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={formData.dobMonth} onValueChange={(v) => handleInputChange('dobMonth', v)}>
                <SelectTrigger className={errors.dobMonth ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={formData.dobYear} onValueChange={(v) => handleInputChange('dobYear', v)}>
                <SelectTrigger className={errors.dobMonth ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {errors.dobMonth && <p className="text-sm text-red-600">{errors.dobMonth}</p>}
          </div>

          {formData.furkidAge && (
            <div className="space-y-2">
              <Label>Age</Label>
              <Input value={formData.furkidAge} disabled className="bg-slate-50" />
            </div>
          )}

          <div className="space-y-2">
            <Label>Gender *</Label>
            <RadioGroup value={formData.furkidGender} onValueChange={(v) => handleInputChange('furkidGender', v)}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="boy" id="boy" />
                  <Label htmlFor="boy" className="cursor-pointer">Boy</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="girl" id="girl" />
                  <Label htmlFor="girl" className="cursor-pointer">Girl</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.furkidGender && <p className="text-sm text-red-600">{errors.furkidGender}</p>}
          </div>

          <div className="space-y-2">
            <Label>Is the dog sterilised? *</Label>
            <RadioGroup value={formData.furkidSterilised?.toString()} onValueChange={(v) => handleInputChange('furkidSterilised', v === 'true')}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="ster-yes" />
                  <Label htmlFor="ster-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="ster-no" />
                  <Label htmlFor="ster-no" className="cursor-pointer">No</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.furkidSterilised && <p className="text-sm text-red-600">{errors.furkidSterilised}</p>}
          </div>

          {formData.furkidSterilised && (
            <>
              <div className="space-y-2">
                <Label>If yes, at what age? *</Label>
                <Input value={formData.furkid_sterilisation_age || ''} onChange={(e) => handleInputChange('furkid_sterilisation_age', e.target.value)} placeholder="e.g., 6 months" />
                {errors.furkid_sterilisation_age && <p className="text-sm text-red-600">{errors.furkid_sterilisation_age}</p>}
              </div>
              <div className="space-y-2">
                <Label>What method was the sterilisation? *</Label>
                {formData.furkidGender === 'boy' ? (
                  <RadioGroup value={formData.furkid_sterilisation_method} onValueChange={(v) => handleInputChange('furkid_sterilisation_method', v)}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Castration" id="cast" />
                        <Label htmlFor="cast" className="cursor-pointer">Castration: Removal of testicles</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Vasectomy" id="vase" />
                        <Label htmlFor="vase" className="cursor-pointer">Vasectomy: severs vas deferens, testicles stay, so hormones stay</Label>
                      </div>
                    </div>
                  </RadioGroup>
                ) : formData.furkidGender === 'girl' ? (
                  <RadioGroup value={formData.furkid_sterilisation_method} onValueChange={(v) => handleInputChange('furkid_sterilisation_method', v)}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Spay" id="spay" />
                        <Label htmlFor="spay" className="cursor-pointer">Spay: Removal of ovaries & uterus</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Hysterectomy" id="hyst" />
                        <Label htmlFor="hyst" className="cursor-pointer">Hysterectomy: Uterus removed, ovaries stay, so hormones stay</Label>
                      </div>
                    </div>
                  </RadioGroup>
                ) : (
                  <p className="text-sm text-slate-500">Please select gender first</p>
                )}
                {errors.furkid_sterilisation_method && <p className="text-sm text-red-600">{errors.furkid_sterilisation_method}</p>}
              </div>
            </>
          )}
        </div>

        {/* History & Background */}
        <div className="space-y-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 text-lg">History & Background</h3>
          
          <div className="space-y-2">
            <Label>Where did you obtain the furkid? *</Label>
            <Input value={formData.furkid_acquired_from || ''} onChange={(e) => handleInputChange('furkid_acquired_from', e.target.value)} />
            {errors.furkid_acquired_from && <p className="text-sm text-red-600">{errors.furkid_acquired_from}</p>}
          </div>

          <div className="space-y-2">
            <Label>How old was the furkid when he/she joined your household? *</Label>
            <Input value={formData.furkid_joined_family_age || ''} onChange={(e) => handleInputChange('furkid_joined_family_age', e.target.value)} />
            {errors.furkid_joined_family_age && <p className="text-sm text-red-600">{errors.furkid_joined_family_age}</p>}
          </div>

          <div className="space-y-2">
            <Label>Does the furkid have a previous guardian? *</Label>
            <RadioGroup value={formData.has_previous_guardian?.toString()} onValueChange={(v) => handleInputChange('has_previous_guardian', v === 'true')}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="prev-yes" />
                  <Label htmlFor="prev-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="prev-no" />
                  <Label htmlFor="prev-no" className="cursor-pointer">No</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.has_previous_guardian && <p className="text-sm text-red-600">{errors.has_previous_guardian}</p>}
          </div>

          {formData.has_previous_guardian && (
            <div className="space-y-2">
              <Label>If yes, briefly state the reason for giving up: *</Label>
              <Textarea value={formData.previous_guardian_reason || ''} onChange={(e) => handleInputChange('previous_guardian_reason', e.target.value)} rows={3} />
              {errors.previous_guardian_reason && <p className="text-sm text-red-600">{errors.previous_guardian_reason}</p>}
            </div>
          )}
        </div>

        {/* Behaviour Details */}
        <div className="space-y-4 p-4 bg-amber-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 text-lg">Behaviour Details</h3>
          
          <div className="space-y-2">
            <Label>When did you first notice the behaviour? *</Label>
            <Input value={formData.behaviour_first_noticed || ''} onChange={(e) => handleInputChange('behaviour_first_noticed', e.target.value)} />
            {errors.behaviour_first_noticed && <p className="text-sm text-red-600">{errors.behaviour_first_noticed}</p>}
          </div>

          <div className="space-y-2">
            <Label>Is it an aggression issue? *</Label>
            <RadioGroup value={formData.is_aggression_issue} onValueChange={(v) => handleInputChange('is_aggression_issue', v)}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="agg-yes" />
                  <Label htmlFor="agg-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="agg-no" />
                  <Label htmlFor="agg-no" className="cursor-pointer">No</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not_sure" id="agg-unsure" />
                  <Label htmlFor="agg-unsure" className="cursor-pointer">Not sure</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.is_aggression_issue && <p className="text-sm text-red-600">{errors.is_aggression_issue}</p>}
          </div>

          {formData.is_aggression_issue === 'yes' && (
            <>
              <div className="space-y-2">
                <Label>Has the dog bitten anyone or another dog? *</Label>
                <RadioGroup value={formData.has_bitten?.toString()} onValueChange={(v) => handleInputChange('has_bitten', v === 'true')}>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="bit-yes" />
                      <Label htmlFor="bit-yes" className="cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="bit-no" />
                      <Label htmlFor="bit-no" className="cursor-pointer">No</Label>
                    </div>
                  </div>
                </RadioGroup>
                {errors.has_bitten && <p className="text-sm text-red-600">{errors.has_bitten}</p>}
              </div>

              {formData.has_bitten && (
                <>
                  <div className="space-y-2">
                    <Label>How many times has he bitten? *</Label>
                    <Input value={formData.bite_count || ''} onChange={(e) => handleInputChange('bite_count', e.target.value)} />
                    {errors.bite_count && <p className="text-sm text-red-600">{errors.bite_count}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>What triggered the bite(s)? *</Label>
                    <Textarea value={formData.bite_triggers || ''} onChange={(e) => handleInputChange('bite_triggers', e.target.value)} rows={3} />
                    {errors.bite_triggers && <p className="text-sm text-red-600">{errors.bite_triggers}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Bite severity (Dr Ian Dunbar's scale) *</Label>
                    <Select value={formData.bite_severity} onValueChange={(v) => handleInputChange('bite_severity', v)}>
                      <SelectTrigger className={errors.bite_severity ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Level 1 - Obnoxious/aggressive (growls, lunges, snarls) but no skin-contact</SelectItem>
                        <SelectItem value="2">Level 2 - Skin-contact but no puncture. Slight break/abrasion</SelectItem>
                        <SelectItem value="3">Level 3 - 1-4 punctures, no deeper than 1/2 canine length</SelectItem>
                        <SelectItem value="4">Level 4 - 1-4 punctures deeper than 1/2 canine length. Deep bruising</SelectItem>
                        <SelectItem value="5">Level 5 - Multiple Level 4 bites</SelectItem>
                        <SelectItem value="6">Level 6 - Fatal bite(s)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.bite_severity && <p className="text-sm text-red-600">{errors.bite_severity}</p>}
                  </div>
                </>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label>Describe behavioural symptoms (triggers, where, when) *</Label>
            <Textarea value={formData.behaviour_symptoms || ''} onChange={(e) => handleInputChange('behaviour_symptoms', e.target.value)} rows={4} />
            {errors.behaviour_symptoms && <p className="text-sm text-red-600">{errors.behaviour_symptoms}</p>}
          </div>

          <div className="space-y-2">
            <Label>Any known past trauma or mistreatment? *</Label>
            <Textarea value={formData.past_trauma || ''} onChange={(e) => handleInputChange('past_trauma', e.target.value)} rows={3} />
            {errors.past_trauma && <p className="text-sm text-red-600">{errors.past_trauma}</p>}
          </div>

          <div className="space-y-2">
            <Label>Your immediate reaction(s) to mediate the behaviour *</Label>
            <Textarea value={formData.immediate_reaction || ''} onChange={(e) => handleInputChange('immediate_reaction', e.target.value)} rows={3} />
            {errors.immediate_reaction && <p className="text-sm text-red-600">{errors.immediate_reaction}</p>}
          </div>

          <div className="space-y-2">
            <Label>What methods have you tried to resolve the behaviour? *</Label>
            <Textarea value={formData.methods_tried || ''} onChange={(e) => handleInputChange('methods_tried', e.target.value)} rows={3} />
            {errors.methods_tried && <p className="text-sm text-red-600">{errors.methods_tried}</p>}
          </div>

          <div className="space-y-2">
            <Label>How effective were the methods/training? *</Label>
            <Textarea value={formData.methods_effectiveness || ''} onChange={(e) => handleInputChange('methods_effectiveness', e.target.value)} rows={2} />
            {errors.methods_effectiveness && <p className="text-sm text-red-600">{errors.methods_effectiveness}</p>}
          </div>

          <div className="space-y-2">
            <Label>How does the dog react to strangers/visitors? *</Label>
            <Textarea value={formData.reaction_to_strangers || ''} onChange={(e) => handleInputChange('reaction_to_strangers', e.target.value)} rows={3} />
            {errors.reaction_to_strangers && <p className="text-sm text-red-600">{errors.reaction_to_strangers}</p>}
          </div>

          <div className="space-y-2">
            <Label>Has the behaviour changed in severity? *</Label>
            <RadioGroup value={formData.behaviour_severity_change} onValueChange={(v) => handleInputChange('behaviour_severity_change', v)}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="worsen" id="sev-worse" />
                  <Label htmlFor="sev-worse" className="cursor-pointer">Worsen</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="same" id="sev-same" />
                  <Label htmlFor="sev-same" className="cursor-pointer">Remains the same</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="better" id="sev-better" />
                  <Label htmlFor="sev-better" className="cursor-pointer">Getting better</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.behaviour_severity_change && <p className="text-sm text-red-600">{errors.behaviour_severity_change}</p>}
          </div>

          <div className="space-y-2">
            <Label>How serious do you find the behaviour? * (1: not serious - 5: very serious)</Label>
            <Select value={formData.behaviour_seriousness_scale?.toString()} onValueChange={(v) => handleInputChange('behaviour_seriousness_scale', parseInt(v))}>
              <SelectTrigger className={errors.behaviour_seriousness_scale ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.behaviour_seriousness_scale && <p className="text-sm text-red-600">{errors.behaviour_seriousness_scale}</p>}
          </div>
        </div>

        {/* Goals & Household */}
        <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 text-lg">Goals & Household</h3>
          
          <div className="space-y-2">
            <Label>What do you wish to achieve with the program? *</Label>
            <Textarea value={formData.program_goals || ''} onChange={(e) => handleInputChange('program_goals', e.target.value)} rows={3} />
            {errors.program_goals && <p className="text-sm text-red-600">{errors.program_goals}</p>}
          </div>

          <div className="space-y-2">
            <Label>How much time are you able to spend training daily? *</Label>
            <RadioGroup value={formData.daily_training_time} onValueChange={(v) => handleInputChange('daily_training_time', v)}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="5-10mins" id="time1" />
                  <Label htmlFor="time1" className="cursor-pointer">5-10 mins</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10-20mins" id="time2" />
                  <Label htmlFor="time2" className="cursor-pointer">10-20 mins</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="20-30mins" id="time3" />
                  <Label htmlFor="time3" className="cursor-pointer">20-30 mins</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.daily_training_time && <p className="text-sm text-red-600">{errors.daily_training_time}</p>}
          </div>

          <div className="space-y-2">
            <Label>Who are the main caregivers of the furkid? *</Label>
            <Input value={formData.main_caregivers || ''} onChange={(e) => handleInputChange('main_caregivers', e.target.value)} />
            {errors.main_caregivers && <p className="text-sm text-red-600">{errors.main_caregivers}</p>}
          </div>

          <div className="space-y-2">
            <Label>Main purposes of getting a furkid? *</Label>
            <Textarea value={formData.purpose_of_getting_furkid || ''} onChange={(e) => handleInputChange('purpose_of_getting_furkid', e.target.value)} rows={2} />
            {errors.purpose_of_getting_furkid && <p className="text-sm text-red-600">{errors.purpose_of_getting_furkid}</p>}
          </div>

          <div className="space-y-2">
            <Label>Why did you choose him/her? *</Label>
            <Textarea value={formData.why_chose_furkid || ''} onChange={(e) => handleInputChange('why_chose_furkid', e.target.value)} rows={2} />
            {errors.why_chose_furkid && <p className="text-sm text-red-600">{errors.why_chose_furkid}</p>}
          </div>

          <div className="space-y-2">
            <Label>Do you have other pets in the household? *</Label>
            <RadioGroup value={formData.other_pets?.toString()} onValueChange={(v) => handleInputChange('other_pets', v === 'true')}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="pets-yes" />
                  <Label htmlFor="pets-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="pets-no" />
                  <Label htmlFor="pets-no" className="cursor-pointer">No</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.other_pets && <p className="text-sm text-red-600">{errors.other_pets}</p>}
          </div>

          {formData.other_pets && (
            <div className="space-y-2">
              <Label>If yes, please list them *</Label>
              <Textarea value={formData.other_pets_list || ''} onChange={(e) => handleInputChange('other_pets_list', e.target.value)} rows={2} />
              {errors.other_pets_list && <p className="text-sm text-red-600">{errors.other_pets_list}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>Have you previously had other furkids? *</Label>
            <RadioGroup value={formData.previous_furkids_owned?.toString()} onValueChange={(v) => handleInputChange('previous_furkids_owned', v === 'true')}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="prevfurk-yes" />
                  <Label htmlFor="prevfurk-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="prevfurk-no" />
                  <Label htmlFor="prevfurk-no" className="cursor-pointer">No</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.previous_furkids_owned && <p className="text-sm text-red-600">{errors.previous_furkids_owned}</p>}
          </div>

          {formData.previous_furkids_owned && (
            <div className="space-y-2">
              <Label>If yes, who are they? *</Label>
              <Textarea value={formData.previous_furkids || ''} onChange={(e) => handleInputChange('previous_furkids', e.target.value)} rows={2} placeholder="e.g., Buddy - Golden Retriever, Max - Beagle" />
              {errors.previous_furkids && <p className="text-sm text-red-600">{errors.previous_furkids}</p>}
            </div>
          )}
        </div>

        {/* Daily Routine */}
        <div className="space-y-4 p-4 bg-pink-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 text-lg">Daily Routine</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Where does the dog hang out during the day? *</Label>
              <Input value={formData.hangout_location || ''} onChange={(e) => handleInputChange('hangout_location', e.target.value)} />
              {errors.hangout_location && <p className="text-sm text-red-600">{errors.hangout_location}</p>}
            </div>

            <div className="space-y-2">
              <Label>Where does the dog sleep at night? *</Label>
              <Input value={formData.sleep_location || ''} onChange={(e) => handleInputChange('sleep_location', e.target.value)} />
              {errors.sleep_location && <p className="text-sm text-red-600">{errors.sleep_location}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>How long is the dog left alone daily? *</Label>
            <Input value={formData.alone_duration || ''} onChange={(e) => handleInputChange('alone_duration', e.target.value)} />
            {errors.alone_duration && <p className="text-sm text-red-600">{errors.alone_duration}</p>}
          </div>

          <div className="space-y-2">
            <Label>Anxiety behaviours when left alone? *</Label>
            <Textarea value={formData.anxiety_when_alone || ''} onChange={(e) => handleInputChange('anxiety_when_alone', e.target.value)} rows={2} />
            {errors.anxiety_when_alone && <p className="text-sm text-red-600">{errors.anxiety_when_alone}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>How often do you walk the dog? *</Label>
              <Input value={formData.walk_frequency || ''} onChange={(e) => handleInputChange('walk_frequency', e.target.value)} />
              {errors.walk_frequency && <p className="text-sm text-red-600">{errors.walk_frequency}</p>}
            </div>

            <div className="space-y-2">
              <Label>How long are these walks? *</Label>
              <Input value={formData.walk_duration || ''} onChange={(e) => handleInputChange('walk_duration', e.target.value)} />
              {errors.walk_duration && <p className="text-sm text-red-600">{errors.walk_duration}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Indoor or outdoor potty trained? *</Label>
            <Input value={formData.potty_training || ''} onChange={(e) => handleInputChange('potty_training', e.target.value)} />
            {errors.potty_training && <p className="text-sm text-red-600">{errors.potty_training}</p>}
          </div>

          <div className="space-y-2">
            <Label>What type of walking equipment do you use? * (Select all that apply)</Label>
            <div className="grid grid-cols-2 gap-2">
              {['Harness', 'Flat collar', 'Head halter', 'Martingale collar', 'Slip lead/choke chain', '2-point leash', 'Normal leash', 'Retractable leash'].map(equip => (
                <div key={equip} className="flex items-center space-x-2">
                  <Checkbox
                    id={`equip-${equip}`}
                    checked={formData.walking_equipment?.includes(equip)}
                    onCheckedChange={() => handleCheckboxToggle('walking_equipment', equip)}
                  />
                  <Label htmlFor={`equip-${equip}`} className="cursor-pointer text-sm">{equip}</Label>
                </div>
              ))}
            </div>
            {errors.walking_equipment && <p className="text-sm text-red-600">{errors.walking_equipment}</p>}
          </div>

          <div className="space-y-2">
            <Label>Enrichment tools available? *</Label>
            <div className="flex gap-4 mb-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enrich-snuffle"
                  checked={hasSnuffleMat}
                  onCheckedChange={() => handleEnrichmentToggle('Snuffle mat')}
                />
                <Label htmlFor="enrich-snuffle" className="cursor-pointer text-sm">Snuffle mat</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enrich-lick"
                  checked={hasLickMat}
                  onCheckedChange={() => handleEnrichmentToggle('Lick mat')}
                />
                <Label htmlFor="enrich-lick" className="cursor-pointer text-sm">Lick mat</Label>
              </div>
            </div>
            <Textarea 
              value={formData.enrichment_tools || ''} 
              onChange={(e) => handleInputChange('enrichment_tools', e.target.value)} 
              rows={2}
              placeholder="e.g., Kong, puzzle toys, treat balls, snuffle mat, lick mat..."
            />
            {errors.enrichment_tools && <p className="text-sm text-red-600">{errors.enrichment_tools}</p>}
          </div>
        </div>

        {/* Training History */}
        <div className="space-y-4 p-4 bg-indigo-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 text-lg">Training History</h3>
          
          <div className="space-y-2">
            <Label>Has the dog received training before? *</Label>
            <RadioGroup value={formData.previous_training?.toString()} onValueChange={(v) => handleInputChange('previous_training', v === 'true')}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="train-yes" />
                  <Label htmlFor="train-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="train-no" />
                  <Label htmlFor="train-no" className="cursor-pointer">No</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.previous_training && <p className="text-sm text-red-600">{errors.previous_training}</p>}
          </div>

          {formData.previous_training && (
            <>
              <div className="space-y-2">
                <Label>What type of training? *</Label>
                <Input value={formData.previous_training_type || ''} onChange={(e) => handleInputChange('previous_training_type', e.target.value)} />
                {errors.previous_training_type && <p className="text-sm text-red-600">{errors.previous_training_type}</p>}
              </div>

              <div className="space-y-2">
                <Label>What school? *</Label>
                <Input value={formData.previous_training_school || ''} onChange={(e) => handleInputChange('previous_training_school', e.target.value)} />
                {errors.previous_training_school && <p className="text-sm text-red-600">{errors.previous_training_school}</p>}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Does the dog know any cues reliably? *</Label>
            <RadioGroup value={formData.known_cues_reliable?.toString()} onValueChange={(v) => handleInputChange('known_cues_reliable', v === 'true')}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="cues-yes" />
                  <Label htmlFor="cues-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="cues-no" />
                  <Label htmlFor="cues-no" className="cursor-pointer">No</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.known_cues_reliable && <p className="text-sm text-red-600">{errors.known_cues_reliable}</p>}
          </div>

          {formData.known_cues_reliable && (
            <div className="space-y-2">
              <Label>What cues does the dog know? *</Label>
              <Textarea value={formData.known_cues_list || ''} onChange={(e) => handleInputChange('known_cues_list', e.target.value)} rows={2} />
              {errors.known_cues_list && <p className="text-sm text-red-600">{errors.known_cues_list}</p>}
            </div>
          )}
        </div>

        {/* Feeding & Diet */}
        <div className="space-y-4 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 text-lg">Feeding & Diet</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>How many times a day do you feed? *</Label>
              <Input value={formData.feeding_frequency || ''} onChange={(e) => handleInputChange('feeding_frequency', e.target.value)} />
              {errors.feeding_frequency && <p className="text-sm text-red-600">{errors.feeding_frequency}</p>}
            </div>

            <div className="space-y-2">
              <Label>What is the dog's diet? *</Label>
              <Input value={formData.diet_type || ''} onChange={(e) => handleInputChange('diet_type', e.target.value)} />
              {errors.diet_type && <p className="text-sm text-red-600">{errors.diet_type}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>How do you feed him/her? * (Select all that apply)</Label>
            <div className="grid grid-cols-2 gap-2">
              {['Food bowl', 'Slow feeder', 'Throughout the day during training', 'Puzzle/Enrichment tools', 'Free feeding throughout the day', 'Others'].map(method => (
                <div key={method} className="flex items-center space-x-2">
                  <Checkbox
                    id={`feed-${method}`}
                    checked={formData.feeding_method?.includes(method)}
                    onCheckedChange={() => handleCheckboxToggle('feeding_method', method)}
                  />
                  <Label htmlFor={`feed-${method}`} className="cursor-pointer text-sm">{method}</Label>
                </div>
              ))}
            </div>
            {errors.feeding_method && <p className="text-sm text-red-600">{errors.feeding_method}</p>}
          </div>

          <div className="space-y-2">
            <Label>Eating speed * (1: slow – 5: gobbles)</Label>
            <Select value={formData.eating_speed?.toString()} onValueChange={(v) => handleInputChange('eating_speed', parseInt(v))}>
              <SelectTrigger className={errors.eating_speed ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.eating_speed && <p className="text-sm text-red-600">{errors.eating_speed}</p>}
          </div>

          <div className="space-y-2">
            <Label>How often gets chews (bully sticks, bones)? *</Label>
            <Input value={formData.chews_frequency || ''} onChange={(e) => handleInputChange('chews_frequency', e.target.value)} />
            {errors.chews_frequency && <p className="text-sm text-red-600">{errors.chews_frequency}</p>}
          </div>

          {formData.chews_frequency?.trim() && (
            <div className="space-y-2">
              <Label>What kind of chews? *</Label>
              <Input value={formData.chews_type || ''} onChange={(e) => handleInputChange('chews_type', e.target.value)} />
              {errors.chews_type && <p className="text-sm text-red-600">{errors.chews_type}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>Does he/she love treats? *</Label>
            <RadioGroup value={formData.loves_treats?.toString()} onValueChange={(v) => handleInputChange('loves_treats', v === 'true')}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="treats-yes" />
                  <Label htmlFor="treats-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="treats-no" />
                  <Label htmlFor="treats-no" className="cursor-pointer">No</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.loves_treats && <p className="text-sm text-red-600">{errors.loves_treats}</p>}
          </div>

          {formData.loves_treats && (
            <div className="space-y-2">
              <Label>What type of treats do you have? *</Label>
              <Textarea value={formData.treats_type || ''} onChange={(e) => handleInputChange('treats_type', e.target.value)} rows={2} />
              {errors.treats_type && <p className="text-sm text-red-600">{errors.treats_type}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>Any food allergies? *</Label>
            <RadioGroup value={formData.food_allergies?.toString()} onValueChange={(v) => handleInputChange('food_allergies', v === 'true')}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="allergy-yes" />
                  <Label htmlFor="allergy-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="allergy-no" />
                  <Label htmlFor="allergy-no" className="cursor-pointer">No</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.food_allergies && <p className="text-sm text-red-600">{errors.food_allergies}</p>}
          </div>

          {formData.food_allergies && (
            <div className="space-y-2">
              <Label>If yes, what allergies? *</Label>
              <Textarea value={formData.food_allergies_details || ''} onChange={(e) => handleInputChange('food_allergies_details', e.target.value)} rows={2} />
              {errors.food_allergies_details && <p className="text-sm text-red-600">{errors.food_allergies_details}</p>}
            </div>
          )}
        </div>

        {/* Health */}
        <div className="space-y-4 p-4 bg-red-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 text-lg">Health & Medical</h3>
          
          <div className="space-y-2">
            <Label>How does the dog react to being handled (grooming, vet visits, nail trims)? *</Label>
            <Textarea value={formData.handling_reaction || ''} onChange={(e) => handleInputChange('handling_reaction', e.target.value)} rows={2} />
            {errors.handling_reaction && <p className="text-sm text-red-600">{errors.handling_reaction}</p>}
          </div>

          <div className="space-y-2">
            <Label>Any resistance to wearing collar, harness, or lead? *</Label>
            <Textarea value={formData.equipment_resistance || ''} onChange={(e) => handleInputChange('equipment_resistance', e.target.value)} rows={2} />
            {errors.equipment_resistance && <p className="text-sm text-red-600">{errors.equipment_resistance}</p>}
          </div>

          <div className="space-y-2">
            <Label>Any discomfort with being touched in certain areas? *</Label>
            <RadioGroup value={formData.touch_discomfort?.toString()} onValueChange={(v) => handleInputChange('touch_discomfort', v === 'true')}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="touch-yes" />
                  <Label htmlFor="touch-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="touch-no" />
                  <Label htmlFor="touch-no" className="cursor-pointer">No</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.touch_discomfort && <p className="text-sm text-red-600">{errors.touch_discomfort}</p>}
          </div>

          {formData.touch_discomfort && (
            <div className="space-y-2">
              <Label>If yes, please describe: *</Label>
              <Textarea value={formData.touch_discomfort_details || ''} onChange={(e) => handleInputChange('touch_discomfort_details', e.target.value)} rows={2} />
              {errors.touch_discomfort_details && <p className="text-sm text-red-600">{errors.touch_discomfort_details}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>When was the dog's last health check? *</Label>
            <Input value={formData.last_health_check || ''} onChange={(e) => handleInputChange('last_health_check', e.target.value)} />
            {errors.last_health_check && <p className="text-sm text-red-600">{errors.last_health_check}</p>}
          </div>

          <div className="space-y-2">
            <Label>Any existing medical conditions? *</Label>
            <RadioGroup value={formData.medical_conditions?.toString()} onValueChange={(v) => handleInputChange('medical_conditions', v === 'true')}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="med-yes" />
                  <Label htmlFor="med-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="med-no" />
                  <Label htmlFor="med-no" className="cursor-pointer">No</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.medical_conditions && <p className="text-sm text-red-600">{errors.medical_conditions}</p>}
          </div>

          {formData.medical_conditions && (
            <div className="space-y-2">
              <Label>Briefly describe the condition(s): *</Label>
              <Textarea value={formData.medical_conditions_details || ''} onChange={(e) => handleInputChange('medical_conditions_details', e.target.value)} rows={2} />
              {errors.medical_conditions_details && <p className="text-sm text-red-600">{errors.medical_conditions_details}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>Any history of pain, injuries, or surgeries? *</Label>
            <RadioGroup value={formData.pain_history?.toString()} onValueChange={(v) => handleInputChange('pain_history', v === 'true')}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="pain-yes" />
                  <Label htmlFor="pain-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="pain-no" />
                  <Label htmlFor="pain-no" className="cursor-pointer">No</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.pain_history && <p className="text-sm text-red-600">{errors.pain_history}</p>}
          </div>

          {formData.pain_history && (
            <div className="space-y-2">
              <Label>Briefly describe the condition(s): *</Label>
              <Textarea value={formData.pain_history_details || ''} onChange={(e) => handleInputChange('pain_history_details', e.target.value)} rows={2} />
              {errors.pain_history_details && <p className="text-sm text-red-600">{errors.pain_history_details}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>Any signs of discomfort (limping, licking, avoiding handling)? *</Label>
            <RadioGroup value={formData.discomfort_signs?.toString()} onValueChange={(v) => handleInputChange('discomfort_signs', v === 'true')}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="disc-yes" />
                  <Label htmlFor="disc-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="disc-no" />
                  <Label htmlFor="disc-no" className="cursor-pointer">No</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.discomfort_signs && <p className="text-sm text-red-600">{errors.discomfort_signs}</p>}
          </div>

          {formData.discomfort_signs && (
            <div className="space-y-2">
              <Label>If yes, briefly describe: *</Label>
              <Textarea value={formData.discomfort_signs_details || ''} onChange={(e) => handleInputChange('discomfort_signs_details', e.target.value)} rows={2} />
              {errors.discomfort_signs_details && <p className="text-sm text-red-600">{errors.discomfort_signs_details}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>Is he/she on any medication? *</Label>
            <RadioGroup value={formData.on_medication?.toString()} onValueChange={(v) => handleInputChange('on_medication', v === 'true')}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="meds-yes" />
                  <Label htmlFor="meds-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="meds-no" />
                  <Label htmlFor="meds-no" className="cursor-pointer">No</Label>
                </div>
              </div>
            </RadioGroup>
            {errors.on_medication && <p className="text-sm text-red-600">{errors.on_medication}</p>}
          </div>

          {formData.on_medication && (
            <div className="space-y-2">
              <Label>If yes, what medications and any possible side effects: *</Label>
              <Textarea value={formData.medication_details || ''} onChange={(e) => handleInputChange('medication_details', e.target.value)} rows={2} placeholder="Medication name and dosage, possible side effects" />
              {errors.medication_details && <p className="text-sm text-red-600">{errors.medication_details}</p>}
            </div>
          )}
        </div>

        {/* Final Confirmation - Different for Canine Assessment vs Behavioural Modification */}
        {isCanineAssessment ? (
          <div className="space-y-3 p-4 bg-slate-100 rounded-lg border-2 border-slate-300">
            <Label className="text-base font-semibold">Do you require an assessment report? *</Label>
            <RadioGroup 
              value={formData.requires_assessment_report?.toString()}
              onValueChange={(value) => handleInputChange('requires_assessment_report', value === 'true')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="report-yes" />
                <Label htmlFor="report-yes" className="cursor-pointer font-normal">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="report-no" />
                <Label htmlFor="report-no" className="cursor-pointer font-normal">No</Label>
              </div>
            </RadioGroup>
            {errors.requires_assessment_report && <p className="text-sm text-red-600">{errors.requires_assessment_report}</p>}
          </div>
        ) : (
          <div className="space-y-3 p-4 bg-slate-100 rounded-lg border-2 border-slate-300">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="understanding" 
                checked={formData.understanding_confirmed || false}
                onCheckedChange={(checked) => handleInputChange('understanding_confirmed', checked)}
              />
              <Label htmlFor="understanding" className="text-sm cursor-pointer leading-relaxed">
                By checking this box, I confirm that I have read the{' '}
                <a href="https://www.hopefordogs.sg/behavioural-modification/#faq" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  FAQs
                </a>
                {' '}and understand that behavior modification is influenced by various factors and that there are no quick fixes. I acknowledge that any improvement or success depends on my commitment to the recommended strategies by the canine behaviour consultant. *
              </Label>
            </div>
            {errors.understanding_confirmed && <p className="text-sm text-red-600">{errors.understanding_confirmed}</p>}
          </div>
        )}

        {Object.keys(errors).length > 0 && (
          <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>Please complete all required (*) fields before continuing</p>
          </div>
        )}

        <div className="flex gap-3 pt-4 sticky bottom-0 bg-white/95 backdrop-blur-sm p-4 -mx-6 -mb-6 border-t">
          <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
          <Button onClick={validateAndContinue} className="flex-1">Review Booking</Button>
        </div>
      </CardContent>
    </Card>
  );
}
