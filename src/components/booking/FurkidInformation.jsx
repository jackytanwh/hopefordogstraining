import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle } from "lucide-react";
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

export default function FurkidInformation({ service, formData, setFormData, onNext, onBack, isFYOG, kinderPuppyCount, isMultiEntryForm, multiEntryIndex }) {
  const [errors, setErrors] = useState({});
  const [showValidationMessage, setShowValidationMessage] = useState(false);
  const [uploading, setUploading] = useState({});
  const [uploadingProof, setUploadingProof] = useState({});
  const [customBreeds, setCustomBreeds] = useState({});

  const numberOfFurkids = isMultiEntryForm ? 1 : (isFYOG ? (kinderPuppyCount || formData.numberOfFurkids || formData.basicMannersFYOGCount || 1) : 1);

  const showFoodAllergy = service.id === 'basic_manners_in_home' || service.id === 'basic_manners_fyog' || service.id === 'basic_manners_group_class';

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
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleInputChange = (furkidIndex, field, value) => {
    const actualIndex = isMultiEntryForm ? multiEntryIndex : furkidIndex;
    
    if (isFYOG || isMultiEntryForm) {
      setFormData(prev => {
        const newFurkids = [...(prev.furkids || [])];
        if (!newFurkids[actualIndex]) newFurkids[actualIndex] = {};
        newFurkids[actualIndex] = { ...newFurkids[actualIndex], [field]: value };
        return { ...prev, furkids: newFurkids };
      });
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
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
    const actualIndex = isMultiEntryForm ? multiEntryIndex : furkidIndex;
    if (value === 'Others') {
      setCustomBreeds({ ...customBreeds, [actualIndex]: true });
      handleInputChange(furkidIndex, 'furkidBreed', '');
    } else {
      setCustomBreeds({ ...customBreeds, [actualIndex]: false });
      handleInputChange(furkidIndex, 'furkidBreed', value);
    }
  };

  useEffect(() => {
    for (let i = 0; i < numberOfFurkids; i++) {
      const actualIndex = isMultiEntryForm ? multiEntryIndex : i;
      const furkid = (isFYOG || isMultiEntryForm) ? (formData.furkids && formData.furkids[actualIndex] ? formData.furkids[actualIndex] : {}) : formData;
      
      if (furkid?.dobMonth && furkid?.dobDay && furkid?.dobYear) {
        try {
          const now = new Date();
          const dobDate = new Date(parseInt(furkid.dobYear), parseInt(furkid.dobMonth) - 1, parseInt(furkid.dobDay));
          const years = differenceInYears(now, dobDate);
          const months = differenceInMonths(now, dobDate) % 12;
          
          let ageString = '';
          if (years > 0) {
            ageString = `${years} year${years > 1 ? 's' : ''}`;
            if (months > 0) {
              ageString += ` ${months} month${months > 1 ? 's' : ''}`;
            }
          } else {
            ageString = `${months} month${months > 1 ? 's' : ''}`;
          }
          
          if (isFYOG || isMultiEntryForm) {
            setFormData(prev => {
              const newFurkids = [...(prev.furkids || [])];
              if (!newFurkids[actualIndex]) newFurkids[actualIndex] = {};
              newFurkids[actualIndex] = { ...newFurkids[actualIndex], furkidAge: ageString };
              return { ...prev, furkids: newFurkids };
            });
          } else {
            setFormData(prev => ({ ...prev, furkidAge: ageString }));
          }
        } catch (e) {
          console.error('Error calculating age:', e);
        }
      }
    }
  }, [numberOfFurkids, ...((isFYOG || isMultiEntryForm) ? (formData.furkids || []).map(f => `${f?.dobMonth}-${f?.dobDay}-${f?.dobYear}`) : [`${formData.dobMonth}-${formData.dobDay}-${formData.dobYear}`])]);

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
      const actualIndex = isMultiEntryForm ? multiEntryIndex : i;
      const furkid = (isFYOG || isMultiEntryForm) ? formData.furkids[actualIndex] || {} : formData;
      const prefix = (isFYOG || isMultiEntryForm) ? `${actualIndex}_` : '';

      if (!furkid.furkidName?.trim()) {
        newErrors[`${prefix}furkidName`] = 'Furkid name is required';
      }

      if (!furkid.dobMonth || !furkid.dobDay || !furkid.dobYear) {
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


    }

    if (!isFYOG && !isMultiEntryForm && !formData.howDidYouKnow) {
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
          {isMultiEntryForm ? `Puppy ${multiEntryIndex + 1} Information` : (isFYOG ? 'Furkids Information' : "Your Furkid's Information")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {Array.from({ length: numberOfFurkids }, (_, index) => {
          const actualIndex = isMultiEntryForm ? multiEntryIndex : index;
          const furkid = (isFYOG || isMultiEntryForm) ? (formData.furkids && formData.furkids[actualIndex] ? formData.furkids[actualIndex] : {}) : formData;
          const prefix = (isFYOG || isMultiEntryForm) ? `${actualIndex}_` : '';
          const showCustomBreedInput = customBreeds[actualIndex] || (furkid.furkidBreed && !commonBreeds.includes(furkid.furkidBreed));

          return (
            <div key={index} className="space-y-4">
              {isFYOG && !isMultiEntryForm && numberOfFurkids > 1 && index > 0 && (
                <div className="pt-6 border-t border-slate-200" />
              )}
              {isFYOG && !isMultiEntryForm && numberOfFurkids > 1 && (
                <h3 className="font-semibold text-slate-900 text-lg">
                  {(service.id === 'kinder_puppy_fyog' || service.id === 'kinder_puppy_in_home' || kinderPuppyCount > 0) ? 'Puppy' : 'Dog'} {actualIndex + 1}
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
                  <Label htmlFor={`${prefix}adoptionProof`}>Upload Proof of Adoption (for non-Singapore Specials) (Max 10MB)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`${prefix}adoptionProof`}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(index, 'adoptionProofUrl', e.target.files?.[0])}
                      disabled={uploadingProof[index]}
                    />
                    {uploadingProof[index] && <Loader2 className="w-4 h-4 animate-spin" />}
                  </div>
                  {furkid.adoptionProofUrl && (
                    <p className="text-sm text-green-600">✓ File uploaded successfully</p>
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
                <Label>Date of Birth *</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={furkid.dobDay} onValueChange={(v) => handleInputChange(index, 'dobDay', v)}>
                    <SelectTrigger className={errors[`${prefix}furkidDob`] ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={furkid.dobMonth} onValueChange={(v) => handleInputChange(index, 'dobMonth', v)}>
                    <SelectTrigger className={errors[`${prefix}furkidDob`] ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={furkid.dobYear} onValueChange={(v) => handleInputChange(index, 'dobYear', v)}>
                    <SelectTrigger className={errors[`${prefix}furkidDob`] ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
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
                    <SelectItem value="Others">Others</SelectItem>
                    {commonBreeds.filter(breed => breed !== 'Others').map(breed => (
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
                <Label>When did your furkid join the family? (Month/Year) *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select 
                    value={furkid.joinedMonth} 
                    onValueChange={(v) => {
                      handleInputChange(index, 'joinedMonth', v);
                      if (furkid.joinedYear) {
                        const monthStr = v.padStart(2, '0');
                        handleInputChange(index, 'furkidJoinedFamily', `${furkid.joinedYear}-${monthStr}`);
                      }
                    }}
                  >
                    <SelectTrigger className={errors[`${prefix}furkidJoinedFamily`] ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={furkid.joinedYear} 
                    onValueChange={(v) => {
                      handleInputChange(index, 'joinedYear', v);
                      if (furkid.joinedMonth) {
                        const monthStr = furkid.joinedMonth.padStart(2, '0');
                        handleInputChange(index, 'furkidJoinedFamily', `${v}-${monthStr}`);
                      }
                    }}
                  >
                    <SelectTrigger className={errors[`${prefix}furkidJoinedFamily`] ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
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
                  placeholder="e.g., Twice a day, once every 2 days, 15mins each time"
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

        {!isFYOG && !isMultiEntryForm && (
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
            {isMultiEntryForm ? 'Continue' : 'Review Booking'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}