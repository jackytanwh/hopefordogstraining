import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";

const Field = ({ label, value }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div>
      <p className="text-slate-600 text-sm font-medium capitalize tracking-wide">{label}</p>
      <p className="font-medium text-slate-900 mt-0.5 text-base">{String(value)}</p>
    </div>
  );
};

const YesNo = ({ label, value, details, detailsLabel }) => {
  if (value === null || value === undefined) return null;
  return (
    <div>
      <p className="text-slate-600 text-sm font-medium capitalize tracking-wide">{label}</p>
      <p className="font-medium text-slate-900 mt-0.5 text-base">{value ? 'Yes' : 'No'}</p>
      {value && details && <p className="text-base text-slate-600 mt-1 italic">{detailsLabel ? `${detailsLabel}: ` : ''}{details}</p>}
    </div>
  );
};

const Section = ({ title, color, children }) => (
  <div className={`space-y-3 p-4 ${color} rounded-lg`}>
    <h4 className="font-semibold text-slate-900 text-base">{title}</h4>
    <div className="grid md:grid-cols-2 gap-3 text-base">
      {children}
    </div>
  </div>
);

const FullField = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="md:col-span-2">
      <p className="text-slate-600 text-sm font-medium capitalize tracking-wide">{label}</p>
      <p className="font-medium text-slate-900 mt-0.5 whitespace-pre-wrap text-base">{String(value)}</p>
    </div>
  );
};

const severityLabels = {
  worsen: 'Worsen',
  same: 'Remains the same',
  better: 'Getting better'
};

const aggressionLabels = {
  yes: 'Yes',
  no: 'No',
  not_sure: 'Not sure'
};

const biteSeverityLabels = {
  '1': 'Level 1 – Obnoxious/aggressive, no skin-contact',
  '2': 'Level 2 – Skin-contact but no puncture',
  '3': 'Level 3 – 1-4 punctures, shallow',
  '4': 'Level 4 – 1-4 punctures, deep',
  '5': 'Level 5 – Multiple Level 4 bites',
  '6': 'Level 6 – Fatal bite(s)'
};

export default function BehaviouralModificationDetails({ booking }) {
  if (booking.service_type !== 'behavioural_modification') return null;

  const b = booking;

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Behaviour Consultation History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">

        <Section title="Basic information" color="bg-blue-50">
          <YesNo label="Singapore Special / Adopted" value={b.is_adopted} />
          {b.adoption_proof_url && (
            <div>
              <p className="text-slate-600 text-xs font-medium uppercase tracking-wide">Adoption proof</p>
              <a href={b.adoption_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">View document</a>
            </div>
          )}
          <Field label="Furkid name" value={b.furkid_name} />
          <Field label="Breed" value={b.furkid_breed} />
          <Field label="Date of birth" value={b.furkid_dob} />
          <Field label="Age" value={b.furkid_age} />
          <Field label="Gender" value={b.furkid_gender ? (b.furkid_gender === 'boy' ? 'Boy' : 'Girl') : null} />
          <YesNo label="Sterilised" value={b.furkid_sterilised} details={b.furkid_sterilisation_age ? `Age: ${b.furkid_sterilisation_age}` : null} />
          {b.furkid_sterilised && <Field label="Sterilisation method" value={b.furkid_sterilisation_method} />}
        </Section>

        <Section title="History & background" color="bg-green-50">
          <Field label="Where did you obtain the furkid?" value={b.furkid_acquired_from} />
          <Field label="Age when joined household" value={b.furkid_joined_family_age} />
          <YesNo label="Has previous guardian?" value={b.has_previous_guardian} details={b.previous_guardian_reason} detailsLabel="Reason" />
        </Section>

        <Section title="Behaviour details" color="bg-amber-50">
          <Field label="When first noticed" value={b.behaviour_first_noticed} />
          <Field label="Aggression issue?" value={b.is_aggression_issue ? aggressionLabels[b.is_aggression_issue] : null} />
          {b.is_aggression_issue === 'yes' && (
            <YesNo label="Has bitten?" value={b.has_bitten} />
          )}
          {b.has_bitten && (
            <>
              <Field label="Number of bites" value={b.bite_count} />
              <Field label="Bite severity" value={b.bite_severity ? biteSeverityLabels[b.bite_severity] : null} />
              <FullField label="Bite triggers" value={b.bite_triggers} />
            </>
          )}
          <FullField label="Behavioural symptoms" value={b.behaviour_symptoms} />
          <FullField label="Known past trauma / mistreatment" value={b.past_trauma} />
          <FullField label="Immediate reaction to behaviour" value={b.immediate_reaction} />
          <FullField label="Methods tried to resolve" value={b.methods_tried} />
          <FullField label="Effectiveness of methods" value={b.methods_effectiveness} />
          <FullField label="Reaction to strangers / visitors" value={b.reaction_to_strangers} />
          <Field label="Behaviour severity change" value={b.behaviour_severity_change ? severityLabels[b.behaviour_severity_change] : null} />
          <Field label="Seriousness scale (1-5)" value={b.behaviour_seriousness_scale} />
        </Section>

        <Section title="Goals & household" color="bg-purple-50">
          <FullField label="Program goals" value={b.program_goals} />
          <Field label="Daily training time available" value={b.daily_training_time} />
          <Field label="Main caregivers" value={b.main_caregivers} />
          <FullField label="Purpose of getting furkid" value={b.purpose_of_getting_furkid} />
          <FullField label="Why chose this furkid" value={b.why_chose_furkid} />
          <YesNo label="Other pets in household?" value={b.other_pets} details={b.other_pets_list} />
          <YesNo label="Previously owned furkids?" value={b.previous_furkids_owned} details={b.previous_furkids} />
        </Section>

        <Section title="Daily routine" color="bg-pink-50">
          <Field label="Hangs out (daytime)" value={b.hangout_location} />
          <Field label="Sleeps (night)" value={b.sleep_location} />
          <Field label="Left alone daily" value={b.alone_duration} />
          <FullField label="Anxiety when alone" value={b.anxiety_when_alone} />
          <Field label="Walk frequency" value={b.walk_frequency} />
          <Field label="Walk duration" value={b.walk_duration} />
          <Field label="Potty training" value={b.potty_training} />
          {b.walking_equipment && b.walking_equipment.length > 0 && (
            <div className="md:col-span-2">
              <p className="text-slate-600 text-xs font-medium uppercase tracking-wide">Walking equipment</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {(Array.isArray(b.walking_equipment) ? b.walking_equipment : [b.walking_equipment]).map((e, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{e}</Badge>
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Training history" color="bg-indigo-50">
          <YesNo label="Previous training?" value={b.previous_training} />
          {b.previous_training && (
            <>
              <Field label="Training type" value={b.previous_training_type} />
              <Field label="Training school" value={b.previous_training_school} />
            </>
          )}
          <YesNo label="Knows cues reliably?" value={b.known_cues_reliable} details={b.known_cues_list} detailsLabel="Cues" />
        </Section>

        <Section title="Feeding & diet" color="bg-yellow-50">
          <Field label="Feeding frequency" value={b.feeding_frequency} />
          <Field label="Diet" value={b.diet_type} />
          {b.feeding_method && b.feeding_method.length > 0 && (
            <div className="md:col-span-2">
              <p className="text-slate-600 text-xs font-medium uppercase tracking-wide">Feeding method</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {(Array.isArray(b.feeding_method) ? b.feeding_method : [b.feeding_method]).map((m, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{m}</Badge>
                ))}
              </div>
            </div>
          )}
          <Field label="Eating speed (1-5)" value={b.eating_speed} />
          <Field label="Chews frequency" value={b.chews_frequency} />
          {b.chews_frequency && <Field label="Chews type" value={b.chews_type} />}
          <YesNo label="Loves treats?" value={b.loves_treats} details={b.treats_type} detailsLabel="Type" />
          <YesNo label="Food allergies?" value={b.food_allergies} details={b.food_allergies_details} detailsLabel="Details" />
          <Field label="Enrichment tools" value={b.enrichment_tools} />
        </Section>

        <Section title="Health & medical" color="bg-red-50">
          <FullField label="Reaction to handling (grooming, vet, nail trim)" value={b.handling_reaction} />
          <FullField label="Resistance to collar/harness/lead" value={b.equipment_resistance} />
          <YesNo label="Touch discomfort?" value={b.touch_discomfort} details={b.touch_discomfort_details} />
          <Field label="Last health check" value={b.last_health_check} />
          <YesNo label="Medical conditions?" value={b.medical_conditions} details={b.medical_conditions_details} />
          <YesNo label="Pain/injury/surgery history?" value={b.pain_history} details={b.pain_history_details} />
          <YesNo label="Signs of discomfort?" value={b.discomfort_signs} details={b.discomfort_signs_details} />
          <YesNo label="On medication?" value={b.on_medication} details={b.medication_details} detailsLabel="Details" />
          <YesNo label="On flea/tick treatment?" value={b.flea_tick_treatment} />
          {b.flea_tick_treatment && <Field label="Treatment type & frequency" value={b.flea_tick_treatment_details} />}
        </Section>

      </CardContent>
    </Card>
  );
}