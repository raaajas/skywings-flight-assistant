import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthGate, PublicOnlyRoute } from "@/components/AuthGate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/layout/AppLayout";
import { BookingsPage } from "@/pages/BookingsPage";
import { ChatPage } from "@/pages/ChatPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          <Route element={<AuthGate />}>
            <Route element={<AppLayout />}>
              <Route index element={<ChatPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
