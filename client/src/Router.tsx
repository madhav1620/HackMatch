import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/layout/AppShell";
import { ProtectedRoute } from "./components/features/auth/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import DiscoverPage from "./pages/DiscoverPage";
import OnboardingPage from "./pages/OnboardingPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import ProfilePage from "./pages/ProfilePage";

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
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/profile/me" element={<ProfilePage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route
          path="/talent"
          element={<PlaceholderPage title="Talent Directory" note="Browse solo builders and teammates by skill — Phase 4." />}
        />
        <Route
          path="/squads"
          element={<PlaceholderPage title="Squads" note="Teams recruiting for a hackathon, with open slots — Phase 4." />}
        />
        <Route
          path="/chats"
          element={<PlaceholderPage title="Chats" note="Accepted requests hand off to Discord / WhatsApp / Email — Phase 4." />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
