import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Camera, Loader2, Check, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import jsnLogo from "@/assets/jsn-logo.png";

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

const OnboardingWizard = ({ open, onComplete }: OnboardingWizardProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const goals = [
    { id: "beginner", label: t('onboarding.learnBasics'), description: t('onboarding.newToCubing') },
    { id: "intermediate", label: t('onboarding.improveSpeed'), description: t('onboarding.canSolveWantFaster') },
    { id: "advanced", label: t('onboarding.masterAdvanced'), description: t('onboarding.wantExpertSkills') },
  ];

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t('profile.pleaseSelectImage'));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('profile.imageTooLarge'));
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success(t('onboarding.avatarUploaded'));
    } catch (error: any) {
      toast.error(error.message || t('errors.failedToUpload'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const updates: { full_name?: string; avatar_url?: string } = {};
      if (displayName.trim()) updates.full_name = displayName.trim();
      if (avatarUrl) updates.avatar_url = avatarUrl;

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("user_id", user.id);

        if (error) throw error;
      }

      // Mark onboarding as complete in localStorage
      localStorage.setItem(`onboarding_complete_${user.id}`, "true");
      
      toast.success(t('onboarding.welcomeMessage'));
      onComplete();
    } catch (error: any) {
      toast.error(error.message || t('errors.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    if (displayName) {
      return displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.email?.[0].toUpperCase() || "U";
  };

  const canProceed = () => {
    if (step === 1) return displayName.trim().length > 0;
    if (step === 2) return true; // Avatar is optional
    if (step === 3) return selectedGoal !== null;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden" hideClose>
        {/* Header with Progress */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center justify-center bg-background">
              <img src={jsnLogo} alt="JSN Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t('onboarding.welcome')}</h2>
              <p className="text-sm text-muted-foreground">{t('onboarding.letsSetup')}</p>
            </div>
          </div>
          {/* Progress Steps */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {/* Step 1: Name */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-semibold">{t('onboarding.whatToCallYou')}</h3>
                <p className="text-sm text-muted-foreground">{t('onboarding.thisWillBeDisplayName')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">{t('onboarding.displayName')}</Label>
                <Input
                  id="name"
                  placeholder={t('onboarding.enterYourName')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-12 text-center text-lg"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Step 2: Avatar */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{t('onboarding.addProfilePicture')}</h3>
                <p className="text-sm text-muted-foreground">{t('onboarding.optionalButHelps')}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <Avatar className="w-32 h-32 border-4 border-border">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                    className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    ) : (
                      <Camera className="w-8 h-8 text-foreground" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <Button
                  variant="ghost"
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                  className="mt-4"
                >
                  {avatarUrl ? t('common.changePhoto') : t('common.uploadPhoto')}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Goal */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{t('onboarding.whatsYourGoal')}</h3>
                <p className="text-sm text-muted-foreground">{t('onboarding.helpPersonalize')}</p>
              </div>
              <div className="space-y-3">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={`w-full p-4 rounded-xl border transition-all text-left flex items-center gap-4 ${
                      selectedGoal === goal.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedGoal === goal.id ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}>
                      {selectedGoal === goal.id && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <div>
                      <p className="font-medium">{goal.label}</p>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex justify-between">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
          ) : (
            <div />
          )}
          
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              {t('common.next')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isSaving || !canProceed()}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  {t('common.getStarted')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;