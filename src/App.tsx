import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { AdminProvider } from "@/hooks/useAdmin";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { PushNotificationPrompt } from "@/components/pwa/PushNotifications";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Lesson = lazy(() => import("./pages/Lesson"));
const Notifications = lazy(() => import("./pages/Notifications"));
const MyDownloads = lazy(() => import("./pages/MyDownloads"));
const Community = lazy(() => import("./pages/Community"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Certificates = lazy(() => import("./pages/Certificates"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const ReferralLanding = lazy(() => import("./pages/ReferralLanding"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminLessons = lazy(() => import("./pages/admin/AdminLessons"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminResources = lazy(() => import("./pages/admin/AdminResources"));
const AdminChallenges = lazy(() => import("./pages/admin/AdminChallenges"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminDailyChallenges = lazy(() => import("./pages/admin/AdminDailyChallenges"));
const AdminInviteAccept = lazy(() => import("./pages/admin/AdminInviteAccept"));
const CubeCoachChat = lazy(() => import("@/components/chat/CubeCoachChat").then(m => ({ default: m.CubeCoachChat })));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <AdminProvider>
          <SettingsProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <PWAInstallPrompt />
            <PWAUpdatePrompt />
            <OfflineBanner />
            <PushNotificationPrompt />
            <BrowserRouter>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/lesson/:id" element={<Lesson />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/downloads" element={<MyDownloads />} />
                <Route path="/community" element={<Community />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/u/:username" element={<PublicProfile />} />
                <Route path="/certificates" element={<Certificates />} />
                <Route path="/verify/:certificateId" element={<VerifyCertificate />} />
                <Route path="/ref/:code" element={<ReferralLanding />} />
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/lessons" element={<AdminLessons />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/resources" element={<AdminResources />} />
                <Route path="/admin/challenges" element={<AdminChallenges />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/daily-challenges" element={<AdminDailyChallenges />} />
                <Route path="/admin/invite/:token" element={<AdminInviteAccept />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
              </BrowserRouter>
              <Suspense fallback={null}>
                <CubeCoachChat />
              </Suspense>
              <SpeedInsights />
            </TooltipProvider>
          </SettingsProvider>
        </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;