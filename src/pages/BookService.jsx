
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import OnDemandSessionSelection from "../components/booking/OnDemandSessionSelection";
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
    maxParticipants: 1,
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
  kinder_puppy_fyog: {
    id: "kinder_puppy_fyog",
    name: "Kinder Puppy Program (FYOG)",
    price: 298,
    duration: 1,
    sessions: 4,
    minParticipants: 2,
    maxParticipants: 2,
    buffer: 1
  },
  basic_manners_fyog: {
    id: "basic_manners_fyog",
    name: "Basic Manners FYOG",
    price: 520,
    duration: 1,
    sessions: 7,
    minParticipants: 2,
    maxParticipants: 3,
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
    price: 158, // Changed from 150 to 158
    duration: 1.5,
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
  const urlParams = new URLSearchParams(window.location.search);
  const serviceId = urlParams.get('service');
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceType: serviceId || '',
    onDemandSessions: null,
    onDemandPrice: null,
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
    furkidPhotoUrl: '',
    furkidInstagram: '',
    enrolmentReason: '',
    howDidYouKnow: '',
    productSelections: [],
    productsTotal: 0,
    // Behavioral Modification specific fields
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
    return services[serviceId];
  };

  const service = getService();
  const isFYOG = serviceId === 'kinder_puppy_fyog' || serviceId === 'basic_manners_fyog';
  const isKinderPuppy = serviceId === 'kinder_puppy_in_home' || serviceId === 'kinder_puppy_fyog';
  const isGroupClass = serviceId === 'basic_manners_group_class';
  const isBasicManners = serviceId === 'basic_manners_in_home' || serviceId === 'basic_manners_fyog' || serviceId === 'basic_manners_group_class';
  const isBehaviouralModification = serviceId === 'behavioural_modification';
  const isCanineAssessment = serviceId === 'canine_assessment';

  // Calculate total steps - add 1 for product selection after furkid info
  const totalSteps = isOnDemand ? 6 : (isGroupClass ? 5 : isFYOG ? 6 : (isBehaviouralModification || isCanineAssessment) ? 5 : 5);

  useEffect(() => {
    if (!serviceId || !services[serviceId]) {
      navigate(createPageUrl("BookingSystem"));
    }
  }, [serviceId, navigate]);

  const calculatePricing = () => {
    if (!service) return { basePrice: 0, discount: 0, surcharge: 0, sentosaSurcharge: 0, productsTotal: 0, total: 0 };
    
    const basePrice = (isFYOG || isGroupClass) ? service.price * (formData.numberOfFurkids || 1) : service.price;
    
    let adoptionDiscount = 0;
    if (isFYOG || isGroupClass) {
      const adoptedCount = formData.furkids.filter(f => f.isAdopted).length;
      adoptionDiscount = (service.price * adoptedCount) * 0.1;
    } else {
      adoptionDiscount = formData.isAdopted ? basePrice * 0.1 : 0;
    }
    
    let weekendSurcharge = 0;
    let weekendSessions = 0;
    
    if (!isGroupClass) {
      weekendSessions = formData.sessionDates.filter(session => {
        if (!session.date) return false;
        const date = new Date(session.date);
        const day = date.getDay();
        return day === 0 || day === 6;
      }).length;
      
      const pricePerSession = (isFYOG || isGroupClass) ? service.price * (formData.numberOfFurkids || 1) : service.price;
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
    setStep(step - 1);
  };

  const camelToSnake = (str) => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  };

  const transformClientFields = (client) => {
    const transformed = {};
    Object.keys(client).forEach(key => {
      const snakeKey = camelToSnake(key);
      transformed[snakeKey] = client[key];
    });
    return transformed;
  };

  const transformFurkidFields = (furkid) => {
    const transformed = {};
    Object.keys(furkid).forEach(key => {
      const snakeKey = camelToSnake(key);
      transformed[snakeKey] = furkid[key];
    });
    return transformed;
  };

  const handleSubmit = async (agreements) => {
    setIsSubmitting(true);
    try {
      const pricing = calculatePricing();
      
      const bookingData = {
        service_type: formData.serviceType,
        service_name: service.name,
        booking_status: 'pending',
        session_dates: formData.sessionDates,
        product_selections: formData.productSelections || [],
        products_total: pricing.productsTotal,
        base_price: pricing.basePrice,
        adoption_discount: pricing.discount,
        weekend_surcharge: pricing.surcharge,
        is_sentosa_booking: formData.isSentosa,
        sentosa_surcharge_per_session: formData.isSentosa ? 10 : 0,
        total_sentosa_surcharge: pricing.sentosaSurcharge,
        total_price: pricing.total,
        whatsapp_consent: formData.whatsappConsent,
        how_did_you_know: formData.howDidYouKnow
      };

      if (isBasicManners) {
        const leashAgreement = agreements.noRetractableLeash || false;
        const refundsAgreement = agreements.noRefunds || false;
        const behaviorAgreement = agreements.dogBehavior || false;
        
        bookingData.agreement_no_retractable_leash = leashAgreement;
        bookingData.agreement_no_refunds = refundsAgreement;
        bookingData.agreement_dog_behavior = behaviorAgreement;
      }

      if (isBehaviouralModification || isCanineAssessment) {
        if (isCanineAssessment) {
          bookingData.requires_assessment_report = formData.requires_assessment_report;
        } else {
          const modAgreement = agreements.behavioralModificationUnderstanding || false;
          bookingData.agreement_behavioral_modification_understanding = modAgreement;
        }
        
        bookingData.owner_involved_in_bite = formData.ownerInvolvedInBite;
        bookingData.bite_history = formData.biteHistory;
        bookingData.stranger_danger = formData.strangerDanger;
        bookingData.resource_guarding = formData.resourceGuarding;
        bookingData.fearful = formData.fearful;
        bookingData.inappropriate_reactivity = formData.inappropriateReactivity;
        bookingData.excessive_vocalization = formData.excessiveVocalization;
        bookingData.destructive_behavior = formData.destructiveBehavior;
        bookingData.separation_anxiety = formData.separationAnxiety;
        bookingData.potty_training_issues = formData.pottyTrainingIssues;
        bookingData.other_behavioral_issues = formData.otherBehavioralIssues;
      }

      if (isKinderPuppy) {
        const curriculumAgreement = agreements.kinderPuppyCurriculum || false;
        const pottyAgreement = agreements.kinderPuppyPottyTraining || false;
        const refundAgreement = agreements.kinderPuppyRefundPolicy || false;
        
        bookingData.agreement_kinder_puppy_curriculum = curriculumAgreement;
        bookingData.agreement_kinder_puppy_potty_training = pottyAgreement;
        bookingData.agreement_kinder_puppy_refund_policy = refundAgreement;
      }

      if (isFYOG || isGroupClass) {
        bookingData.number_of_furkids = formData.numberOfFurkids;
        bookingData.number_of_clients = formData.numberOfClients;
        bookingData.clients = formData.clients.map(client => transformClientFields(client));
        bookingData.furkids = formData.furkids.map(furkid => transformFurkidFields(furkid));
      } else {
        bookingData.client_name = formData.clientName;
        bookingData.client_email = formData.clientEmail;
        bookingData.client_mobile = formData.clientMobile;
        bookingData.client_address = formData.clientAddress;
        bookingData.client_postal_code = formData.clientPostalCode;
        bookingData.is_adopted = formData.isAdopted;
        bookingData.adoption_proof_url = formData.adoptionProofUrl;
        bookingData.furkid_name = formData.furkidName;
        bookingData.furkid_dob = formData.furkidDob;
        bookingData.furkid_age = formData.furkidAge;
        bookingData.furkid_breed = formData.furkidBreed;
        bookingData.furkid_gender = formData.furkidGender;
        bookingData.furkid_sterilised = formData.furkidSterilised;
        bookingData.furkid_acquired_from = formData.furkidAcquiredFrom;
        bookingData.furkid_joined_family = formData.furkidJoinedFamily;
        bookingData.first_time_owner = formData.firstTimeOwner;
        bookingData.furkid_diet = formData.furkidDiet;
        bookingData.furkid_sleep_area = formData.furkidSleepArea;
        bookingData.furkid_photo_url = formData.furkidPhotoUrl;
        bookingData.furkid_instagram = formData.furkidInstagram;
        bookingData.enrolment_reason = formData.enrolmentReason;
      }

      const booking = await base44.entities.Booking.create(bookingData);
      
      if (isFYOG || isGroupClass) {
        try {
          for (let i = 0; i < formData.furkids.length; i++) {
            const furkid = formData.furkids[i];
            const client = formData.clients[i] || formData.clients[0];
            
            const clientData = {
              client_name: client.clientName,
              mobile_number: client.clientMobile,
              dog_name: furkid.furkidName,
              dog_age: furkid.furkidAge,
              breed: furkid.furkidBreed,
              gender: furkid.furkidGender,
              program: serviceId === 'kinder_puppy_fyog' ? 'kinder_puppy' : 
                       serviceId === 'basic_manners_fyog' ? 'basic_manners_fyog' :
                       serviceId === 'basic_manners_group_class' ? 'basic_manners_group' : 'basic_manners',
              training_status: 'in_progress',
              diet: furkid.furkidDiet,
              sleep_area: furkid.furkidSleepArea,
              primary_concerns: furkid.enrolmentReason
            };
            
            if (isBasicManners) {
              clientData.food_allergy = furkid.hasFoodAllergy || false;
            }
            
            if (formData.sessionDates && formData.sessionDates.length > 0) {
              clientData.start_date = formData.sessionDates[0].date;
            }
            
            await base44.entities.Client.create(clientData);
          }
          
          console.log('Client records created successfully for FYOG/Group Class booking');
        } catch (error) {
          console.error('Error creating Client records:', error);
        }
      }
      
      if (formData.whatsappConsent) {
        try {
          const sendConfirmationModule = await import("@/functions/sendBookingConfirmation");
          await sendConfirmationModule.sendBookingConfirmation({ booking });
          console.log('WhatsApp booking confirmation sent successfully');
        } catch (error) {
          console.error('Error sending WhatsApp confirmation:', error);
        }
      }
      
      sessionStorage.setItem('latestBookingId', booking.id);
      sessionStorage.setItem('serviceType', formData.serviceType);
      sessionStorage.setItem('whatsappConsent', formData.whatsappConsent);
      
      navigate(createPageUrl("ThankYou"));
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("There was an error processing your booking. Please try again.");
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
            onBack={() => navigate(createPageUrl("BookingSystem"))}
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
          <DateTimeSelection
            service={service}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
          />
        );
      } else if (step === 2) {
        return (
          <ParticipantSelection
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
            isFYOG={isFYOG}
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
            isFYOG={isFYOG}
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
            isFYOG={isFYOG}
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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{service.name}</h1>
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
