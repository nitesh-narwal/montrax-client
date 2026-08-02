import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Everything past the landing/auth entry points is lazy-loaded so the initial
// bundle stays small — these are only fetched once a user actually navigates there.
const ActivatePage = lazy(() => import("./pages/ActivatePage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const OtpVerifyPage = lazy(() => import("./pages/OtpVerifyPage"));
const OAuth2RedirectPage = lazy(() => import("./pages/OAuth2RedirectPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ExpensesPage = lazy(() => import("./pages/ExpensesPage"));
const IncomesPage = lazy(() => import("./pages/IncomesPage"));
const AccountsPage = lazy(() => import("./pages/AccountsPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const BudgetsPage = lazy(() => import("./pages/BudgetsPage"));
const SavingsGoalsPage = lazy(() => import("./pages/SavingsGoalsPage"));
const RecurringPage = lazy(() => import("./pages/RecurringPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const BankImportPage = lazy(() => import("./pages/BankImportPage"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <LoadingSpinner />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/activate/:token" element={<ActivatePage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-otp" element={<OtpVerifyPage />} />
              <Route path="/oauth2/redirect" element={<OAuth2RedirectPage />} />

              {/* Dashboard routes */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/incomes" element={<IncomesPage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/budgets" element={<BudgetsPage />} />
                <Route path="/savings-goals" element={<SavingsGoalsPage />} />
                <Route path="/recurring" element={<RecurringPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/insights" element={<InsightsPage />} />
                <Route path="/bank-import" element={<BankImportPage />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
