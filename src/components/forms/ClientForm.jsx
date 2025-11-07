
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Save, X, Phone, PawPrint, AlertTriangle, GraduationCap, Calendar, FileText } from "lucide-react";

export default function ClientForm({ onSubmit, onCancel, isSubmitting, commonBreeds, initialData = {} }) {
  const [formData, setFormData] = useState({
    client_name: '',
    mobile_number: '',
    dog_name: '',
    dog_age: '',
    breed: '',
    gender: '',
    food_allergy: false,
    diet: '',
    sleep_area: '',
    program: 'kinder_puppy',
    fyog_group: '', // Added FYOG group field
    start_date: '', // Added start_date field
    primary_concerns: '',
    instructions_for_clients: '',
    additional_instructions: '',
    initial_consultation_date: '',
    follow_up_date: '',
    second_consultation_date: '',
    ...initialData
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.client_name.trim()) {
      newErrors.client_name = "Client name is required";
    }
    
    if (!formData.mobile_number.trim()) {
      newErrors.mobile_number = "Mobile number is required";
    } else if (!/^\+[1-9]\d{1,14}$/.test(formData.mobile_number)) {
      newErrors.mobile_number = "Mobile number must be in E.164 format (e.g., +1234567890)";
    }
    
    if (!formData.dog_name.trim()) {
      newErrors.dog_name = (formData.program === 'basic_manners' || formData.program === 'basic_manners_group' || formData.program === 'basic_manners_fyog' || formData.program === 'behavioural_modification') ? "Dog's name is required" : "Puppy's name is required";
    }

    if (!formData.program) {
      newErrors.program = "Please select a program.";
    }

    if (formData.program === 'behavioural_modification' && !formData.initial_consultation_date) {
      newErrors.initial_consultation_date = "Initial consultation date is required for Behavioural Modification program";
    }
        
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card className="border border-slate-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contact Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name *</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => handleInputChange('client_name', e.target.value)}
                placeholder="Enter client's full name"
                className={errors.client_name ? 'border-red-500' : ''}
              />
              {errors.client_name && (
                <p className="text-sm text-red-600">{errors.client_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile_number">Mobile Number *</Label>
              <Input
                id="mobile_number"
                value={formData.mobile_number}
                onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                placeholder="+1234567890"
                className={errors.mobile_number ? 'border-red-500' : ''}
              />
              {errors.mobile_number && (
                <p className="text-sm text-red-600">{errors.mobile_number}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Program Selection */}
      <Card className="border border-slate-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Program Selection
          </h3>
          <div className="space-y-4"> {/* Changed to space-y-4 to accommodate FYOG group input */}
            <div className="space-y-2">
              <Label htmlFor="program">Program *</Label>
              <Select
                value={formData.program}
                onValueChange={(value) => handleInputChange('program', value)}
              >
                <SelectTrigger className={errors.program ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kinder_puppy">Kinder Puppy Program</SelectItem>
                  <SelectItem value="basic_manners">Basic Manners In-Home</SelectItem> {/* Renamed */}
                  <SelectItem value="basic_manners_group">Basic Manners Group Program</SelectItem>
                  <SelectItem value="basic_manners_fyog">Basic Manners FYOG (Max 4 Dogs)</SelectItem>
                  <SelectItem value="behavioural_modification">Behavioural Modification Program</SelectItem>
                </SelectContent>
              </Select>
              {errors.program && <p className="text-sm text-red-600">{errors.program}</p>}
            </div>

            {formData.program === 'basic_manners_fyog' && (
              <div className="space-y-2">
                <Label htmlFor="fyog_group">FYOG Group</Label>
                <Select
                  value={formData.fyog_group}
                  onValueChange={(value) => handleInputChange('fyog_group', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Group 1">Group 1</SelectItem>
                    <SelectItem value="Group 2">Group 2</SelectItem>
                    <SelectItem value="Group 3">Group 3</SelectItem>
                    <SelectItem value="Group 4">Group 4</SelectItem>
                    <SelectItem value="Group 5">Group 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Puppy/Dog Information */}
      <Card className="border border-slate-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <PawPrint className="w-5 h-5" />
            {formData.program === 'basic_manners' || formData.program === 'basic_manners_group' || formData.program === 'basic_manners_fyog' || formData.program === 'behavioural_modification' ? 'Dog Information' : 'Puppy Information'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="dog_name">{formData.program === 'basic_manners' || formData.program === 'basic_manners_group' || formData.program === 'basic_manners_fyog' || formData.program === 'behavioural_modification' ? "Dog's Name *" : "Puppy's Name *"}</Label>
              <Input
                id="dog_name"
                value={formData.dog_name}
                onChange={(e) => handleInputChange('dog_name', e.target.value)}
                placeholder={formData.program === 'basic_manners' || formData.program === 'basic_manners_group' || formData.program === 'basic_manners_fyog' || formData.program === 'behavioural_modification' ? "Enter dog's name" : "Enter puppy's name"}
                className={errors.dog_name ? 'border-red-500' : ''}
              />
              {errors.dog_name && (
                <p className="text-sm text-red-600">{errors.dog_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dog_age">{formData.program === 'basic_manners' || formData.program === 'basic_manners_group' || formData.program === 'basic_manners_fyog' || formData.program === 'behavioural_modification' ? "Dog's Age" : "Puppy's Age"}</Label>
              <Input
                id="dog_age"
                value={formData.dog_age || ''}
                onChange={(e) => handleInputChange('dog_age', e.target.value)}
                placeholder={formData.program === 'basic_manners' || formData.program === 'basic_manners_group' || formData.program === 'basic_manners_fyog' || formData.program === 'behavioural_modification' ? "e.g., 2 years" : "e.g., 12 weeks"}
              />
            </div>

            {/* Gender field - now visible for all programs */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleInputChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boy">Boy</SelectItem>
                  <SelectItem value="girl">Girl</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(formData.program === 'basic_manners' || formData.program === 'basic_manners_group' || formData.program === 'basic_manners_fyog') && (
              <div className="space-y-2">
                <Label htmlFor="food_allergy">Food Allergy?</Label>
                <Select
                  value={formData.food_allergy ? 'yes' : 'no'}
                  onValueChange={(value) => handleInputChange('food_allergy', value === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Does the dog have allergies?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Select
                value={commonBreeds.includes(formData.breed) ? formData.breed : 'other'}
                onValueChange={(value) => handleInputChange('breed', value === 'other' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select breed" />
                </SelectTrigger>
                <SelectContent>
                  {commonBreeds.map((breed) => (
                    <SelectItem key={breed} value={breed}>
                      {breed}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other (specify below)</SelectItem>
                </SelectContent>
              </Select>
              
              {(formData.breed === '' || (formData.breed !== 'other' && !commonBreeds.includes(formData.breed))) && (
                <Input
                  value={formData.breed}
                  onChange={(e) => handleInputChange('breed', e.target.value)}
                  placeholder="Enter specific breed"
                  className="mt-2"
                />
              )}
            </div>

            {/* Diet field for Kinder Puppy, Basic Manners In-Home, Basic Manners Group, and Basic Manners FYOG */}
            {(formData.program === 'kinder_puppy' || formData.program === 'basic_manners' || formData.program === 'basic_manners_group' || formData.program === 'basic_manners_fyog') && (
              <div className="space-y-2">
                <Label htmlFor="diet">Diet</Label>
                <Input
                  id="diet"
                  value={formData.diet || ''}
                  onChange={(e) => handleInputChange('diet', e.target.value)}
                  placeholder="e.g., Kibble, Raw food, Homemade"
                />
              </div>
            )}

            {/* Sleep Area field only for Basic Manners Group and Basic Manners FYOG */}
            {(formData.program === 'basic_manners_group' || formData.program === 'basic_manners_fyog') && (
              <div className="space-y-2">
                <Label htmlFor="sleep_area">Sleep Area</Label>
                <Input
                  id="sleep_area"
                  value={formData.sleep_area || ''}
                  onChange={(e) => handleInputChange('sleep_area', e.target.value)}
                  placeholder="e.g., Crate, Bed in living room"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Primary Concerns */}
      <Card className="border border-slate-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Primary Concerns
          </h3>
          <div className="space-y-2">
            <Label htmlFor="primary_concerns">Client's Primary Concerns</Label>
            <Textarea
              id="primary_concerns"
              value={formData.primary_concerns}
              onChange={(e) => handleInputChange('primary_concerns', e.target.value)}
              placeholder="Describe the main issues or goals the client has (e.g., leash pulling, separation anxiety, basic obedience)..."
              className="h-24"
            />
          </div>
        </CardContent>
      </Card>

      {/* Training Instructions - Only for Behavioural Modification */}
      {formData.program === 'behavioural_modification' && (
        <Card className="border border-slate-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Training Instructions
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="instructions_for_clients">Instructions for Clients</Label>
                <Textarea
                  id="instructions_for_clients"
                  value={formData.instructions_for_clients}
                  onChange={(e) => handleInputChange('instructions_for_clients', e.target.value)}
                  placeholder="Enter training instructions and exercises for the client..."
                  className="h-24"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_instructions">Additional Instructions</Label>
                <Textarea
                  id="additional_instructions"
                  value={formData.additional_instructions}
                  onChange={(e) => handleInputChange('additional_instructions', e.target.value)}
                  placeholder="Any additional notes or special considerations..."
                  className="h-24"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consultation Schedule - Only for Behavioural Modification */}
      {formData.program === 'behavioural_modification' && (
        <Card className="border border-slate-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Consultation Schedule
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="initial_consultation_date">Initial Consultation *</Label>
                <Input
                  id="initial_consultation_date"
                  type="date"
                  value={formData.initial_consultation_date}
                  onChange={(e) => handleInputChange('initial_consultation_date', e.target.value)}
                  className={errors.initial_consultation_date ? 'border-red-500' : ''}
                  placeholder="dd/mm/yyyy"
                />
                {errors.initial_consultation_date && (
                  <p className="text-sm text-red-600">{errors.initial_consultation_date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="follow_up_date">Follow-up Date</Label>
                <Input
                  id="follow_up_date"
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => handleInputChange('follow_up_date', e.target.value)}
                  placeholder="dd/mm/yyyy"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="second_consultation_date">Second Consultation</Label>
                <Input
                  id="second_consultation_date"
                  type="date"
                  value={formData.second_consultation_date}
                  onChange={(e) => handleInputChange('second_consultation_date', e.target.value)}
                  placeholder="dd/mm/yyyy"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving...' : 'Save Client'}
        </Button>
      </div>
    </form>
  );
}
