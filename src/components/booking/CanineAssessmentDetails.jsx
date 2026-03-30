import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

const Field = ({ label, value }) => {
  if (value === undefined || value === null || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <div>
      <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="text-slate-900 text-sm mt-0.5">{display}</p>
    </div>
  );
};

const Section = ({ title, color, children }) => (
  <div className={`p-4 ${color} rounded-lg space-y-3`}>
    <h4 className="font-semibold text-slate-900">{title}</h4>
    <div className="grid md:grid-cols-2 gap-3">{children}</div>
  </div>
);

export default function CanineAssessmentDetails({ booking: b }) {
  if (!b) return null;

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          Canine Assessment History Form
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">

        {/* Basic Information */}
        <Section title="Basic Information" color="bg-blue-50">
          <Field label="Furkid Name" value={b.furkid_name} />
          <Field label="Breed" value={b.furkid_breed} />
          <Field label="Age" value={b.furkid_age} />
          <Field label="Gender" value={b.furkid_gender} />
          <Field label="Sterilised" value={b.furkid_sterilised} />
          {b.furkid_sterilised && <Field label="Sterilised Age" value={b.furkid_sterilisation_age} />}
          {b.furkid_sterilised && <Field label="Sterilisation Method" value={b.furkid_sterilisation_method} />}
          <Field label="Singapore Special / Adopted" value={b.is_adopted} />
          {b.is_adopted && b.adoption_proof_url && (
            <div className="md:col-span-2">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Adoption Proof</p>
              <a href={b.adoption_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                View Document
              </a>
            </div>
          )}
        </Section>

        {/* History & Background */}
        <Section title="History & Background" color="bg-green-50">
          <Field label="Obtained From" value={b.furkid_acquired_from} />
          <Field label="Age When Joined Family" value={b.furkid_joined_family_age} />
          <Field label="Has Previous Guardian" value={b.has_previous_guardian} />
          {b.has_previous_guardian && (
            <div className="md:col-span-2">
              <Field label="Reason Previous Guardian Gave Up" value={b.previous_guardian_reason} />
            </div>
          )}
        </Section>

        {/* Behaviour Details */}
        <Section title="Behaviour Details" color="bg-amber-50">
          <Field label="When Behaviour First Noticed" value={b.behaviour_first_noticed} />
          <Field label="Aggression Issue" value={b.is_aggression_issue} />
          {b.is_aggression_issue === 'yes' && (
            <>
              <Field label="Has Bitten" value={b.has_bitten} />
              {b.has_bitten && <Field label="Bite Count" value={b.bite_count} />}
              {b.has_bitten && <Field label="Bite Severity" value={b.bite_severity ? `Level ${b.bite_severity}` : undefined} />}
            </>
          )}
          <div className="md:col-span-2"><Field label="Bite Triggers" value={b.bite_triggers} /></div>
          <div className="md:col-span-2"><Field label="Behavioural Symptoms" value={b.behaviour_symptoms} /></div>
          <div className="md:col-span-2"><Field label="Past Trauma" value={b.past_trauma} /></div>
          <div className="md:col-span-2"><Field label="Immediate Reaction to Behaviour" value={b.immediate_reaction} /></div>
          <div className="md:col-span-2"><Field label="Methods Tried" value={b.methods_tried} /></div>
          <div className="md:col-span-2"><Field label="Effectiveness of Methods" value={b.methods_effectiveness} /></div>
          <div className="md:col-span-2"><Field label="Reaction to Strangers" value={b.reaction_to_strangers} /></div>
          <Field label="Behaviour Severity Change" value={b.behaviour_severity_change} />
          <Field label="Seriousness Scale (1-5)" value={b.behaviour_seriousness_scale} />
        </Section>

        {/* Goals & Household */}
        <Section title="Goals & Household" color="bg-purple-50">
          <div className="md:col-span-2"><Field label="Program Goals" value={b.program_goals} /></div>
          <Field label="Daily Training Time" value={b.daily_training_time} />
          <Field label="Main Caregivers" value={b.main_caregivers} />
          <div className="md:col-span-2"><Field label="Purpose of Getting Furkid" value={b.purpose_of_getting_furkid} /></div>
          <div className="md:col-span-2"><Field label="Why Chose This Furkid" value={b.why_chose_furkid} /></div>
          <Field label="Other Pets" value={b.other_pets} />
          {b.other_pets && <Field label="Other Pets List" value={b.other_pets_list} />}
          <Field label="Previously Had Furkids" value={b.previous_furkids_owned} />
          {b.previous_furkids_owned && <Field label="Previous Furkids" value={b.previous_furkids} />}
        </Section>

        {/* Daily Routine */}
        <Section title="Daily Routine" color="bg-pink-50">
          <Field label="Hangout Location (Day)" value={b.hangout_location} />
          <Field label="Sleep Location (Night)" value={b.sleep_location} />
          <Field label="Left Alone Duration" value={b.alone_duration} />
          <div className="md:col-span-2"><Field label="Anxiety When Alone" value={b.anxiety_when_alone} /></div>
          <Field label="Walk Frequency" value={b.walk_frequency} />
          <Field label="Walk Duration" value={b.walk_duration} />
          <Field label="Potty Training" value={b.potty_training} />
          <Field label="Walking Equipment" value={Array.isArray(b.walking_equipment) ? b.walking_equipment.join(', ') : b.walking_equipment} />
          <Field label="Enrichment Tools" value={b.enrichment_tools} />
        </Section>

        {/* Training History */}
        <Section title="Training History" color="bg-indigo-50">
          <Field label="Previous Training" value={b.previous_training} />
          {b.previous_training && (
            <>
              <Field label="Training Type" value={b.previous_training_type} />
              <Field label="School / Trainer" value={b.previous_training_school} />
            </>
          )}
          <Field label="Knows Cues Reliably" value={b.known_cues_reliable} />
          {b.known_cues_reliable && <Field label="Known Cues" value={b.known_cues_list} />}
        </Section>

        {/* Feeding & Diet */}
        <Section title="Feeding & Diet" color="bg-yellow-50">
          <Field label="Feeding Frequency" value={b.feeding_frequency} />
          <Field label="Diet" value={b.diet_type} />
          <Field label="Feeding Method" value={Array.isArray(b.feeding_method) ? b.feeding_method.join(', ') : b.feeding_method} />
          <Field label="Eating Speed (1-5)" value={b.eating_speed} />
          <Field label="Chews Frequency" value={b.chews_frequency} />
          <Field label="Chews Type" value={b.chews_type} />
          <Field label="Loves Treats" value={b.loves_treats} />
          {b.loves_treats && <Field label="Treats Type" value={b.treats_type} />}
          <Field label="Food Allergies" value={b.food_allergies} />
          {b.food_allergies && <Field label="Food Allergy Details" value={b.food_allergies_details} />}
        </Section>

        {/* Health & Medical */}
        <Section title="Health & Medical" color="bg-red-50">
          <div className="md:col-span-2"><Field label="Reaction to Handling/Grooming" value={b.handling_reaction} /></div>
          <div className="md:col-span-2"><Field label="Resistance to Equipment" value={b.equipment_resistance} /></div>
          <Field label="Touch Discomfort" value={b.touch_discomfort} />
          {b.touch_discomfort && <Field label="Touch Discomfort Details" value={b.touch_discomfort_details} />}
          <Field label="Last Health Check" value={b.last_health_check} />
          <Field label="Medical Conditions" value={b.medical_conditions} />
          {b.medical_conditions && <Field label="Medical Conditions Details" value={b.medical_conditions_details} />}
          <Field label="Pain / Injury History" value={b.pain_history} />
          {b.pain_history && <Field label="Pain History Details" value={b.pain_history_details} />}
          <Field label="Signs of Discomfort" value={b.discomfort_signs} />
          {b.discomfort_signs && <Field label="Discomfort Details" value={b.discomfort_signs_details} />}
          <Field label="On Medication" value={b.on_medication} />
          {b.on_medication && <Field label="Medication Details" value={b.medication_details} />}
        </Section>

        {/* Assessment */}
        <Section title="Assessment" color="bg-slate-50">
          <Field label="Requires Assessment Report" value={b.requires_assessment_report} />
        </Section>

      </CardContent>
    </Card>
  );
}