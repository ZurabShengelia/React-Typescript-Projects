import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { PageSpinner } from "./LoadingState";

export function ProtectedRoute() {
  const { status, hydrate } = useAuthStore();

  useEffect(() => {
    if (status === "idle") hydrate();
  }, [status, hydrate]);

  if (status === "idle" || status === "loading") return <PageSpinner />;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;

  return <Outlet />;
}
