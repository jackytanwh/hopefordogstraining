import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PawPrint } from "lucide-react";

const TERMS = [
  {
    id: 'curriculum',
    html: 'I have reviewed the curriculum and understand that puppy training extends beyond teaching basic cues or addressing potty training alone. The programme is designed to <strong>support my puppy\'s overall development and long-term success.</strong>',
  },
  {
    id: 'potty',
    html: 'I understand that successful potty training requires a <strong>consistent routine involving feeding, supervision, potty opportunities and patience.</strong> Limited supervision or an inconsistent routine may affect my puppy\'s progress.',
  },
  {
    id: 'compassionate',
    html: 'I understand that HopeforDogs Canine Training advocates only <strong>compassionate and reward-based training methods,</strong> placing the puppy\'s welfare and emotional well-being at the forefront of the training process.',
  },
  {
    id: 'wellbeing',
    html: 'I understand that a puppy\'s emotional well-being plays a significant role in their behaviour and development. Factors such as <strong>prolonged isolation, unmet emotional needs, inadequate enrichment, or long working hours</strong> that limit the quality time I have with my puppy may affect their learning, confidence, and behaviour.',
  },
  {
    id: 'consistency',
    html: 'I understand that training success largely depends on consistency outside of lessons. I agree to <strong>practise the recommended exercises and management strategies</strong> provided by HopeforDogs Canine Training and acknowledge that progress may be limited if recommendations are not followed consistently.',
  },
  {
    id: 'individual',
    html: 'I understand that every puppy is an individual, and that progress is influenced by <strong>factors such as genetics, health, diet, environment, emotional well-being, and owner participation.</strong> Therefore, specific training outcomes or timelines cannot be guaranteed.',
  },
  {
    id: 'refund',
    html: 'I understand and accept that HopeforDogs Canine Training <strong>does not offer refunds, exchanges, transfers, or cancellations</strong> for purchased training programmes, and they <strong>expire 3 months from the date.</strong> Any exception made will be solely at the discretion of HopeforDogs Canine Training and provided only as a gesture of goodwill.',
  },
];

export default function KinderPuppyTerms({ onNext, onBack }) {
  const [checked, setChecked] = useState({});
  const [error, setError] = useState('');

  const allChecked = TERMS.every(t => checked[t.id]);

  const toggle = (id) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
    if (error) setError('');
  };

  const handleNext = () => {
    if (!allChecked) {
      setError('Please acknowledge all terms to proceed.');
      return;
    }
    onNext();
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <PawPrint className="w-5 h-5 text-blue-600" />
          Terms &amp; Conditions
        </CardTitle>
        <p className="text-sm text-slate-500 mt-1">Please read and acknowledge all terms before proceeding with your booking.</p>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        {TERMS.map((term) => (
          <div key={term.id} className="flex items-start space-x-3">
            <Checkbox
              id={term.id}
              checked={!!checked[term.id]}
              onCheckedChange={() => toggle(term.id)}
              className="mt-0.5 flex-shrink-0"
            />
            <Label
              htmlFor={term.id}
              className="text-sm leading-relaxed cursor-pointer font-normal text-slate-700"
              dangerouslySetInnerHTML={{ __html: term.html }}
            />
          </div>
        ))}

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={handleNext} className="flex-1">
            I Agree &amp; Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}