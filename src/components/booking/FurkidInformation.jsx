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
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, CalendarIcon, AlertCircle } from "lucide-react";
import { differenceInYears, differenceInMonths, parseISO, format } from "date-fns";

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
  "Yorkshire Terrier",
  "Others"
];

export default function FurkidInformation({ service, formData, setFormData, onNext, onBack, isFYOG }) {
  const [errors, setErrors] = useState({});
  const [showValidationMessage, setShowValidationMessage] = useState(false);
  const [uploading, setUploading] = useState({});
  const [uploadingProof, setUploadingProof] = useState({});
  const [customBreeds, setCustomBreeds] = useState({});

  const numberOfFurkids = isFYOG ? formData.numberOfFurkids : 1;

  const showFoodAllergy = service.id === 'basic_manners_in_home' || service.id === 'basic_manners_fyog' || service.id === 'basic_manners_group_class';

  const handleInputChange = (furkidIndex, field, value) => {
    if (isFYOG) {
      const newFurkids = [...(formData.furkids || [])];
      if (!newFurkids[furkidIndex]) {
        newFurkids[furkidIndex] = {};
      }
      newFurkids[furkidIndex][field] = value;
      setFormData({ ...formData, furkids: newFurkids });
    } else {
      setFormData({ ...formData, [field]: value });
    }
    
    if (errors[`${furkidIndex}_${field}`] || errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[`${furkidIndex}_${field}`];
      delete newErrors[field];
      setErrors(newErrors);
    }
    
    if (showValidationMessage) {
      setShowValidationMessage(false);
    }
  };

  const handleBreedSelect = (furkidIndex, value) => {
    if (value === 'Others') {
      setCustomBreeds({ ...customBreeds, [furkidIndex]: true });
      handleInputChange(furkidIndex, 'furkidBreed', '');
    } else {
      setCustomBreeds({ ...customBreeds, [furkidIndex]: false });
      handleInputChange(furkidIndex, 'furkidBreed', value);
    }
  };

  const handleDateSelect = (furkidIndex, date) => {
    if (date) {
      handleInputChange(furkidIndex, 'furkidDob', format(date, 'yyyy-MM-dd'));
    }
  };

  useEffect(() => {
    for (let i = 0; i < numberOfFurkids; i++) {
      const furkid = isFYOG ? (formData.furkids && formData.furkids[i] ? formData.furkids[i] : {}) : formData;
      const dobField = furkid?.furkidDob;
      
      if (dobField) {
        try {
          const dob = parseISO(dobField);
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
            if (years === 0 && months === 0 && dob < now) {
                ageString = 'Less than a month';
            } else if (dob > now) {
                ageString = '';
            }
          }
          
          handleInputChange(i, 'furkidAge', ageString);
        } catch (e) {
          console.error('Error calculating age:', e);
          handleInputChange(i, 'furkidAge', '');
        }
      } else {
        handleInputChange(i, 'furkidAge', '');
      }
    }
  }, [numberOfFurkids, ...(isFYOG ? (formData.furkids || []).map(f => f?.furkidDob) : [formData.furkidDob])]);

  const handleFileUpload = async (furkidIndex, field, file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrors({ ...errors, [`${furkidIndex}_${field}`]: 'File size must be less than 10MB' });
      return;
    }

    try {
      if (field === 'furkidPhotoUrl') {
        setUploading({ ...uploading, [furkidIndex]: true });
      } else {
        setUploadingProof({ ...uploadingProof, [furkidIndex]: true });
      }

      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleInputChange(furkidIndex, field, file_url);
    } catch (error) {
      console.error('Upload error:', error);
      setErrors({ ...errors, [`${furkidIndex}_${field}`]: 'Upload failed. Please try again.' });
    } finally {
      if (field === 'furkidPhotoUrl') {
        setUploading({ ...uploading, [furkidIndex]: false });
      } else {
        setUploadingProof({ ...uploadingProof, [furkidIndex]: false });
      }
    }
  };

  const validateAndContinue = () => {
    const newErrors = {};

    for (let i = 0; i < numberOfFurkids; i++) {
      const furkid = isFYOG ? formData.furkids[i] || {} : formData;
      const prefix = isFYOG ? `${i}_` : '';

      if (!furkid.furkidName?.trim()) {
        newErrors[`${prefix}furkidName`] = 'Furkid name is required';
      }

      if (!furkid.furkidDob) {
        newErrors[`${prefix}furkidDob`] = 'Date of birth is required';
      }

      if (!furkid.furkidBreed?.trim()) {
        newErrors[`${prefix}furkidBreed`] = 'Breed is required';
      }

      if (!furkid.furkidGender) {
        newErrors[`${prefix}furkidGender`] = 'Gender is required';
      }

      if (furkid.furkidSterilised === undefined || furkid.furkidSterilised === null) {
        newErrors[`${prefix}furkidSterilised`] = 'Please select if furkid is sterilised';
      }

      if (!furkid.furkidAcquiredFrom?.trim()) {
        newErrors[`${prefix}furkidAcquiredFrom`] = 'Please specify where you acquired your furkid';
      }

      if (!furkid.furkidJoinedFamily?.trim()) {
        newErrors[`${prefix}furkidJoinedFamily`] = 'Please specify when furkid joined the family';
      }

      if (furkid.firstTimeOwner === undefined || furkid.firstTimeOwner === null) {
        newErrors[`${prefix}firstTimeOwner`] = 'Please specify if this is your first time having a furkid';
      }

      if (!furkid.furkidDiet?.trim()) {
        newErrors[`${prefix}furkidDiet`] = 'Please specify furkid diet';
      }

      if (showFoodAllergy && (furkid.hasFoodAllergy === undefined || furkid.hasFoodAllergy === null)) {
        newErrors[`${prefix}hasFoodAllergy`] = 'Please specify if furkid has food allergies';
      }

      if (showFoodAllergy && furkid.hasFoodAllergy && !furkid.foodAllergyDetails?.trim()) {
        newErrors[`${prefix}foodAllergyDetails`] = 'Please specify the food allergy details';
      }

      if (!furkid.furkidSleepArea?.trim()) {
        newErrors[`${prefix}furkidSleepArea`] = 'Please specify where furkid sleeps';
      }

      if (!furkid.walkingFrequency?.trim()) {
        newErrors[`${prefix}walkingFrequency`] = 'Please specify walking frequency';
      }

      if (furkid.isAdopted && !furkid.adoptionProofUrl) {
        newErrors[`${prefix}adoptionProofUrl`] = 'Adoption proof is required';
      }
    }

    if (!isFYOG && !formData.howDidYouKnow) {
      newErrors.howDidYouKnow = 'Please let us know how you heard about us';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShowValidationMessage(true);
      return;
    }

    onNext();
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>
          {isFYOG ? 'Furkids Information' : "Your Furkid's Information"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {Array.from({ length: numberOfFurkids }, (_, index) => {
          const furkid = isFYOG ? (formData.furkids && formData.furkids[index] ? formData.furkids[index] : {}) : formData;
          const prefix = isFYOG ? `${index}_` : '';
          const showCustomBreedInput = customBreeds[index] || (furkid.furkidBreed && !commonBreeds.includes(furkid.furkidBreed));

          return (
            <div key={index} className={`space-y-4 ${isFYOG && index > 0 ? 'pt-6 border-t border-slate-200' : ''}`}>
              {isFYOG && (
                <h3 className="font-semibold text-slate-900 text-lg">
                  {service.id === 'kinder_puppy_fyog' ? 'Puppy' : 'Dog'} {index + 1}
                </h3>
              )}

              <div className="space-y-2">
                <Label>Is your furkid a Singapore Special or adopted from a shelter? *</Label>
                <RadioGroup
                  value={furkid.isAdopted?.toString()}
                  onValueChange={(value) => handleInputChange(index, 'isAdopted', value === 'true')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id={`${prefix}adopted-yes`} />
                    <Label htmlFor={`${prefix}adopted-yes`} className="font-normal cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id={`${prefix}adopted-no`} />
                    <Label htmlFor={`${prefix}adopted-no`} className="font-normal cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {furkid.isAdopted && (
                <div className="space-y-2">
                  <Label htmlFor={`${prefix}adoptionProof`}>Upload Proof of Adoption * (Max 10MB)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`${prefix}adoptionProof`}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(index, 'adoptionProofUrl', e.target.files?.[0])}
                      disabled={uploadingProof[index]}
                      className={errors[`${prefix}adoptionProofUrl`] ? 'border-red-500' : ''}
                    />
                    {uploadingProof[index] && <Loader2 className="w-4 h-4 animate-spin" />}
                  </div>
                  {furkid.adoptionProofUrl && (
                    <p className="text-sm text-green-600">✓ File uploaded successfully</p>
                  )}
                  {errors[`${prefix}adoptionProofUrl`] && (
                    <p className="text-sm text-red-600">{errors[`${prefix}adoptionProofUrl`]}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={`${prefix}furkidName`}>Furkid's Name *</Label>
                <Input
                  id={`${prefix}furkidName`}
                  value={furkid.furkidName || ''}
                  onChange={(e) => handleInputChange(index, 'furkidName', e.target.value)}
                  placeholder="Enter your furkid's name"
                  className={errors[`${prefix}furkidName`] ? 'border-red-500' : ''}
                />
                {errors[`${prefix}furkidName`] && (
                  <p className="text-sm text-red-600">{errors[`${prefix}furkidName`]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${prefix}furkidDob`}>Date of Birth *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !furkid.furkidDob && 'text-muted-foreground'
                      } ${errors[`${prefix}furkidDob`] ? 'border-red-500' : ''}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {furkid.furkidDob ? format(parseISO(furkid.furkidDob), 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={furkid.furkidDob ? parseISO(furkid.furkidDob) : undefined}
                      onSelect={(date) => handleDateSelect(index, date)}
                      disabled={(date) => date > new Date()}
                      captionLayout="dropdown-buttons"
                      fromYear={2000}
                      toYear={new Date().getFullYear()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors[`${prefix}furkidDob`] && (
                  <p className="text-sm text-red-600">{errors[`${prefix}furkidDob`]}</p>
                )}
              </div>

              {furkid.furkidAge && (
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input value={furkid.furkidAge} disabled className="bg-slate-50" />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={`${prefix}furkidBreed`}>Breed *</Label>
                <Select
                  value={showCustomBreedInput ? 'Others' : furkid.furkidBreed}
                  onValueChange={(value) => handleBreedSelect(index, value)}
                >
                  <SelectTrigger className={errors[`${prefix}furkidBreed`] ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select breed" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonBreeds.map(breed => (
                      <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {showCustomBreedInput && (
                  <Input
                    value={furkid.furkidBreed || ''}
                    onChange={(e) => handleInputChange(index, 'furkidBreed', e.target.value)}
                    placeholder="Enter breed name"
                    className={errors[`${prefix}furkidBreed`] ? 'border-red-500 mt-2' : 'mt-2'}
                  />
                )}
                
                {errors[`${prefix}furkidBreed`] && (
                  <p className="text-sm text-red-600">{errors[`${prefix}furkidBreed`]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Gender *</Label>
                <RadioGroup
                  value={furkid.furkidGender}
                  onValueChange={(value) => handleInputChange(index, 'furkidGender', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="boy" id={`${prefix}gender-boy`} />
                    <Label htmlFor={`${prefix}gender-boy`} className="font-normal cursor-pointer">Boy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="girl" id={`${prefix}gender-girl`} />
                    <Label htmlFor={`${prefix}gender-girl`} className="font-normal cursor-pointer">Girl</Label>
                  </div>
                </RadioGroup>
                {errors[`${prefix}furkidGender`] && (
                  <p className="text-sm text-red-600">{errors[`${prefix}furkidGender`]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Sterilised? *</Label>
                <RadioGroup
                  value={furkid.furkidSterilised?.toString()}
                  onValueChange={(value) => handleInputChange(index, 'furkidSterilised', value === 'true')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id={`${prefix}sterilised-yes`} />
                    <Label htmlFor={`${prefix}sterilised-yes`} className="font-normal cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id={`${prefix}sterilised-no`} />
                    <Label htmlFor={`${prefix}sterilised-no`} className="font-normal cursor-pointer">Nope</Label>
                  </div>
                </RadioGroup>
                {errors[`${prefix}furkidSterilised`] && (
                  <p className="text-sm text-red-600">{errors[`${prefix}furkidSterilised`]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${prefix}furkidAcquiredFrom`}>Where did you acquire your furkid? *</Label>
                <Input
                  id={`${prefix}furkidAcquiredFrom`}
                  value={furkid.furkidAcquiredFrom || ''}
                  onChange={(e) => handleInputChange(index, 'furkidAcquiredFrom', e.target.value)}
                  placeholder="e.g., Breeder, Shelter, Friend"
                  className={errors[`${prefix}furkidAcquiredFrom`] ? 'border-red-500' : ''}
                />
                {errors[`${prefix}furkidAcquiredFrom`] && (
                  <p className="text-sm text-red-600">{errors[`${prefix}furkidAcquiredFrom`]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${prefix}furkidJoinedFamily`}>When did your furkid join the family? (Month/Year) *</Label>
                <Input
                  id={`${prefix}furkidJoinedFamily`}
                  type="month"
                  value={furkid.furkidJoinedFamily || ''}
                  onChange={(e) => handleInputChange(index, 'furkidJoinedFamily', e.target.value)}
                  className={errors[`${prefix}furkidJoinedFamily`] ? 'border-red-500' : ''}
                />
                {errors[`${prefix}furkidJoinedFamily`] && (
                  <p className="text-sm text-red-600">{errors[`${prefix}furkidJoinedFamily`]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>First time having a furkid? *</Label>
                <RadioGroup
                  value={furkid.firstTimeOwner?.toString()}
                  onValueChange={(value) => handleInputChange(index, 'firstTimeOwner', value === 'true')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id={`${prefix}firsttime-yes`} />
                    <Label htmlFor={`${prefix}firsttime-yes`} className="font-normal cursor-pointer">Yup</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id={`${prefix}firsttime-no`} />
                    <Label htmlFor={`${prefix}firsttime-no`} className="font-normal cursor-pointer">Nope</Label>
                  </div>
                </RadioGroup>
                {errors[`${prefix}firstTimeOwner`] && (
                  <p className="text-sm text-red-600">{errors[`${prefix}firstTimeOwner`]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${prefix}furkidDiet`}>What is your furkid's diet? *</Label>
                <Input
                  id={`${prefix}furkidDiet`}
                  value={furkid.furkidDiet || ''}
                  onChange={(e) => handleInputChange(index, 'furkidDiet', e.target.value)}
                  placeholder="e.g., Dry kibble, Raw food"
                  className={errors[`${prefix}furkidDiet`] ? 'border-red-500' : ''}
                />
                {errors[`${prefix}furkidDiet`] && (
                  <p className="text-sm text-red-600">{errors[`${prefix}furkidDiet`]}</p>
                )}
              </div>

              {showFoodAllergy && (
                <>
                  <div className="space-y-2">
                    <Label>Any food allergy? *</Label>
                    <RadioGroup
                      value={furkid.hasFoodAllergy?.toString()}
                      onValueChange={(value) => handleInputChange(index, 'hasFoodAllergy', value === 'true')}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id={`${prefix}allergy-yes`} />
                        <Label htmlFor={`${prefix}allergy-yes`} className="font-normal cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id={`${prefix}allergy-no`} />
                        <Label htmlFor={`${prefix}allergy-no`} className="font-normal cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                    {errors[`${prefix}hasFoodAllergy`] && (
                      <p className="text-sm text-red-600">{errors[`${prefix}hasFoodAllergy`]}</p>
                    )}
                  </div>

                  {furkid.hasFoodAllergy && (
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}foodAllergyDetails`}>Please specify the food allergy *</Label>
                      <Input
                        id={`${prefix}foodAllergyDetails`}
                        value={furkid.foodAllergyDetails || ''}
                        onChange={(e) => handleInputChange(index, 'foodAllergyDetails', e.target.value)}
                        placeholder="e.g., Chicken, Beef, Grains"
                        className={errors[`${prefix}foodAllergyDetails`] ? 'border-red-500' : ''}
                      />
                      {errors[`${prefix}foodAllergyDetails`] && (
                        <p className="text-sm text-red-600">{errors[`${prefix}foodAllergyDetails`]}</p>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor={`${prefix}furkidSleepArea`}>Where does your furkid sleep at night? *</Label>
                <Input
                  id={`${prefix}furkidSleepArea`}
                  value={furkid.furkidSleepArea || ''}
                  onChange={(e) => handleInputChange(index, 'furkidSleepArea', e.target.value)}
                  placeholder="e.g., Bedroom, Living room, Crate"
                  className={errors[`${prefix}furkidSleepArea`] ? 'border-red-500' : ''}
                />
                {errors[`${prefix}furkidSleepArea`] && (
                  <p className="text-sm text-red-600">{errors[`${prefix}furkidSleepArea`]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${prefix}walkingFrequency`}>How frequently do you walk the furkid? *</Label>
                <Input
                  id={`${prefix}walkingFrequency`}
                  value={furkid.walkingFrequency || ''}
                  onChange={(e) => handleInputChange(index, 'walkingFrequency', e.target.value)}
                  placeholder="e.g., Twice a day, Once every 2 days"
                  className={errors[`${prefix}walkingFrequency`] ? 'border-red-500' : ''}
                />
                {errors[`${prefix}walkingFrequency`] && (
                  <p className="text-sm text-red-600">{errors[`${prefix}walkingFrequency`]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${prefix}furkidPhoto`}>Front Photo of Furkid (Max 10MB)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`${prefix}furkidPhoto`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(index, 'furkidPhotoUrl', e.target.files?.[0])}
                    disabled={uploading[index]}
                  />
                  {uploading[index] && <Loader2 className="w-4 h-4 animate-spin" />}
                </div>
                {furkid.furkidPhotoUrl && (
                  <img src={furkid.furkidPhotoUrl} alt="Furkid" className="w-32 h-32 object-cover rounded-lg mt-2" />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${prefix}furkidInstagram`}>Furkid's IG Account (if any)</Label>
                <Input
                  id={`${prefix}furkidInstagram`}
                  value={furkid.furkidInstagram || ''}
                  onChange={(e) => handleInputChange(index, 'furkidInstagram', e.target.value)}
                  placeholder="@furkidname"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${prefix}enrolmentReason`}>Reason for Enrolment</Label>
                <Textarea
                  id={`${prefix}enrolmentReason`}
                  value={furkid.enrolmentReason || ''}
                  onChange={(e) => handleInputChange(index, 'enrolmentReason', e.target.value)}
                  placeholder="Tell us why you're enrolling your furkid"
                  rows={3}
                />
              </div>
            </div>
          );
        })}

        {!isFYOG && (
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <Label>How did you know about us? *</Label>
            <RadioGroup
              value={formData.howDidYouKnow}
              onValueChange={(value) => {
                setFormData({ ...formData, howDidYouKnow: value });
                if (showValidationMessage) {
                  setShowValidationMessage(false);
                }
              }}
            >
              {['Google', 'Facebook', 'Instagram', 'AVS website', 'Recommendation'].map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`know-${option}`} />
                  <Label htmlFor={`know-${option}`} className="font-normal cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {errors.howDidYouKnow && (
              <p className="text-sm text-red-600">{errors.howDidYouKnow}</p>
            )}
          </div>
        )}

        {isFYOG && (
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <Label>How did you know about us?</Label>
            <RadioGroup
              value={formData.howDidYouKnow}
              onValueChange={(value) => setFormData({ ...formData, howDidYouKnow: value })}
            >
              {['Google', 'Facebook', 'Instagram', 'AVS website', 'Recommendation'].map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`know-${option}`} />
                  <Label htmlFor={`know-${option}`} className="font-normal cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {showValidationMessage && Object.keys(errors).length > 0 && (
          <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>Please fill in all required fields marked with an asterisk (*) before continuing.</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={validateAndContinue} className="flex-1">
            Review Booking
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}