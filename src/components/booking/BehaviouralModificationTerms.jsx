import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertCircle, FileText } from "lucide-react";

export default function BehaviouralModificationTerms({ onNext, onBack }) {
  const [agreement1, setAgreement1] = useState(false);
  const [agreement2, setAgreement2] = useState(false);
  const [agreement3, setAgreement3] = useState(false);
  const [agreement4, setAgreement4] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!agreement1 || !agreement2 || !agreement3 || !agreement4) {
      setError('Please acknowledge all agreements to proceed');
      return;
    }
    onNext();
  };

  const handleChange = (setter, value) => {
    setter(value);
    if (error) setError('');
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Terms &amp; Agreements
        </CardTitle>
        <p className="text-sm text-slate-600 mt-1">Please read and acknowledge all terms before proceeding.</p>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="space-y-5">
          <div className="flex items-start space-x-3">
            <Checkbox id="bm-term1" checked={agreement1} onCheckedChange={(v) => handleChange(setAgreement1, v)} />
            <Label htmlFor="bm-term1" className="text-sm leading-relaxed cursor-pointer font-normal">
              I confirm that I have read the{' '}
              <a href="https://www.hopefordogs.sg/behavioural-modification/#faq" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">FAQs</a>{' '}
              and understand that behaviour modification is a <strong>gradual process with NO QUICK FIXES</strong>. I understand a dog's behaviour is influenced by multiple factors, including <strong>emotional well-being, diet, health, sterilisation status, environment, genetics, and medical conditions.</strong>
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox id="bm-term2" checked={agreement2} onCheckedChange={(v) => handleChange(setAgreement2, v)} />
            <Label htmlFor="bm-term2" className="text-sm leading-relaxed cursor-pointer font-normal">
              I will provide training updates, along with <strong>video recordings, every 2-3 days</strong> so we can review progress together and make any necessary adjustments. <strong>Consistent communication and feedback</strong> will help us maximise your dog's success throughout the programme.
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox id="bm-term3" checked={agreement3} onCheckedChange={(v) => handleChange(setAgreement3, v)} />
            <Label htmlFor="bm-term3" className="text-sm leading-relaxed cursor-pointer font-normal">
              I acknowledge that behaviour change is a collaborative process. While Hopefordogs Canine Training is committed to providing professional guidance and support, successful outcomes largely depend on my <strong>consistent implementation of the training plan, management strategies, and recommendations provided.</strong> *
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox id="bm-term4" checked={agreement4} onCheckedChange={(v) => handleChange(setAgreement4, v)} />
            <Label htmlFor="bm-term4" className="text-sm leading-relaxed cursor-pointer font-normal">
              I acknowledge that behaviour modification outcomes vary from dog to dog, as they depend on multiple factors stated above. As such, Hopefordogs Canine Training <strong>does not offer refunds, exchanges, or cancellations once the programme has commenced.</strong> *
            </Label>
          </div>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
          <Button onClick={handleNext} className="flex-1">Next: Schedule Your Sessions</Button>
        </div>
      </CardContent>
    </Card>
  );
}