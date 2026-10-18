import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/layout/AppShell";
import { ProtectedRoute } from "./components/features/auth/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import DiscoverPage from "./pages/DiscoverPage";
import HackathonDetailPage from "./pages/HackathonDetailPage";
import MyRequestsPage from "./pages/MyRequestsPage";
import MyTeamsPage from "./pages/MyTeamsPage";
import OnboardingPage from "./pages/OnboardingPage";
import PostHackathonPage from "./pages/PostHackathonPage";
import ProfilePage from "./pages/ProfilePage";
import SavedPage from "./pages/SavedPage";
import TalentPage from "./pages/TalentPage";
import TeamDetailPage from "./pages/TeamDetailPage";

export default function Router() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DiscoverPage />} />
        <Route path="/hackathons/:id" element={<HackathonDetailPage />} />
        <Route path="/teams/:id" element={<TeamDetailPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/admin/hackathons/new" element={<PostHackathonPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/profile/me" element={<ProfilePage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />

        {/* Phase 4 — Team Matchmaking & Recruitment */}
        <Route path="/talent" element={<TalentPage />} />
        <Route path="/squads" element={<MyTeamsPage />} />
        <Route path="/requests" element={<MyRequestsPage />} />
        <Route path="/chats" element={<Navigate to="/requests" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
