import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { PublicOnlyRoute } from "@/components/common/PublicOnlyRoute";

import Landing from "@/pages/public/Landing";
import Login from "@/pages/public/Login";
import Register from "@/pages/public/Register";
import ForgotPassword from "@/pages/public/ForgotPassword";
import ResetPassword from "@/pages/public/ResetPassword";
import VerifyEmail from "@/pages/public/VerifyEmail";
import Privacy from "@/pages/public/Privacy";
import Terms from "@/pages/public/Terms";
import Contact from "@/pages/public/Contact";

import Dashboard from "@/pages/app/Dashboard";
import Categories from "@/pages/app/Categories";
import Tests from "@/pages/app/Tests";
import TestDetail from "@/pages/app/TestDetail";
import TestRunner from "@/pages/app/TestRunner";
import Attempts from "@/pages/app/Attempts";
import AttemptReview from "@/pages/app/AttemptReview";
import Labs from "@/pages/app/Labs";
import Chat from "@/pages/app/Chat";
import LabDetail from "@/pages/app/LabDetail";
import Profile from "@/pages/app/Profile";
import PublicProfile from "@/pages/app/PublicProfile";
import Settings from "@/pages/app/Settings";
import NotFound from "@/pages/public/NotFound";

export default function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />

            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/tests" element={<Tests />} />
              <Route path="/tests/:id" element={<TestDetail />} />
              <Route path="/attempts" element={<Attempts />} />
              <Route path="/attempts/:id" element={<AttemptReview />} />
              <Route path="/results/:id" element={<AttemptReview />} />
              <Route path="/labs" element={<Labs />} />
              <Route path="/labs/:slug" element={<LabDetail />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<PublicProfile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/:tab" element={<Settings />} />
            </Route>
            <Route path="/tests/:id/run" element={<TestRunner />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster theme="system" position="top-right" richColors />
      </TooltipProvider>
    </ErrorBoundary>
  );
}
