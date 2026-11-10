import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import {
  adminApi,
  authApi,
  // circlesApi, // switched off for now
  loansApi,
  meApi,
  notificationsApi,
  publicApi,
  reviewsApi,
  // savingsApi, // switched off for now
  walletApi,
} from '../lib/api/endpoints';
import type { PaystackStatus, DepositStatus, LegalKind, LoanApplicationStatus, LoanStatus, TxFilter, WithdrawalStatus, AccountStatus, AuditCategory, PublicSettings, RepaymentSource } from '../types/api';
import { useSession } from '../state/session';
import { useSettings } from '../state/settings';

/** Query keys in one place, so a change knows exactly what to refresh. */
export const keys = {
  dashboard: ['dashboard'] as const,
  wallet: ['wallet'] as const,
  transactions: (filter: TxFilter) => ['transactions', filter] as const,
  transaction: (id: string) => ['transactions', 'one', id] as const,
  claims: ['claims'] as const,
  withdrawals: ['withdrawals'] as const,
  plans: ['plans'] as const,
  plan: (id: string) => ['plans', id] as const,
  loans: ['loans'] as const,
  loan: (id: string) => ['loans', id] as const,
  eligibility: ['loans', 'eligibility'] as const,
  applications: ['loan-applications'] as const,
  circles: ['circles'] as const,
  circle: (id: string) => ['circles', id] as const,
  notifications: ['notifications'] as const,
  preferences: ['notifications', 'preferences'] as const,
  agreements: ['agreements'] as const,
  sessions: ['sessions'] as const,
  reviewSummary: ['reviews', 'summary'] as const,
  myReview: ['reviews', 'mine'] as const,
  reviews: ['reviews', 'list'] as const,
  legal: ['legal'] as const,
  banks: ['banks'] as const,
  closure: ['closure'] as const,
  paystack: ['paystack'] as const,
  signatures: ['signatures'] as const,
  admin: {
    root: ['admin'] as const,
    overview: ['admin', 'overview'] as const,
    book: ['admin', 'overview', 'book'] as const,
    me: ['admin', 'me'] as const,
    customers: (q: string, status?: AccountStatus) => ['admin', 'customers', q, status ?? ''] as const,
    customer: (id: string) => ['admin', 'customer', id] as const,
    payIns: (status: string) => ['admin', 'payins', status] as const,
    withdrawals: (status: string) => ['admin', 'withdrawals', status] as const,
    applications: (status: string) => ['admin', 'applications', status] as const,
    application: (id: string) => ['admin', 'application', id] as const,
    loans: (status: string) => ['admin', 'loans', status] as const,
    imports: ['admin', 'imports'] as const,
    importFile: (id: string) => ['admin', 'imports', id] as const,
    loanRecords: (loanId: string) => ['admin', 'loan-records', loanId] as const,
    paystack: (status: string) => ['admin', 'paystack', status] as const,
    team: ['admin', 'team'] as const,
    settings: ['admin', 'settings'] as const,
    groups: ['admin', 'groups'] as const,
    group: (id: string) => ['admin', 'groups', id] as const,
    audit: (category: string, q: string) => ['admin', 'audit', category, q] as const,
    repayments: (filters: object) => ['admin', 'repayments', filters] as const,
  },
};

const useUnlocked = () => useSession().stage === 'unlocked';

// ── Customer ────────────────────────────────────────────────────────────────

export const useDashboard = () =>
  useQuery({ queryKey: keys.dashboard, queryFn: meApi.dashboard, enabled: useUnlocked(), refetchInterval: 60_000 });

export const useWallet = () => useQuery({ queryKey: keys.wallet, queryFn: walletApi.wallet, enabled: useUnlocked() });

export const useTransactions = (filter: TxFilter = 'ALL', size = 100) =>
  useQuery({
    queryKey: [...keys.transactions(filter), size],
    queryFn: () => walletApi.transactions(0, size, filter),
    enabled: useUnlocked(),
  });

export const useTransaction = (id: string) =>
  useQuery({ queryKey: keys.transaction(id), queryFn: () => walletApi.transaction(id), enabled: useUnlocked() && !!id });

export const useClaims = () => useQuery({ queryKey: keys.claims, queryFn: () => walletApi.claims(0, 50), enabled: useUnlocked() });

export const useMyWithdrawals = () =>
  useQuery({ queryKey: keys.withdrawals, queryFn: () => walletApi.withdrawals(0, 50), enabled: useUnlocked() });

// Savings is switched off for now.
// export const usePlans = () => useQuery({ queryKey: keys.plans, queryFn: savingsApi.plans, enabled: useUnlocked() });
//
// export const usePlan = (id: string) =>
//   useQuery({ queryKey: keys.plan(id), queryFn: () => savingsApi.plan(id), enabled: useUnlocked() && !!id });

export const useLoans = () => useQuery({ queryKey: keys.loans, queryFn: loansApi.loans, enabled: useUnlocked() });

export const useLoan = (id: string) =>
  useQuery({ queryKey: keys.loan(id), queryFn: () => loansApi.loan(id), enabled: useUnlocked() && !!id });

export const useEligibility = () =>
  useQuery({ queryKey: keys.eligibility, queryFn: loansApi.eligibility, enabled: useUnlocked() });

/**
 * The settings to price this customer's loan with: the loan-group terms for a
 * member of a loan group, the standard terms for everybody else. Until the
 * server has said which, the standard terms.
 */
export function useBorrowerSettings(): { settings: PublicSettings; groupPricing: boolean } {
  const s = useSettings();
  const e = useEligibility();
  if (!e.data?.terms) return { settings: s, groupPricing: false };
  return { settings: { ...s, lending: e.data.terms }, groupPricing: e.data.groupPricing };
}

export const useApplications = () =>
  useQuery({ queryKey: keys.applications, queryFn: loansApi.applications, enabled: useUnlocked() });

// Ajo circles are switched off for now.
// export const useCircles = () => useQuery({ queryKey: keys.circles, queryFn: circlesApi.circles, enabled: useUnlocked() });
//
// export const useCircle = (id: string) =>
//   useQuery({ queryKey: keys.circle(id), queryFn: () => circlesApi.circle(id), enabled: useUnlocked() && !!id });

export const useNotifications = () =>
  useQuery({ queryKey: keys.notifications, queryFn: () => notificationsApi.list(0, 100), enabled: useUnlocked() });

export const usePreferences = () =>
  useQuery({ queryKey: keys.preferences, queryFn: notificationsApi.preferences, enabled: useUnlocked() });

export const useOutstandingAgreements = () =>
  useQuery({ queryKey: keys.agreements, queryFn: meApi.outstandingAgreements, enabled: useUnlocked(), staleTime: 5 * 60_000 });

export const useSessions = () => useQuery({ queryKey: keys.sessions, queryFn: authApi.sessions, enabled: useUnlocked() });

export const useReviewSummary = () =>
  useQuery({ queryKey: keys.reviewSummary, queryFn: reviewsApi.summary, enabled: useUnlocked() });

export const useMyReview = () =>
  useQuery({ queryKey: keys.myReview, queryFn: async () => (await reviewsApi.mine()) ?? null, enabled: useUnlocked() });

export const usePaystackPayments = () =>
  useQuery({ queryKey: keys.paystack, queryFn: () => walletApi.paystackPayments(0, 50), enabled: useUnlocked() });

export const usePaystackEnabled = () =>
  useQuery({ queryKey: [...keys.paystack, 'enabled'], queryFn: walletApi.paystackEnabled, enabled: useUnlocked(), staleTime: 10 * 60_000 });

export const useMySignatures = () =>
  useQuery({ queryKey: keys.signatures, queryFn: meApi.signatures, enabled: useUnlocked() });

export const useClosure = () => useQuery({ queryKey: keys.closure, queryFn: meApi.closureEligibility, enabled: useUnlocked() });

// ── Reference data (open) ───────────────────────────────────────────────────

export const useLegalDocuments = () =>
  useQuery({ queryKey: keys.legal, queryFn: publicApi.legalAll, staleTime: 30 * 60_000 });

export const useLegalDocument = (kind: LegalKind) => {
  const all = useLegalDocuments();
  return { ...all, data: all.data?.[kind] };
};

export const useBanks = () =>
  useQuery({
    queryKey: keys.banks,
    queryFn: publicApi.banks,
    staleTime: 60 * 60_000,
    select: (banks) => banks.map((b) => b.name),
  });

// ── Admin ───────────────────────────────────────────────────────────────────

const useAdminEnabled = () => {
  const s = useSession();
  return s.stage === 'unlocked' && s.isAdmin;
};

export const useOverview = () =>
  useQuery({ queryKey: keys.admin.overview, queryFn: adminApi.overview, enabled: useAdminEnabled(), refetchInterval: 60_000 });

export const useAdminBook = () =>
  useQuery({ queryKey: keys.admin.book, queryFn: adminApi.book, enabled: useAdminEnabled(), refetchInterval: 60_000 });

export const useAdminMe = () => useQuery({ queryKey: keys.admin.me, queryFn: adminApi.me, enabled: useAdminEnabled() });

export const useCustomers = (query: string, status?: AccountStatus) =>
  useQuery({
    queryKey: keys.admin.customers(query, status),
    queryFn: () => adminApi.customers({ query: query || undefined, status, size: 100 }),
    enabled: useAdminEnabled(),
    placeholderData: (prev) => prev,
  });

export const useAdminPayIns = (status: DepositStatus | 'ALL') =>
  useQuery({ queryKey: keys.admin.payIns(status), queryFn: () => adminApi.payIns(status, 0, 100), enabled: useAdminEnabled() });

export const useAdminWithdrawals = (status: WithdrawalStatus | 'ALL') =>
  useQuery({
    queryKey: keys.admin.withdrawals(status),
    queryFn: () => adminApi.withdrawals(status, 0, 100),
    enabled: useAdminEnabled(),
  });

export const useAdminApplications = (status?: LoanApplicationStatus) =>
  useQuery({
    queryKey: keys.admin.applications(status ?? 'ALL'),
    queryFn: () => adminApi.loanApplications(status),
    enabled: useAdminEnabled(),
  });

export const useAdminLoans = (status?: LoanStatus) =>
  useQuery({ queryKey: keys.admin.loans(status ?? 'ALL'), queryFn: () => adminApi.loans(status), enabled: useAdminEnabled() });

export const useImportedLoans = () =>
  useQuery({ queryKey: keys.admin.imports, queryFn: () => adminApi.importedLoans(), enabled: useAdminEnabled() });

export const useImportedLoanFile = (id: string) =>
  useQuery({ queryKey: keys.admin.importFile(id), queryFn: () => adminApi.importedLoan(id), enabled: useAdminEnabled() && !!id });

export const useLoanRecords = (loanId?: string) =>
  useQuery({
    queryKey: keys.admin.loanRecords(loanId ?? ''),
    queryFn: () => adminApi.loanRecords(loanId!),
    enabled: useAdminEnabled() && !!loanId,
  });

export const useAdminPaystack = (status: PaystackStatus | 'ALL') =>
  useQuery({
    queryKey: keys.admin.paystack(status),
    queryFn: () => adminApi.paystackPayments(status === 'ALL' ? undefined : status, 0, 100),
    enabled: useAdminEnabled(),
  });

export const useTeam = () => useQuery({ queryKey: keys.admin.team, queryFn: adminApi.team, enabled: useAdminEnabled() });

export const useAdminSettings = () =>
  useQuery({ queryKey: keys.admin.settings, queryFn: adminApi.settings, enabled: useAdminEnabled() });

export const useAudit = (category: AuditCategory | 'ALL', query: string) =>
  useQuery({
    queryKey: keys.admin.audit(category, query),
    queryFn: () => adminApi.audit({ category: category === 'ALL' ? undefined : category, query: query || undefined, size: 200 }),
    enabled: useAdminEnabled(),
    placeholderData: (prev) => prev,
  });

export const useAdminRepayments = (filters: { page: number; query: string; source: RepaymentSource | 'ALL'; from: string; to: string }) =>
  useQuery({
    queryKey: keys.admin.repayments(filters),
    queryFn: () =>
      adminApi.repayments({
        page: filters.page,
        size: 50,
        query: filters.query || undefined,
        source: filters.source === 'ALL' ? undefined : filters.source,
        from: filters.from || undefined,
        to: filters.to || undefined,
      }),
    enabled: useAdminEnabled(),
    placeholderData: (prev) => prev,
  });

// ── Refreshing after a change ───────────────────────────────────────────────

/** After money moves, every figure that could have changed is refetched. */
export function useRefresh() {
  const qc = useQueryClient();
  const run = (...ks: QueryKey[]) => Promise.all(ks.map((k) => qc.invalidateQueries({ queryKey: k })));
  return {
    money: () => run(keys.dashboard, keys.wallet, ['transactions'], keys.notifications, keys.paystack, keys.withdrawals, keys.loans),
    // savings: () => run(keys.plans, keys.dashboard, keys.wallet, ['transactions'], keys.notifications),
    loans: () => run(keys.loans, keys.applications, keys.dashboard, keys.wallet, ['transactions'], keys.notifications),
    // circles: () => run(keys.circles, keys.dashboard, keys.wallet, ['transactions'], keys.notifications),
    claims: () => run(keys.claims, keys.dashboard),
    admin: () => run(keys.admin.root),
    all: () => qc.invalidateQueries(),
  };
}
