import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import jsnLogo from "@/assets/jsn-logo.png";

interface SignupQuestionsProps {
  open: boolean;
  onComplete: (answers: SignupAnswers) => void;
}

export interface SignupAnswers {
  experience: string;
  solveTime: string;
  goal: string;
  commitment: string;
}

const questions = [
  {
    id: "experience",
    title: "How experienced are you with the Rubik's Cube?",
    options: [
      { id: "never", label: "Never solved one", description: "I'm completely new to cubing" },
      { id: "sometimes", label: "Can solve sometimes", description: "I've solved it a few times with help" },
      { id: "always", label: "Can always solve", description: "I can solve it consistently" },
      { id: "speedcuber", label: "I'm a speedcuber", description: "I practice regularly for speed" },
    ],
  },
  {
    id: "solveTime",
    title: "What's your current average solve time?",
    options: [
      { id: "never", label: "Can't solve yet", description: "I haven't solved the cube" },
      { id: "5min", label: "5+ minutes", description: "I take my time" },
      { id: "2min", label: "1-5 minutes", description: "Getting there" },
      { id: "1min", label: "Under 1 minute", description: "Pretty fast" },
      { id: "30sec", label: "Under 30 seconds", description: "Speedcuber territory" },
    ],
  },
  {
    id: "goal",
    title: "What's your main cubing goal?",
    options: [
      { id: "learn", label: "Learn to solve", description: "Just want to solve it once" },
      { id: "consistent", label: "Solve consistently", description: "Be able to solve it every time" },
      { id: "speed", label: "Get faster", description: "Improve my solve times" },
      { id: "compete", label: "Compete", description: "Enter competitions and rank" },
    ],
  },
  {
    id: "commitment",
    title: "How much time can you commit to practice?",
    options: [
      { id: "casual", label: "A few minutes a week", description: "Very casual practice" },
      { id: "regular", label: "15-30 min/day", description: "Regular practice sessions" },
      { id: "dedicated", label: "1+ hours/day", description: "Dedicated training" },
      { id: "intensive", label: "Multiple hours/day", description: "Intensive training schedule" },
    ],
  },
];

const SignupQuestions = ({ open, onComplete }: SignupQuestionsProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentStep];
  const selectedAnswer = answers[currentQuestion?.id];

  const handleSelect = (optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    // Small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));
    const finalAnswers: SignupAnswers = {
      experience: answers.experience || "",
      solveTime: answers.solveTime || "",
      goal: answers.goal || "",
      commitment: answers.commitment || "",
    };
    onComplete(finalAnswers);
    setIsSubmitting(false);
  };

  const isLastStep = currentStep === questions.length - 1;
  const canProceed = !!selectedAnswer;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden" hideClose>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-4 sm:p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <img src={jsnLogo} alt="JSN Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Quick Questions</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Help us personalize your experience</p>
            </div>
          </div>
          {/* Progress */}
          <div className="flex gap-1.5 sm:gap-2">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1 sm:h-1.5 flex-1 rounded-full transition-colors ${
                  i <= currentStep ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question Content */}
        <div className="p-4 sm:p-6">
          <div className="text-center mb-4 sm:mb-6">
            <span className="text-xs sm:text-sm text-muted-foreground">
              Question {currentStep + 1} of {questions.length}
            </span>
            <h3 className="text-base sm:text-lg font-semibold mt-1 sm:mt-2">{currentQuestion.title}</h3>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`w-full p-3 sm:p-4 rounded-xl border transition-all text-left flex items-center gap-3 sm:gap-4 ${
                  selectedAnswer === option.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedAnswer === option.id ? "border-primary bg-primary" : "border-muted-foreground"
                  }`}
                >
                  {selectedAnswer === option.id && (
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">{option.label}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{option.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 pt-0 flex justify-between">
          {currentStep > 0 ? (
            <Button variant="ghost" onClick={handleBack} size="sm" className="sm:size-default">
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {isLastStep ? (
            <Button onClick={handleComplete} disabled={!canProceed || isSubmitting} size="sm" className="sm:size-default">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed} size="sm" className="sm:size-default">
              Next
              <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupQuestions;
