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

export default function CombinedPawrentPuppyForm({ service, formData, setFormData, onNext, onBack, kinderPuppyCount, currentIndex }) {
  const [errors, setErrors] = useState({});
  const [showValidationMessage, setShowValidationMessage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [showCustomBreed, setShowCustomBreed] = useState(false);

  const formDataRef = React.useRef(formData);
  useEffect(() => { formDataRef.current = formData; });

  const client = (formData.clients && formData.clients[currentIndex]) || {};
  const furkid = (formData.furkids && formData.furkids[currentIndex]) || {};

  // Clear fields when currentIndex changes
  useEffect(() => {
    setErrors({});
    setShowValidationMessage(false);
    setShowCustomBreed(false);

    // Use ref to get latest formData and clear the current entry's data
    const latest = formDataRef.current;
    const newClients = [...(latest.clients || [])];
    const newFurkids = [...(latest.furkids || [])];
    newClients[currentIndex] = {};
    newFurkids[currentIndex] = {};
    setFormData({ ...latest, clients: newClients, furkids: newFurkids });
  }, [currentIndex]);

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

  const checkSentosaPostalCode = (postalCode) => {
    if (!postalCode) return false;
    const code = parseInt(postalCode);
    return code >= 90000 && code <= 99999;
  };

  const handleSharedLocationChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    if (field === 'sharedPostalCode') {
      updated.isSentosa = checkSentosaPostalCode(value);
    }
    setFormData(updated);
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
    if (showValidationMessage) setShowValidationMessage(false);
  };

  const handleClientChange = (field, value) => {
    const newClients = [...(formData.clients || [])];
    if (!newClients[currentIndex]) {
      newClients[currentIndex] = {};
    }
    newClients[currentIndex][field] = value;
    setFormData({ ...formData, clients: newClients });
    
    if (errors[`client_${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`client_${field}`];
      setErrors(newErrors);
    }
    if (showValidationMessage) setShowValidationMessage(false);
  };

  const handleFurkidChange = (field, value) => {
    const newFurkids = [...(formData.furkids || [])];
    if (!newFurkids[currentIndex]) {
      newFurkids[currentIndex] = {};
    }
    newFurkids[currentIndex][field] = value;
    setFormData({ ...formData, furkids: newFurkids });
    
    if (errors[`furkid_${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`furkid_${field}`];
      setErrors(newErrors);
    }
    if (showValidationMessage) setShowValidationMessage(false);
  };

  useEffect(() => {
    if (furkid?.dobMonth && furkid?.dobDay && furkid?.dobYear) {
      try {
        const now = new Date();
        const dobDate = new Date(parseInt(furkid.dobYear), parseInt(furkid.dobMonth) - 1, parseInt(furkid.dobDay));
        const yearsDiff = differenceInYears(now, dobDate);
        const monthsDiff = differenceInMonths(now, dobDate) % 12;
        
        let ageString = '';
        if (yearsDiff > 0) {
          ageString = `${yearsDiff} year${yearsDiff > 1 ? 's' : ''}`;
          if (monthsDiff > 0) {
            ageString += ` ${monthsDiff} month${monthsDiff > 1 ? 's' : ''}`;
          }
        } else {
          ageString = `${monthsDiff} month${monthsDiff > 1 ? 's' : ''}`;
        }
        handleFurkidChange('furkidAge', ageString);
      } catch (e) {
        console.error('Error calculating age:', e);
      }
    }
  }, [furkid?.dobMonth, furkid?.dobDay, furkid?.dobYear]);

  const handleBreedSelect = (value) => {
    if (value === 'Others') {
      setShowCustomBreed(true);
      handleFurkidChange('furkidBreed', '');
    } else {
      setShowCustomBreed(false);
      handleFurkidChange('furkidBreed', value);
    }
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrors({ ...errors, [field]: 'File size must be less than 10MB' });
      return;
    }

    try {
      if (field === 'furkidPhotoUrl') {
        setUploading(true);
      } else {
        setUploadingProof(true);
      }

      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleFurkidChange(field, file_url);
    } catch (error) {
      console.error('Upload error:', error);
      setErrors({ ...errors, [field]: 'Upload failed. Please try again.' });
    } finally {
      if (field === 'furkidPhotoUrl') {
        setUploading(false);
      } else {
        setUploadingProof(false);
      }
    }
  };

  const validateAndContinue = () => {
    const newErrors = {};
    
    // Get current client and furkid data
    const currentClient = (formData.clients && formData.clients[currentIndex]) || {};
    const currentFurkid = (formData.furkids && formData.furkids[currentIndex]) || {};

    // Client validation
    if (!currentClient.clientName?.trim()) {
      newErrors.client_clientName = 'Name is required';
    }
    if (!currentClient.clientEmail?.trim()) {
      newErrors.client_clientEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentClient.clientEmail)) {
      newErrors.client_clientEmail = 'Invalid email format';
    }
    if (!currentClient.clientMobile?.trim()) {
      newErrors.client_clientMobile = 'Mobile number is required';
    }

    // Address/postal only required for first Pawrent
    if (currentIndex === 0) {
      if (!formData.sharedAddress?.trim()) {
        newErrors.sharedAddress = 'Address is required';
      }
      if (!formData.sharedPostalCode?.trim()) {
        newErrors.sharedPostalCode = 'Postal code is required';
      } else if (!/^\d{6}$/.test(formData.sharedPostalCode)) {
        newErrors.sharedPostalCode = 'Invalid postal code (6 digits required)';
      }
    }

    // Furkid validation
    if (currentFurkid.isAdopted === undefined || currentFurkid.isAdopted === null || currentFurkid.isAdopted === '') {
      newErrors.furkid_isAdopted = 'Please specify if puppy is adopted';
    }
    if (!currentFurkid.furkidName?.trim()) {
      newErrors.furkid_furkidName = 'Puppy name is required';
    }
    if (!currentFurkid.dobMonth || !currentFurkid.dobDay || !currentFurkid.dobYear) {
      newErrors.furkid_furkidDob = 'Date of birth is required';
    }
    if (!currentFurkid.furkidBreed?.trim()) {
      newErrors.furkid_furkidBreed = 'Breed is required';
    }
    if (!currentFurkid.furkidGender?.trim()) {
      newErrors.furkid_furkidGender = 'Gender is required';
    }
    if (currentFurkid.furkidSterilised === undefined || currentFurkid.furkidSterilised === null || currentFurkid.furkidSterilised === '') {
      newErrors.furkid_furkidSterilised = 'Please select if puppy is sterilised';
    }
    if (!currentFurkid.furkidAcquiredFrom?.trim()) {
      newErrors.furkid_furkidAcquiredFrom = 'Please specify where you acquired your puppy';
    }
    if (!currentFurkid.joinedMonth || !currentFurkid.joinedYear) {
      newErrors.furkid_furkidJoinedFamily = 'Please specify when puppy joined the family';
    }
    if (currentFurkid.firstTimeOwner === undefined || currentFurkid.firstTimeOwner === null || currentFurkid.firstTimeOwner === '') {
      newErrors.furkid_firstTimeOwner = 'Please specify if this is your first time having a furkid';
    }
    if (!currentFurkid.furkidDiet?.trim()) {
      newErrors.furkid_furkidDiet = 'Please specify puppy diet';
    }
    if (!currentFurkid.furkidSleepArea?.trim()) {
      newErrors.furkid_furkidSleepArea = 'Please specify where puppy sleeps';
    }
    if (!currentFurkid.walkingFrequency?.trim()) {
      newErrors.furkid_walkingFrequency = 'Please specify walking frequency';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShowValidationMessage(true);
      return;
    }

    onNext();
  };

  const showCustomBreedInput = showCustomBreed || (furkid.furkidBreed && !commonBreeds.includes(furkid.furkidBreed));

  return (
    <Card key={currentIndex} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>Pawrent {currentIndex + 1} & Puppy {currentIndex + 1}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {/* Pawrent Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Pawrent Information</h3>
          
          <div className="space-y-2">
            <Label htmlFor="clientName">Name *</Label>
            <Input
              id="clientName"
              value={client.clientName || ''}
              onChange={(e) => handleClientChange('clientName', e.target.value)}
              placeholder="Enter your name"
              className={errors.client_clientName ? 'border-red-500' : ''}
            />
            {errors.client_clientName && (
              <p className="text-sm text-red-600">{errors.client_clientName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientEmail">Email Address *</Label>
            <Input
              id="clientEmail"
              type="email"
              value={client.clientEmail || ''}
              onChange={(e) => handleClientChange('clientEmail', e.target.value)}
              placeholder="your.email@example.com"
              className={errors.client_clientEmail ? 'border-red-500' : ''}
            />
            {errors.client_clientEmail && (
              <p className="text-sm text-red-600">{errors.client_clientEmail}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientMobile">Mobile Number (WhatsApp) *</Label>
            <Input
              id="clientMobile"
              value={client.clientMobile || ''}
              onChange={(e) => handleClientChange('clientMobile', e.target.value)}
              placeholder="+65 9123 4567"
              className={errors.client_clientMobile ? 'border-red-500' : ''}
            />
            {errors.client_clientMobile && (
              <p className="text-sm text-red-600">{errors.client_clientMobile}</p>
            )}
          </div>

          {/* Address & Postal Code - only for Pawrent 1 */}
          {currentIndex === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="sharedAddress">Training Address *</Label>
                <Input
                  id="sharedAddress"
                  value={formData.sharedAddress || ''}
                  onChange={(e) => handleSharedLocationChange('sharedAddress', e.target.value)}
                  placeholder="Enter full address"
                  className={errors.sharedAddress ? 'border-red-500' : ''}
                />
                {errors.sharedAddress && (
                  <p className="text-sm text-red-600">{errors.sharedAddress}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sharedPostalCode">Postal Code *</Label>
                <Input
                  id="sharedPostalCode"
                  value={formData.sharedPostalCode || ''}
                  onChange={(e) => handleSharedLocationChange('sharedPostalCode', e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className={errors.sharedPostalCode ? 'border-red-500' : ''}
                />
                {errors.sharedPostalCode && (
                  <p className="text-sm text-red-600">{errors.sharedPostalCode}</p>
                )}
                {formData.isSentosa && (
                  <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-800">
                      <p className="font-semibold">Sentosa Island Surcharge</p>
                      <p>An additional $10 per session surcharge will apply to your booking.</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Puppy Information Section */}
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Puppy Information</h3>

          <div className="space-y-2">
            <Label>Is your puppy a Singapore Special or adopted from a shelter? *</Label>
            <RadioGroup
              value={furkid.isAdopted?.toString()}
              onValueChange={(value) => handleFurkidChange('isAdopted', value === 'true')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`adopted-yes-${currentIndex}`} />
                <Label htmlFor={`adopted-yes-${currentIndex}`} className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`adopted-no-${currentIndex}`} />
                <Label htmlFor={`adopted-no-${currentIndex}`} className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>
            {errors.furkid_isAdopted && (
              <p className="text-sm text-red-600">{errors.furkid_isAdopted}</p>
            )}
          </div>

          {furkid.isAdopted && (
            <div className="space-y-2">
              <Label htmlFor="adoptionProof">Upload Proof of Adoption (for non-Singapore Specials) (Max 10MB)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="adoptionProof"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload('adoptionProofUrl', e.target.files?.[0])}
                  disabled={uploadingProof}
                />
                {uploadingProof && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
              {furkid.adoptionProofUrl && (
                <p className="text-sm text-green-600">✓ File uploaded successfully</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="furkidName">Puppy's Name *</Label>
            <Input
              id="furkidName"
              value={furkid.furkidName || ''}
              onChange={(e) => handleFurkidChange('furkidName', e.target.value)}
              placeholder="Enter your puppy's name"
              className={errors.furkid_furkidName ? 'border-red-500' : ''}
            />
            {errors.furkid_furkidName && (
              <p className="text-sm text-red-600">{errors.furkid_furkidName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date of Birth *</Label>
            <div className="grid grid-cols-3 gap-2">
              <Select value={furkid.dobDay} onValueChange={(v) => handleFurkidChange('dobDay', v)}>
                <SelectTrigger className={errors.furkid_furkidDob ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {days.map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={furkid.dobMonth} onValueChange={(v) => handleFurkidChange('dobMonth', v)}>
                <SelectTrigger className={errors.furkid_furkidDob ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={furkid.dobYear} onValueChange={(v) => handleFurkidChange('dobYear', v)}>
                <SelectTrigger className={errors.furkid_furkidDob ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {errors.furkid_furkidDob && (
              <p className="text-sm text-red-600">{errors.furkid_furkidDob}</p>
            )}
          </div>

          {furkid.furkidAge && (
            <div className="space-y-2">
              <Label>Age</Label>
              <Input value={furkid.furkidAge} disabled className="bg-slate-50" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="furkidBreed">Breed *</Label>
            <Select
              value={showCustomBreedInput ? 'Others' : furkid.furkidBreed}
              onValueChange={handleBreedSelect}
            >
              <SelectTrigger className={errors.furkid_furkidBreed ? 'border-red-500' : ''}>
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
                onChange={(e) => handleFurkidChange('furkidBreed', e.target.value)}
                placeholder="Enter breed name"
                className={errors.furkid_furkidBreed ? 'border-red-500 mt-2' : 'mt-2'}
              />
            )}
            
            {errors.furkid_furkidBreed && (
              <p className="text-sm text-red-600">{errors.furkid_furkidBreed}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Gender *</Label>
            <RadioGroup
              value={furkid.furkidGender}
              onValueChange={(value) => handleFurkidChange('furkidGender', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="boy" id={`gender-boy-${currentIndex}`} />
                <Label htmlFor={`gender-boy-${currentIndex}`} className="font-normal cursor-pointer">Boy</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="girl" id={`gender-girl-${currentIndex}`} />
                <Label htmlFor={`gender-girl-${currentIndex}`} className="font-normal cursor-pointer">Girl</Label>
              </div>
            </RadioGroup>
            {errors.furkid_furkidGender && (
              <p className="text-sm text-red-600">{errors.furkid_furkidGender}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Sterilised? *</Label>
            <RadioGroup
              value={furkid.furkidSterilised?.toString()}
              onValueChange={(value) => handleFurkidChange('furkidSterilised', value === 'true')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`sterilised-yes-${currentIndex}`} />
                <Label htmlFor={`sterilised-yes-${currentIndex}`} className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`sterilised-no-${currentIndex}`} />
                <Label htmlFor={`sterilised-no-${currentIndex}`} className="font-normal cursor-pointer">Nope</Label>
              </div>
            </RadioGroup>
            {errors.furkid_furkidSterilised && (
              <p className="text-sm text-red-600">{errors.furkid_furkidSterilised}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="furkidAcquiredFrom">Where did you acquire your puppy? *</Label>
            <Input
              id="furkidAcquiredFrom"
              value={furkid.furkidAcquiredFrom || ''}
              onChange={(e) => handleFurkidChange('furkidAcquiredFrom', e.target.value)}
              placeholder="e.g., Breeder, Shelter, Friend"
              className={errors.furkid_furkidAcquiredFrom ? 'border-red-500' : ''}
            />
            {errors.furkid_furkidAcquiredFrom && (
              <p className="text-sm text-red-600">{errors.furkid_furkidAcquiredFrom}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>When did your puppy join the family? (Month/Year) *</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select 
                value={furkid.joinedMonth} 
                onValueChange={(v) => {
                  handleFurkidChange('joinedMonth', v);
                  if (furkid.joinedYear) {
                    const monthStr = v.padStart(2, '0');
                    handleFurkidChange('furkidJoinedFamily', `${furkid.joinedYear}-${monthStr}`);
                  }
                }}
              >
                <SelectTrigger className={errors.furkid_furkidJoinedFamily ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select 
                value={furkid.joinedYear} 
                onValueChange={(v) => {
                  handleFurkidChange('joinedYear', v);
                  if (furkid.joinedMonth) {
                    const monthStr = furkid.joinedMonth.padStart(2, '0');
                    handleFurkidChange('furkidJoinedFamily', `${v}-${monthStr}`);
                  }
                }}
              >
                <SelectTrigger className={errors.furkid_furkidJoinedFamily ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {errors.furkid_furkidJoinedFamily && (
              <p className="text-sm text-red-600">{errors.furkid_furkidJoinedFamily}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>First time having a furkid? *</Label>
            <RadioGroup
              value={furkid.firstTimeOwner?.toString()}
              onValueChange={(value) => handleFurkidChange('firstTimeOwner', value === 'true')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`firsttime-yes-${currentIndex}`} />
                <Label htmlFor={`firsttime-yes-${currentIndex}`} className="font-normal cursor-pointer">Yup</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`firsttime-no-${currentIndex}`} />
                <Label htmlFor={`firsttime-no-${currentIndex}`} className="font-normal cursor-pointer">Nope</Label>
              </div>
            </RadioGroup>
            {errors.furkid_firstTimeOwner && (
              <p className="text-sm text-red-600">{errors.furkid_firstTimeOwner}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="furkidDiet">What is your puppy's diet? *</Label>
            <Input
              id="furkidDiet"
              value={furkid.furkidDiet || ''}
              onChange={(e) => handleFurkidChange('furkidDiet', e.target.value)}
              placeholder="e.g., Dry kibble, Raw food"
              className={errors.furkid_furkidDiet ? 'border-red-500' : ''}
            />
            {errors.furkid_furkidDiet && (
              <p className="text-sm text-red-600">{errors.furkid_furkidDiet}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="furkidSleepArea">Where does your puppy sleep at night? *</Label>
            <Input
              id="furkidSleepArea"
              value={furkid.furkidSleepArea || ''}
              onChange={(e) => handleFurkidChange('furkidSleepArea', e.target.value)}
              placeholder="e.g., Bedroom, Living room, Crate"
              className={errors.furkid_furkidSleepArea ? 'border-red-500' : ''}
            />
            {errors.furkid_furkidSleepArea && (
              <p className="text-sm text-red-600">{errors.furkid_furkidSleepArea}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="walkingFrequency">How frequently do you walk the puppy? *</Label>
            <Input
              id="walkingFrequency"
              value={furkid.walkingFrequency || ''}
              onChange={(e) => handleFurkidChange('walkingFrequency', e.target.value)}
              placeholder="e.g., Twice a day, Once every 2 days"
              className={errors.furkid_walkingFrequency ? 'border-red-500' : ''}
            />
            {errors.furkid_walkingFrequency && (
              <p className="text-sm text-red-600">{errors.furkid_walkingFrequency}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="furkidPhoto">Front Photo of Puppy (Max 10MB)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="furkidPhoto"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('furkidPhotoUrl', e.target.files?.[0])}
                disabled={uploading}
              />
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
            {furkid.furkidPhotoUrl && (
              <img src={furkid.furkidPhotoUrl} alt="Puppy" className="w-32 h-32 object-cover rounded-lg mt-2" />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="furkidInstagram">Puppy's IG Account (if any)</Label>
            <Input
              id="furkidInstagram"
              value={furkid.furkidInstagram || ''}
              onChange={(e) => handleFurkidChange('furkidInstagram', e.target.value)}
              placeholder="@puppyname"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="enrolmentReason">Reason for Enrolment</Label>
            <Textarea
              id="enrolmentReason"
              value={furkid.enrolmentReason || ''}
              onChange={(e) => handleFurkidChange('enrolmentReason', e.target.value)}
              placeholder="Tell us why you're enrolling your puppy"
              rows={3}
            />
          </div>
        </div>

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
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}