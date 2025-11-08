import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { Loader2, CalendarIcon, AlertCircle, Clock } from "lucide-react";
import { differenceInYears, differenceInMonths, parseISO, format } from "date-fns";

const commonBreeds = [
  "Affenpinscher", "Akita Inu", "Alaskan Malamute", "American Bulldog",
  "Singapore Special", "Staffordshire Bull Terrier* (restricted breed)",
  "West Highland White Terrier (Westie)", "Whippet", "Yorkshire Terrier",
  "Others"
];

export default function BehaviouralModificationForm({ service, formData, setFormData, onNext, onBack }) {
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [showCustomBreed, setShowCustomBreed] = useState(false);

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

  const handleDateSelect = (date) => {
    if (date) {
      handleInputChange('furkidDob', format(date, 'yyyy-MM-dd'));
    }
  };

  useEffect(() => {
    if (formData.furkidDob) {
      try {
        const dob = parseISO(formData.furkidDob);
        const now = new Date();
        const years = differenceInYears(now, dob);
        const months = differenceInMonths(now, dob) % 12;
        
        let ageString = '';
        if (years > 0) {
          ageString = `${years} year${years > 1 ? 's' : ''}`;
          if (months > 0) {
            ageString += ` ${months} month${months > 1 ? 's' : ''}`;
          }
        } else {
          ageString = `${months} month${months > 1 ? 's' : ''}`;
        }
        
        handleInputChange('furkidAge', ageString);
      } catch (e) {
        console.error('Error calculating age:', e);
      }
    }
  }, [formData.furkidDob]);

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
    
    // Only validate required fields
    if (formData.isAdopted === undefined) newErrors.isAdopted = 'Required';
    if (formData.isAdopted && !formData.adoptionProofUrl) newErrors.adoptionProofUrl = 'Required';
    if (!formData.howDidYouKnow) newErrors.howDidYouKnow = 'Required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    onNext();
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <div>
          <CardTitle>Furkid's Behaviour Consultation History Form</CardTitle>
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

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Furkid's Name</Label>
              <Input value={formData.furkidName || ''} onChange={(e) => handleInputChange('furkidName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Breed</Label>
              <Select value={showCustomBreed ? 'Others' : formData.furkidBreed} onValueChange={handleBreedSelect}>
                <SelectTrigger><SelectValue placeholder="Select breed" /></SelectTrigger>
                <SelectContent>
                  {commonBreeds.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
              {showCustomBreed && <Input value={formData.furkidBreed || ''} onChange={(e) => handleInputChange('furkidBreed', e.target.value)} placeholder="Enter breed" className="mt-2" />}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.furkidDob ? format(parseISO(formData.furkidDob), 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={formData.furkidDob ? parseISO(formData.furkidDob) : undefined} onSelect={handleDateSelect} disabled={(date) => date > new Date()} />
                </PopoverContent>
              </Popover>
            </div>
            {formData.furkidAge && (
              <div className="space-y-2">
                <Label>Age</Label>
                <Input value={formData.furkidAge} disabled className="bg-slate-50" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
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
          </div>

          <div className="space-y-2">
            <Label>Is the dog sterilised?</Label>
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
          </div>

          {formData.furkidSterilised && (
            <>
              <div className="space-y-2">
                <Label>If yes, at what age?</Label>
                <Input value={formData.furkid_sterilisation_age || ''} onChange={(e) => handleInputChange('furkid_sterilisation_age', e.target.value)} placeholder="e.g., 6 months" />
              </div>
              <div className="space-y-2">
                <Label>What method was the sterilisation?</Label>
                <Textarea value={formData.furkid_sterilisation_method || ''} onChange={(e) => handleInputChange('furkid_sterilisation_method', e.target.value)} rows={4} placeholder="Boy: Castration (Removal of testicles) or Vasectomy&#10;Girl: Spay (Removal of ovaries & uterus) or Hysterectomy" />
              </div>
            </>
          )}
        </div>

        {/* History & Background */}
        <div className="space-y-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 text-lg">History & Background</h3>
          
          <div className="space-y-2">
            <Label>Where did you obtain the furkid?</Label>
            <Input value={formData.furkid_acquired_from || ''} onChange={(e) => handleInputChange('furkid_acquired_from', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>How old was the furkid when he/she joined your household?</Label>
            <Input value={formData.furkid_joined_family_age || ''} onChange={(e) => handleInputChange('furkid_joined_family_age', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Does the furkid have a previous guardian?</Label>
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
          </div>

          {formData.has_previous_guardian && (
            <div className="space-y-2">
              <Label>If yes, briefly state the reason for giving up:</Label>
              <Textarea value={formData.previous_guardian_reason || ''} onChange={(e) => handleInputChange('previous_guardian_reason', e.target.value)} rows={3} />
            </div>
          )}
        </div>

        {/* Behaviour Details */}
        <div className="space-y-4 p-4 bg-amber-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 text-lg">Behaviour Details</h3>
          
          <div className="space-y-2">
            <Label>When did you first notice the behaviour?</Label>
            <Input value={formData.behaviour_first_noticed || ''} onChange={(e) => handleInputChange('behaviour_first_noticed', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Is it an aggression issue?</Label>
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
          </div>

          {formData.is_aggression_issue === 'yes' && (
            <>
              <div className="space-y-2">
                <Label>Has the dog bitten anyone or another dog?</Label>
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
              </div>

              {formData.has_bitten && (
                <>
                  <div className="space-y-2">
                    <Label>How many times has he bitten?</Label>
                    <Input value={formData.bite_count || ''} onChange={(e) => handleInputChange('bite_count', e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>What triggered the bite(s)?</Label>
                    <Textarea value={formData.bite_triggers || ''} onChange={(e) => handleInputChange('bite_triggers', e.target.value)} rows={3} />
                  </div>

                  <div className="space-y-2">
                    <Label>Bite severity (Dr Ian Dunbar's scale)</Label>
                    <Select value={formData.bite_severity} onValueChange={(v) => handleInputChange('bite_severity', v)}>
                      <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Level 1 - Obnoxious/aggressive (growls, lunges, snarls) but no skin-contact</SelectItem>
                        <SelectItem value="2">Level 2 - Skin-contact but no puncture. Slight break/abrasion</SelectItem>
                        <SelectItem value="3">Level 3 - 1-4 punctures, no deeper than 1/2 canine length</SelectItem>
                        <SelectItem value="4">Level 4 - 1-4 punctures deeper than 1/2 canine length. Deep bruising</SelectItem>
                        <SelectItem value="5">Level 5 - Multiple Level 4 bites</SelectItem>
                        <SelectItem value="6">Level 6 - Fatal bite(s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label>Describe behavioural symptoms (triggers, where, when)</Label>
            <Textarea value={formData.behaviour_symptoms || ''} onChange={(e) => handleInputChange('behaviour_symptoms', e.target.value)} rows={4} />
          </div>

          <div className="space-y-2">
            <Label>Any known past trauma or mistreatment?</Label>
            <Textarea value={formData.past_trauma || ''} onChange={(e) => handleInputChange('past_trauma', e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Your immediate reaction(s) to mediate the behaviour</Label>
            <Textarea value={formData.immediate_reaction || ''} onChange={(e) => handleInputChange('immediate_reaction', e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>What methods have you tried to resolve the behaviour?</Label>
            <Textarea value={formData.methods_tried || ''} onChange={(e) => handleInputChange('methods_tried', e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>How effective were the methods/training?</Label>
            <Textarea value={formData.methods_effectiveness || ''} onChange={(e) => handleInputChange('methods_effectiveness', e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>How does the dog react to strangers/visitors?</Label>
            <Textarea value={formData.reaction_to_strangers || ''} onChange={(e) => handleInputChange('reaction_to_strangers', e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Has the behaviour changed in severity?</Label>
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
          </div>

          <div className="space-y-2">
            <Label>How serious do you find the behaviour? (1-5 scale)</Label>
            <Select value={formData.behaviour_seriousness_scale?.toString()} onValueChange={(v) => handleInputChange('behaviour_seriousness_scale', parseInt(v))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Goals & Household */}
        <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 text-lg">Goals & Household</h3>
          
          <div className="space-y-2">
            <Label>What do you wish to achieve with the program?</Label>
            <Textarea value={formData.program_goals || ''} onChange={(e) => handleInputChange('program_goals', e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>How much time are you able to spend training daily?</Label>
            <Input value={formData.daily_training_time || ''} onChange={(e) => handleInputChange('daily_training_time', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Who are the main caregivers of the furkid?</Label>
            <Input value={formData.main_caregivers || ''} onChange={(e) => handleInputChange('main_caregivers', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Main purposes of getting a furkid?</Label>
            <Textarea value={formData.purpose_of_getting_furkid || ''} onChange={(e) => handleInputChange('purpose_of_getting_furkid', e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Why did you choose him/her?</Label>
            <Textarea value={formData.why_chose_furkid || ''} onChange={(e) => handleInputChange('why_chose_furkid', e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Do you have other pets in the household?</Label>
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
          </div>

          {formData.other_pets && (
            <div className="space-y-2">
              <Label>If yes, please list them</Label>
              <Textarea value={formData.other_pets_list || ''} onChange={(e) => handleInputChange('other_pets_list', e.target.value)} rows={2} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Have you previously had other furkids?</Label>
            <Textarea value={formData.previous_furkids || ''} onChange={(e) => handleInputChange('previous_furkids', e.target.value)} rows={2} />
          </div>
        </div>

        {/* Daily Routine */}
        <div className="space-y-4 p-4 bg-pink-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 text-lg">Daily Routine</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Where does the dog hang out during the day?</Label>
              <Input value={formData.hangout_location || ''} onChange={(e) => handleInputChange('hangout_location', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Where does the dog sleep at night?</Label>
              <Input value={formData.sleep_location || ''} onChange={(e) => handleInputChange('sleep_location', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>How long is the dog left alone daily?</Label>
            <Input value={formData.alone_duration || ''} onChange={(e) => handleInputChange('alone_duration', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Anxiety behaviours when left alone?</Label>
            <Textarea value={formData.anxiety_when_alone || ''} onChange={(e) => handleInputChange('anxiety_when_alone', e.target.value)} rows={2} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>How often do you walk the dog?</Label>
              <Input value={formData.walk_frequency || ''} onChange={(e) => handleInputChange('walk_frequency', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>How long are these walks?</Label>
              <Input value={formData.walk_duration || ''} onChange={(e) => handleInputChange('walk_duration', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Indoor or outdoor potty trained?</Label>
            <Input value={formData.potty_training || ''} onChange={(e) => handleInputChange('potty_training', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>What type of walking equipment do you use?</Label>
            <Input value={formData.walking_equipment || ''} onChange={(e) => handleInputChange('walking_equipment', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Enrichment tools available?</Label>
            <Textarea value={formData.enrichment_tools || ''} onChange={(e) => handleInputChange('enrichment_tools', e.target.value)} rows={2} />
          </div>
        </div>

        {/* Training History */}
        <div className="space-y-4 p-4 bg-indigo-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 text-lg">Training History</h3>
          
          <div className="space-y-2">
            <Label>Has the dog received training before?</Label>
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
          </div>

          {formData.previous_training && (
            <>
              <div className="space-y-2">
                <Label>What type of training?</Label>
                <Input value={formData.previous_training_type || ''} onChange={(e) => handleInputChange('previous_training_type', e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>What school?</Label>
                <Input value={formData.previous_training_school || ''} onChange={(e) => handleInputChange('previous_training_school', e.target.value)} />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Does the dog know any cues reliably?</Label>
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
          </div>

          {formData.known_cues_reliable && (
            <div className="space-y-2">
              <Label>What cues does the dog know?</Label>
              <Textarea value={formData.known_cues_list || ''} onChange={(e) => handleInputChange('known_cues_list', e.target.value)} rows={2} />
            </div>
          )}
        </div>

        {/* Feeding & Diet */}
        <div className="space-y-4 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 text-lg">Feeding & Diet</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>How many times a day do you feed?</Label>
              <Input value={formData.feeding_frequency || ''} onChange={(e) => handleInputChange('feeding_frequency', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>What is the dog's diet?</Label>
              <Input value={formData.diet_type || ''} onChange={(e) => handleInputChange('diet_type', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>How do you feed him/her?</Label>
            <Input value={formData.feeding_method || ''} onChange={(e) => handleInputChange('feeding_method', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Eating speed (1: slow – 5: gobbles)</Label>
            <Select value={formData.eating_speed?.toString()} onValueChange={(v) => handleInputChange('eating_speed', parseInt(v))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>How often gets chews (bully sticks, bones)?</Label>
            <Input value={formData.chews_frequency || ''} onChange={(e) => handleInputChange('chews_frequency', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>What kind of chews?</Label>
            <Input value={formData.chews_type || ''} onChange={(e) => handleInputChange('chews_type', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Does he/she love treats?</Label>
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
          </div>

          <div className="space-y-2">
            <Label>Any food allergies?</Label>
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
          </div>

          {formData.food_allergies && (
            <div className="space-y-2">
              <Label>If yes, what allergies?</Label>
              <Textarea value={formData.food_allergies_details || ''} onChange={(e) => handleInputChange('food_allergies_details', e.target.value)} rows={2} />
            </div>
          )}
        </div>

        {/* Health */}
        <div className="space-y-4 p-4 bg-red-50 rounded-lg">
          <h3 className="font-semibold text-slate-900 text-lg">Health & Medical</h3>
          
          <div className="space-y-2">
            <Label>How does the dog react to being handled (grooming, vet visits, nail trims)?</Label>
            <Textarea value={formData.handling_reaction || ''} onChange={(e) => handleInputChange('handling_reaction', e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Any resistance to wearing collar, harness, or lead?</Label>
            <Textarea value={formData.equipment_resistance || ''} onChange={(e) => handleInputChange('equipment_resistance', e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Any discomfort with being touched in certain areas?</Label>
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
          </div>

          {formData.touch_discomfort && (
            <div className="space-y-2">
              <Label>If yes, please describe:</Label>
              <Textarea value={formData.touch_discomfort_details || ''} onChange={(e) => handleInputChange('touch_discomfort_details', e.target.value)} rows={2} />
            </div>
          )}

          <div className="space-y-2">
            <Label>When was the dog's last health check?</Label>
            <Input value={formData.last_health_check || ''} onChange={(e) => handleInputChange('last_health_check', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Any existing medical conditions?</Label>
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
          </div>

          {formData.medical_conditions && (
            <div className="space-y-2">
              <Label>Briefly describe the condition(s):</Label>
              <Textarea value={formData.medical_conditions_details || ''} onChange={(e) => handleInputChange('medical_conditions_details', e.target.value)} rows={2} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Any history of pain, injuries, or surgeries?</Label>
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
          </div>

          {formData.pain_history && (
            <div className="space-y-2">
              <Label>Briefly describe the condition(s):</Label>
              <Textarea value={formData.pain_history_details || ''} onChange={(e) => handleInputChange('pain_history_details', e.target.value)} rows={2} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Any signs of discomfort (limping, licking, avoiding handling)?</Label>
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
          </div>

          {formData.discomfort_signs && (
            <div className="space-y-2">
              <Label>If yes, briefly describe:</Label>
              <Textarea value={formData.discomfort_signs_details || ''} onChange={(e) => handleInputChange('discomfort_signs_details', e.target.value)} rows={2} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Is he/she on any medication?</Label>
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
          </div>

          {formData.on_medication && (
            <div className="space-y-2">
              <Label>If yes, any possible side effects:</Label>
              <Textarea value={formData.medication_details || ''} onChange={(e) => handleInputChange('medication_details', e.target.value)} rows={2} />
            </div>
          )}
        </div>

        {/* How Did You Know */}
        <div className="space-y-2 pt-4 border-t-2 border-slate-300">
          <Label>How did you know about us? *</Label>
          <RadioGroup value={formData.howDidYouKnow} onValueChange={(v) => handleInputChange('howDidYouKnow', v)}>
            {['Google', 'Facebook', 'Instagram', 'AVS website', 'Recommendation'].map(opt => (
              <div key={opt} className="flex items-center space-x-2">
                <RadioGroupItem value={opt} id={`know-${opt}`} />
                <Label htmlFor={`know-${opt}`} className="cursor-pointer">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
          {errors.howDidYouKnow && <p className="text-sm text-red-600">{errors.howDidYouKnow}</p>}
        </div>

        {/* Final Confirmation */}
        <div className="space-y-3 p-4 bg-slate-100 rounded-lg border-2 border-slate-300">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="understanding" 
              checked={formData.understanding_confirmed || false}
              onCheckedChange={(checked) => handleInputChange('understanding_confirmed', checked)}
            />
            <Label htmlFor="understanding" className="text-sm cursor-pointer leading-relaxed">
              By checking this box, I confirm that I have read the FAQs and understand that behavior modification is influenced by various factors and that there are no quick fixes. I acknowledge that any improvement or success depends on my commitment to the recommended strategies by the canine behaviour consultant.
            </Label>
          </div>
        </div>

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