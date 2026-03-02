import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ArrowLeft, Camera, User, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { LogoWithGlow } from "@/components/LogoWithGlow";

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.full_name || "");
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(t('profile.pleaseSelectImage'));
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('profile.imageTooLarge'));
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      toast.success(t('profile.avatarUpdated'));
      refetch();
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(error.message || t('errors.failedToUpload'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: displayName })
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      toast.success(t('profile.profileUpdated'));
      refetch();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || t('errors.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  const getInitials = () => {
    if (displayName) {
      return displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.email?.[0].toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <LogoWithGlow size="sm" />
                <span className="text-lg font-bold text-foreground">{t('profile.profile')}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-xl mx-auto">
          <div className="card-gradient rounded-2xl p-8 border border-border">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-border">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
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
              <p className="text-sm text-muted-foreground mt-3">
                {t('common.clickToUpload')}
              </p>
            </div>

            {/* Profile Form */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">{t('profile.email')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="pl-11 h-12 bg-secondary border-border opacity-60"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t('profile.emailCannotChange')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">{t('profile.displayName')}</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder={t('profile.displayNamePlaceholder')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-12 bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">{t('profile.subscription')}</Label>
                <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-border">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    profile?.subscription_tier === 'pro' 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {profile?.subscription_tier === 'pro' ? t('profile.pro') : t('profile.free')}
                  </div>
                  {profile?.subscription_tier !== 'pro' && (
                    <Link to="/#pricing">
                      <Button variant="link" className="text-primary p-0 h-auto">
                        {t('common.upgradeToPro')}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full h-12 gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('common.saveChanges')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
