import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

import OnDemandSessionSelection from "../components/booking/OnDemandSessionSelection";
import KinderPuppyCountSelection from "../components/booking/KinderPuppyCountSelection";
import BasicMannersFYOGCountSelection from "../components/booking/BasicMannersFYOGCountSelection";
import DateTimeSelection from "../components/booking/DateTimeSelection";
import ParticipantSelection from "../components/booking/ParticipantSelection";
import ClientInformation from "../components/booking/ClientInformation";
import FurkidInformation from "../components/booking/FurkidInformation";
import ProductSelection from "../components/booking/ProductSelection";
import BookingSummary from "../components/booking/BookingSummary";
import BehaviouralModificationForm from "../components/booking/BehaviouralModificationForm";

const services = {
  kinder_puppy_in_home: {
    id: "kinder_puppy_in_home",
    name: "Kinder Puppy Program (In-Home)",
    price: 520,
    duration: 1,
    sessions: 4,
    minParticipants: 1,
    maxParticipants: 3,
    buffer: 1
  },
  basic_manners_in_home: {
    id: "basic_manners_in_home",
    name: "Basic Manners Program (In-Home)",
    price: 720,
    duration: 1,
    sessions: 6,
    minParticipants: 1,
    maxParticipants: 1,
    buffer: 1
  },

  basic_manners_fyog: {
    id: "basic_manners_fyog",
    name: "Basic Manners Program",
    price: 720,
    duration: 1,
    sessions: 6,
    minParticipants: 1,
    maxParticipants: 4,
    buffer: 1
  },
  adore_hdb_approval: {
    id: "adore_hdb_approval",
    name: "ADORE/HDB Approval Program",
    price: 520,
    duration: 0.75,
    sessions: 4,
    minParticipants: 1,
    maxParticipants: 1,
    buffer: 1
  },
  basic_manners_group_class: {
    id: "basic_manners_group_class",
    name: "Basic Manners Program (Group)",
    price: 520,
    duration: 1,
    sessions: 7,
    minParticipants: 1,
    maxParticipants: 4,
    buffer: 1
  },
  canine_assessment: {
    id: "canine_assessment",
    name: "Canine Assessment",
    price: 158,
    duration: 0.75,
    sessions: 1,
    minParticipants: 1,
    maxParticipants: 1,
    buffer: 1
  },
  behavioural_modification: {
    id: "behavioural_modification",
    name: "Behavioural Modification (In-Home)",
    price: 358,
    duration: 1.5,
    sessions: 2,
    minParticipants: 1,
    maxParticipants: 1,
    buffer: 1
  },
  on_demand_training: {
    id: "on_demand_training",
    name: "On-Demand Training",
    price: 120,
    duration: 1,
    sessions: 1,
    minParticipants: 1,
    maxParticipants: 1,
    buffer: 1
  }
};

export default function BookService() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const serviceId = urlParams.get('service');
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceType: serviceId || '',
    onDemandSessions: null,
    onDemandPrice: null,
    kinderPuppyCount: null,
    kinderPuppyPrice: null,
    basicMannersFYOGCount: null,
    basicMannersFYOGPrice: null,
    sessionDates: [],
    numberOfFurkids: null,
    numberOfClients: null,
    clients: [],
    furkids: [],
    clientName: '',
    clientEmail: '',
    clientMobile: '',
    clientAddress: '',
    clientPostalCode: '',
    isSentosa: false,
    whatsappConsent: false,
    isAdopted: false,
    adoptionProofUrl: '',
    furkidName: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    furkidDob: '',
    furkidAge: '',
    furkidBreed: '',
    furkidGender: '',
    furkidSterilised: false,
    furkidAcquiredFrom: '',
    furkidJoinedFamily: '',
    firstTimeOwner: false,
    furkidDiet: '',
    furkidSleepArea: '',
    walkingFrequency: '',
    hasFoodAllergy: false,
    foodAllergyDetails: '',
    furkidPhotoUrl: '',
    furkidInstagram: '',
    enrolmentReason: '',
    howDidYouKnow: '',
    productSelections: [],
    productsTotal: 0,
    ownerInvolvedInBite: false,
    biteHistory: false,
    strangerDanger: false,
    resourceGuarding: false,
    fearful: false,
    inappropriateReactivity: false,
    excessiveVocalization: false,
    destructiveBehavior: false,
    separationAnxiety: false,
    pottyTrainingIssues: false,
    otherBehavioralIssues: '',
    requires_assessment_report: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOnDemand = serviceId === 'on_demand_training';
  
  const getService = () => {
    if (isOnDemand && formData.onDemandSessions) {
      return {
        ...services[serviceId],
        sessions: formData.onDemandSessions,
        price: formData.onDemandPrice,
        name: `On-Demand Training (${formData.onDemandSessions} Session${formData.onDemandSessions > 1 ? 's' : ''})`
      };
    }
    if (serviceId === 'kinder_puppy_in_home' && formData.kinderPuppyPrice) {
      return {
        ...services[serviceId],
        price: formData.kinderPuppyPrice,
        name: `Kinder Puppy Program (In-Home) — ${formData.kinderPuppyCount} Pupp${formData.kinderPuppyCount > 1 ? 'ies' : 'y'}`
      };
    }
    if (serviceId === 'basic_manners_fyog' && formData.basicMannersFYOGPrice) {
      return {
        ...services[serviceId],
        price: formData.basicMannersFYOGPrice,
        name: `Basic Manners Program — ${formData.basicMannersFYOGCount} Dog${formData.basicMannersFYOGCount > 1 ? 's' : ''}`
      };
    }
    return services[serviceId];
  };

  const service = getService();
  const isFYOG = serviceId === 'basic_manners_fyog';
  const isKinderPuppy = serviceId === 'kinder_puppy_in_home';
  const isGroupClass = serviceId === 'basic_manners_group_class';
  const isBasicManners = serviceId === 'basic_manners_in_home' || serviceId === 'basic_manners_fyog' || serviceId === 'basic_manners_group_class';
  const isBehaviouralModification = serviceId === 'behavioural_modification';
  const isCanineAssessment = serviceId === 'canine_assessment';

  const totalSteps = isOnDemand ? 6 : (isGroupClass ? 5 : isFYOG ? 6 : isKinderPuppy ? 6 : (isBehaviouralModification || isCanineAssessment) ? 5 : 5);

  useEffect(() => {
    if (!serviceId || !services[serviceId]) {
      navigate(createPageUrl("BookingSystem"));
    }
  }, [serviceId, navigate]);

  const calculatePricing = () => {
    if (!service) return { basePrice: 0, discount: 0, surcharge: 0, sentosaSurcharge: 0, productsTotal: 0, total: 0 };
    
    const basePrice = isGroupClass
      ? service.price * (formData.numberOfFurkids || 1)
      : isFYOG && formData.basicMannersFYOGPrice
      ? formData.basicMannersFYOGPrice
      : isKinderPuppy && formData.kinderPuppyPrice
      ? formData.kinderPuppyPrice
      : service.price;
    
    let adoptionDiscount = 0;
    if (isGroupClass) {
      const adoptedCount = (formData.furkids || []).filter(f => f && f.isAdopted).length;
      adoptionDiscount = (service.price * adoptedCount) * 0.1;
    } else if (isFYOG) {
      // Apply 10% discount per adopted furkid (first dog $720, extra dogs $360)
      const fyogBasePrice = 720;
      const fyogExtraPrice = 360;
      const furkids = formData.furkids || [];
      furkids.forEach((furkid, idx) => {
        if (furkid && furkid.isAdopted) {
          adoptionDiscount += (idx === 0 ? fyogBasePrice : fyogExtraPrice) * 0.1;
        }
      });
    } else {
      adoptionDiscount = formData.isAdopted ? basePrice * 0.1 : 0;
    }
    
    let weekendSurcharge = 0;
    let weekendSessions = 0;
    
    if (!isGroupClass && formData.sessionDates && Array.isArray(formData.sessionDates)) {
      weekendSessions = formData.sessionDates.filter(session => {
        if (!session || !session.date) return false;
        const date = new Date(session.date);
        const day = date.getDay();
        return day === 0 || day === 6;
      }).length;
      
      const pricePerSession = isGroupClass
        ? service.price * (formData.numberOfFurkids || 1)
        : isFYOG && formData.basicMannersFYOGPrice
        ? formData.basicMannersFYOGPrice
        : isKinderPuppy && formData.kinderPuppyPrice
        ? formData.kinderPuppyPrice
        : service.price;
      const pricePerSessionCalculated = pricePerSession / service.sessions;
      
      weekendSurcharge = weekendSessions > 0 ? (pricePerSessionCalculated * weekendSessions * 0.05) : 0;
    }
    
    const sentosaSurcharge = formData.isSentosa ? (10 * service.sessions) : 0;
    const productsTotal = formData.productsTotal || 0;
    
    const total = basePrice - adoptionDiscount + weekendSurcharge + sentosaSurcharge + productsTotal;
    
    return {
      basePrice,
      discount: adoptionDiscount,
      surcharge: weekendSurcharge,
      sentosaSurcharge,
      productsTotal,
      total,
      weekendSessionCount: weekendSessions
    };
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      navigate(createPageUrl("BookingSystem"));
    } else {
      setStep(step - 1);
    }
  };

  const camelToSnake = (str) => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  };

  const transformClientFields = (client) => {
    const transformed = {};
    Object.keys(client).forEach(key => {
      const snakeKey = camelToSnake(key);
      transformed[snakeKey] = client[key] || '';
    });
    return transformed;
  };

  const transformFurkidFields = (furkid) => {
    const transformed = {};
    Object.keys(furkid).forEach(key => {
      if (key === 'dobDay' || key === 'dobMonth' || key === 'dobYear') {
        return;
      }
      const snakeKey = camelToSnake(key);
      
      if (key === 'isAdopted' || key === 'furkidSterilised' || key === 'firstTimeOwner' || key === 'hasFoodAllergy') {
        transformed[snakeKey] = Boolean(furkid[key]);
      } else {
        transformed[snakeKey] = furkid[key] || '';
      }
    });
    
    if (furkid.dobDay && furkid.dobMonth && furkid.dobYear) {
      const month = furkid.dobMonth.toString().padStart(2, '0');
      const day = furkid.dobDay.toString().padStart(2, '0');
      transformed.furkid_dob = `${furkid.dobYear}-${month}-${day}`;
    }
    
    return transformed;
  };

  const getClientFieldValue = (client, camelKey, snakeKey) => {
    if (!client) return '';
    return client[camelKey] || client[snakeKey] || '';
  };

  const firstNonEmptyValue = (...values) => {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return '';
  };

  const getPrimaryClientContact = (clients = []) => {
    let name = '';
    let email = '';
    let mobile = '';

    for (const client of clients) {
      name = firstNonEmptyValue(name, getClientFieldValue(client, 'clientName', 'client_name'));
      email = firstNonEmptyValue(email, getClientFieldValue(client, 'clientEmail', 'client_email'));
      mobile = firstNonEmptyValue(mobile, getClientFieldValue(client, 'clientMobile', 'client_mobile'));

      if (name && email) {
        break;
      }
    }

    return { name, email, mobile };
  };

  const handleSubmit = async (agreements) => {
    setIsSubmitting(true);
    
    console.log('=== BOOKING SUBMISSION STARTED ===');
    console.log('Raw formData:', JSON.stringify(formData, null, 2));
    
    try {
      const pricing = calculatePricing();
      console.log('✅ Pricing calculated:', pricing);
      
      let actualServiceType = formData.serviceType;
      if (formData.serviceType === 'on_demand_training' && formData.onDemandSessions) {
        actualServiceType = `on_demand_${formData.onDemandSessions}_session${formData.onDemandSessions > 1 ? 's' : ''}`;
      }
      
      const bookingData = {
        service_type: actualServiceType,
        service_name: service.name,
        booking_status: 'pending',
        session_dates: formData.sessionDates || [],
        product_selections: formData.productSelections || [],
        products_total: pricing.productsTotal || 0,
        base_price: pricing.basePrice || 0,
        adoption_discount: pricing.discount || 0,
        weekend_surcharge: pricing.surcharge || 0,
        is_sentosa_booking: Boolean(formData.isSentosa),
        sentosa_surcharge_per_session: formData.isSentosa ? 10 : 0,
        total_sentosa_surcharge: pricing.sentosaSurcharge || 0,
        total_price: pricing.total || 0,
        whatsapp_consent: Boolean(formData.whatsappConsent),
      };

      if (formData.howDidYouKnow) {
        bookingData.how_did_you_know = formData.howDidYouKnow;
      }

      if (isBasicManners) {
        bookingData.agreement_no_retractable_leash = Boolean(agreements?.noRetractableLeash);
        bookingData.agreement_no_refunds = Boolean(agreements?.noRefunds);
        bookingData.agreement_dog_behavior = Boolean(agreements?.dogBehavior);
      }

      if (isBehaviouralModification || isCanineAssessment) {
        if (isCanineAssessment) {
          bookingData.requires_assessment_report = Boolean(formData.requires_assessment_report);
        } else {
          bookingData.agreement_behavioral_modification_understanding = Boolean(agreements?.behavioralModificationUnderstanding);
        }
      }

      if (isKinderPuppy) {
        bookingData.agreement_kinder_puppy_curriculum = Boolean(agreements?.kinderPuppyCurriculum);
        bookingData.agreement_kinder_puppy_potty_training = Boolean(agreements?.kinderPuppyPottyTraining);
        bookingData.agreement_kinder_puppy_refund_policy = Boolean(agreements?.kinderPuppyRefundPolicy);
      }

      const kinderPuppyCount = formData.kinderPuppyCount || 1;
      const isKinderPuppyMulti = isKinderPuppy && kinderPuppyCount > 1;
      const fyogCount = formData.basicMannersFYOGCount || 1;

      if (isFYOG || isGroupClass || isKinderPuppyMulti) {
        console.log('Processing FYOG/Group/KinderPuppyMulti booking...');
        bookingData.number_of_furkids = isFYOG ? fyogCount : isKinderPuppyMulti ? kinderPuppyCount : (formData.numberOfFurkids || 0);
        bookingData.number_of_clients = isFYOG ? fyogCount : isKinderPuppyMulti ? kinderPuppyCount : (formData.numberOfClients || 0);
        bookingData.clients = (formData.clients || []).map(client => transformClientFields(client));
        bookingData.furkids = (formData.furkids || []).map(furkid => transformFurkidFields(furkid));
        if (isFYOG || isKinderPuppyMulti) {
          bookingData.client_address = formData.sharedAddress || '';
          bookingData.client_postal_code = formData.sharedPostalCode || '';
        }
        console.log('✅ Transformed clients:', bookingData.clients);
        console.log('✅ Transformed furkids:', bookingData.furkids);
      } else {
        console.log('Processing single client booking...');
        bookingData.client_name = formData.clientName || '';
        bookingData.client_email = formData.clientEmail || '';
        bookingData.client_mobile = formData.clientMobile || '';
        bookingData.client_address = formData.clientAddress || '';
        bookingData.client_postal_code = formData.clientPostalCode || '';
        bookingData.is_adopted = Boolean(formData.isAdopted);
        bookingData.adoption_proof_url = formData.adoptionProofUrl || '';
        bookingData.furkid_name = formData.furkidName || '';
        
        if (formData.dobDay && formData.dobMonth && formData.dobYear) {
          const month = formData.dobMonth.toString().padStart(2, '0');
          const day = formData.dobDay.toString().padStart(2, '0');
          bookingData.furkid_dob = `${formData.dobYear}-${month}-${day}`;
          console.log('✅ Constructed furkid_dob:', bookingData.furkid_dob);
        }
        
        bookingData.furkid_age = formData.furkidAge || '';
        bookingData.furkid_breed = formData.furkidBreed || '';
        bookingData.furkid_gender = formData.furkidGender || '';
        bookingData.furkid_sterilised = Boolean(formData.furkidSterilised);
        bookingData.furkid_acquired_from = formData.furkidAcquiredFrom || '';
        bookingData.furkid_joined_family = formData.furkidJoinedFamily || '';
        bookingData.first_time_owner = Boolean(formData.firstTimeOwner);
        bookingData.furkid_diet = formData.furkidDiet || '';
        bookingData.furkid_sleep_area = formData.furkidSleepArea || '';
        bookingData.walking_frequency = formData.walkingFrequency || '';
        bookingData.furkid_photo_url = formData.furkidPhotoUrl || '';
        bookingData.furkid_instagram = formData.furkidInstagram || '';
        bookingData.enrolment_reason = formData.enrolmentReason || '';
        
        if (isBasicManners) {
          bookingData.has_food_allergy = Boolean(formData.hasFoodAllergy);
          bookingData.food_allergy_details = formData.hasFoodAllergy ? (formData.foodAllergyDetails || '') : '';
        }
      }

      console.log('=== FINAL BOOKING DATA TO SUBMIT ===');
      console.log(JSON.stringify(bookingData, null, 2));
      
      console.log('Calling base44.entities.Booking.create...');
      const booking = await base44.entities.Booking.create(bookingData);
      
      console.log('✅ Booking created successfully! ID:', booking.id);
      
      // Handle FYOG/Group Class/KinderPuppyMulti client creation
      const kinderPuppyCountForCreate = formData.kinderPuppyCount || 1;
      const isKinderPuppyMultiForCreate = isKinderPuppy && kinderPuppyCountForCreate > 1;
      if (isFYOG || isGroupClass || isKinderPuppyMultiForCreate) {
        console.log('Creating client records...');
        try {
          for (let i = 0; i < (formData.furkids || []).length; i++) {
            const furkid = formData.furkids[i];
            const client = formData.clients[i] || formData.clients[0];
            
            if (!furkid || !client) {
              console.warn(`Skipping client creation for index ${i} - missing data`);
              continue;
            }
            
            const clientData = {
              client_name: client.clientName || client.client_name || '',
              mobile_number: client.clientMobile || client.client_mobile || '',
              dog_name: furkid.furkidName || furkid.furkid_name || '',
              dog_age: furkid.furkidAge || furkid.furkid_age || '',
              breed: furkid.furkidBreed || furkid.furkid_breed || '',
              gender: furkid.furkidGender || furkid.furkid_gender || '',
              program: serviceId === 'basic_manners_fyog' ? 'basic_manners_fyog' :
                       serviceId === 'basic_manners_group_class' ? 'basic_manners_group' :
                       serviceId === 'kinder_puppy_in_home' ? 'kinder_puppy' : 'basic_manners',
              training_status: 'in_progress',
              diet: furkid.furkidDiet || furkid.furkid_diet || '',
              sleep_area: furkid.furkidSleepArea || furkid.furkid_sleep_area || '',
              primary_concerns: furkid.enrolmentReason || furkid.enrolment_reason || ''
            };
            
            if (isBasicManners) {
              clientData.food_allergy = Boolean(furkid.hasFoodAllergy || furkid.has_food_allergy);
            }
            
            if (formData.sessionDates && formData.sessionDates.length > 0) {
              clientData.start_date = formData.sessionDates[0].date;
            }
            
            console.log(`Creating client record ${i + 1}:`, JSON.stringify(clientData, null, 2));
            await base44.entities.Client.create(clientData);
          }
          
          console.log('✅ Client records created successfully');
        } catch (error) {
          console.error('❌ Error creating Client records:', error);
          console.error('Client creation error details:', error.response?.data);
        }
      }
      
      // Save booking info to session storage
      sessionStorage.setItem('latestBookingId', booking.id);
      sessionStorage.setItem('serviceType', formData.serviceType);
      sessionStorage.setItem('whatsappConsent', String(formData.whatsappConsent));
      
      console.log('=== INITIATING HITPAY PAYMENT ===');

      // Get client details for HitPay
      const useClientsArray = isFYOG || isGroupClass || (isKinderPuppy && (formData.kinderPuppyCount || 1) > 1);
      const primaryClient = useClientsArray ? getPrimaryClientContact(formData.clients || []) : null;
      const clientName = useClientsArray
        ? firstNonEmptyValue(primaryClient?.name, formData.clientName)
        : firstNonEmptyValue(formData.clientName);
      const clientEmail = useClientsArray
        ? firstNonEmptyValue(primaryClient?.email, formData.clientEmail)
        : firstNonEmptyValue(formData.clientEmail);
      const clientMobile = useClientsArray
        ? firstNonEmptyValue(primaryClient?.mobile, formData.clientMobile)
        : firstNonEmptyValue(formData.clientMobile);

      console.log('💳 Calling HitPay with:', {
        bookingId: booking.id,
        amount: pricing.total,
        clientName,
        clientEmail,
        clientMobile
      });

      // Call HitPay to create payment request
      const hitpayResponse = await base44.functions.invoke('createHitpayPayment', {
        bookingId: booking.id,
        amount: pricing.total,
        clientName,
        clientEmail,
        clientMobile
      });

      console.log('📥 HitPay response status:', hitpayResponse?.status);
      console.log('📥 HitPay response data:', hitpayResponse?.data);

      // Extract payment URL from response
      const paymentUrl = hitpayResponse?.data?.payment_url;

      if (!paymentUrl) {
        console.error('❌ No payment URL received');
        throw new Error('Failed to get payment URL from HitPay');
      }

      console.log('✅ Payment URL received, redirecting...');

      // Redirect to HitPay payment page
      window.location.href = paymentUrl;
      
    } catch (error) {
      console.error('❌❌❌ ERROR CREATING BOOKING ❌❌❌');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error stack:', error.stack);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        console.error('Response headers:', error.response.headers);
      }
      
      let errorMessage = 'Booking submission failed.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Booking submission failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!services[serviceId]) {
    return null;
  }

  const getCurrentStepComponent = () => {
    if (isOnDemand) {
      if (step === 1) {
        return (
          <OnDemandSessionSelection
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      } else if (step === 2) {
        return (
          <DateTimeSelection
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      } else if (step === 3) {
        return (
          <ClientInformation
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
            isFYOG={false}
          />
        );
      } else if (step === 4) {
        return (
          <FurkidInformation
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
            isFYOG={false}
          />
        );
      } else if (step === 5) {
        return (
          <ProductSelection
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      } else if (step === 6) {
        return (
          <BookingSummary
            service={service}
            formData={formData}
            pricing={calculatePricing()}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isFYOG={false}
          />
        );
      }
    } else if (isGroupClass) {
      if (step === 1) {
        return (
          <ParticipantSelection
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      } else if (step === 2) {
        return (
          <ClientInformation
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
            isFYOG={true}
          />
        );
      } else if (step === 3) {
        return (
          <FurkidInformation
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
            isFYOG={true}
          />
        );
      } else if (step === 4) {
        return (
          <ProductSelection
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      } else if (step === 5) {
        return (
          <BookingSummary
            service={service}
            formData={formData}
            pricing={calculatePricing()}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isFYOG={true}
            isGroupClass={true}
          />
        );
      }
    } else if (isFYOG) {
      if (step === 1) {
        return (
          <BasicMannersFYOGCountSelection
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      } else if (step === 2) {
        return (
          <DateTimeSelection
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      } else if (step === 3) {
        return (
          <ClientInformation
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
            isFYOG={true}
            isFYOGMulti={(formData.basicMannersFYOGCount || 1) > 1}
            fyogCount={formData.basicMannersFYOGCount || 1}
          />
        );
      } else if (step === 4) {
        return (
          <FurkidInformation
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
            isFYOG={true}
          />
        );
      } else if (step === 5) {
        return (
          <ProductSelection
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      } else if (step === 6) {
        return (
          <BookingSummary
            service={service}
            formData={formData}
            pricing={calculatePricing()}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isFYOG={true}
          />
        );
      }
    } else if (isKinderPuppy) {
      if (step === 1) {
        return (
          <KinderPuppyCountSelection
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      } else if (step === 2) {
        return (
          <DateTimeSelection
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      } else if (step === 3) {
        return (
          <ClientInformation
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
            isFYOG={false}
            isKinderPuppy={true}
            kinderPuppyCount={formData.kinderPuppyCount || 1}
          />
        );
      } else if (step === 4) {
        return (
          <FurkidInformation
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
            isFYOG={(formData.kinderPuppyCount || 1) > 1}
            kinderPuppyCount={formData.kinderPuppyCount || 1}
          />
        );
      } else if (step === 5) {
        return (
          <ProductSelection
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      } else if (step === 6) {
        return (
          <BookingSummary
            service={service}
            formData={formData}
            pricing={calculatePricing()}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isFYOG={false}
          />
        );
      }
    } else if (isBehaviouralModification || isCanineAssessment) {
      if (step === 1) {
        return (
          <DateTimeSelection
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      } else if (step === 2) {
        return (
          <ClientInformation
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
            isFYOG={false}
          />
        );
      } else if (step === 3) {
        return (
          <BehaviouralModificationForm
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      } else if (step === 4) {
        return (
          <ProductSelection
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      } else if (step === 5) {
        return (
          <BookingSummary
            service={service}
            formData={formData}
            pricing={calculatePricing()}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isFYOG={false}
          />
        );
      }
    } else {
      if (step === 1) {
        return (
          <DateTimeSelection
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      } else if (step === 2) {
        return (
          <ClientInformation
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
            isFYOG={isFYOG}
          />
        );
      } else if (step === 3) {
        return (
          <FurkidInformation
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
            isFYOG={isFYOG}
          />
        );
      } else if (step === 4) {
        return (
          <ProductSelection
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      } else if (step === 5) {
        return (
          <BookingSummary
            service={service}
            formData={formData}
            pricing={calculatePricing()}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isFYOG={isFYOG}
          />
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{service.name.replace(' (In-Home)', '').replace(' (FYOG)', '')}</h1>
          <p className="text-sm md:text-base text-slate-600">Complete your booking in step {step} of {totalSteps}</p>
        </div>

        <div className="flex gap-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${
                s <= step ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {getCurrentStepComponent()}
      </div>
    </div>
  );
}