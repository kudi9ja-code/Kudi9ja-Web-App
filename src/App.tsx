import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useSession } from './state/session';
import { PageSpinner } from './components/ui/Spinner';
import { AppLayout } from './layouts/AppLayout';
import { AdminLayout } from './layouts/AdminLayout';
import LockScreen from './pages/auth/LockScreen';

// Public
const Welcome = lazy(() => import('./pages/public/Welcome'));
const SignIn = lazy(() => import('./pages/auth/SignIn'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const Signup = lazy(() => import('./pages/auth/signup/Signup'));
const LegalIndex = lazy(() => import('./pages/legal/LegalIndex'));
const LegalDocumentPage = lazy(() => import('./pages/legal/LegalDocumentPage'));
const NotFound = lazy(() => import('./pages/public/NotFound'));

// Customer
const Dashboard = lazy(() => import('./pages/app/Dashboard'));
// Savings and Ajo circles are switched off for now.
// const Savings = lazy(() => import('./pages/app/savings/Savings'));
// const NewPlan = lazy(() => import('./pages/app/savings/NewPlan'));
// const FixedPlan = lazy(() => import('./pages/app/savings/FixedPlan'));
// const TargetPlan = lazy(() => import('./pages/app/savings/TargetPlan'));
// const PlanDetail = lazy(() => import('./pages/app/savings/PlanDetail'));
// const SavingsCalculator = lazy(() => import('./pages/app/savings/SavingsCalculator'));
// const Circles = lazy(() => import('./pages/app/circles/Circles'));
// const NewCircle = lazy(() => import('./pages/app/circles/NewCircle'));
// const CircleDetail = lazy(() => import('./pages/app/circles/CircleDetail'));
const Loans = lazy(() => import('./pages/app/loans/Loans'));
const LoanCalculator = lazy(() => import('./pages/app/loans/LoanCalculator'));
const LoanApply = lazy(() => import('./pages/app/loans/LoanApply'));
const LoanDetail = lazy(() => import('./pages/app/loans/LoanDetail'));
const Wallet = lazy(() => import('./pages/app/wallet/Wallet'));
const PayIn = lazy(() => import('./pages/app/wallet/PayIn'));
const PaystackReturn = lazy(() => import('./pages/app/wallet/PaystackReturn'));
const Withdraw = lazy(() => import('./pages/app/wallet/Withdraw'));
const PayoutAccount = lazy(() => import('./pages/app/wallet/PayoutAccount'));
const Receipt = lazy(() => import('./pages/app/wallet/Receipt'));
const Notifications = lazy(() => import('./pages/app/Notifications'));
const Insights = lazy(() => import('./pages/app/Insights'));
const Reviews = lazy(() => import('./pages/app/Reviews'));
const Support = lazy(() => import('./pages/app/support/Support'));
const Profile = lazy(() => import('./pages/app/profile/Profile'));
const Security = lazy(() => import('./pages/app/profile/Security'));
const Privacy = lazy(() => import('./pages/app/profile/Privacy'));

// Admin
const AdminOverview = lazy(() => import('./pages/admin/Overview'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers'));
const AdminCustomer = lazy(() => import('./pages/admin/CustomerDetail'));
const AdminPayments = lazy(() => import('./pages/admin/Payments'));
const AdminLending = lazy(() => import('./pages/admin/Lending'));
const AdminApplication = lazy(() => import('./pages/admin/ApplicationDetail'));
const AdminOfflineLoan = lazy(() => import('./pages/admin/OfflineLoanDetail'));
const AdminNewOfflineLoan = lazy(() => import('./pages/admin/NewOfflineLoan'));
const AdminControls = lazy(() => import('./pages/admin/Controls'));
const AdminTeam = lazy(() => import('./pages/admin/Team'));
const AdminAudit = lazy(() => import('./pages/admin/Audit'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminRepayments = lazy(() => import('./pages/admin/Repayments'));
const AdminBookDetail = lazy(() => import('./pages/admin/BookDetail'));
const AdminSupport = lazy(() => import('./pages/admin/Support'));
const AdminGroups = lazy(() => import('./pages/admin/Groups'));
const AdminGroup = lazy(() => import('./pages/admin/GroupDetail'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

/** Customer and admin areas: signed out goes to sign-in; locked shows the passcode screen in place. */
function RequireSession({ children }: { children: ReactNode }) {
  const { stage, resuming } = useSession();
  const location = useLocation();
  if (stage === 'signedOut') {
    return <Navigate to={`/signin?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  if (stage === 'locked') return resuming ? <PageSpinner /> : <LockScreen />;
  return <>{children}</>;
}

function RequireAdmin() {
  const { isAdmin } = useSession();
  if (!isAdmin) return <Navigate to="/app" replace />;
  return <Outlet />;
}

/** Sign-in and sign-up are for visitors; anybody with a session goes to their dashboard. */
function GuestOnly({ children }: { children: ReactNode }) {
  const { stage } = useSession();
  const next = new URLSearchParams(useLocation().search).get('next');
  if (stage !== 'signedOut') return <Navigate to={next && next.startsWith('/') ? next : '/app'} replace />;
  return <>{children}</>;
}

export default function App() {
  const { stage } = useSession();
  return (
    <Suspense fallback={<PageSpinner />}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={stage === 'signedOut' ? <Welcome /> : <Navigate to="/app" replace />} />
        <Route path="/signin" element={<GuestOnly><SignIn /></GuestOnly>} />
        <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/legal" element={<LegalIndex />} />
        <Route path="/legal/:kind" element={<LegalDocumentPage />} />

        <Route
          path="/app"
          element={
            <RequireSession>
              <AppLayout />
            </RequireSession>
          }
        >
          <Route index element={<Dashboard />} />
          {/* Savings and Ajo circles are switched off for now; old links land on the dashboard.
          <Route path="savings" element={<Savings />} />
          <Route path="savings/new" element={<NewPlan />} />
          <Route path="savings/fixed" element={<FixedPlan />} />
          <Route path="savings/target" element={<TargetPlan />} />
          <Route path="savings/calculator" element={<SavingsCalculator />} />
          <Route path="savings/:id" element={<PlanDetail />} />
          <Route path="circles" element={<Circles />} />
          <Route path="circles/new" element={<NewCircle />} />
          <Route path="circles/:id" element={<CircleDetail />} />
          */}
          <Route path="savings/*" element={<Navigate to="/app" replace />} />
          <Route path="circles/*" element={<Navigate to="/app" replace />} />
          <Route path="loans" element={<Loans />} />
          <Route path="loans/calculator" element={<LoanCalculator />} />
          <Route path="loans/apply" element={<LoanApply />} />
          <Route path="loans/:id" element={<LoanDetail />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="wallet/add" element={<PayIn />} />
          <Route path="wallet/paystack" element={<PaystackReturn />} />
          <Route path="wallet/withdraw" element={<Withdraw />} />
          <Route path="wallet/payout-account" element={<PayoutAccount />} />
          <Route path="transactions/:id" element={<Receipt />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="insights" element={<Insights />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="support" element={<Support />} />
          <Route path="support/:id" element={<Support />} />
          <Route path="profile" element={<Profile />} />
          <Route path="security" element={<Security />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="legal" element={<LegalIndex embedded />} />
          <Route path="legal/:kind" element={<LegalDocumentPage embedded />} />
          <Route path="*" element={<NotFound embedded />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireSession>
              <RequireAdmin />
            </RequireSession>
          }
        >
          <Route element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="customers/:id" element={<AdminCustomer />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="lending" element={<AdminLending />} />
            <Route path="lending/applications/:id" element={<AdminApplication />} />
            <Route path="lending/offline/new" element={<AdminNewOfflineLoan />} />
            <Route path="lending/offline/:id" element={<AdminOfflineLoan />} />
            <Route path="controls" element={<AdminControls />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="audit" element={<AdminAudit />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="repayments" element={<AdminRepayments />} />
            <Route path="book" element={<Navigate to="/admin/book/overdue" replace />} />
            <Route path="book/:view" element={<AdminBookDetail />} />
            <Route path="groups" element={<AdminGroups />} />
            <Route path="groups/:id" element={<AdminGroup />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="support/:id" element={<AdminSupport />} />
            <Route path="*" element={<NotFound embedded />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
