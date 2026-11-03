import { DEVICE_LABEL } from '../../config';
import { shrinkImage } from '../images';
import type {
  AdminApplicationDetail,
  AdminApplicationRow,
  AdminClaim,
  AdminLoanRow,
  AdminWithdrawal,
  AppNotification,
  AuditCategory,
  AuditRow,
  AutoFrequency,
  Bank,
  Circle,
  Claim,
  ClosureEligibility,
  ClosureResponse,
  CustomerDetail,
  CustomerRow,
  DashboardResponse,
  DepositPurpose,
  DepositStatus,
  DraftResponse,
  Eligibility,
  Guarantor,
  BvnMatch,
  ImportedLoan,
  ImportLoanInput,
  OfflineLoanFile,
  OfflineLoanUpdate,
  OfflineDocument,
  OfflineRepayment,
  RecordRepaymentInput,
  LoanRecords,
  CustomerLoanRecords,
  IssuedReference,
  LegalDocument,
  LegalKind,
  Loan,
  LoanApplication,
  LoanApplicationStatus,
  LoanQuote,
  ExportReport,
  ExportReportName,
  RepaymentFrequency,
  LoanStatus,
  NotificationPreference,
  NotifyKind,
  OtpPurpose,
  OtpResponse,
  OutstandingAgreement,
  Overview,
  PageResponse,
  PaymentInstruction,
  PaystackCheckout,
  PaystackPayment,
  AdminPaystackPayment,
  PaystackStatus,
  SignatureRecord,
  SupportConversation,
  SupportMessage,
  SupportThread,
  SupportQueueSummary,
  SupportKind,
  SupportStatus,
  OfficerOption,
  AssignedOfficer,
  MyOfficer,
  OfficerBorrower,
  LoanGroup,
  LoanGroupDetail,
  GroupLabel,
  Plan,
  PlatformSettings,
  Profile,
  PublicSettings,
  ReleaseResponse,
  RepaymentResponse,
  Review,
  ReviewSummary,
  RoleOption,
  RoundResponse,
  SessionResponse,
  SessionSummary,
  TeamMember,
  ThemeMode,
  Transaction,
  TxFilter,
  WalletResponse,
  Withdrawal,
  WithdrawalStatus,
  AccountStatus,
  AdminRole,
  RepaymentHistory,
  RepaymentSource,
} from '../../types/api';
import { http, newIdempotencyKey } from './client';
import { tokens } from './tokens';

/**
 * Every operation the website performs on the server, named the way the
 * product talks about it. Thin on purpose: paths, shapes, and which calls
 * move money (those mint a fresh idempotency key, once per operation).
 */

function storeSession(body: SessionResponse): SessionResponse {
  tokens.save(body.accessToken, body.refreshToken, body.expiresInSeconds ?? 900, body.sessionId);
  return body;
}

// ── Reference data (open) ───────────────────────────────────────────────────

export const publicApi = {
  settings: () => http.get<PublicSettings>('/settings/public'),
  banks: () => http.get<Bank[]>('/banks'),
  states: () => http.get<string[]>('/states'),
  legalAll: () => http.get<Record<string, LegalDocument>>('/legal'),
  legal: (kind: LegalKind) => http.get<LegalDocument>(`/legal/${kind}`),
};

// ── Sign-up: nine server steps, each validated as it is submitted ───────────

export const signupApi = {
  personal: (input: { fullName: string; email: string; phone: string; dateOfBirth: string; gender: string }) =>
    http.post<DraftResponse>('/auth/signup/personal', input, { authenticated: false }),
  resendEmail: (draftId: string) =>
    http.post<OtpResponse>(`/auth/signup/${draftId}/email/resend`, undefined, { authenticated: false }),
  verifyEmail: (draftId: string, code: string) =>
    http.post<DraftResponse>(`/auth/signup/${draftId}/email`, { code }, { authenticated: false }),
  identity: (draftId: string, input: { bvn: string; nin: string; address: string; state: string }) =>
    http.post<DraftResponse>(`/auth/signup/${draftId}/identity`, input, { authenticated: false }),
  payout: (draftId: string, input: { bank: string; accountNumber: string }) =>
    http.post<DraftResponse>(`/auth/signup/${draftId}/payout`, input, { authenticated: false }),
  password: (draftId: string, input: { password: string; securityQuestion: string; securityAnswer: string }) =>
    http.post<DraftResponse>(`/auth/signup/${draftId}/password`, input, { authenticated: false }),
  passcode: (draftId: string, passcode: string) =>
    http.post<DraftResponse>(
      `/auth/signup/${draftId}/passcode`,
      { passcode, confirmPasscode: passcode },
      { authenticated: false },
    ),
  pin: (draftId: string, pin: string) =>
    http.post<DraftResponse>(`/auth/signup/${draftId}/pin`, { pin, confirmPin: pin }, { authenticated: false }),
  progress: (draftId: string) => http.post<DraftResponse>(`/auth/signup/${draftId}`, undefined, { authenticated: false }),
  /**
   * Creates the account and signs in. The acceptance travels with this call
   * because the server records it against the account this call creates.
   * `signature` is sent for the server to keep once it has a field for it.
   */
  complete: async (
    draftId: string,
    acceptedVersions: Record<string, string>,
    signature?: { image: string; typedName: string; signedAt: string },
  ) =>
    storeSession(
      await http.post<SessionResponse>(
        `/auth/signup/${draftId}/complete`,
        { acceptedVersions, accepted: true, device: DEVICE_LABEL, ...(signature ? { signature } : {}) },
        { authenticated: false },
      ),
    ),
};

// ── Session and secrets ─────────────────────────────────────────────────────

export const authApi = {
  signIn: async (email: string, password: string) =>
    storeSession(
      await http.post<SessionResponse>('/auth/signin', { email, password, device: DEVICE_LABEL }, { authenticated: false }),
    ),
  /** Ends this session on the server, then locally — locally whatever the server says. */
  signOut: async () => {
    try {
      await http.post('/auth/signout');
    } catch {
      // deliberately ignored
    }
    tokens.clear();
  },
  signOutEverywhere: async () => {
    try {
      await http.post('/auth/signout/all');
    } finally {
      tokens.clear();
    }
  },
  sessions: () => http.get<SessionSummary[]>('/auth/sessions'),
  endSession: (id: string) => http.delete<void>(`/auth/sessions/${id}`),
  verifyPasscode: (passcode: string) => http.post<Record<string, unknown>>('/auth/passcode/verify', { passcode }),
  verifyPin: (pin: string) => http.post<Record<string, unknown>>('/auth/pin/verify', { pin }),
  changePasscode: (currentPasscode: string, newPasscode: string) =>
    http.patch<void>('/auth/passcode', { currentPasscode, newPasscode }),
  changePin: (currentPin: string, newPin: string) => http.patch<void>('/auth/pin', { currentPin, newPin }),
  changePassword: (currentPassword: string, newPassword: string) =>
    http.patch<void>('/auth/password', { currentPassword, newPassword }),
  forgotPassword: (email: string) =>
    http.post<Record<string, string>>('/auth/password/forgot', { email }, { authenticated: false }),
  resetPassword: (email: string, code: string, newPassword: string) =>
    http.post<Record<string, string>>('/auth/password/reset', { email, code, newPassword }, { authenticated: false }),
  sendOtp: (email: string, purpose: OtpPurpose) =>
    http.post<OtpResponse>('/auth/otp/send', { email, purpose }, { authenticated: false }),
};

// ── The customer ────────────────────────────────────────────────────────────

export const meApi = {
  profile: () => http.get<Profile>('/me'),
  dashboard: () => http.get<DashboardResponse>('/me/dashboard'),
  update: (input: {
    phone?: string;
    address?: string;
    state?: string;
    themeMode?: ThemeMode;
    hideBalance?: boolean;
    autoDebit?: boolean;
  }) => http.patch<Profile>('/me', input),
  payoutCode: () => http.post<OtpResponse>('/me/payout/code'),
  changePayout: (input: { bank: string; accountNumber: string; code: string; pin: string }) =>
    http.patch<Profile>('/me/payout', input),
  outstandingAgreements: () => http.get<OutstandingAgreement[]>('/me/legal/outstanding'),
  acceptAgreement: (document: string, version: string) =>
    http.post<Record<string, string>>('/me/legal/accept', { document, version }),
  acceptances: () => http.get<Record<string, string>[]>('/me/legal/acceptances'),
  closureEligibility: () => http.get<ClosureEligibility>('/me/closure'),
  closureCode: () => http.post<OtpResponse>('/me/closure/code'),
  closeAccount: (code: string, password: string, reason: string) =>
    http.delete<ClosureResponse>('/account', { code, password, reason }),
  signatures: () => http.get<SignatureRecord[]>('/me/legal/signatures'),
  dataExport: () => http.get<Record<string, unknown>>('/me/data-export'),
};

// ── Wallet, money in, money out ─────────────────────────────────────────────

export const walletApi = {
  wallet: () => http.get<WalletResponse>('/wallet'),
  transactions: (page = 0, size = 50, filter: TxFilter = 'ALL') =>
    http.get<PageResponse<Transaction>>('/transactions', { page, size, filter }),
  transaction: (id: string) => http.get<Transaction>(`/transactions/${id}`),

  /** The reference on screen. Asking twice gives the same one. */
  paymentReference: () => http.get<PaymentInstruction>('/payins/reference'),
  /** Records that the reference was copied, and returns the next one. */
  referenceCopied: () => http.post<PaymentInstruction>('/payins/reference/copied'),
  /** Claims a transfer already sent, with the receipt. Moves no money. */
  submitClaim: (input: {
    amount: number;
    reference: string;
    senderName: string;
    senderBank?: string;
    purpose: DepositPurpose;
    loanId?: string;
    receipt: File;
  }) => {
    const form = new FormData();
    form.set('amount', String(input.amount));
    form.set('reference', input.reference);
    form.set('senderName', input.senderName);
    if (input.senderBank) form.set('senderBank', input.senderBank);
    form.set('purpose', input.purpose);
    if (input.loanId) form.set('loanId', input.loanId);
    form.set('receipt', input.receipt, input.receipt.name);
    return http.upload<Claim>('/payins', form, newIdempotencyKey());
  },
  claims: (page = 0, size = 25) => http.get<PageResponse<Claim>>('/payins', { page, size }),

  /** Debits the wallet at once and queues the payout for an admin. */
  requestWithdrawal: (input: { amount: number; pin: string; bank: string; accountNumber: string }) =>
    http.post<Withdrawal>('/withdrawals', input, { idempotencyKey: newIdempotencyKey() }),
  withdrawals: (page = 0, size = 25) => http.get<PageResponse<Withdrawal>>('/withdrawals', { page, size }),

  /** Paystack: whether paying in is switched on for this deployment. */
  paystackEnabled: () => http.get<{ enabled: boolean }>('/payins/paystack/enabled'),
  /** Opens a checkout; send the browser to authorizationUrl. Moves no money. */
  startPaystack: (input: { amount: number; purpose: DepositPurpose; loanId?: string; callbackUrl?: string }) =>
    http.post<PaystackCheckout>('/payins/paystack', input, { idempotencyKey: newIdempotencyKey() }),
  /** Back from checkout: the server verifies with Paystack and credits once. */
  confirmPaystack: (reference: string) =>
    http.get<PaystackPayment>(`/payins/paystack/${encodeURIComponent(reference)}`),
  paystackPayments: (page = 0, size = 25) =>
    http.get<PageResponse<PaystackPayment>>('/payins/paystack', { page, size }),
};

// ── Savings ─────────────────────────────────────────────────────────────────

export const savingsApi = {
  plans: () => http.get<Plan[]>('/savings/plans'),
  plan: (id: string) => http.get<Plan>(`/savings/plans/${id}`),
  createFixed: (input: { title: string; principal: number; days: number; emoji: string; pin: string }) =>
    http.post<Plan>('/savings/plans/fixed', input, { idempotencyKey: newIdempotencyKey() }),
  createTarget: (input: {
    title: string;
    goal: number;
    frequency: AutoFrequency;
    months: number;
    emoji: string;
    pin: string;
  }) => http.post<Plan>('/savings/plans/target', input, { idempotencyKey: newIdempotencyKey() }),
  topUp: (id: string, amount: number, pin: string) =>
    http.post<Plan>(`/savings/plans/${id}/topup`, { amount, pin }, { idempotencyKey: newIdempotencyKey() }),
  withdraw: (id: string, pin: string) =>
    http.post<ReleaseResponse>(`/savings/plans/${id}/withdraw`, { pin }, { idempotencyKey: newIdempotencyKey() }),
  breakPlan: (id: string, pin: string) =>
    http.post<ReleaseResponse>(`/savings/plans/${id}/break`, { pin }, { idempotencyKey: newIdempotencyKey() }),
  autoSave: (id: string, enabled: boolean) => http.patch<Plan>(`/savings/plans/${id}/autosave`, { enabled }),
};

// ── Lending ─────────────────────────────────────────────────────────────────

export const loansApi = {
  loans: () => http.get<Loan[]>('/loans'),
  loan: (id: string) => http.get<Loan>(`/loans/${id}`),
  eligibility: () => http.get<Eligibility>('/loans/eligibility'),
  quote: (amount: number, months: number, frequency: RepaymentFrequency = 'MONTHLY') =>
    http.get<LoanQuote>('/loans/quote', { amount, months, frequency }),
  /**
   * Five files and a form in one request. Nothing is credited by this call.
   * Photos are shrunk first: full-size camera files ran the server out of memory.
   */
  apply: async (input: {
    amount: number;
    months: number;
    repaymentFrequency: RepaymentFrequency;
    purpose: string;
    businessName: string;
    businessAddress: string;
    monthlyIncome: number;
    guarantors: Guarantor[];
    statementPassword?: string;
    pin: string;
    bankStatement: File;
    selfie: File;
    businessPhotos: File[];
  }) => {
    const form = new FormData();
    const { bankStatement, selfie, businessPhotos, statementPassword, ...rest } = input;
    const payload = { ...rest, ...(statementPassword?.trim() ? { statementPassword: statementPassword.trim() } : {}) };
    form.set('form', new Blob([JSON.stringify(payload)], { type: 'application/json' }), 'form.json');
    const [statementFile, selfieFile, photoFiles] = await Promise.all([
      shrinkImage(bankStatement),
      shrinkImage(selfie),
      Promise.all(businessPhotos.map(shrinkImage)),
    ]);
    form.append('bankStatement', statementFile, statementFile.name);
    form.append('selfie', selfieFile, selfieFile.name);
    for (const photo of photoFiles) form.append('businessPhotos', photo, photo.name);
    return http.upload<LoanApplication>('/loans/applications', form, newIdempotencyKey());
  },
  applications: () => http.get<LoanApplication[]>('/loans/applications'),
  withdrawApplication: (id: string) => http.post<LoanApplication>(`/loans/applications/${id}/withdraw`),
  agreeToTerms: (id: string, pin: string) => http.post<LoanApplication>(`/loans/applications/${id}/agree`, { pin }),
  turnDownTerms: (id: string) => http.post<LoanApplication>(`/loans/applications/${id}/turn-down`),
  repay: (id: string, amount: number, pin: string) =>
    http.post<RepaymentResponse>(`/loans/${id}/repay`, { amount, pin }, { idempotencyKey: newIdempotencyKey() }),
  settle: (id: string, pin: string) =>
    http.post<RepaymentResponse>(`/loans/${id}/settle`, { pin }, { idempotencyKey: newIdempotencyKey() }),
};

// ── Ajo circles ─────────────────────────────────────────────────────────────

export const circlesApi = {
  circles: () => http.get<Circle[]>('/circles'),
  circle: (id: string) => http.get<Circle>(`/circles/${id}`),
  create: (input: {
    name: string;
    contribution: number;
    frequency: AutoFrequency;
    memberRefs: string[];
    emoji: string;
    pin: string;
  }) => http.post<Circle>('/circles', input, { idempotencyKey: newIdempotencyKey() }),
  join: (inviteCode: string) => http.post<Circle>('/circles/join', { inviteCode }),
  contribute: (id: string, pin: string) =>
    http.post<Circle>(`/circles/${id}/contribute`, { pin }, { idempotencyKey: newIdempotencyKey() }),
  collect: (id: string, pin: string) =>
    http.post<RoundResponse>(`/circles/${id}/payout`, { pin }, { idempotencyKey: newIdempotencyKey() }),
  leave: (id: string) => http.post<void>(`/circles/${id}/leave`),
};

// ── Notifications and reviews ───────────────────────────────────────────────

export const notificationsApi = {
  list: (page = 0, size = 50) => http.get<PageResponse<AppNotification>>('/notifications', { page, size }),
  unreadCount: () => http.get<{ count: number }>('/notifications/unread-count'),
  markRead: () => http.post<Record<string, number>>('/notifications/read'),
  clear: () => http.delete<Record<string, number>>('/notifications'),
  preferences: () => http.get<NotificationPreference[]>('/notifications/preferences'),
  setPreference: (kind: NotifyKind, enabled: boolean) =>
    http.patch<NotificationPreference[]>('/notifications/preferences', { kind, enabled }),
};

export const reviewsApi = {
  list: (page = 0, size = 20) => http.get<PageResponse<Review>>('/reviews', { page, size }),
  summary: () => http.get<ReviewSummary>('/reviews/summary'),
  /** The caller's own review, or undefined (204) when there is none. */
  mine: () => http.get<Review | undefined>('/reviews/mine'),
  submit: (rating: number, comment: string) => http.put<Review>('/reviews/mine', { rating, comment }),
  withdraw: () => http.delete<Record<string, boolean>>('/reviews/mine'),
};

// ── Help and complaints ─────────────────────────────────────────────────────

function attachmentForm(file: File, body?: string): FormData {
  const form = new FormData();
  form.set('file', file, file.name || 'photo.png');
  if (body?.trim()) form.set('body', body.trim());
  return form;
}

export const supportApi = {
  topics: () => http.get<{ categories: string[] }>('/support/topics'),
  conversations: () => http.get<SupportConversation[]>('/support/conversations'),
  unread: () => http.get<{ unread: number }>('/support/unread'),
  open: (input: { kind: SupportKind; category: string; subject: string; message: string }) =>
    http.post<SupportThread>('/support/conversations', input),
  thread: (id: string) => http.get<SupportThread>(`/support/conversations/${id}`),
  send: (id: string, body: string) => http.post<SupportMessage>(`/support/conversations/${id}/messages`, { body }),
  /** A photo or document, with an optional message. */
  attach: (id: string, file: File, body?: string) =>
    http.upload<SupportMessage>(`/support/conversations/${id}/attachments`, attachmentForm(file, body)),
  resolve: (id: string) => http.post<SupportConversation>(`/support/conversations/${id}/resolve`),
  typing: (id: string) => http.post<void>(`/support/conversations/${id}/typing`),
};

export const adminSupportApi = {
  summary: () => http.get<SupportQueueSummary>('/admin/support/summary'),
  queue: (input: {
    status?: SupportStatus;
    kind?: SupportKind;
    customerId?: string;
    query?: string;
    page?: number;
    size?: number;
  }) => http.get<PageResponse<SupportConversation>>('/admin/support/conversations', { page: 0, size: 100, ...input }),
  thread: (id: string) => http.get<SupportThread>(`/admin/support/conversations/${id}`),
  send: (id: string, body: string) => http.post<SupportMessage>(`/admin/support/conversations/${id}/messages`, { body }),
  attach: (id: string, file: File, body?: string) =>
    http.upload<SupportMessage>(`/admin/support/conversations/${id}/attachments`, attachmentForm(file, body)),
  assign: (id: string) => http.post<SupportConversation>(`/admin/support/conversations/${id}/assign`),
  resolve: (id: string, note?: string) =>
    http.post<SupportConversation>(`/admin/support/conversations/${id}/resolve`, note ? { note } : {}),
  reopen: (id: string) => http.post<SupportConversation>(`/admin/support/conversations/${id}/reopen`),
  typing: (id: string) => http.post<void>(`/admin/support/conversations/${id}/typing`),
};

// ── Loan officers ───────────────────────────────────────────────────────────

export const officersApi = {
  mine: () => http.get<MyOfficer[]>('/me/officers'),
  options: () => http.get<OfficerOption[]>('/admin/officers'),
  book: (officerId: string) => http.get<OfficerBorrower[]>(`/admin/officers/${officerId}/borrowers`),
  forCustomer: (customerId: string) => http.get<AssignedOfficer[]>(`/admin/customers/${customerId}/officers`),
  assignToCustomer: (customerId: string, officerIds: string[], lead = false) =>
    http.post<AssignedOfficer[]>(`/admin/customers/${customerId}/officers`, { officerIds, lead }),
  forImport: (importId: string) => http.get<AssignedOfficer[]>(`/admin/loans/imports/${importId}/officers`),
  assignToImport: (importId: string, officerIds: string[], lead = false) =>
    http.post<AssignedOfficer[]>(`/admin/loans/imports/${importId}/officers`, { officerIds, lead }),
  makeLead: (assignmentId: string) => http.post<void>(`/admin/officers/assignments/${assignmentId}/lead`),
  remove: (assignmentId: string) => http.delete<void>(`/admin/officers/assignments/${assignmentId}`),
};

// ── Loan groups ─────────────────────────────────────────────────────────────

export const groupsApi = {
  list: () => http.get<LoanGroup[]>('/admin/groups'),
  nextNumber: () => http.get<{ number: number }>('/admin/groups/next-number'),
  /** Who is in which group, for labelling the customers list. */
  labels: () => http.get<GroupLabel[]>('/admin/groups/labels'),
  create: (input: { number?: number; name: string; area?: string; description?: string; officerId: string }) =>
    http.post<LoanGroupDetail>('/admin/groups', input),
  detail: (id: string) => http.get<LoanGroupDetail>(`/admin/groups/${id}`),
  update: (id: string, input: { name?: string; area?: string; description?: string; officerId?: string; active?: boolean }) =>
    http.patch<LoanGroupDetail>(`/admin/groups/${id}`, input),
  addCustomer: (id: string, customerRef: string) => http.post<LoanGroupDetail>(`/admin/groups/${id}/customers`, { customerRef }),
  removeMember: (id: string, memberId: string) => http.delete<LoanGroupDetail>(`/admin/groups/${id}/members/${memberId}`),
  forCustomer: (customerId: string) => http.get<LoanGroup[]>(`/admin/customers/${customerId}/groups`),
};

// ── The admin panel ─────────────────────────────────────────────────────────

export const adminApi = {
  overview: () => http.get<Overview>('/admin/overview'),
  /** A report for Excel or PDF. Owners and administrators only; logged. */
  exportReport: (name: ExportReportName, from?: string, to?: string) =>
    http.get<ExportReport>(`/admin/exports/${name}`, { from, to }),
  me: () => http.get<TeamMember>('/admin/team/me'),
  repayments: (input: { page?: number; size?: number; query?: string; source?: RepaymentSource; from?: string; to?: string }) =>
    http.get<RepaymentHistory>('/admin/repayments', { page: 0, size: 50, ...input }),

  audit: (input: { page?: number; size?: number; category?: AuditCategory; query?: string }) =>
    http.get<PageResponse<AuditRow>>('/admin/audit', { page: 0, size: 100, ...input }),

  customers: (input: { page?: number; size?: number; query?: string; status?: AccountStatus }) =>
    http.get<PageResponse<CustomerRow>>('/admin/customers', { page: 0, size: 25, ...input }),
  customer: (id: string) => http.get<CustomerDetail>(`/admin/customers/${id}`),
  customerTransactions: (id: string, filter: TxFilter = 'ALL', page = 0, size = 100) =>
    http.get<PageResponse<Transaction>>(`/admin/customers/${id}/transactions`, { filter, page, size }),
  customerPayIns: (id: string) => http.get<PageResponse<AdminClaim>>(`/admin/customers/${id}/payins`, { size: 50 }),
  customerWithdrawals: (id: string) =>
    http.get<PageResponse<AdminWithdrawal>>(`/admin/customers/${id}/withdrawals`, { size: 50 }),
  customerPlans: (id: string) => http.get<Plan[]>(`/admin/customers/${id}/plans`),
  customerLoans: (id: string) => http.get<Loan[]>(`/admin/customers/${id}/loans`),
  /** The full BVN and NIN; the server logs every call as a data access. */
  customerIdentityNumbers: (id: string) => http.get<{ bvn?: string; nin?: string }>(`/admin/customers/${id}/identity-numbers`),
  customerSignatures: (id: string) => http.get<SignatureRecord[]>(`/admin/customers/${id}/signatures`),
  customerLoanRecords: (id: string) => http.get<CustomerLoanRecords>(`/admin/customers/${id}/loan-records`),
  paystackPayments: (status?: PaystackStatus, page = 0, size = 50, customerId?: string) =>
    http.get<PageResponse<AdminPaystackPayment>>('/admin/payins/paystack', { status, page, size, customerId }),
  customerReferences: (id: string) => http.get<IssuedReference[]>(`/admin/customers/${id}/references`),
  setCustomerStatus: (id: string, status: AccountStatus, reason: string) =>
    http.post<CustomerDetail>(`/admin/customers/${id}/status`, { status, reason }),
  flagCustomer: (id: string, reason: string) => http.post<CustomerDetail>(`/admin/customers/${id}/flag`, { reason }),

  payIns: (status: DepositStatus | 'ALL', page = 0, size = 25, query?: string) =>
    http.get<PageResponse<AdminClaim>>('/admin/payins', { status: status === 'ALL' ? undefined : status, page, size, query }),
  receiptUrl: (claimId: string) => http.post<Record<string, string>>(`/admin/payins/${claimId}/receipt`),
  confirmPayIn: (claimId: string, note?: string) =>
    http.post<AdminClaim>(`/admin/payins/${claimId}/confirm`, note ? { note } : {}, {
      idempotencyKey: newIdempotencyKey(),
    }),
  rejectPayIn: (claimId: string, note: string) => http.post<AdminClaim>(`/admin/payins/${claimId}/reject`, { note }),

  withdrawals: (status: WithdrawalStatus | 'ALL', page = 0, size = 25, query?: string) =>
    http.get<PageResponse<AdminWithdrawal>>('/admin/withdrawals', {
      status: status === 'ALL' ? undefined : status,
      page,
      size,
      query,
    }),
  approveWithdrawal: (id: string, payoutReference?: string, note?: string, paidByHand?: boolean) =>
    http.post<AdminWithdrawal>(
      `/admin/withdrawals/${id}/approve`,
      { ...(payoutReference ? { payoutReference } : {}), ...(note ? { note } : {}), ...(paidByHand ? { paidByHand } : {}) },
      { idempotencyKey: newIdempotencyKey() },
    ),
  declineWithdrawal: (id: string, reason: string) =>
    http.post<AdminWithdrawal>(`/admin/withdrawals/${id}/decline`, { reason }, { idempotencyKey: newIdempotencyKey() }),

  loanApplications: (status?: LoanApplicationStatus, page = 0, size = 50) =>
    http.get<PageResponse<AdminApplicationRow>>('/admin/loan-applications', { status, page, size }),
  loanApplication: (id: string) => http.get<AdminApplicationDetail>(`/admin/loan-applications/${id}`),
  approveApplication: (id: string, note?: string) =>
    http.post<AdminApplicationDetail>(`/admin/loan-applications/${id}/approve`, note ? { note } : {}),
  /** Rates are percentages, as typed: 30 for 30%. */
  offerApplicationTerms: (
    id: string,
    terms: { months: number; interestRatePct: number; managementFee: number; transactionFeePct: number; note?: string },
  ) => http.post<AdminApplicationDetail>(`/admin/loan-applications/${id}/offer`, terms),
  rejectApplication: (id: string, reason: string) =>
    http.post<AdminApplicationDetail>(`/admin/loan-applications/${id}/reject`, { reason }),

  loans: (status?: LoanStatus, page = 0, size = 100) =>
    http.get<PageResponse<AdminLoanRow>>('/admin/loans', { status, page, size }),
  remindBorrower: (loanId: string, note?: string) =>
    http.post<Loan>(`/admin/loans/${loanId}/remind`, note ? { note } : {}),
  writeOffLoan: (loanId: string, reason: string) => http.post<Loan>(`/admin/loans/${loanId}/writeoff`, { reason }),

  /** Loans written outside the app, waiting for (or attached to) their borrower's account. */
  importedLoans: (claimed?: boolean) => http.get<ImportedLoan[]>('/admin/loans/imports', { claimed }),
  importLoan: (input: ImportLoanInput) => http.post<ImportedLoan>('/admin/loans/imports', input),
  lookupBvn: (bvn: string) => http.get<BvnMatch>('/admin/loans/imports/lookup', { bvn }),
  /** Takes back a repayment recorded by mistake; a loan it had closed runs again. */
  removeRecordedRepayment: (repaymentId: string) => http.delete<void>(`/admin/loans/imports/repayments/${repaymentId}`),
  importedLoan: (id: string) => http.get<OfflineLoanFile>(`/admin/loans/imports/${id}`),
  updateImportedLoan: (id: string, input: OfflineLoanUpdate) =>
    http.patch<OfflineLoanFile>(`/admin/loans/imports/${id}`, input),
  attachToImport: (id: string, file: File, label: string) => {
    const form = new FormData();
    form.set('file', file, file.name);
    form.set('label', label);
    return http.upload<OfflineDocument>(`/admin/loans/imports/${id}/documents`, form);
  },
  removeDocument: (documentId: string) => http.delete<void>(`/admin/loans/imports/documents/${documentId}`),
  recordOnImport: (id: string, input: RecordRepaymentInput) =>
    http.post<OfflineRepayment>(`/admin/loans/imports/${id}/repayments`, input, {
      idempotencyKey: newIdempotencyKey(),
    }),
  /** Loans already on an account: a repayment taken by hand, or a document added. */
  recordOnLoan: (loanId: string, input: RecordRepaymentInput) =>
    http.post<OfflineRepayment>(`/admin/loans/${loanId}/repayments`, input, { idempotencyKey: newIdempotencyKey() }),
  loanRecords: (loanId: string) => http.get<LoanRecords>(`/admin/loans/${loanId}/records`),
  attachToLoan: (loanId: string, file: File, label: string) => {
    const form = new FormData();
    form.set('file', file, file.name);
    form.set('label', label);
    return http.upload<OfflineDocument>(`/admin/loans/${loanId}/documents`, form);
  },
  deleteImportedLoan: (id: string) => http.delete<Record<string, boolean>>(`/admin/loans/imports/${id}`),

  team: () => http.get<TeamMember[]>('/admin/team'),
  roles: () => http.get<RoleOption[]>('/admin/team/roles'),
  grant: (email: string, role: AdminRole) => http.post<TeamMember>('/admin/team', { email, role }),
  changeRole: (id: string, role: AdminRole) => http.patch<TeamMember>(`/admin/team/${id}/role`, { role }),
  setActive: (id: string, active: boolean, reason?: string) =>
    http.patch<TeamMember>(`/admin/team/${id}/active`, { active, ...(reason ? { reason } : {}) }),
  revoke: (id: string) => http.delete<void>(`/admin/team/${id}`),

  settings: () => http.get<PlatformSettings>('/admin/settings'),
  saveSettings: (expectedVersion: number, settings: PlatformSettings) =>
    http.put<PlatformSettings>('/admin/settings', { expectedVersion, settings }),

  removeReview: (id: string, reason: string) => http.delete<Record<string, boolean>>(`/admin/reviews/${id}`, { reason }),
  announce: (title: string, body: string) => http.post<{ devices: number }>('/admin/announcements', { title, body }),
};
