import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Heart, ThumbsUp, Clock, Sparkles } from "lucide-react";

export default function ThankYou() {
  const navigate = useNavigate();
  const bookingId = sessionStorage.getItem('latestBookingId');
  const serviceType = sessionStorage.getItem('serviceType');
  
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState({
    overall_rating: 0,
    ease_of_use: 0,
    clarity_rating: 0,
    time_taken: '',
    most_difficult_part: '',
    suggestions: '',
    would_recommend: false
  });

  const [hoveredStar, setHoveredStar] = useState({
    overall: 0,
    ease: 0,
    clarity: 0
  });

  const handleStarClick = (field, rating) => {
    setFeedback({ ...feedback, [field]: rating });
  };

  const handleSubmit = async () => {
    try {
      await base44.entities.BookingFeedback.create({
        booking_id: bookingId,
        service_type: serviceType,
        ...feedback
      });
      setSubmitted(true);
      
      // Navigate to confirmation page after 2 seconds
      setTimeout(() => {
        navigate(createPageUrl("BookingConfirmation"));
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Still navigate even if feedback fails
      navigate(createPageUrl("BookingConfirmation"));
    }
  };

  const handleSkip = () => {
    navigate(createPageUrl("BookingConfirmation"));
  };

  const StarRating = ({ value, onHover, onLeave, onClick, label }) => (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => onHover(star)}
          onMouseLeave={() => onLeave(0)}
          onClick={() => onClick(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 md:w-10 md:h-10 transition-colors ${
              star <= (value || hoveredStar[label])
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-slate-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 md:p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-10 h-10 text-green-600 fill-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Thank You!</h2>
            <p className="text-slate-600">
              Your feedback helps us improve our booking experience.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Sparkles className="w-4 h-4" />
              <span>Redirecting to confirmation page...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100 text-center pb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ThumbsUp className="w-10 h-10 text-blue-600" />
            </div>
            <CardTitle className="text-2xl md:text-3xl text-slate-900">
              Thank You for Your Booking!
            </CardTitle>
            <p className="text-base md:text-lg text-slate-600 mt-2">
              Help us improve by sharing your experience with our booking process
            </p>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Overall Experience */}
            <div className="space-y-3">
              <Label className="text-base md:text-lg font-semibold text-slate-900">
                How was your overall booking experience? *
              </Label>
              <div className="flex justify-center">
                <StarRating
                  value={feedback.overall_rating}
                  onHover={(star) => setHoveredStar({ ...hoveredStar, overall: star })}
                  onLeave={() => setHoveredStar({ ...hoveredStar, overall: 0 })}
                  onClick={(star) => handleStarClick('overall_rating', star)}
                  label="overall"
                />
              </div>
              {feedback.overall_rating > 0 && (
                <p className="text-center text-sm text-slate-600">
                  {feedback.overall_rating === 5 && "Excellent! 🎉"}
                  {feedback.overall_rating === 4 && "Great! 😊"}
                  {feedback.overall_rating === 3 && "Good 👍"}
                  {feedback.overall_rating === 2 && "Fair 😐"}
                  {feedback.overall_rating === 1 && "Needs improvement 😔"}
                </p>
              )}
            </div>

            {/* Ease of Use */}
            <div className="space-y-3">
              <Label className="text-base md:text-lg font-semibold text-slate-900">
                How easy was it to complete the booking? *
              </Label>
              <div className="flex justify-center">
                <StarRating
                  value={feedback.ease_of_use}
                  onHover={(star) => setHoveredStar({ ...hoveredStar, ease: star })}
                  onLeave={() => setHoveredStar({ ...hoveredStar, ease: 0 })}
                  onClick={(star) => handleStarClick('ease_of_use', star)}
                  label="ease"
                />
              </div>
            </div>

            {/* Clarity */}
            <div className="space-y-3">
              <Label className="text-base md:text-lg font-semibold text-slate-900">
                How clear were the instructions?
              </Label>
              <div className="flex justify-center">
                <StarRating
                  value={feedback.clarity_rating}
                  onHover={(star) => setHoveredStar({ ...hoveredStar, clarity: star })}
                  onLeave={() => setHoveredStar({ ...hoveredStar, clarity: 0 })}
                  onClick={(star) => handleStarClick('clarity_rating', star)}
                  label="clarity"
                />
              </div>
            </div>

            {/* Time Taken */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                How long did it take to complete the booking?
              </Label>
              <RadioGroup
                value={feedback.time_taken}
                onValueChange={(value) => setFeedback({ ...feedback, time_taken: value })}
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="less_than_5" id="time1" />
                    <Label htmlFor="time1" className="cursor-pointer font-normal">Less than 5 minutes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="5_to_10" id="time2" />
                    <Label htmlFor="time2" className="cursor-pointer font-normal">5-10 minutes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="10_to_15" id="time3" />
                    <Label htmlFor="time3" className="cursor-pointer font-normal">10-15 minutes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="more_than_15" id="time4" />
                    <Label htmlFor="time4" className="cursor-pointer font-normal">More than 15 minutes</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Suggestions */}
            <div className="space-y-3">
              <Label htmlFor="suggestions" className="text-base font-semibold text-slate-900">
                How can we improve? (Optional)
              </Label>
              <Textarea
                id="suggestions"
                value={feedback.suggestions}
                onChange={(e) => setFeedback({ ...feedback, suggestions: e.target.value })}
                placeholder="Your suggestions help us make the booking process better..."
                rows={3}
                className="text-sm md:text-base"
              />
            </div>

            {/* Would Recommend */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="recommend"
                  checked={feedback.would_recommend}
                  onCheckedChange={(checked) => setFeedback({ ...feedback, would_recommend: checked })}
                />
                <Label
                  htmlFor="recommend"
                  className="text-sm md:text-base cursor-pointer leading-relaxed"
                >
                  I would recommend this booking system to others
                </Label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1 text-sm md:text-base"
              >
                Skip for Now
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!feedback.overall_rating || !feedback.ease_of_use}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-sm md:text-base"
              >
                Submit Feedback
              </Button>
            </div>

            <p className="text-xs text-center text-slate-500">
              * Required fields
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}