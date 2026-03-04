import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { useUserSettings } from "@/hooks/useUserSettings";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  Palette,
  Globe,
  Bell,
  Shield,
  CreditCard,
  Puzzle,
  ChevronRight,
  LogOut,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Check,
  Send,
  Loader2,
  MessageSquare,
  ExternalLink,
  Smartphone,
  Monitor,
  Trash2,
} from "lucide-react";
import { useDownloads } from "@/hooks/useDownloads";
import { LogoWithGlow } from "@/components/LogoWithGlow";
import EditProfileModal from "@/components/modals/EditProfileModal";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import DeleteAccountModal from "@/components/modals/DeleteAccountModal";

const getSettingsTabs = (t: (key: string) => string) => [
  { id: "profile", label: t('settings.profile'), icon: User },
  { id: "theme", label: t('settings.appearance'), icon: Palette },
  { id: "language", label: t('settings.timeAndLanguage'), icon: Globe },
  { id: "notifications", label: t('settings.notifications'), icon: Bell },
  { id: "privacy", label: t('settings.privacy'), icon: Shield },
  { id: "devices", label: "Devices", icon: Smartphone },
  { id: "payment", label: t('settings.payment'), icon: CreditCard },
  { id: "plugins", label: t('settings.plugins'), icon: Puzzle },
  { id: "support", label: t('settings.support'), icon: MessageSquare },
];

const getThemes = (t: (key: string) => string) => [
  { id: "dark", label: t('settings.darkMode'), icon: Moon },
  { id: "light", label: t('settings.lightMode'), icon: Sun },
];

// Comprehensive language list
const languages = [
  { id: "en", label: "English (US)", flag: "🇺🇸" },
  { id: "en-gb", label: "English (UK)", flag: "🇬🇧" },
  { id: "es", label: "Español", flag: "🇪🇸" },
  { id: "fr", label: "Français", flag: "🇫🇷" },
  { id: "de", label: "Deutsch", flag: "🇩🇪" },
  { id: "it", label: "Italiano", flag: "🇮🇹" },
  { id: "pt", label: "Português", flag: "🇵🇹" },
  { id: "pt-br", label: "Português (Brasil)", flag: "🇧🇷" },
  { id: "nl", label: "Nederlands", flag: "🇳🇱" },
  { id: "pl", label: "Polski", flag: "🇵🇱" },
  { id: "ru", label: "Русский", flag: "🇷🇺" },
  { id: "ja", label: "日本語", flag: "🇯🇵" },
  { id: "ko", label: "한국어", flag: "🇰🇷" },
  { id: "zh", label: "中文 (简体)", flag: "🇨🇳" },
  { id: "zh-tw", label: "中文 (繁體)", flag: "🇹🇼" },
  { id: "ar", label: "العربية", flag: "🇸🇦" },
  { id: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { id: "tr", label: "Türkçe", flag: "🇹🇷" },
  { id: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { id: "th", label: "ไทย", flag: "🇹🇭" },
  { id: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { id: "ms", label: "Bahasa Melayu", flag: "🇲🇾" },
  { id: "sv", label: "Svenska", flag: "🇸🇪" },
  { id: "no", label: "Norsk", flag: "🇳🇴" },
  { id: "da", label: "Dansk", flag: "🇩🇰" },
  { id: "fi", label: "Suomi", flag: "🇫🇮" },
  { id: "el", label: "Ελληνικά", flag: "🇬🇷" },
  { id: "he", label: "עברית", flag: "🇮🇱" },
  { id: "cs", label: "Čeština", flag: "🇨🇿" },
  { id: "hu", label: "Magyar", flag: "🇭🇺" },
  { id: "ro", label: "Română", flag: "🇷🇴" },
  { id: "uk", label: "Українська", flag: "🇺🇦" },
];

// Comprehensive timezone list by region
const timezones = [
  // Americas
  { id: "America/New_York", label: "Eastern Time (US & Canada)", region: "Americas" },
  { id: "America/Chicago", label: "Central Time (US & Canada)", region: "Americas" },
  { id: "America/Denver", label: "Mountain Time (US & Canada)", region: "Americas" },
  { id: "America/Los_Angeles", label: "Pacific Time (US & Canada)", region: "Americas" },
  { id: "America/Anchorage", label: "Alaska", region: "Americas" },
  { id: "Pacific/Honolulu", label: "Hawaii", region: "Americas" },
  { id: "America/Phoenix", label: "Arizona", region: "Americas" },
  { id: "America/Toronto", label: "Toronto", region: "Americas" },
  { id: "America/Vancouver", label: "Vancouver", region: "Americas" },
  { id: "America/Mexico_City", label: "Mexico City", region: "Americas" },
  { id: "America/Bogota", label: "Bogota", region: "Americas" },
  { id: "America/Lima", label: "Lima", region: "Americas" },
  { id: "America/Santiago", label: "Santiago", region: "Americas" },
  { id: "America/Buenos_Aires", label: "Buenos Aires", region: "Americas" },
  { id: "America/Sao_Paulo", label: "São Paulo", region: "Americas" },
  // Europe
  { id: "Europe/London", label: "London", region: "Europe" },
  { id: "Europe/Paris", label: "Paris", region: "Europe" },
  { id: "Europe/Berlin", label: "Berlin", region: "Europe" },
  { id: "Europe/Rome", label: "Rome", region: "Europe" },
  { id: "Europe/Madrid", label: "Madrid", region: "Europe" },
  { id: "Europe/Amsterdam", label: "Amsterdam", region: "Europe" },
  { id: "Europe/Brussels", label: "Brussels", region: "Europe" },
  { id: "Europe/Vienna", label: "Vienna", region: "Europe" },
  { id: "Europe/Warsaw", label: "Warsaw", region: "Europe" },
  { id: "Europe/Prague", label: "Prague", region: "Europe" },
  { id: "Europe/Stockholm", label: "Stockholm", region: "Europe" },
  { id: "Europe/Oslo", label: "Oslo", region: "Europe" },
  { id: "Europe/Helsinki", label: "Helsinki", region: "Europe" },
  { id: "Europe/Athens", label: "Athens", region: "Europe" },
  { id: "Europe/Moscow", label: "Moscow", region: "Europe" },
  { id: "Europe/Istanbul", label: "Istanbul", region: "Europe" },
  { id: "Europe/Kyiv", label: "Kyiv", region: "Europe" },
  // Asia
  { id: "Asia/Dubai", label: "Dubai", region: "Asia" },
  { id: "Asia/Karachi", label: "Karachi", region: "Asia" },
  { id: "Asia/Kolkata", label: "Mumbai, Kolkata, New Delhi", region: "Asia" },
  { id: "Asia/Dhaka", label: "Dhaka", region: "Asia" },
  { id: "Asia/Bangkok", label: "Bangkok", region: "Asia" },
  { id: "Asia/Singapore", label: "Singapore", region: "Asia" },
  { id: "Asia/Hong_Kong", label: "Hong Kong", region: "Asia" },
  { id: "Asia/Shanghai", label: "Beijing, Shanghai", region: "Asia" },
  { id: "Asia/Taipei", label: "Taipei", region: "Asia" },
  { id: "Asia/Tokyo", label: "Tokyo", region: "Asia" },
  { id: "Asia/Seoul", label: "Seoul", region: "Asia" },
  { id: "Asia/Manila", label: "Manila", region: "Asia" },
  { id: "Asia/Jakarta", label: "Jakarta", region: "Asia" },
  { id: "Asia/Kuala_Lumpur", label: "Kuala Lumpur", region: "Asia" },
  { id: "Asia/Ho_Chi_Minh", label: "Ho Chi Minh City", region: "Asia" },
  { id: "Asia/Jerusalem", label: "Jerusalem", region: "Asia" },
  { id: "Asia/Riyadh", label: "Riyadh", region: "Asia" },
  // Pacific & Oceania
  { id: "Australia/Sydney", label: "Sydney", region: "Pacific" },
  { id: "Australia/Melbourne", label: "Melbourne", region: "Pacific" },
  { id: "Australia/Brisbane", label: "Brisbane", region: "Pacific" },
  { id: "Australia/Perth", label: "Perth", region: "Pacific" },
  { id: "Pacific/Auckland", label: "Auckland", region: "Pacific" },
  { id: "Pacific/Fiji", label: "Fiji", region: "Pacific" },
  // Africa
  { id: "Africa/Cairo", label: "Cairo", region: "Africa" },
  { id: "Africa/Johannesburg", label: "Johannesburg", region: "Africa" },
  { id: "Africa/Lagos", label: "Lagos", region: "Africa" },
  { id: "Africa/Nairobi", label: "Nairobi", region: "Africa" },
  { id: "Africa/Casablanca", label: "Casablanca", region: "Africa" },
  // UTC
  { id: "UTC", label: "UTC (Coordinated Universal Time)", region: "UTC" },
];

// Plugin configurations with real links
const pluginConfigs = [
  { 
    name: "Google Calendar", 
    description: "Sync practice reminders with your calendar", 
    icon: "📅",
    connectUrl: "https://calendar.google.com",
    color: "bg-blue-500/10"
  },
  { 
    name: "Discord", 
    description: "Join our community server for tips and support", 
    icon: "💬",
    connectUrl: "https://discord.gg/cubemastery",
    color: "bg-indigo-500/10"
  },
  { 
    name: "Notion", 
    description: "Export notes and progress to your Notion workspace", 
    icon: "📝",
    connectUrl: "https://notion.so",
    color: "bg-gray-500/10"
  },
  { 
    name: "Spotify", 
    description: "Listen to focus playlists while practicing", 
    icon: "🎵",
    connectUrl: "https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS",
    color: "bg-green-500/10"
  },
];

function DevicesTab() {
  const { devices, removeDevice, maxDevices, formatBytes, totalStorageUsed, downloads } = useDownloads();
  const handleRemoveDevice = async (deviceId: string, name: string) => {
    if (confirm(`Remove "${name}" from your devices? Downloads on that device will become inaccessible.`)) {
      await removeDevice(deviceId);
      toast.success(`Device "${name}" removed`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-1">Active Devices</h3>
        <p className="text-sm text-muted-foreground mb-4">
          You can download courses on up to {maxDevices} devices. Remove a device to add a new one.
        </p>
        {devices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No devices registered yet.</p>
        ) : (
          <div className="space-y-2">
            {devices.map((device: any) => (
              <div key={device.id} className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-border bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {device.device_name?.includes("Phone") || device.device_name?.includes("iPhone") || device.device_name?.includes("Android") ? (
                      <Smartphone className="w-5 h-5 text-primary" />
                    ) : (
                      <Monitor className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{device.device_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Last used: {new Date(device.last_used_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRemoveDevice(device.id, device.device_name)}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          {devices.length}/{maxDevices} devices active
        </p>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-base sm:text-lg font-semibold mb-1">Download Storage</h3>
        <div className="p-4 rounded-xl border border-border bg-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Total storage used</span>
            <span className="text-sm font-medium">{formatBytes(totalStorageUsed)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Downloaded videos</span>
            <span className="text-sm font-medium">{downloads.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const Settings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut, signOutAllDevices, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const { settings, loading: settingsLoading, updateSetting, toggleConnectedApp } = useUserSettings();
  
  const [activeTab, setActiveTab] = useState("profile");
  
  // Modal states
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  // Search states
  const [languageSearch, setLanguageSearch] = useState("");
  const [timezoneSearch, setTimezoneSearch] = useState("");

  // Support states
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubject, setSupportSubject] = useState("");
  const [isSendingSupport, setIsSendingSupport] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleLogOutAllDevices = async () => {
    const { error } = await signOutAllDevices();
    if (error) {
      toast.error("Failed to log out of all devices");
    } else {
      toast.success("Logged out of all devices");
      navigate("/auth");
    }
  };

  // Theme change - syncs with global theme system
  const handleThemeChange = (themeId: string) => {
    if (theme !== themeId) {
      toggleTheme();
    }
    toast.success(`Theme changed to ${themeId}`);
  };

  // Language change - persists to database
  const handleLanguageChange = async (langId: string) => {
    await updateSetting('language', langId);
    document.documentElement.lang = langId;
    toast.success("Language preference saved");
  };

  // Timezone change - persists to database
  const handleTimezoneChange = async (tzId: string) => {
    await updateSetting('timezone', tzId);
    toast.success("Timezone updated - timestamps will reflect this change");
  };

  // 2FA toggle - persists to database
  const handleToggle2FA = async (enabled: boolean) => {
    await updateSetting('two_step_enabled', enabled);
    if (!enabled) {
      toast.info("Note: Email verification is still required for security");
    }
  };

  // Browser notifications with permission request
  const handleBrowserNotifications = async (enabled: boolean) => {
    if (enabled && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await updateSetting('browser_notifications', true);
        toast.success("Browser notifications enabled");
      } else {
        toast.error("Notification permission denied");
        return;
      }
    } else {
      await updateSetting('browser_notifications', false);
    }
  };

  // Support request submission
  const handleSendSupport = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      toast.error("Please fill in both subject and message");
      return;
    }

    setIsSendingSupport(true);
    try {
      // Create a notification for admins
      await supabase.from("notifications").insert({
        title: `Support Request: ${supportSubject}`,
        message: supportMessage,
        type: "support",
        user_id: null,
        reference_id: user?.id,
      });

      // Log the activity
      await supabase.from("activity_log").insert({
        user_id: user?.id,
        user_email: user?.email,
        action: "Support request submitted",
        action_type: "support",
        details: { subject: supportSubject, message: supportMessage },
      });

      toast.success("Support request sent! We'll get back to you soon.");
      setSupportSubject("");
      setSupportMessage("");
    } catch (error) {
      toast.error("Failed to send support request");
    } finally {
      setIsSendingSupport(false);
    }
  };

  // Plugin connection with real URL redirect
  const handleConnectApp = async (appName: string, connectUrl: string) => {
    const isConnected = settings?.connected_apps?.includes(appName);
    
    if (isConnected) {
      // Disconnect
      await toggleConnectedApp(appName);
    } else {
      // Connect - open the app URL in new tab and mark as connected
      window.open(connectUrl, '_blank', 'noopener,noreferrer');
      await toggleConnectedApp(appName);
    }
  };

  // Navigate to pricing section for upgrades
  const handleUpgrade = () => {
    navigate('/#pricing');
    // Scroll to pricing section after navigation
    setTimeout(() => {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const filteredLanguages = languages.filter(lang => 
    lang.label.toLowerCase().includes(languageSearch.toLowerCase())
  );

  const filteredTimezones = timezones.filter(tz => 
    tz.label.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
    tz.region.toLowerCase().includes(timezoneSearch.toLowerCase())
  );

  const groupedTimezones = filteredTimezones.reduce((acc, tz) => {
    if (!acc[tz.region]) acc[tz.region] = [];
    acc[tz.region].push(tz);
    return acc;
  }, {} as Record<string, typeof timezones>);

  if (authLoading || profileLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split("@")[0] || "User";
  const email = user.email || "";
  const currentPlan = profile?.subscription_tier || "free";
  
  // Use settings from database with fallbacks
  const selectedLanguage = settings?.language || 'en';
  const selectedTimezone = settings?.timezone || 'UTC';
  const emailNotifications = settings?.email_notifications ?? true;
  const progressReminders = settings?.progress_reminders ?? true;
  const marketingEmails = settings?.marketing_emails ?? false;
  const browserNotifications = settings?.browser_notifications ?? false;
  const profileVisibility = settings?.profile_visibility || 'private';
  const activityTracking = settings?.activity_tracking ?? true;
  const dataSharing = settings?.data_sharing ?? false;
  const twoStepEnabled = settings?.two_step_enabled ?? true;
  const supportAccess = settings?.support_access ?? false;
  const connectedApps = settings?.connected_apps || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <LogoWithGlow size="md" />
            <span className="text-lg sm:text-xl font-bold text-foreground hidden xs:inline">{t('common.cubeMastery')}</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Title */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8 text-foreground" />
          <h1 className="text-2xl sm:text-4xl font-bold italic">Settings</h1>
        </div>

        <div className="grid lg:grid-cols-[280px,1fr] gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="card-gradient rounded-2xl border border-border p-3 sm:p-4 h-fit">
            <nav className="space-y-1">
              {getSettingsTabs(t).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all text-sm sm:text-base ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="card-gradient rounded-2xl border border-border p-4 sm:p-6 lg:p-8">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6 sm:space-y-8">
                {/* Profile Header with Avatar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative group">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-bold">{displayName}</h2>
                    <p className="text-muted-foreground text-sm sm:text-base">{email}</p>
                  </div>
                  <Link to="/profile">
                    <Button variant="outline" size="sm">
                      Edit Profile
                    </Button>
                  </Link>
                </div>

                {/* Name - Links to Profile page */}
                <div className="flex items-center justify-between py-3 sm:py-4 border-b border-border">
                  <span className="text-muted-foreground text-sm sm:text-base">Name</span>
                  <Link 
                    to="/profile"
                    className="flex items-center gap-2 text-foreground hover:text-primary transition-colors text-sm sm:text-base"
                  >
                    <span>{displayName}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Avatar - Links to Profile page */}
                <div className="flex items-center justify-between py-3 sm:py-4 border-b border-border">
                  <span className="text-muted-foreground text-sm sm:text-base">Profile Picture</span>
                  <Link 
                    to="/profile"
                    className="flex items-center gap-2 text-foreground hover:text-primary transition-colors text-sm sm:text-base"
                  >
                    <span>{profile?.avatar_url ? "Change" : "Add"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Account Security Section */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Account security</h3>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between py-2 sm:py-3 border-b border-border">
                      <span className="text-muted-foreground text-sm sm:text-base">Email</span>
                      <span className="text-foreground text-sm sm:text-base truncate max-w-[200px]">{email}</span>
                    </div>

                    <button 
                      onClick={() => setChangePasswordOpen(true)}
                      className="flex items-center justify-between w-full py-3 border-b border-border bg-secondary/30 px-3 sm:px-4 rounded-lg -mx-3 sm:-mx-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="text-left">
                        <span className="font-medium text-sm sm:text-base">Password</span>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Set a permanent password to login to your account.
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>

                    <div className="flex items-center justify-between py-2 sm:py-3">
                      <div>
                        <span className="font-medium text-sm sm:text-base">2-step verification</span>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Email verification code required on every login.
                        </p>
                      </div>
                      <Switch
                        checked={twoStepEnabled}
                        onCheckedChange={handleToggle2FA}
                      />
                    </div>
                  </div>
                </div>

                {/* Support Section */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Support</h3>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between py-2 sm:py-3">
                      <div>
                        <span className="font-medium text-sm sm:text-base">Support access</span>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Grant support temporary access to troubleshoot issues.
                        </p>
                      </div>
                      <Switch
                        checked={supportAccess}
                        onCheckedChange={(checked) => updateSetting('support_access', checked)}
                      />
                    </div>

                    <button 
                      onClick={handleLogOutAllDevices}
                      className="flex items-center justify-between w-full py-2 sm:py-3 hover:text-primary transition-colors"
                    >
                      <div className="text-left">
                        <span className="font-medium text-sm sm:text-base">Log out of all devices</span>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Log out of all other active sessions.
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => setDeleteAccountOpen(true)}
                      className="flex items-center justify-between w-full py-2 sm:py-3 text-destructive hover:text-destructive/80 transition-colors"
                    >
                      <div className="text-left">
                        <span className="font-medium text-sm sm:text-base">Delete my account</span>
                        <p className="text-xs sm:text-sm opacity-70">
                          Permanently delete the account and all data.
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Theme Tab */}
            {activeTab === "theme" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t('settings.appearance')}</h3>
                  <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">{t('settings.chooseTheme')}</p>
                  
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                    {getThemes(t).map((themeOption) => (
                      <button
                        key={themeOption.id}
                        onClick={() => handleThemeChange(themeOption.id)}
                        className={`p-4 sm:p-6 rounded-xl border transition-all flex items-center gap-3 sm:gap-4 ${
                          theme === themeOption.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                          themeOption.id === "dark" ? "bg-secondary" : "bg-yellow-100"
                        }`}>
                          <themeOption.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${themeOption.id === "dark" ? "text-foreground" : "text-yellow-600"}`} />
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-medium text-sm sm:text-base">{themeOption.label}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {themeOption.id === "dark" ? "Easy on the eyes" : "Classic bright mode"}
                          </p>
                        </div>
                        {theme === themeOption.id && (
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Language Tab */}
            {activeTab === "language" && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Language</h3>
                  <p className="text-muted-foreground mb-4 text-sm">Your language preference is saved and applied across the platform.</p>
                  <Input
                    placeholder="Search languages..."
                    value={languageSearch}
                    onChange={(e) => setLanguageSearch(e.target.value)}
                    className="mb-4"
                  />
                  <div className="grid sm:grid-cols-2 gap-2 sm:gap-3 max-h-64 overflow-y-auto">
                    {filteredLanguages.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => handleLanguageChange(lang.id)}
                        className={`p-3 sm:p-4 rounded-xl border transition-all flex items-center gap-2 sm:gap-3 ${
                          selectedLanguage === lang.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="text-xl sm:text-2xl">{lang.flag}</span>
                        <span className="font-medium text-sm sm:text-base">{lang.label}</span>
                        {selectedLanguage === lang.id && (
                          <Check className="w-4 h-4 text-primary ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Timezone</h3>
                  <p className="text-muted-foreground mb-4 text-sm">Your timezone affects timestamps for lessons, activity, and notifications.</p>
                  <Input
                    placeholder="Search timezones..."
                    value={timezoneSearch}
                    onChange={(e) => setTimezoneSearch(e.target.value)}
                    className="mb-4"
                  />
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {Object.entries(groupedTimezones).map(([region, tzs]) => (
                      <div key={region}>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">{region}</h4>
                        <div className="space-y-1">
                          {tzs.map((tz) => (
                            <button
                              key={tz.id}
                              onClick={() => handleTimezoneChange(tz.id)}
                              className={`w-full p-3 sm:p-4 rounded-xl border transition-all flex items-center justify-between text-left ${
                                selectedTimezone === tz.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <span className="font-medium text-sm sm:text-base">{tz.label}</span>
                              {selectedTimezone === tz.id && (
                                <Check className="w-4 h-4 text-primary" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Email Notifications</h3>
                  <p className="text-muted-foreground mb-4 text-sm">These preferences are saved and control what emails you receive.</p>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between py-2 sm:py-3">
                      <div>
                        <span className="font-medium text-sm sm:text-base">Email notifications</span>
                        <p className="text-xs sm:text-sm text-muted-foreground">Receive important updates via email</p>
                      </div>
                      <Switch
                        checked={emailNotifications}
                        onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between py-2 sm:py-3">
                      <div>
                        <span className="font-medium text-sm sm:text-base">Progress reminders</span>
                        <p className="text-xs sm:text-sm text-muted-foreground">Weekly reminders about your learning</p>
                      </div>
                      <Switch
                        checked={progressReminders}
                        onCheckedChange={(checked) => updateSetting('progress_reminders', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between py-2 sm:py-3">
                      <div>
                        <span className="font-medium text-sm sm:text-base">Marketing emails</span>
                        <p className="text-xs sm:text-sm text-muted-foreground">Updates about new courses and offers</p>
                      </div>
                      <Switch
                        checked={marketingEmails}
                        onCheckedChange={(checked) => updateSetting('marketing_emails', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Push Notifications</h3>
                  <div className="flex items-center justify-between py-2 sm:py-3">
                    <div>
                      <span className="font-medium text-sm sm:text-base">Browser notifications</span>
                      <p className="text-xs sm:text-sm text-muted-foreground">Get notifications in your browser</p>
                    </div>
                    <Switch
                      checked={browserNotifications}
                      onCheckedChange={handleBrowserNotifications}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Profile Visibility</h3>
                  <p className="text-muted-foreground mb-4 text-sm">Control who can see your profile and progress.</p>
                  <div className="space-y-2">
                    {["public", "private"].map((visibility) => (
                      <button
                        key={visibility}
                        onClick={() => updateSetting('profile_visibility', visibility)}
                        className={`w-full p-3 sm:p-4 rounded-xl border transition-all flex items-center justify-between ${
                          profileVisibility === visibility
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-left">
                          <span className="font-medium capitalize text-sm sm:text-base">{visibility}</span>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {visibility === "public" 
                              ? "Anyone can see your profile and progress" 
                              : "Only you can see your profile"
                            }
                          </p>
                        </div>
                        {profileVisibility === visibility && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 sm:py-3">
                  <div>
                    <span className="font-medium text-sm sm:text-base">Activity tracking</span>
                    <p className="text-xs sm:text-sm text-muted-foreground">Track your learning progress for personalized recommendations</p>
                  </div>
                  <Switch
                    checked={activityTracking}
                    onCheckedChange={(checked) => updateSetting('activity_tracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between py-2 sm:py-3">
                  <div>
                    <span className="font-medium text-sm sm:text-base">Data sharing</span>
                    <p className="text-xs sm:text-sm text-muted-foreground">Share anonymous usage data to help improve the platform</p>
                  </div>
                  <Switch
                    checked={dataSharing}
                    onCheckedChange={(checked) => updateSetting('data_sharing', checked)}
                  />
                </div>
              </div>
            )}

            {/* Devices Tab */}
            {activeTab === "devices" && <DevicesTab />}

            {/* Payment Tab */}
            {activeTab === "payment" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Subscription</h3>
                  <div className="p-4 sm:p-6 rounded-xl border border-border bg-secondary/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <p className="font-medium text-sm sm:text-base">Current Plan</p>
                        <p className="text-xl sm:text-2xl font-bold text-primary capitalize">{currentPlan}</p>
                      </div>
                      {currentPlan === "free" && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button size="sm" variant="outline" onClick={handleUpgrade}>
                            Starter - $15
                          </Button>
                          <Button size="sm" onClick={handleUpgrade}>
                            Pro - $40
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {currentPlan === "free" 
                        ? "Upgrade to unlock all 50+ lessons and advanced features."
                        : "Thank you for being a premium member!"}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Payment Methods</h3>
                  <div className="p-4 sm:p-6 rounded-xl border border-dashed border-border text-center">
                    <CreditCard className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4 text-sm sm:text-base">No payment methods added yet</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Payment methods are securely managed through our payment provider during checkout.
                    </p>
                    <Button variant="outline" size="sm" onClick={handleUpgrade}>
                      Add Payment Method
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Billing History</h3>
                  <div className="p-4 rounded-xl border border-border bg-secondary/20">
                    <p className="text-sm text-muted-foreground">
                      {currentPlan === "free" 
                        ? "No billing history. Upgrade to a paid plan to start."
                        : "View your billing history and invoices in the payment portal."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Plugins Tab */}
            {activeTab === "plugins" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Connected Apps</h3>
                  <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">Connect third-party apps to enhance your learning experience. Connections are saved to your account.</p>
                  
                  <div className="space-y-2 sm:space-y-3">
                    {pluginConfigs.map((app) => {
                      const isConnected = connectedApps.includes(app.name);
                      return (
                        <div
                          key={app.name}
                          className={`p-3 sm:p-4 rounded-xl border transition-all ${
                            isConnected ? "border-primary/50 bg-primary/5" : "border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${app.color}`}>
                                <span className="text-xl sm:text-2xl">{app.icon}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm sm:text-base">{app.name}</p>
                                  {isConnected && (
                                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Connected</span>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground">{app.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isConnected && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => window.open(app.connectUrl, '_blank', 'noopener,noreferrer')}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              )}
                              <Button 
                                variant={isConnected ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => handleConnectApp(app.name, app.connectUrl)}
                              >
                                {isConnected ? "Disconnect" : "Connect"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Support Tab */}
            {activeTab === "support" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Submit a Support Request</h3>
                  <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
                    Having issues or need help? Send us a message and we'll get back to you.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Subject</label>
                      <Input
                        placeholder="What do you need help with?"
                        value={supportSubject}
                        onChange={(e) => setSupportSubject(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Message</label>
                      <Textarea
                        placeholder="Describe your issue or question in detail..."
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        rows={5}
                      />
                    </div>
                    <Button 
                      onClick={handleSendSupport}
                      disabled={isSendingSupport || !supportSubject.trim() || !supportMessage.trim()}
                      className="w-full sm:w-auto"
                    >
                      {isSendingSupport ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Request
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Help</h3>
                  <div className="space-y-2">
                    {[
                      { question: "How do I reset my password?", answer: "Go to Profile → Password → Change Password" },
                      { question: "How do I upgrade my plan?", answer: "Go to Payment tab and select a plan, or click the upgrade buttons" },
                      { question: "Can I download lessons for offline?", answer: "Yes, videos can be downloaded on Pro plan" },
                    ].map((faq, i) => (
                      <div key={i} className="p-3 sm:p-4 rounded-xl bg-secondary/30">
                        <p className="font-medium text-sm sm:text-base">{faq.question}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <EditProfileModal
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        currentName={displayName}
        userId={user.id}
        onSuccess={refetchProfile}
      />
      <ChangePasswordModal
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
      <DeleteAccountModal
        open={deleteAccountOpen}
        onOpenChange={setDeleteAccountOpen}
        userEmail={email}
        onConfirm={handleSignOut}
      />
    </div>
  );
};

export default Settings;
