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
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Lesson from "./pages/Lesson";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLessons from "./pages/admin/AdminLessons";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminResources from "./pages/admin/AdminResources";
import AdminChallenges from "./pages/admin/AdminChallenges";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminInviteAccept from "./pages/admin/AdminInviteAccept";
import MyDownloads from "./pages/MyDownloads";
import Community from "./pages/Community";
import Leaderboard from "./pages/Leaderboard";
import PublicProfile from "./pages/PublicProfile";
import Certificates from "./pages/Certificates";
import VerifyCertificate from "./pages/VerifyCertificate";
import ReferralLanding from "./pages/ReferralLanding";
import { CubeCoachChat } from "@/components/chat/CubeCoachChat";

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
                <Route path="/admin/invite/:token" element={<AdminInviteAccept />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </BrowserRouter>
              <CubeCoachChat />
            </TooltipProvider>
          </SettingsProvider>
        </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;