import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  AtSign,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Hash,
  Home,
  KeyRound,
  Landmark,
  Lock,
  MailCheck,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, DetailRows } from '../../../components/ui/Card';
import { ChoiceTiles, Notice, Pill } from '../../../components/ui/Bits';
import { Input, Select } from '../../../components/ui/Field';
import { NumericKeypad, OtpInput, PasscodeDots } from '../../../components/ui/PinPad';
import { useToast } from '../../../components/ui/Toast';
import { PasswordStrength } from '../../../components/PasswordStrength';
import { PASSCODE_LENGTH, PIN_LENGTH } from '../../../config';
import { useBanks } from '../../../hooks/queries';
import { signupApi } from '../../../lib/api/endpoints';
import { ApiError, describeError } from '../../../lib/api/errors';
import { asDay, maskEmail } from '../../../lib/format';
import { GENDERS, NIGERIAN_STATES, normalisePhone, SECURITY_QUESTIONS, validators } from '../../../lib/validators';
import { useSettings } from '../../../state/settings';
import type { StepProps } from './Signup';

export function StepFrame({
  headline,
  subhead,
  children,
  action,
  onSubmit,
}: {
  headline: ReactNode;
  subhead?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  onSubmit?: (e: FormEvent) => void;
}) {
  const body = (
    <>
      <h1 className="text-[30px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[34px]">{headline}</h1>
      {subhead && <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-2">{subhead}</p>}
      <div className="mt-8 space-y-5">{children}</div>
      {action && <div className="mt-8">{action}</div>}
    </>
  );
  return onSubmit ? (
    <form onSubmit={onSubmit} noValidate className="max-w-xl">
      {body}
    </form>
  ) : (
    <div className="max-w-2xl">{body}</div>
  );
}

/** Calls the server; returns its message on refusal so the step can show it. */
async function attempt(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run();
    return null;
  } catch (e) {
    return describeError(e);
  }
}

// ── 1. Personal details ─────────────────────────────────────────────────────

export function PersonalStep({ draft, update, next }: StepProps) {
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const maxDob = new Date();
  maxDob.setFullYear(maxDob.getFullYear() - 18);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = {
      fullName: validators.fullName(draft.fullName),
      email: validators.email(draft.email),
      phone: validators.phone(draft.phone),
      dateOfBirth: validators.dateOfBirth(draft.dateOfBirth),
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    const gender = draft.gender || GENDERS[GENDERS.length - 1]!;
    setBusy(true);
    setError(null);
    try {
      const res = await signupApi.personal({
        fullName: draft.fullName.trim().replace(/\s+/g, ' '),
        email: draft.email.trim().toLowerCase(),
        phone: normalisePhone(draft.phone),
        dateOfBirth: draft.dateOfBirth,
        gender,
      });
      update({ draftId: res.draftId, gender, email: draft.email.trim().toLowerCase() });
      next();
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) setErrors((x) => ({ ...x, ...err.fieldErrors }));
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <StepFrame
      headline="Let us start with you"
      subhead="Use your name exactly as it appears on your BVN."
      onSubmit={submit}
      action={
        <Button type="submit" size="lg" block loading={busy}>
          Continue
        </Button>
      }
    >
      <Input label="Full name" placeholder="Exactly as it appears on your BVN" icon={<UserRound />} autoComplete="name" value={draft.fullName} onChange={(e) => update({ fullName: e.target.value })} error={errors.fullName} autoFocus />
      <Input label="Email address" type="email" placeholder="you@example.com" icon={<AtSign />} autoComplete="email" hint="We will send a 6-digit code here" value={draft.email} onChange={(e) => update({ email: e.target.value })} error={errors.email} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Phone number" inputMode="numeric" placeholder="08031234567" icon={<Phone />} autoComplete="tel" maxLength={11} hint="How we reach you about your money" value={draft.phone} onChange={(e) => update({ phone: e.target.value.replace(/\D/g, '') })} error={errors.phone} />
        <Input label="Date of birth" type="date" icon={<CalendarDays />} max={maxDob.toISOString().slice(0, 10)} hint="You must be 18 or older" value={draft.dateOfBirth} onChange={(e) => update({ dateOfBirth: e.target.value })} error={errors.dateOfBirth} />
      </div>
      <div>
        <p className="mb-2 text-[13px] font-semibold text-ink-2">Gender</p>
        <ChoiceTiles value={draft.gender} onChange={(g) => update({ gender: g })} options={GENDERS.map((g) => ({ value: g, label: g }))} />
      </div>
      <Notice tone="neutral" icon={<ShieldCheck />}>
        We ask for this to confirm who you are, as the law requires. Your details are never sold, and never shared for anybody else's marketing.
      </Notice>
      {error && <Notice tone="danger">{error}</Notice>}
    </StepFrame>
  );
}

// ── 2. Email code ───────────────────────────────────────────────────────────

export function EmailStep({ draft, next }: StepProps) {
  const settings = useSettings();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(settings.security.otpResendSeconds);

  useEffect(() => {
    if (left <= 0) return;
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);

  const verify = async (value = code) => {
    if (value.length !== 6 || !draft.draftId || busy) return;
    setBusy(true);
    setError(null);
    const problem = await attempt(() => signupApi.verifyEmail(draft.draftId!, value));
    setBusy(false);
    if (problem) {
      setError(problem);
      setCode('');
    } else next();
  };

  const resend = async () => {
    if (!draft.draftId) return;
    setError(null);
    try {
      const res = await signupApi.resendEmail(draft.draftId);
      setLeft(res.resendAfterSeconds || settings.security.otpResendSeconds);
      setCode('');
      toast.success(`A new code is on its way to ${draft.email}`);
    } catch (e) {
      setError(describeError(e));
    }
  };

  return (
    <StepFrame
      headline="Check your inbox"
      subhead={`We sent a 6-digit code to ${maskEmail(draft.email)}. It expires in 10 minutes.`}
      action={
        <Button size="lg" block loading={busy} disabled={code.length !== 6} onClick={() => verify()}>
          Verify and continue
        </Button>
      }
    >
      <div className="flex justify-center py-2">
        <span className="grid h-16 w-16 place-items-center rounded-2xl border border-gold/25 bg-gold/10 text-gold">
          <MailCheck className="h-8 w-8" />
        </span>
      </div>
      <OtpInput value={code} onChange={(v) => { setCode(v); setError(null); }} onComplete={verify} error={!!error} />
      {error && <p className="text-center text-[13px] font-semibold text-danger">{error}</p>}
      <div className="text-center">
        {left > 0 ? (
          <p className="text-[13px] text-ink-3">Resend code in {left}s</p>
        ) : (
          <Button variant="subtle" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={resend}>
            Resend code
          </Button>
        )}
      </div>
      <p className="text-center text-[12.5px] text-ink-3">Not there? Check your spam or promotions folder.</p>
    </StepFrame>
  );
}

// ── 3. Identity ─────────────────────────────────────────────────────────────

export function IdentityStep({ draft, update, next }: StepProps) {
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const masked = draft.bvn.startsWith('•');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = {
      bvn: validators.bvn(draft.bvn),
      nin: validators.nin(draft.nin),
      address: validators.address(draft.address),
      state: draft.state ? null : 'Select your state',
    };
    setErrors(found);
    if (Object.values(found).some(Boolean) || !draft.draftId) return;
    setBusy(true);
    setError(null);
    const problem = await attempt(() =>
      signupApi.identity(draft.draftId!, {
        bvn: draft.bvn.trim(),
        nin: draft.nin.trim(),
        address: draft.address.trim(),
        state: draft.state,
      }),
    );
    setBusy(false);
    if (problem) setError(problem);
    else setVerified(true);
  };

  if (verified) {
    return (
      <StepFrame
        headline="Identity details saved"
        subhead="Your BVN and NIN are on your account. Check them below — they must be your own."
        action={
          <Button size="lg" block onClick={next}>
            Continue
          </Button>
        }
      >
        <div className="flex justify-center py-2">
          <span className="grid h-20 w-20 animate-pop-in place-items-center rounded-full bg-success text-white shadow-[0_18px_40px_-14px_rgb(var(--success)/0.7)]">
            <BadgeCheck className="h-10 w-10" />
          </span>
        </div>
        <Card accent="success" gradient>
          <DetailRows
            rows={[
              ['Name', draft.fullName],
              ['BVN', `${draft.bvn.slice(0, 3)}*****${draft.bvn.slice(8)}`],
              ['NIN', `${draft.nin.slice(0, 3)}*****${draft.nin.slice(8)}`],
              ['State', draft.state],
            ]}
          />
        </Card>
        <div className="flex flex-wrap gap-2">
          <Pill tone="success" icon={<ShieldCheck />}>Details saved</Pill>
          <Pill tone="gold" icon={<Lock />}>Lending unlocked</Pill>
        </div>
      </StepFrame>
    );
  }

  return (
    <StepFrame
      headline="Your identity details"
      subhead="Nigerian law requires your BVN and NIN to open an account. Give your own — using somebody else's is fraud."
      onSubmit={submit}
      action={
        <Button type="submit" size="lg" block loading={busy}>
          {busy ? 'Saving…' : 'Continue'}
        </Button>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Bank Verification Number (BVN)"
          inputMode="numeric"
          maxLength={11}
          placeholder="11 digits"
          icon={<Landmark />}
          hint="Dial *565*0# on your registered line to get it"
          value={masked ? '' : draft.bvn}
          onChange={(e) => update({ bvn: e.target.value.replace(/\D/g, '') })}
          error={errors.bvn}
          autoFocus
        />
        <Input
          label="National Identity Number (NIN)"
          inputMode="numeric"
          maxLength={11}
          placeholder="11 digits"
          icon={<Hash />}
          value={draft.nin.startsWith('•') ? '' : draft.nin}
          onChange={(e) => update({ nin: e.target.value.replace(/\D/g, '') })}
          error={errors.nin}
        />
      </div>
      <Input label="Residential address" placeholder="Street, area and city" icon={<Home />} autoComplete="street-address" value={draft.address} onChange={(e) => update({ address: e.target.value })} error={errors.address} />
      <Select label="State of residence" icon={<MapPin />} placeholder="Select your state" options={NIGERIAN_STATES} value={draft.state} onChange={(e) => update({ state: e.target.value })} error={errors.state} />
      <Notice tone="info" icon={<ShieldCheck />}>
        Your BVN and NIN are kept private and shown back to you only in part. Kudi9ja can never move money in your bank accounts.
      </Notice>
      {error && <Notice tone="danger">{error}</Notice>}
    </StepFrame>
  );
}

// ── 4. Payout account ───────────────────────────────────────────────────────

export function PayoutStep({ draft, update, next }: StepProps) {
  const banks = useBanks();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ready = !!draft.payoutBank && draft.payoutAccountNumber.length === 10;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ready || !draft.draftId) return;
    setBusy(true);
    setError(null);
    const problem = await attempt(() => signupApi.payout(draft.draftId!, { bank: draft.payoutBank, accountNumber: draft.payoutAccountNumber }));
    setBusy(false);
    if (problem) setError(problem);
    else next();
  };

  return (
    <StepFrame
      headline="Where should we pay you?"
      subhead="Kudi9ja does not give you a new account number. Your loans and anything you withdraw go straight to a bank account you already have."
      onSubmit={submit}
      action={
        <Button type="submit" size="lg" block loading={busy} disabled={!ready}>
          Continue
        </Button>
      }
    >
      <Select label="Your bank" icon={<Building2 />} placeholder={banks.isLoading ? 'Loading banks…' : 'Choose your bank'} options={banks.data ?? []} value={draft.payoutBank} onChange={(e) => update({ payoutBank: e.target.value })} />
      <Input label="Account number" inputMode="numeric" maxLength={10} placeholder="10 digits" icon={<Hash />} value={draft.payoutAccountNumber} onChange={(e) => update({ payoutAccountNumber: e.target.value.replace(/\D/g, '') })} />
      <Notice tone="gold" icon={<UserRound />} title="The account must be in your own name">
        We only pay out to {draft.fullName.trim() || 'the name on your Kudi9ja account'}. A payout to somebody else is refused, and the money stays in your wallet.
      </Notice>
      <p className="text-[12.5px] leading-relaxed text-ink-3">You can change this later, from your profile, with a code we email you and your PIN.</p>
      {error && <Notice tone="danger">{error}</Notice>}
    </StepFrame>
  );
}

// ── 5. Password ─────────────────────────────────────────────────────────────

export function PasswordStep({ draft, update, next }: StepProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [answer, setAnswer] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = {
      password: validators.password(password),
      confirm: confirm === password ? null : 'Passwords do not match',
      question: draft.securityQuestion ? null : 'Pick a question',
      answer: answer.trim().length >= 2 ? null : 'Give a fuller answer',
    };
    setErrors(found);
    if (Object.values(found).some(Boolean) || !draft.draftId) return;
    setBusy(true);
    setError(null);
    const problem = await attempt(() =>
      signupApi.password(draft.draftId!, { password, securityQuestion: draft.securityQuestion, securityAnswer: answer.trim() }),
    );
    setBusy(false);
    if (problem) setError(problem);
    else next();
  };

  return (
    <StepFrame
      headline="Create your password"
      subhead="This is your account password — what you sign in with on a new device. Day to day, you will use your passcode instead."
      onSubmit={submit}
      action={
        <Button type="submit" size="lg" block loading={busy}>
          Continue
        </Button>
      }
    >
      <div>
        <Input label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" icon={<Lock />} value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} autoFocus />
        <PasswordStrength value={password} className="mt-3" />
      </div>
      <Input label="Confirm password" type="password" autoComplete="new-password" placeholder="Type it once more" icon={<Lock />} value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
      <div className="h-px bg-stroke" />
      <Select label="Security question" icon={<KeyRound />} placeholder="Choose a question" options={SECURITY_QUESTIONS} value={draft.securityQuestion} onChange={(e) => update({ securityQuestion: e.target.value })} error={errors.question} />
      <Input label="Your answer" placeholder="Something only you would know" hint="Used to recover your account. Not case sensitive." value={answer} onChange={(e) => setAnswer(e.target.value)} error={errors.answer} />
      {error && <Notice tone="danger">{error}</Notice>}
    </StepFrame>
  );
}

// ── 6 & 7. Passcode and PIN ─────────────────────────────────────────────────

export function CodeStep({ draft, next, mode }: StepProps & { mode: 'passcode' | 'pin' }) {
  const length = mode === 'passcode' ? PASSCODE_LENGTH : PIN_LENGTH;
  const [first, setFirst] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const value = useRef('');
  const confirming = first.length > 0;

  const fail = (msg: string, restart = false) => {
    setMessage(msg);
    setError(true);
    window.setTimeout(() => {
      value.current = '';
      setCode('');
      setError(false);
      if (restart) setFirst('');
    }, 750);
  };

  const evaluate = async (entered: string) => {
    if (!confirming) {
      const weak = validators.passcodeStrength(entered);
      if (weak) return fail(weak);
      setFirst(entered);
      value.current = '';
      setCode('');
      setMessage(null);
      return;
    }
    if (entered !== first) return fail('Those did not match. Start again.', true);
    if (!draft.draftId) return;
    setBusy(true);
    const problem = await attempt(() =>
      mode === 'passcode' ? signupApi.passcode(draft.draftId!, entered) : signupApi.pin(draft.draftId!, entered),
    );
    setBusy(false);
    if (problem) fail(problem, true);
    else next();
  };

  const digit = (d: string) => {
    if (busy || error || value.current.length >= length) return;
    value.current += d;
    setCode(value.current);
    setMessage(null);
    if (value.current.length === length) window.setTimeout(() => void evaluate(value.current), 180);
  };

  const headline =
    mode === 'passcode'
      ? confirming
        ? 'Confirm your passcode'
        : 'Create your sign-in passcode'
      : confirming
        ? 'Confirm your transaction PIN'
        : 'Create your transaction PIN';
  const subhead = confirming
    ? 'Enter it once more to be sure.'
    : mode === 'passcode'
      ? `You will type this to open Kudi9ja after signing in or 10 minutes away. ${length} digits, no repeats, no straight runs.`
      : `A separate ${length}-digit PIN that authorises every repayment and withdrawal.`;

  return (
    <div className="mx-auto max-w-md text-center">
      <span className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-gold/25 bg-gold/10 text-gold">
        {mode === 'passcode' ? <Lock className="h-8 w-8" /> : <KeyRound className="h-8 w-8" />}
      </span>
      <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">{headline}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{subhead}</p>
      <div className="mt-10">
        <PasscodeDots length={length} filled={code.length} error={error} size={mode === 'passcode' ? 15 : 18} />
      </div>
      <p className="mt-4 h-10 text-[13px] font-semibold text-danger">{message}</p>
      <NumericKeypad onDigit={digit} onBackspace={() => { value.current = value.current.slice(0, -1); setCode(value.current); }} disabled={busy} />
      <p className="mt-4 text-[12px] text-ink-3">You can type the digits on your keyboard.</p>
    </div>
  );
}

// ── 8. Review ───────────────────────────────────────────────────────────────

export function ReviewStep({ draft, next }: StepProps) {
  const last4 = (v: string) => (v ? `••••••• ${v.slice(-4)}` : '—');
  return (
    <StepFrame
      headline="Almost there"
      subhead="Check everything reads correctly. Next, you will read and sign your agreements, and your account opens."
      action={
        <Button size="lg" block onClick={next}>
          Continue to agreements
        </Button>
      }
    >
      <Card gradient accent="gold">
        <DetailRows
          rows={[
            ['Full name', draft.fullName],
            ['Email', draft.email],
            ['Phone', draft.phone],
            ['Date of birth', asDay(draft.dateOfBirth ? `${draft.dateOfBirth}T00:00:00` : '')],
            ['Gender', draft.gender || '—'],
            ['Address', draft.address || '—'],
            ['State', draft.state || '—'],
            ['BVN', last4(draft.bvn)],
            ['NIN', last4(draft.nin)],
            ['Payout bank', draft.payoutBank || '—'],
            ['Payout account', draft.payoutAccountNumber || '—'],
          ]}
        />
      </Card>
      <Card>
        <p className="eyebrow mb-3">Security set up</p>
        <ul className="space-y-2.5">
          {['Email verified', 'BVN & NIN provided', 'Payout account set', 'Password and security question set', 'Sign-in passcode set', 'Transaction PIN set'].map((t) => (
            <li key={t} className="flex items-center justify-between text-[13.5px] text-ink-2">
              {t}
              <CheckCircle2 className="h-[18px] w-[18px] text-success" />
            </li>
          ))}
        </ul>
      </Card>
    </StepFrame>
  );
}
