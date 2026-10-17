import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return null; // or a minimal skeleton
  if (!user) return <Navigate to="/auth" replace state={{ from: loc }} />;
  return <>{children}</>;
}
